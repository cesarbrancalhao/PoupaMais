import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, PoolClient, QueryResult } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private pool: Pool;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.pool = new Pool({
      host: this.configService.get<string>('DB_HOST'),
      port: this.configService.get<number>('DB_PORT'),
      user: this.configService.get<string>('DB_USERNAME'),
      password: this.configService.get<string>('DB_PASSWORD'),
      database: this.configService.get<string>('DB_DATABASE'),
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    try {
      await this.pool.query('SELECT NOW()');
      this.logger.log('Conexão com banco de dados estabelecida com sucesso');
    } catch (error) {
      this.logger.error('Falha na conexão com banco de dados:', error);
      throw new Error('Falha na conexão com o banco de dados');
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
      this.logger.debug(`Consulta executada em ${duration}ms - Linhas: ${result.rowCount}`);
      return result;
    } catch (error) {
      this.logger.error('Erro na consulta:', error);
      throw new Error('Erro na consulta');
    }
  }

  async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }
}
