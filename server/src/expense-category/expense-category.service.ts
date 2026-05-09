import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class ExpenseCategoryService {
  constructor(private databaseService: DatabaseService) {}

  async create(userId: number, name: string, icon?: string) {
    const result = await this.databaseService.query(
      'INSERT INTO expense_category (name, icon, user_id) VALUES ($1, $2, $3) RETURNING *',
      [name, icon || 'Home', userId],
    );
    return result.rows[0];
  }

  async findAll(userId: number) {
    const result = await this.databaseService.query(
      'SELECT * FROM expense_category WHERE user_id = $1',
      [userId],
    );
    return result.rows;
  }

  async findOne(id: number, userId: number) {
    const result = await this.databaseService.query(
      'SELECT * FROM expense_category WHERE id = $1 AND user_id = $2',
      [id, userId],
    );
    if (result.rows.length === 0) throw new NotFoundException('Expense category not found');
    return result.rows[0];
  }

  async update(id: number, userId: number, name: string, icon?: string) {
    const result = await this.databaseService.query(
      'UPDATE expense_category SET name = $1, icon = COALESCE($2, icon) WHERE id = $3 AND user_id = $4 RETURNING *',
      [name, icon, id, userId],
    );
    if (result.rows.length === 0) throw new NotFoundException('Expense category not found');
    return result.rows[0];
  }

  async remove(id: number, userId: number) {
    await this.findOne(id, userId);
    
    await this.databaseService.query(
      'UPDATE expense SET expense_category_id = NULL WHERE expense_category_id = $1 AND user_id = $2',
      [id, userId],
    );
    
    const result = await this.databaseService.query(
      'DELETE FROM expense_category WHERE id = $1 AND user_id = $2',
      [id, userId],
    );
    
    if (result.rowCount === 0) throw new NotFoundException('Expense category not found');
    return { message: 'Expense category deleted successfully' };
  }
}
