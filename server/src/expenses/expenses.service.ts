import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { CreateExpenseExclusionDto } from './dto/create-expense-exclusion.dto';
import { PaginationResponse } from '../common/dto/pagination.dto';

@Injectable()
export class ExpensesService {
  constructor(private databaseService: DatabaseService) {}

  async create(userId: number, createExpenseDto: CreateExpenseDto) {
    const client = await this.databaseService.getClient();
    try {
      await client.query('BEGIN');

      if (createExpenseDto.categoria_despesa_id !== undefined && createExpenseDto.categoria_despesa_id !== null) {
        const categoryExists = await client.query(
          'SELECT * FROM categoria_despesa WHERE id = $1 AND usuario_id = $2',
          [createExpenseDto.categoria_despesa_id, userId],
        );
        if (categoryExists.rows.length === 0) {
          throw new NotFoundException('Category not found');
        }
      }

      const result = await client.query(
        `INSERT INTO despesa (nome, valor, recorrente, data, data_vencimento, categoria_despesa_id, usuario_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [
          createExpenseDto.nome,
          createExpenseDto.valor,
          createExpenseDto.recorrente,
          createExpenseDto.data,
          createExpenseDto.data_vencimento,
          createExpenseDto.categoria_despesa_id,
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
        'SELECT * FROM despesa WHERE usuario_id = $1 ORDER BY data DESC LIMIT $2 OFFSET $3',
        [userId, maxLimit, offset],
      ),
      this.databaseService.query(
        'SELECT COUNT(*) FROM despesa WHERE usuario_id = $1',
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
      'SELECT * FROM despesa WHERE id = $1 AND usuario_id = $2',
      [id, userId],
    );
    if (result.rows.length === 0) {
      throw new NotFoundException('Expense not found');
    }
    return result.rows[0];
  }

  async update(id: number, userId: number, updateExpenseDto: UpdateExpenseDto) {
    const client = await this.databaseService.getClient();
    try {
      await client.query('BEGIN');

      if (updateExpenseDto.categoria_despesa_id !== undefined && updateExpenseDto.categoria_despesa_id !== null) {
        const categoryExists = await client.query(
          'SELECT * FROM categoria_despesa WHERE id = $1 AND usuario_id = $2',
          [updateExpenseDto.categoria_despesa_id, userId],
        );
        if (categoryExists.rows.length === 0) throw new NotFoundException('Category not found');
      }

      const fields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (updateExpenseDto.nome !== undefined) {
        fields.push(`nome = $${paramIndex++}`);
        values.push(updateExpenseDto.nome);
      }
      if (updateExpenseDto.valor !== undefined) {
        fields.push(`valor = $${paramIndex++}`);
        values.push(updateExpenseDto.valor);
      }
      if (updateExpenseDto.recorrente !== undefined) {
        fields.push(`recorrente = $${paramIndex++}`);
        values.push(updateExpenseDto.recorrente);
      }
      if (updateExpenseDto.data !== undefined) {
        fields.push(`data = $${paramIndex++}`);
        values.push(updateExpenseDto.data);
      }
      if (updateExpenseDto.data_vencimento !== undefined) {
        fields.push(`data_vencimento = $${paramIndex++}`);
        values.push(updateExpenseDto.data_vencimento);
      }
      if (updateExpenseDto.categoria_despesa_id !== undefined) {
        fields.push(`categoria_despesa_id = $${paramIndex++}`);
        values.push(updateExpenseDto.categoria_despesa_id);
      }

      if (fields.length === 0) {
        const existing = await client.query('SELECT * FROM despesa WHERE id = $1 AND usuario_id = $2', [id, userId]);
        if (existing.rows.length === 0) throw new NotFoundException('Expense not found');
        await client.query('COMMIT');
        return existing.rows[0];
      }

      values.push(id, userId);
      const query = `UPDATE despesa SET ${fields.join(', ')} WHERE id = $${paramIndex++} AND usuario_id = $${paramIndex++} RETURNING *`;

      const result = await client.query(query, values);

      if (result.rows.length === 0) throw new NotFoundException('Expense not found');

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
      'DELETE FROM despesa WHERE id = $1 AND usuario_id = $2',
      [id, userId],
    );
    if (result.rowCount === 0) throw new NotFoundException('Expense not found');
    return { message: 'Expense deleted successfully' };
  }

  async createExclusion(expenseId: number, userId: number, createExclusionDto: CreateExpenseExclusionDto) {
    const client = await this.databaseService.getClient();
    try {
      await client.query('BEGIN');

      const expenseExists = await client.query(
        'SELECT * FROM despesa WHERE id = $1 AND usuario_id = $2',
        [expenseId, userId],
      );
      if (expenseExists.rows.length === 0) {
        throw new NotFoundException('Expense not found');
      }

      const result = await client.query(
        `INSERT INTO despesa_exclusao (despesa_id, data_exclusao, usuario_id)
         VALUES ($1, $2, $3) RETURNING *`,
        [expenseId, createExclusionDto.data_exclusao, userId],
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
      'SELECT * FROM despesa_exclusao WHERE usuario_id = $1 ORDER BY data_exclusao DESC',
      [userId],
    );
    return result.rows;
  }

  async removeExclusion(id: number, userId: number) {
    const result = await this.databaseService.query(
      'DELETE FROM despesa_exclusao WHERE id = $1 AND usuario_id = $2',
      [id, userId],
    );
    if (result.rowCount === 0) throw new NotFoundException('Exclusion not found');
    return { message: 'Exclusion removed successfully' };
  }
}
