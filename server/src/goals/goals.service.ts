import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { PaginationResponse } from '../common/dto/pagination.dto';

@Injectable()
export class GoalsService {
  constructor(private databaseService: DatabaseService) {}

  async create(userId: number, data: CreateGoalDto) {
    const client = await this.databaseService.getClient();
    try {
      await client.query('BEGIN');

      const userCheck = await client.query(
        'SELECT id FROM users WHERE id = $1',
        [userId],
      );
      if (userCheck.rows.length === 0) {
        throw new BadRequestException(`User with ID ${userId} does not exist`);
      }

      const result = await client.query(
        `INSERT INTO goal (name, description, value, monthly_savings, start_date, target_date, user_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [
          data.name,
          data.description || null,
          data.value,
          data.monthly_savings || 0,
          data.start_date || new Date(),
          data.target_date || null,
          userId
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
        'SELECT * FROM goal WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
        [userId, maxLimit, offset],
      ),
      this.databaseService.query(
        'SELECT COUNT(*) FROM goal WHERE user_id = $1',
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
      'SELECT * FROM goal WHERE id = $1 AND user_id = $2',
      [id, userId],
    );
    if (result.rows.length === 0) throw new NotFoundException('Goal not found');
    return result.rows[0];
  }

  async update(id: number, userId: number, data: UpdateGoalDto) {
    const client = await this.databaseService.getClient();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        `UPDATE goal
         SET name = COALESCE($1, name),
             description = COALESCE($2, description),
             value = COALESCE($3, value),
             monthly_savings = COALESCE($4, monthly_savings),
             start_date = COALESCE($5, start_date),
             target_date = COALESCE($6, target_date)
         WHERE id = $7 AND user_id = $8 RETURNING *`,
        [data.name, data.description, data.value, data.monthly_savings, data.start_date, data.target_date, id, userId],
      );
      if (result.rows.length === 0) throw new NotFoundException('Goal not found');

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
      'DELETE FROM goal WHERE id = $1 AND user_id = $2',
      [id, userId],
    );
    if (result.rowCount === 0) throw new NotFoundException('Goal not found');
    return { message: 'Goal deleted successfully' };
  }
}
