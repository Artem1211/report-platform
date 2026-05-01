import { Test } from '@nestjs/testing';
import { mkdtempSync, unlinkSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

import { DatasourceService } from '../../datasource';
import type { DatasourceConfig } from '../../datasource/datasource.service';
import { DynamicProcessor } from './dynamic.processor';

const mockClickhouseDatasource: DatasourceConfig = {
  id: 'ch',
  label: 'ClickHouse',
  engine: 'clickhouse',
  url: 'http://localhost:8123',
  defaultQuery: 'SELECT 1',
  dateField: 'event_date',
};

const mockPostgresDatasource: DatasourceConfig = {
  id: 'pg',
  label: 'PostgreSQL',
  engine: 'postgres',
  url: 'postgresql://localhost/test',
  defaultQuery: 'SELECT 1',
  dateField: 'created_at',
};

describe('DynamicProcessor', () => {
  let processor: DynamicProcessor;
  let datasourceService: jest.Mocked<DatasourceService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        DynamicProcessor,
        {
          provide: DatasourceService,
          useValue: {
            findById: jest.fn(),
            queryClickhouse: jest.fn(),
            queryPostgres: jest.fn(),
          },
        },
      ],
    }).compile();

    processor = module.get(DynamicProcessor);
    datasourceService = module.get(DatasourceService);
  });

  describe('SQL injection prevention', () => {
    beforeEach(() => {
      datasourceService.findById.mockReturnValue(mockPostgresDatasource);
      datasourceService.queryPostgres.mockResolvedValue([]);
    });

    it.each([
      'DROP TABLE users',
      'DELETE FROM users',
      'INSERT INTO users VALUES (1)',
      'CREATE TABLE x (id int)',
      'ALTER TABLE users ADD col text',
      'TRUNCATE users',
    ])('rejects forbidden statement: %s', async (query) => {
      await expect(
        processor.run({ _sourceConfig: { type: 'sql', db: 'pg', query } }),
      ).rejects.toThrow('forbidden');
    });

    it('allows SELECT queries', async () => {
      datasourceService.queryPostgres.mockResolvedValue([{ id: 1, name: 'test' }]);
      const result = await processor.run({
        _sourceConfig: { type: 'sql', db: 'pg', query: 'SELECT * FROM users' },
      });
      expect(result.rows).toHaveLength(1);
    });
  });

  describe('SQL identifier validation', () => {
    it('rejects invalid dateField name', async () => {
      datasourceService.findById.mockReturnValue(mockPostgresDatasource);
      await expect(
        processor.run({
          _sourceConfig: {
            type: 'sql',
            db: 'pg',
            query: 'SELECT 1',
            dateField: 'date; DROP TABLE users',
          },
          dateFrom: '2024-01-01',
        }),
      ).rejects.toThrow('Invalid field name');
    });

    it('accepts valid snake_case dateField', async () => {
      datasourceService.findById.mockReturnValue({
        ...mockPostgresDatasource,
        dateField: 'created_at',
      });
      datasourceService.queryPostgres.mockResolvedValue([{ id: 1 }]);
      const result = await processor.run({
        _sourceConfig: { type: 'sql', db: 'pg', query: 'SELECT 1', dateField: 'created_at' },
        dateFrom: '2024-01-01',
      });
      expect(result.rows).toHaveLength(1);
    });
  });

  describe('ClickHouse date filter injection', () => {
    beforeEach(() => {
      datasourceService.findById.mockReturnValue(mockClickhouseDatasource);
      datasourceService.queryClickhouse.mockResolvedValue([{ count: 5 }]);
    });

    it('injects WHERE clause when dateFrom is provided', async () => {
      await processor.run({
        _sourceConfig: {
          type: 'sql',
          db: 'ch',
          dateField: 'event_date',
          query: 'SELECT count() FROM events',
        },
        dateFrom: '2024-01-01',
      });

      const [, sql] = datasourceService.queryClickhouse.mock.calls[0]!;
      expect(sql).toContain('WHERE');
      expect(sql).toContain('event_date >= {dateFrom:Date}');
    });

    it('inserts filter before GROUP BY', async () => {
      await processor.run({
        _sourceConfig: {
          type: 'sql',
          db: 'ch',
          dateField: 'event_date',
          query: 'SELECT event_date, count() FROM events GROUP BY event_date',
        },
        dateFrom: '2024-01-01',
      });

      const [, sql] = datasourceService.queryClickhouse.mock.calls[0]!;
      expect(sql.indexOf('WHERE')).toBeLessThan(sql.indexOf('GROUP BY'));
    });

    it('uses AND when query already has WHERE', async () => {
      await processor.run({
        _sourceConfig: {
          type: 'sql',
          db: 'ch',
          dateField: 'event_date',
          query: 'SELECT * FROM events WHERE status = 1',
        },
        dateFrom: '2024-01-01',
      });

      const [, sql] = datasourceService.queryClickhouse.mock.calls[0]!;
      expect(sql).toContain('AND');
      expect(sql).not.toMatch(/WHERE.*WHERE/i);
    });

    it('skips filter when dateFrom is empty', async () => {
      await processor.run({
        _sourceConfig: {
          type: 'sql',
          db: 'ch',
          dateField: 'event_date',
          query: 'SELECT count() FROM events',
        },
      });

      const [, sql, params] = datasourceService.queryClickhouse.mock.calls[0]!;
      expect(sql).not.toContain('WHERE');
      expect(params).toEqual({});
    });
  });

  describe('PostgreSQL date filter injection', () => {
    beforeEach(() => {
      datasourceService.findById.mockReturnValue(mockPostgresDatasource);
      datasourceService.queryPostgres.mockResolvedValue([{ id: 1 }]);
    });

    it('uses positional params $1/$2 for date filter', async () => {
      await processor.run({
        _sourceConfig: {
          type: 'sql',
          db: 'pg',
          dateField: 'created_at',
          query: 'SELECT * FROM items',
        },
        dateFrom: '2024-01-01',
      });

      const [, sql, params] = datasourceService.queryPostgres.mock.calls[0]!;
      expect(sql).toContain('$1');
      expect(sql).toContain('$2');
      expect(params).toEqual(['2024-01-01', expect.any(String)]);
    });
  });

  describe('unknown datasource', () => {
    it('throws when datasource not found', async () => {
      datasourceService.findById.mockReturnValue(undefined);
      await expect(
        processor.run({ _sourceConfig: { type: 'sql', db: 'nonexistent', query: 'SELECT 1' } }),
      ).rejects.toThrow('Unknown datasource');
    });
  });

  describe('API source', () => {
    it('returns rows from array response', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' },
        ],
      } as Response);

      const result = await processor.run({
        _sourceConfig: { type: 'api', url: 'http://example.com/data' },
      });

      expect(result.rows).toHaveLength(2);
      expect(result.columns.map((c: { key: string }) => c.key)).toEqual(['id', 'name']);
    });

    it('extracts nested array from object response', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: { items: [{ a: 1 }, { a: 2 }] } }),
      } as Response);

      const result = await processor.run({
        _sourceConfig: { type: 'api', url: 'http://example.com/data' },
      });
      expect(result.rows).toHaveLength(0);
    });

    it('throws on non-ok response', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
      } as Response);

      await expect(
        processor.run({ _sourceConfig: { type: 'api', url: 'http://example.com/data' } }),
      ).rejects.toThrow('API request failed: 503');
    });

    it('throws on missing url', async () => {
      global.fetch = jest.fn().mockRejectedValue(new TypeError('Failed to fetch'));

      await expect(
        processor.run({ _sourceConfig: { type: 'api', url: 'http://bad-url' } }),
      ).rejects.toThrow();
    });
  });

  describe('File source — CSV', () => {
    let tmpDir: string;
    let csvPath: string;

    beforeEach(() => {
      tmpDir = mkdtempSync(join(tmpdir(), 'dp-test-'));
      csvPath = join(tmpDir, 'test.csv');
    });

    afterEach(() => {
      try {
        unlinkSync(csvPath);
      } catch {}
    });

    it('parses basic CSV', async () => {
      writeFileSync(csvPath, 'id,name\n1,Alice\n2,Bob\n');
      const result = await processor.run({ _sourceConfig: { type: 'file' }, filePath: csvPath });
      expect(result.columns).toEqual([
        { key: 'id', label: 'id' },
        { key: 'name', label: 'name' },
      ]);
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]).toEqual({ id: '1', name: 'Alice' });
    });

    it('handles quoted values with commas (RFC 4180)', async () => {
      writeFileSync(csvPath, 'name,address\nAlice,"New York, NY"\nBob,"Los Angeles, CA"\n');
      const result = await processor.run({ _sourceConfig: { type: 'file' }, filePath: csvPath });
      expect(result.rows[0]).toEqual({ name: 'Alice', address: 'New York, NY' });
    });

    it('handles escaped double quotes inside quoted fields', async () => {
      writeFileSync(csvPath, 'name,note\nAlice,"says ""hello"""\n');
      const result = await processor.run({ _sourceConfig: { type: 'file' }, filePath: csvPath });
      expect(result.rows[0]).toEqual({ name: 'Alice', note: 'says "hello"' });
    });

    it('returns empty result for header-only CSV', async () => {
      writeFileSync(csvPath, 'id,name\n');
      const result = await processor.run({ _sourceConfig: { type: 'file' }, filePath: csvPath });
      expect(result.rows).toHaveLength(0);
    });
  });

  describe('File source — missing file', () => {
    it('throws when no filePath provided', async () => {
      await expect(processor.run({ _sourceConfig: { type: 'file' } })).rejects.toThrow(
        'No file provided',
      );
    });
  });

  describe('empty result handling', () => {
    it('returns empty columns and rows when query returns no data', async () => {
      datasourceService.findById.mockReturnValue(mockPostgresDatasource);
      datasourceService.queryPostgres.mockResolvedValue([]);
      const result = await processor.run({
        _sourceConfig: { type: 'sql', db: 'pg', query: 'SELECT 1' },
      });
      expect(result).toEqual({ columns: [], rows: [] });
    });
  });
});
