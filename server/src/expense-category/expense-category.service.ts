import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class ExpenseCategoryService {
  constructor(private databaseService: DatabaseService) {}

  async create(userId: number, nome: string, icone?: string) {
    const result = await this.databaseService.query(
      'INSERT INTO categoria_despesa (nome, icone, usuario_id) VALUES ($1, $2, $3) RETURNING *',
      [nome, icone || 'Home', userId],
    );
    return result.rows[0];
  }

  async findAll(userId: number) {
    const result = await this.databaseService.query(
      'SELECT * FROM categoria_despesa WHERE usuario_id = $1',
      [userId],
    );
    return result.rows;
  }

  async findOne(id: number, userId: number) {
    const result = await this.databaseService.query(
      'SELECT * FROM categoria_despesa WHERE id = $1 AND usuario_id = $2',
      [id, userId],
    );
    if (result.rows.length === 0) throw new NotFoundException('Expense category not found');
    return result.rows[0];
  }

  async update(id: number, userId: number, nome: string, icone?: string) {
    const result = await this.databaseService.query(
      'UPDATE categoria_despesa SET nome = $1, icone = COALESCE($2, icone) WHERE id = $3 AND usuario_id = $4 RETURNING *',
      [nome, icone, id, userId],
    );
    if (result.rows.length === 0) throw new NotFoundException('Expense category not found');
    return result.rows[0];
  }

  async remove(id: number, userId: number) {
    await this.findOne(id, userId);
    
    await this.databaseService.query(
      'UPDATE despesa SET categoria_despesa_id = NULL WHERE categoria_despesa_id = $1 AND usuario_id = $2',
      [id, userId],
    );
    
    const result = await this.databaseService.query(
      'DELETE FROM categoria_despesa WHERE id = $1 AND usuario_id = $2',
      [id, userId],
    );
    
    if (result.rowCount === 0) throw new NotFoundException('Expense category not found');
    return { message: 'Expense category deleted successfully' };
  }
}
