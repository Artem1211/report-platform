import type { ClickHouseClient } from '@clickhouse/client';
import { createClient } from '@clickhouse/client';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';

export interface DatasourceConfig {
  id: string;
  label: string;
  engine: 'clickhouse' | 'postgres';
  url: string;
  description?: string;
  defaultQuery?: string;
  dateField?: string;
}

@Injectable()
export class DatasourceService implements OnModuleDestroy {
  private readonly datasources: DatasourceConfig[];
  private readonly chClients = new Map<string, ClickHouseClient>();
  private readonly pgPools = new Map<string, Pool>();

  constructor() {
    const env = process.env['DATASOURCES'];
    if (!env) throw new Error('DATASOURCES environment variable is required');
    const parsed = JSON.parse(env) as unknown[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error('DATASOURCES must be a non-empty array');
    }
    for (const ds of parsed) {
      this.validateDatasource(ds);
    }
    this.datasources = parsed as DatasourceConfig[];
    this.initClients();
  }

  private validateDatasource(ds: unknown): void {
    if (!ds || typeof ds !== 'object') throw new Error('Each datasource must be an object');
    const { id, label, engine, url } = ds as Record<string, unknown>;
    if (!id || typeof id !== 'string') throw new Error(`Datasource missing required field: id`);
    if (!label || typeof label !== 'string')
      throw new Error(`Datasource [${id}] missing required field: label`);
    if (!url || typeof url !== 'string')
      throw new Error(`Datasource [${id}] missing required field: url`);
    if (engine !== 'clickhouse' && engine !== 'postgres') {
      throw new Error(
        `Datasource [${id}] field 'engine' must be 'clickhouse' or 'postgres', got: ${String(engine)}`,
      );
    }
  }

  private initClients() {
    for (const ds of this.datasources) {
      if (ds.engine === 'clickhouse') {
        this.chClients.set(ds.id, createClient({ url: ds.url }));
      } else {
        this.pgPools.set(ds.id, new Pool({ connectionString: ds.url }));
      }
    }
  }

  async onModuleDestroy() {
    for (const client of this.chClients.values()) await client.close();
    for (const pool of this.pgPools.values()) await pool.end();
  }

  findAll(): DatasourceConfig[] {
    return this.datasources;
  }

  findById(id: string): DatasourceConfig | undefined {
    return this.datasources.find((ds) => ds.id === id);
  }

  async queryClickhouse(
    id: string,
    sql: string,
    params?: Record<string, unknown>,
  ): Promise<Record<string, unknown>[]> {
    const client = this.chClients.get(id);
    if (!client) throw new Error(`ClickHouse datasource not found: ${id}`);
    const result = await client.query({ query: sql, query_params: params, format: 'JSONEachRow' });
    return result.json<Record<string, unknown>>();
  }

  async queryPostgres(
    id: string,
    sql: string,
    params: unknown[] = [],
  ): Promise<Record<string, unknown>[]> {
    const pool = this.pgPools.get(id);
    if (!pool) throw new Error(`PostgreSQL datasource not found: ${id}`);
    const result = await pool.query(sql, params);
    return result.rows as Record<string, unknown>[];
  }
}
