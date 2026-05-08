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
        'SELECT id FROM usuario WHERE id = $1',
        [userId],
      );
      if (userCheck.rows.length === 0) {
        throw new BadRequestException(`User with ID ${userId} does not exist`);
      }

      const result = await client.query(
        `INSERT INTO meta (nome, descricao, valor, economia_mensal, data_inicio, data_alvo, usuario_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [
          data.nome,
          data.descricao || null,
          data.valor,
          data.economia_mensal || 0,
          data.data_inicio || new Date(),
          data.data_alvo || null,
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
        'SELECT * FROM meta WHERE usuario_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
        [userId, maxLimit, offset],
      ),
      this.databaseService.query(
        'SELECT COUNT(*) FROM meta WHERE usuario_id = $1',
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
      'SELECT * FROM meta WHERE id = $1 AND usuario_id = $2',
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
        `UPDATE meta
         SET nome = COALESCE($1, nome),
             descricao = COALESCE($2, descricao),
             valor = COALESCE($3, valor),
             economia_mensal = COALESCE($4, economia_mensal),
             data_inicio = COALESCE($5, data_inicio),
             data_alvo = COALESCE($6, data_alvo)
         WHERE id = $7 AND usuario_id = $8 RETURNING *`,
        [data.nome, data.descricao, data.valor, data.economia_mensal, data.data_inicio, data.data_alvo, id, userId],
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
      'DELETE FROM meta WHERE id = $1 AND usuario_id = $2',
      [id, userId],
    );
    if (result.rowCount === 0) throw new NotFoundException('Goal not found');
    return { message: 'Goal deleted successfully' };
  }
}
