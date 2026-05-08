import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class IncomeSourceService {
  constructor(private databaseService: DatabaseService) {}

  async create(userId: number, nome: string, icone?: string) {
    const result = await this.databaseService.query(
      'INSERT INTO fonte_receita (nome, icone, usuario_id) VALUES ($1, $2, $3) RETURNING *',
      [nome, icone || 'DollarSign', userId],
    );
    return result.rows[0];
  }

  async findAll(userId: number) {
    const result = await this.databaseService.query(
      'SELECT * FROM fonte_receita WHERE usuario_id = $1',
      [userId],
    );
    return result.rows;
  }

  async findOne(id: number, userId: number) {
    const result = await this.databaseService.query(
      'SELECT * FROM fonte_receita WHERE id = $1 AND usuario_id = $2',
      [id, userId],
    );
    if (result.rows.length === 0) throw new NotFoundException('Income source not found');
    return result.rows[0];
  }

  async update(id: number, userId: number, nome: string, icone?: string) {
    const result = await this.databaseService.query(
      'UPDATE fonte_receita SET nome = $1, icone = COALESCE($2, icone) WHERE id = $3 AND usuario_id = $4 RETURNING *',
      [nome, icone, id, userId],
    );
    if (result.rows.length === 0) throw new NotFoundException('Income source not found');
    return result.rows[0];
  }

  async remove(id: number, userId: number) {
    await this.findOne(id, userId);
    
    await this.databaseService.query(
      'UPDATE receita SET fonte_receita_id = NULL WHERE fonte_receita_id = $1 AND usuario_id = $2',
      [id, userId],
    );
    
    const result = await this.databaseService.query(
      'DELETE FROM fonte_receita WHERE id = $1 AND usuario_id = $2',
      [id, userId],
    );
    
    if (result.rowCount === 0) throw new NotFoundException('Income source not found');
    return { message: 'Income source deleted successfully' };
  }
}
