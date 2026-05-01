import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';

import { PrismaService } from '../../database';
import { DatasourceService } from '../../datasource';
import { ReportsController } from '../reports.controller';
import { ReportsService } from '../reports.service';

const mockTemplate = {
  id: 'uuid-1',
  type: 'weather_moscow_api',
  name: 'Погода в Москве',
  description: null,
  paramsSchema: {},
  sourceConfig: { type: 'api', url: 'http://example.com' },
  createdAt: new Date('2024-01-01'),
};

describe('ReportsController', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  const reportsService = {
    findAllTemplates: jest.fn(),
    createTemplate: jest.fn(),
    deleteTemplate: jest.fn(),
    getDataSources: jest.fn(),
  };

  const prisma = {
    pool: { query: jest.fn().mockResolvedValue(undefined) },
  };

  async function buildApp() {
    const module = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot({ throttlers: [{ ttl: 60_000, limit: 60 }] })],
      controllers: [ReportsController],
      providers: [
        { provide: ReportsService, useValue: reportsService },
        { provide: PrismaService, useValue: prisma },
        { provide: DatasourceService, useValue: {} },
      ],
    }).compile();

    const nestApp = module.createNestApplication();
    nestApp.setGlobalPrefix('api');
    nestApp.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await nestApp.init();
    return nestApp;
  }

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/health', () => {
    it('returns ok when db is reachable', async () => {
      const res = await request(app.getHttpServer()).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'ok', postgres: 'ok' });
    });

    it('returns degraded when db is down', async () => {
      prisma.pool.query.mockRejectedValueOnce(new Error('connection refused'));
      const res = await request(app.getHttpServer()).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'degraded', postgres: 'error' });
    });
  });

  describe('GET /api/reports', () => {
    it('returns template list', async () => {
      reportsService.findAllTemplates.mockResolvedValue([mockTemplate]);
      const res = await request(app.getHttpServer()).get('/api/reports');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].name).toBe('Погода в Москве');
    });
  });

  describe('POST /api/reports', () => {
    it('creates template and returns 201', async () => {
      reportsService.createTemplate.mockResolvedValue(mockTemplate);
      const res = await request(app.getHttpServer())
        .post('/api/reports')
        .send({ name: 'Test', sourceConfig: { type: 'api', url: 'http://x.com' } });
      expect(res.status).toBe(201);
      expect(reportsService.createTemplate).toHaveBeenCalledTimes(1);
    });

    it('rejects missing name with 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/reports')
        .send({ sourceConfig: { type: 'api', url: 'http://x.com' } });
      expect(res.status).toBe(400);
    });

    it('rejects missing sourceConfig with 400', async () => {
      const res = await request(app.getHttpServer()).post('/api/reports').send({ name: 'Test' });
      expect(res.status).toBe(400);
    });

    it('rejects extra fields with 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/reports')
        .send({ name: 'Test', sourceConfig: { type: 'api', url: 'http://x.com' }, evil: 'x' });
      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/reports/:id', () => {
    it('deletes template and returns 200', async () => {
      reportsService.deleteTemplate.mockResolvedValue(undefined);
      const res = await request(app.getHttpServer()).delete('/api/reports/uuid-1');
      expect(res.status).toBe(200);
      expect(reportsService.deleteTemplate).toHaveBeenCalledWith('uuid-1');
    });
  });

  describe('GET /api/reports/datasources', () => {
    it('returns datasources list', async () => {
      reportsService.getDataSources.mockReturnValue([{ id: 'pg', label: 'PostgreSQL' }]);
      const res = await request(app.getHttpServer()).get('/api/reports/datasources');
      expect(res.status).toBe(200);
      expect(res.body[0].id).toBe('pg');
    });
  });
});
