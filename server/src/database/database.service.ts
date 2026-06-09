import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, PoolClient, QueryResult } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private pool: Pool;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const sslEnabled = this.configService.get<string>('DB_SSL') === 'true';
    const sslRejectUnauthorized =
      this.configService.get<string>('DB_SSL_REJECT_UNAUTHORIZED') !== 'false';
    const sslCa = this.configService.get<string>('DB_SSL_CA');

    this.pool = new Pool({
      host: this.configService.get<string>('DB_HOST'),
      port: this.configService.get<number>('DB_PORT'),
      user: this.configService.get<string>('DB_USERNAME'),
      password: this.configService.get<string>('DB_PASSWORD'),
      database: this.configService.get<string>('DB_DATABASE'),
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      ...(sslEnabled && {
        ssl: {
          rejectUnauthorized: sslRejectUnauthorized,
          ...(sslCa && { ca: sslCa }),
        },
      }),
    });

    try {
      await this.pool.query('SELECT NOW()');
      this.logger.log('Database connection established successfully');
    } catch (error) {
      this.logger.error('Database connection failed:', error);
      throw new Error('Database connection failed');
    }
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  async query(text: string, params?: any[]): Promise<QueryResult> {
    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      this.logger.debug(`Query executed in ${duration}ms - Rows: ${result.rowCount}`);
      return result;
    } catch (error) {
      this.logger.error('Query error:', error);
      throw new Error('Query error');
    }
  }

  async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }
}
