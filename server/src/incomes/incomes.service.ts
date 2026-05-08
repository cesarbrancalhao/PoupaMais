import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';
import { CreateIncomeExclusionDto } from './dto/create-income-exclusion.dto';
import { PaginationResponse } from '../common/dto/pagination.dto';

@Injectable()
export class IncomesService {
  constructor(private databaseService: DatabaseService) {}

  async create(userId: number, data: CreateIncomeDto) {
    const client = await this.databaseService.getClient();
    try {
      await client.query('BEGIN');

      if (data.fonte_receita_id !== undefined && data.fonte_receita_id !== null) {
        const fonteExists = await client.query(
          'SELECT * FROM fonte_receita WHERE id = $1 AND usuario_id = $2',
          [data.fonte_receita_id, userId],
        );
        if (fonteExists.rows.length === 0) {
          throw new NotFoundException('Income source not found');
        }
      }

      const result = await client.query(
        `INSERT INTO receita (nome, valor, recorrente, data, data_vencimento, fonte_receita_id, usuario_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [
          data.nome,
          data.valor,
          data.recorrente,
          data.data,
          data.data_vencimento,
          data.fonte_receita_id,
          userId,
        ],
      );

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async findAll(userId: number, page: number = 1, limit: number = 20): Promise<PaginationResponse<any>> {
    const maxLimit = Math.min(limit, 2000);
    const offset = (page - 1) * maxLimit;

    const [dataResult, countResult] = await Promise.all([
      this.databaseService.query(
        'SELECT * FROM receita WHERE usuario_id = $1 ORDER BY data DESC LIMIT $2 OFFSET $3',
        [userId, maxLimit, offset],
      ),
      this.databaseService.query(
        'SELECT COUNT(*) FROM receita WHERE usuario_id = $1',
        [userId],
      ),
    ]);

    const total = parseInt(countResult.rows[0].count);

    return {
      data: dataResult.rows,
      pagination: {
        page,
        limit: maxLimit,
        total,
        totalPages: Math.ceil(total / maxLimit),
      },
    };
  }

  async findOne(id: number, userId: number) {
    const result = await this.databaseService.query(
      'SELECT * FROM receita WHERE id = $1 AND usuario_id = $2',
      [id, userId],
    );
    if (result.rows.length === 0) throw new NotFoundException('Income not found');
    return result.rows[0];
  }

  async update(id: number, userId: number, data: UpdateIncomeDto) {
    const client = await this.databaseService.getClient();
    try {
      await client.query('BEGIN');

      if (data.fonte_receita_id !== undefined && data.fonte_receita_id !== null) {
        const fonteExists = await client.query(
          'SELECT * FROM fonte_receita WHERE id = $1 AND usuario_id = $2',
          [data.fonte_receita_id, userId],
        );
        if (fonteExists.rows.length === 0) throw new NotFoundException('Income source not found');
      }

      const fields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (data.nome !== undefined) {
        fields.push(`nome = $${paramIndex++}`);
        values.push(data.nome);
      }
      if (data.valor !== undefined) {
        fields.push(`valor = $${paramIndex++}`);
        values.push(data.valor);
      }
      if (data.recorrente !== undefined) {
        fields.push(`recorrente = $${paramIndex++}`);
        values.push(data.recorrente);
      }
      if (data.data !== undefined) {
        fields.push(`data = $${paramIndex++}`);
        values.push(data.data);
      }
      if (data.data_vencimento !== undefined) {
        fields.push(`data_vencimento = $${paramIndex++}`);
        values.push(data.data_vencimento);
      }
      if (data.fonte_receita_id !== undefined) {
        fields.push(`fonte_receita_id = $${paramIndex++}`);
        values.push(data.fonte_receita_id);
      }

      if (fields.length === 0) {
        const existing = await client.query('SELECT * FROM receita WHERE id = $1 AND usuario_id = $2', [id, userId]);
        if (existing.rows.length === 0) throw new NotFoundException('Income not found');
        await client.query('COMMIT');
        return existing.rows[0];
      }

      values.push(id, userId);
      const query = `UPDATE receita SET ${fields.join(', ')} WHERE id = $${paramIndex++} AND usuario_id = $${paramIndex++} RETURNING *`;

      const result = await client.query(query, values);

      if (result.rows.length === 0) throw new NotFoundException('Income not found');

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async remove(id: number, userId: number) {
    const result = await this.databaseService.query(
      'DELETE FROM receita WHERE id = $1 AND usuario_id = $2',
      [id, userId],
    );
    if (result.rowCount === 0) throw new NotFoundException('Income not found');
    return { message: 'Income deleted successfully' };
  }

  async createExclusion(incomeId: number, userId: number, createExclusionDto: CreateIncomeExclusionDto) {
    const client = await this.databaseService.getClient();
    try {
      await client.query('BEGIN');
      
      const incomeExists = await client.query(
        'SELECT * FROM receita WHERE id = $1 AND usuario_id = $2',
        [incomeId, userId],
      );
      if (incomeExists.rows.length === 0) {
        throw new NotFoundException('Income not found');
      }

      const result = await client.query(
        `INSERT INTO receita_exclusao (receita_id, data_exclusao, usuario_id)
         VALUES ($1, $2, $3) RETURNING *`,
        [incomeId, createExclusionDto.data_exclusao, userId],
      );
      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async findAllExclusions(userId: number) {
    const result = await this.databaseService.query(
      'SELECT * FROM receita_exclusao WHERE usuario_id = $1 ORDER BY data_exclusao DESC',
      [userId],
    );
    return result.rows;
  }

  async removeExclusion(id: number, userId: number) {
    const result = await this.databaseService.query(
      'DELETE FROM receita_exclusao WHERE id = $1 AND usuario_id = $2',
      [id, userId],
    );
    if (result.rowCount === 0) throw new NotFoundException('Exclusion not found');
    return { message: 'Exclusion removed successfully' };
  }
}
