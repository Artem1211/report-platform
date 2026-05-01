import { Injectable } from '@nestjs/common';
import { Workbook } from 'exceljs';
import { createReadStream } from 'fs';

import { DatasourceService } from '../../datasource';
import type { ReportData, SourceConfig } from '../run.types';

const FORBIDDEN_SQL = /\b(DROP|CREATE|ALTER|DELETE|INSERT|UPDATE|TRUNCATE)\b/i;
const CLAUSE_BEFORE_FILTER = /\b(GROUP\s+BY|ORDER\s+BY|HAVING|LIMIT|OFFSET)\b/i;
const FETCH_TIMEOUT_MS = 30_000;
const VALID_IDENTIFIER = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

function validateIdentifier(name: string): void {
  if (!VALID_IDENTIFIER.test(name)) {
    throw new Error(`Invalid field name: "${name}"`);
  }
}

function columnsFromRow(row: Record<string, unknown>): ReportData['columns'] {
  return Object.keys(row).map((key) => ({ key, label: key }));
}

function injectFilter(base: string, connector: 'WHERE' | 'AND', filter: string): string {
  const match = CLAUSE_BEFORE_FILTER.exec(base);
  if (match) {
    return `${base.slice(0, match.index)}${connector} ${filter} ${base.slice(match.index)}`;
  }
  return `${base} ${connector} ${filter}`;
}

@Injectable()
export class DynamicProcessor {
  constructor(private readonly datasourceService: DatasourceService) {}

  async run(params: Record<string, unknown>): Promise<ReportData> {
    const sourceConfig = params['_sourceConfig'] as SourceConfig;
    const dateFrom = String(params['dateFrom'] ?? '');
    const dateTo = String(params['dateTo'] || new Date().toISOString().slice(0, 10));

    if (sourceConfig.type === 'sql') {
      return this.runSql(sourceConfig, dateFrom, dateTo);
    }

    if (sourceConfig.type === 'api') {
      return this.runApi(sourceConfig.url);
    }

    // Extension point: add new source type handler here (e.g. grpc, s3, kafka)
    return this.runFile(String(params['filePath'] ?? ''));
  }

  private async runSql(
    config: Extract<SourceConfig, { type: 'sql' }>,
    dateFrom: string,
    dateTo: string,
  ): Promise<ReportData> {
    const ds = this.datasourceService.findById(config.db);
    if (!ds) throw new Error(`Unknown datasource: ${config.db}`);

    const base = config.query?.trim() || ds.defaultQuery || 'SELECT *';
    if (FORBIDDEN_SQL.test(base)) throw new Error('SQL query contains forbidden statements');

    if (config.dateField) validateIdentifier(config.dateField);

    const hasWhere = /\bwhere\b/i.test(base);
    const connector = hasWhere ? 'AND' : 'WHERE';
    const canFilter = Boolean(dateFrom && config.dateField);

    let rows: Record<string, unknown>[];

    if (ds.engine === 'clickhouse') {
      const field = config.dateField!;
      const sql = canFilter
        ? injectFilter(base, connector, `${field} >= {dateFrom:Date} AND ${field} <= {dateTo:Date}`)
        : base;
      rows = await this.datasourceService.queryClickhouse(
        config.db,
        sql,
        canFilter ? { dateFrom, dateTo } : {},
      );
    } else {
      const field = `"${config.dateField!}"`;
      const sql = canFilter
        ? injectFilter(base, connector, `${field} >= $1 AND ${field} <= $2`)
        : base;
      rows = await this.datasourceService.queryPostgres(
        config.db,
        sql,
        canFilter ? [dateFrom, dateTo] : [],
      );
    }

    if (rows.length === 0 || !rows[0]) return { columns: [], rows: [] };
    return { columns: columnsFromRow(rows[0]), rows };
  }

  private async runApi(url: string): Promise<ReportData> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(url, { signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as unknown;
    const rows = this.normalizeApiResponse(data);

    if (rows.length === 0 || !rows[0]) return { columns: [], rows: [] };
    return { columns: columnsFromRow(rows[0]), rows };
  }

  private normalizeApiResponse(data: unknown): Record<string, unknown>[] {
    if (Array.isArray(data)) {
      return data as Record<string, unknown>[];
    }

    if (data && typeof data === 'object') {
      const obj = data as Record<string, unknown>;

      for (const val of Object.values(obj)) {
        if (val && typeof val === 'object' && !Array.isArray(val)) {
          const inner = val as Record<string, unknown>;
          const arrays = Object.entries(inner).filter(([, v]) => Array.isArray(v));
          if (arrays.length > 1) {
            const len = (arrays[0]?.[1] as unknown[]).length;
            return Array.from({ length: len }, (_, i) =>
              Object.fromEntries(arrays.map(([k, v]) => [k, (v as unknown[])[i]])),
            );
          }
        }
      }

      const arrays = Object.entries(obj).filter(([, v]) => Array.isArray(v));
      if (arrays.length > 1) {
        const len = (arrays[0]?.[1] as unknown[]).length;
        return Array.from({ length: len }, (_, i) =>
          Object.fromEntries(arrays.map(([k, v]) => [k, (v as unknown[])[i]])),
        );
      }

      for (const val of Object.values(obj)) {
        if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object') {
          return val as Record<string, unknown>[];
        }
      }
    }

    return [];
  }

  private async runFile(filePath: string): Promise<ReportData> {
    if (!filePath) throw new Error('No file provided');

    if (filePath.endsWith('.csv')) {
      return this.parseCsv(filePath);
    }

    return this.parseXlsx(filePath);
  }

  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  private async parseCsv(filePath: string): Promise<ReportData> {
    const content = await new Promise<string>((resolve, reject) => {
      const chunks: Buffer[] = [];
      const stream = createReadStream(filePath);
      stream.on('data', (chunk) =>
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)),
      );
      stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
      stream.on('error', reject);
    });

    const lines = content.split('\n').filter((l) => l.trim());
    if (lines.length < 2 || !lines[0]) return { columns: [], rows: [] };

    const headers = this.parseCsvLine(lines[0]);
    const columns = headers.map((key) => ({ key, label: key }));
    const rows = lines.slice(1).map((line) => {
      const values = this.parseCsvLine(line);
      return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']));
    });

    return { columns, rows };
  }

  private async parseXlsx(filePath: string): Promise<ReportData> {
    const workbook = new Workbook();
    await workbook.xlsx.readFile(filePath);

    const sheet = workbook.worksheets[0];
    if (!sheet) return { columns: [], rows: [] };

    const headerRow = sheet.getRow(1).values as (string | undefined)[];
    const headers = headerRow.slice(1).map((h) => String(h ?? ''));
    const columns = headers.map((key) => ({ key, label: key }));

    const rows: Record<string, unknown>[] = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const values = row.values as unknown[];
      rows.push(Object.fromEntries(headers.map((h, i) => [h, values[i + 1] ?? ''])));
    });

    return { columns, rows };
  }
}
