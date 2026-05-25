import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import { UpdateWishlistDto } from './dto/update-wishlist.dto';
import { PaginationResponse } from '../common/dto/pagination.dto';

@Injectable()
export class WishlistService {
  constructor(private databaseService: DatabaseService) {}

  private getDefaultQuarter(): string {
    const now = new Date()
    const yy = now.getFullYear().toString().slice(-2)
    const q = Math.floor(now.getMonth() / 3) + 1
    return `${yy}Q${q}`
  }

  async create(userId: number, data: CreateWishlistDto) {
    const client = await this.databaseService.getClient();
    try {
      await client.query('BEGIN');

      const userCheck = await client.query('SELECT id FROM users WHERE id = $1', [userId]);
      if (userCheck.rows.length === 0) {
        throw new BadRequestException(`User with ID ${userId} does not exist`);
      }

      const result = await client.query(
        `INSERT INTO wishlist (name, price, checked, priority, quarter, wishlist_type_id, saga_id, user_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [
          data.name,
          data.price,
          data.checked ?? false,
          data.priority || 'medium',
          data.quarter || this.getDefaultQuarter(),
          data.wishlist_type_id || null,
          data.saga_id || null,
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

  async findAll(
    userId: number,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginationResponse<any>> {
    const maxLimit = Math.min(limit, 2000);
    const offset = (page - 1) * maxLimit;

    const [dataResult, countResult] = await Promise.all([
      this.databaseService.query(
        'SELECT * FROM wishlist WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
        [userId, maxLimit, offset],
      ),
      this.databaseService.query('SELECT COUNT(*) FROM wishlist WHERE user_id = $1', [userId]),
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
      'SELECT * FROM wishlist WHERE id = $1 AND user_id = $2',
      [id, userId],
    );
    if (result.rows.length === 0) throw new NotFoundException('Wishlist item not found');
    return result.rows[0];
  }

  async update(id: number, userId: number, data: UpdateWishlistDto) {
    const client = await this.databaseService.getClient();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        `UPDATE wishlist
         SET name = COALESCE($1, name),
             price = COALESCE($2, price),
             checked = COALESCE($3, checked),
             priority = COALESCE($4, priority),
             quarter = COALESCE($5, quarter),
             wishlist_type_id = COALESCE($6, wishlist_type_id),
             saga_id = COALESCE($7, saga_id)
         WHERE id = $8 AND user_id = $9 RETURNING *`,
        [
          data.name,
          data.price,
          data.checked,
          data.priority,
          data.quarter,
          data.wishlist_type_id,
          data.saga_id,
          id,
          userId,
        ],
      );
      if (result.rows.length === 0) throw new NotFoundException('Wishlist item not found');

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
      'DELETE FROM wishlist WHERE id = $1 AND user_id = $2',
      [id, userId],
    );
    if (result.rowCount === 0) throw new NotFoundException('Wishlist item not found');
    return { message: 'Wishlist item deleted successfully' };
  }
}
