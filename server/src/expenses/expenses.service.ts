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

      if (createExpenseDto.expense_category_id !== undefined && createExpenseDto.expense_category_id !== null) {
        const categoryExists = await client.query(
          'SELECT * FROM expense_category WHERE id = $1 AND user_id = $2',
          [createExpenseDto.expense_category_id, userId],
        );
        if (categoryExists.rows.length === 0) {
          throw new NotFoundException('Category not found');
        }
      }

      const result = await client.query(
        `INSERT INTO expense (name, value, recurring, date, due_date, expense_category_id, user_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [
          createExpenseDto.name,
          createExpenseDto.value,
          createExpenseDto.recurring,
          createExpenseDto.date,
          createExpenseDto.due_date,
          createExpenseDto.expense_category_id,
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
        'SELECT * FROM expense WHERE user_id = $1 ORDER BY date DESC LIMIT $2 OFFSET $3',
        [userId, maxLimit, offset],
      ),
      this.databaseService.query(
        'SELECT COUNT(*) FROM expense WHERE user_id = $1',
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
      'SELECT * FROM expense WHERE id = $1 AND user_id = $2',
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

      if (updateExpenseDto.expense_category_id !== undefined && updateExpenseDto.expense_category_id !== null) {
        const categoryExists = await client.query(
          'SELECT * FROM expense_category WHERE id = $1 AND user_id = $2',
          [updateExpenseDto.expense_category_id, userId],
        );
        if (categoryExists.rows.length === 0) throw new NotFoundException('Category not found');
      }

      const fields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (updateExpenseDto.name !== undefined) {
        fields.push(`name = $${paramIndex++}`);
        values.push(updateExpenseDto.name);
      }
      if (updateExpenseDto.value !== undefined) {
        fields.push(`value = $${paramIndex++}`);
        values.push(updateExpenseDto.value);
      }
      if (updateExpenseDto.recurring !== undefined) {
        fields.push(`recurring = $${paramIndex++}`);
        values.push(updateExpenseDto.recurring);
      }
      if (updateExpenseDto.date !== undefined) {
        fields.push(`date = $${paramIndex++}`);
        values.push(updateExpenseDto.date);
      }
      if (updateExpenseDto.due_date !== undefined) {
        fields.push(`due_date = $${paramIndex++}`);
        values.push(updateExpenseDto.due_date);
      }
      if (updateExpenseDto.expense_category_id !== undefined) {
        fields.push(`expense_category_id = $${paramIndex++}`);
        values.push(updateExpenseDto.expense_category_id);
      }

      if (fields.length === 0) {
        const existing = await client.query('SELECT * FROM expense WHERE id = $1 AND user_id = $2', [id, userId]);
        if (existing.rows.length === 0) throw new NotFoundException('Expense not found');
        await client.query('COMMIT');
        return existing.rows[0];
      }

      values.push(id, userId);
      const query = `UPDATE expense SET ${fields.join(', ')} WHERE id = $${paramIndex++} AND user_id = $${paramIndex++} RETURNING *`;

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
      'DELETE FROM expense WHERE id = $1 AND user_id = $2',
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
        'SELECT * FROM expense WHERE id = $1 AND user_id = $2',
        [expenseId, userId],
      );
      if (expenseExists.rows.length === 0) {
        throw new NotFoundException('Expense not found');
      }

      const result = await client.query(
        `INSERT INTO expense_exclusion (expense_id, exclusion_date, user_id)
         VALUES ($1, $2, $3) RETURNING *`,
        [expenseId, createExclusionDto.exclusion_date, userId],
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
      'SELECT * FROM expense_exclusion WHERE user_id = $1 ORDER BY exclusion_date DESC',
      [userId],
    );
    return result.rows;
  }

  async removeExclusion(id: number, userId: number) {
    const result = await this.databaseService.query(
      'DELETE FROM expense_exclusion WHERE id = $1 AND user_id = $2',
      [id, userId],
    );
    if (result.rowCount === 0) throw new NotFoundException('Exclusion not found');
    return { message: 'Exclusion removed successfully' };
  }
}
