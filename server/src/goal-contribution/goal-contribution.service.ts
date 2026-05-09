import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateGoalContributionDto } from './dto/create-goal-contribution.dto';
import { UpdateGoalContributionDto } from './dto/update-goal-contribution.dto';
import { PaginationResponse } from '../common/dto/pagination.dto';

@Injectable()
export class GoalContributionService {
  constructor(private databaseService: DatabaseService) {}

  async create(userId: number, data: CreateGoalContributionDto) {
    const client = await this.databaseService.getClient();
    try {
      await client.query('BEGIN');

      const goalResult = await client.query(
        'SELECT id FROM goal WHERE id = $1 AND user_id = $2',
        [data.goal_id, userId],
      );
      if (goalResult.rows.length === 0) {
        throw new NotFoundException('Goal not found');
      }

      const result = await client.query(
        `INSERT INTO goal_contribution (goal_id, value, date, observation, user_id)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [data.goal_id, data.value, data.date || new Date(), data.observation || null, userId],
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
        `SELECT cm.*, g.name as goal_name
         FROM goal_contribution cm
         JOIN goal g ON cm.goal_id = g.id
         WHERE cm.user_id = $1
         ORDER BY cm.date DESC, cm.created_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, maxLimit, offset],
      ),
      this.databaseService.query(
        'SELECT COUNT(*) FROM goal_contribution WHERE user_id = $1',
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

  async findAllByGoal(goalId: number, userId: number, page: number = 1, limit: number = 20): Promise<PaginationResponse<any>> {
    const goalResult = await this.databaseService.query(
      'SELECT id FROM goal WHERE id = $1 AND user_id = $2',
      [goalId, userId],
    );
    if (goalResult.rows.length === 0) {
      throw new NotFoundException('Goal not found');
    }

    const maxLimit = Math.min(limit, 2000);
    const offset = (page - 1) * maxLimit;

    const [dataResult, countResult] = await Promise.all([
      this.databaseService.query(
        `SELECT * FROM goal_contribution
         WHERE goal_id = $1 AND user_id = $2
         ORDER BY date DESC, created_at DESC
         LIMIT $3 OFFSET $4`,
        [goalId, userId, maxLimit, offset],
      ),
      this.databaseService.query(
        'SELECT COUNT(*) FROM goal_contribution WHERE goal_id = $1 AND user_id = $2',
        [goalId, userId],
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
      `SELECT cm.*, g.name as goal_name
       FROM goal_contribution cm
       JOIN goal g ON cm.goal_id = g.id
       WHERE cm.id = $1 AND cm.user_id = $2`,
      [id, userId],
    );
    if (result.rows.length === 0) {
      throw new NotFoundException('Contribution not found');
    }
    return result.rows[0];
  }

  async update(id: number, userId: number, data: UpdateGoalContributionDto) {
    const client = await this.databaseService.getClient();
    try {
      await client.query('BEGIN');

      const checkResult = await client.query(
        'SELECT id FROM goal_contribution WHERE id = $1 AND user_id = $2',
        [id, userId],
      );
      if (checkResult.rows.length === 0) {
        throw new NotFoundException('Contribution not found');
      }

      const result = await client.query(
        `UPDATE goal_contribution
         SET value = COALESCE($1, value),
             date = COALESCE($2, date),
             observation = COALESCE($3, observation)
         WHERE id = $4 AND user_id = $5 RETURNING *`,
        [data.value, data.date, data.observation, id, userId],
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

  async remove(id: number, userId: number) {
    const result = await this.databaseService.query(
      'DELETE FROM goal_contribution WHERE id = $1 AND user_id = $2',
      [id, userId],
    );
    if (result.rowCount === 0) {
      throw new NotFoundException('Contribution not found');
    }
    return { message: 'Contribution deleted successfully' };
  }
}
