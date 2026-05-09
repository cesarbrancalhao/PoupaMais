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

      if (data.income_source_id !== undefined && data.income_source_id !== null) {
        const sourceExists = await client.query(
          'SELECT * FROM income_source WHERE id = $1 AND user_id = $2',
          [data.income_source_id, userId],
        );
        if (sourceExists.rows.length === 0) {
          throw new NotFoundException('Income source not found');
        }
      }

      const result = await client.query(
        `INSERT INTO income (name, value, recurring, date, due_date, income_source_id, user_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [
          data.name,
          data.value,
          data.recurring,
          data.date,
          data.due_date,
          data.income_source_id,
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
        'SELECT * FROM income WHERE user_id = $1 ORDER BY date DESC LIMIT $2 OFFSET $3',
        [userId, maxLimit, offset],
      ),
      this.databaseService.query(
        'SELECT COUNT(*) FROM income WHERE user_id = $1',
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
      'SELECT * FROM income WHERE id = $1 AND user_id = $2',
      [id, userId],
    );
    if (result.rows.length === 0) throw new NotFoundException('Income not found');
    return result.rows[0];
  }

  async update(id: number, userId: number, data: UpdateIncomeDto) {
    const client = await this.databaseService.getClient();
    try {
      await client.query('BEGIN');

      if (data.income_source_id !== undefined && data.income_source_id !== null) {
        const sourceExists = await client.query(
          'SELECT * FROM income_source WHERE id = $1 AND user_id = $2',
          [data.income_source_id, userId],
        );
        if (sourceExists.rows.length === 0) throw new NotFoundException('Income source not found');
      }

      const fields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (data.name !== undefined) {
        fields.push(`name = $${paramIndex++}`);
        values.push(data.name);
      }
      if (data.value !== undefined) {
        fields.push(`value = $${paramIndex++}`);
        values.push(data.value);
      }
      if (data.recurring !== undefined) {
        fields.push(`recurring = $${paramIndex++}`);
        values.push(data.recurring);
      }
      if (data.date !== undefined) {
        fields.push(`date = $${paramIndex++}`);
        values.push(data.date);
      }
      if (data.due_date !== undefined) {
        fields.push(`due_date = $${paramIndex++}`);
        values.push(data.due_date);
      }
      if (data.income_source_id !== undefined) {
        fields.push(`income_source_id = $${paramIndex++}`);
        values.push(data.income_source_id);
      }

      if (fields.length === 0) {
        const existing = await client.query('SELECT * FROM income WHERE id = $1 AND user_id = $2', [id, userId]);
        if (existing.rows.length === 0) throw new NotFoundException('Income not found');
        await client.query('COMMIT');
        return existing.rows[0];
      }

      values.push(id, userId);
      const query = `UPDATE income SET ${fields.join(', ')} WHERE id = $${paramIndex++} AND user_id = $${paramIndex++} RETURNING *`;

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
      'DELETE FROM income WHERE id = $1 AND user_id = $2',
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
        'SELECT * FROM income WHERE id = $1 AND user_id = $2',
        [incomeId, userId],
      );
      if (incomeExists.rows.length === 0) {
        throw new NotFoundException('Income not found');
      }

      const result = await client.query(
        `INSERT INTO income_exclusion (income_id, exclusion_date, user_id)
         VALUES ($1, $2, $3) RETURNING *`,
        [incomeId, createExclusionDto.exclusion_date, userId],
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
      'SELECT * FROM income_exclusion WHERE user_id = $1 ORDER BY exclusion_date DESC',
      [userId],
    );
    return result.rows;
  }

  async removeExclusion(id: number, userId: number) {
    const result = await this.databaseService.query(
      'DELETE FROM income_exclusion WHERE id = $1 AND user_id = $2',
      [id, userId],
    );
    if (result.rowCount === 0) throw new NotFoundException('Exclusion not found');
    return { message: 'Exclusion removed successfully' };
  }
}
