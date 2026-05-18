import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { ExportQueryDto } from './dto/export-query.dto';
import { ImportDto } from './dto/import.dto';

@Injectable()
export class ReportsService {
  constructor(private databaseService: DatabaseService) {}

  async exportData(userId: number, query: ExportQueryDto) {
    const { start, end, categories, sources } = query;

    const expenseCategories = await this.databaseService.query(
      'SELECT id, name, icon FROM expense_category WHERE user_id = $1 ORDER BY id',
      [userId],
    );

    const incomeSources = await this.databaseService.query(
      'SELECT id, name, icon FROM income_source WHERE user_id = $1 ORDER BY id',
      [userId],
    );

    let expenseQuery =
      'SELECT id, name, value, recurring, date, due_date, expense_category_id FROM expense WHERE user_id = $1';
    const expenseParams: any[] = [userId];
    let paramIdx = 2;

    if (start) {
      expenseQuery += ` AND date >= $${paramIdx}`;
      expenseParams.push(start);
      paramIdx++;
    }
    if (end) {
      expenseQuery += ` AND date <= $${paramIdx}`;
      expenseParams.push(end);
      paramIdx++;
    }
    if (categories) {
      const catIds = categories
        .split(',')
        .map(Number)
        .filter((n) => !isNaN(n));
      if (catIds.length > 0) {
        expenseQuery += ` AND expense_category_id IN (${catIds.map((_, i) => `$${paramIdx + i}`).join(',')})`;
        expenseParams.push(...catIds);
        paramIdx += catIds.length;
      }
    }
    expenseQuery += ' ORDER BY date, id';
    const expenses = await this.databaseService.query(expenseQuery, expenseParams);

    let incomeQuery =
      'SELECT id, name, value, recurring, date, due_date, income_source_id FROM income WHERE user_id = $1';
    const incomeParams: any[] = [userId];
    paramIdx = 2;

    if (start) {
      incomeQuery += ` AND date >= $${paramIdx}`;
      incomeParams.push(start);
      paramIdx++;
    }
    if (end) {
      incomeQuery += ` AND date <= $${paramIdx}`;
      incomeParams.push(end);
      paramIdx++;
    }
    if (sources) {
      const srcIds = sources
        .split(',')
        .map(Number)
        .filter((n) => !isNaN(n));
      if (srcIds.length > 0) {
        incomeQuery += ` AND income_source_id IN (${srcIds.map((_, i) => `$${paramIdx + i}`).join(',')})`;
        incomeParams.push(...srcIds);
        paramIdx += srcIds.length;
      }
    }
    incomeQuery += ' ORDER BY date, id';
    const incomes = await this.databaseService.query(incomeQuery, incomeParams);

    const goals = await this.databaseService.query(
      'SELECT id, name, description, value, current_value, monthly_savings, start_date, target_date FROM goal WHERE user_id = $1 ORDER BY id',
      [userId],
    );

    const goalContributions = await this.databaseService.query(
      'SELECT gc.id, gc.goal_id, gc.value, gc.date, gc.observation, g.name as goal_name FROM goal_contribution gc JOIN goal g ON g.id = gc.goal_id WHERE gc.user_id = $1 ORDER BY gc.date, gc.id',
      [userId],
    );

    const expenseExclusions = await this.databaseService.query(
      'SELECT ee.id, ee.expense_id, ee.exclusion_date, e.name as expense_name FROM expense_exclusion ee JOIN expense e ON e.id = ee.expense_id WHERE ee.user_id = $1 ORDER BY ee.exclusion_date, ee.id',
      [userId],
    );

    const incomeExclusions = await this.databaseService.query(
      'SELECT ie.id, ie.income_id, ie.exclusion_date, i.name as income_name FROM income_exclusion ie JOIN income i ON i.id = ie.income_id WHERE ie.user_id = $1 ORDER BY ie.exclusion_date, ie.id',
      [userId],
    );

    return {
      expenseCategories: expenseCategories.rows,
      incomeSources: incomeSources.rows,
      expenses: expenses.rows,
      incomes: incomes.rows,
      goals: goals.rows,
      goalContributions: goalContributions.rows,
      expenseExclusions: expenseExclusions.rows,
      incomeExclusions: incomeExclusions.rows,
    };
  }

  async importData(userId: number, dto: ImportDto) {
    const results: string[] = [];
    const categoryMap = new Map<string, number>();
    const sourceMap = new Map<string, number>();
    const goalMap = new Map<string, number>();
    const expenseMap = new Map<string, number>();
    const incomeMap = new Map<string, number>();

    const rows = dto.rows;

    const categoryRows = rows.filter((r) => r.type === 'expense_category');
    for (const row of categoryRows) {
      try {
        const existing = await this.databaseService.query(
          'SELECT id FROM expense_category WHERE user_id = $1 AND name = $2',
          [userId, row.name],
        );
        if (existing.rows.length > 0) {
          categoryMap.set(row.name!, existing.rows[0].id);
          results.push(`Category "${row.name}" already exists, skipped`);
          continue;
        }
        const result = await this.databaseService.query(
          'INSERT INTO expense_category (name, icon, user_id) VALUES ($1, $2, $3) RETURNING id',
          [row.name, row.icon || 'Home', userId],
        );
        categoryMap.set(row.name!, result.rows[0].id);
        results.push(`Category "${row.name}" imported`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        results.push(`Error importing category "${row.name}": ${msg}`);
      }
    }

    const sourceRows = rows.filter((r) => r.type === 'income_source');
    for (const row of sourceRows) {
      try {
        const existing = await this.databaseService.query(
          'SELECT id FROM income_source WHERE user_id = $1 AND name = $2',
          [userId, row.name],
        );
        if (existing.rows.length > 0) {
          sourceMap.set(row.name!, existing.rows[0].id);
          results.push(`Source "${row.name}" already exists, skipped`);
          continue;
        }
        const result = await this.databaseService.query(
          'INSERT INTO income_source (name, icon, user_id) VALUES ($1, $2, $3) RETURNING id',
          [row.name, row.icon || 'DollarSign', userId],
        );
        sourceMap.set(row.name!, result.rows[0].id);
        results.push(`Source "${row.name}" imported`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        results.push(`Error importing source "${row.name}": ${msg}`);
      }
    }

    const expenseRows = rows.filter((r) => r.type === 'expense');
    for (const row of expenseRows) {
      try {
        let categoryId = null;
        if (row.category_name && categoryMap.has(row.category_name)) {
          categoryId = categoryMap.get(row.category_name);
        }
        const result = await this.databaseService.query(
          'INSERT INTO expense (name, value, recurring, date, due_date, expense_category_id, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
          [
            row.name,
            row.value,
            row.recurring || false,
            row.date,
            row.due_date || null,
            categoryId,
            userId,
          ],
        );
        expenseMap.set(row.name! + (row.date || ''), result.rows[0].id);
        results.push(`Expense "${row.name}" imported`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        results.push(`Error importing expense "${row.name}": ${msg}`);
      }
    }

    const incomeRows = rows.filter((r) => r.type === 'income');
    for (const row of incomeRows) {
      try {
        let sourceId = null;
        if (row.source_name && sourceMap.has(row.source_name)) {
          sourceId = sourceMap.get(row.source_name);
        }
        const result = await this.databaseService.query(
          'INSERT INTO income (name, value, recurring, date, due_date, income_source_id, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
          [
            row.name,
            row.value,
            row.recurring || false,
            row.date,
            row.due_date || null,
            sourceId,
            userId,
          ],
        );
        incomeMap.set(row.name! + (row.date || ''), result.rows[0].id);
        results.push(`Income "${row.name}" imported`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        results.push(`Error importing income "${row.name}": ${msg}`);
      }
    }

    const goalRows = rows.filter((r) => r.type === 'goal');
    for (const row of goalRows) {
      try {
        const existing = await this.databaseService.query(
          'SELECT id FROM goal WHERE user_id = $1 AND name = $2',
          [userId, row.name],
        );
        if (existing.rows.length > 0) {
          goalMap.set(row.name!, existing.rows[0].id);
          results.push(`Goal "${row.name}" already exists, skipped`);
          continue;
        }
        const result = await this.databaseService.query(
          'INSERT INTO goal (name, description, value, current_value, monthly_savings, start_date, target_date, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
          [
            row.name,
            row.description || null,
            row.value,
            row.current_value || 0,
            row.monthly_savings || 0,
            row.start_date || new Date().toISOString().split('T')[0],
            row.target_date || null,
            userId,
          ],
        );
        goalMap.set(row.name!, result.rows[0].id);
        results.push(`Goal "${row.name}" imported`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        results.push(`Error importing goal "${row.name}": ${msg}`);
      }
    }

    const contributionRows = rows.filter((r) => r.type === 'goal_contribution');
    for (const row of contributionRows) {
      try {
        let goalId = null;
        if (row.goal_name && goalMap.has(row.goal_name)) {
          goalId = goalMap.get(row.goal_name);
        }
        if (!goalId) {
          results.push(`Goal "${row.goal_name}" not found for contribution, skipped`);
          continue;
        }
        await this.databaseService.query(
          'INSERT INTO goal_contribution (goal_id, value, date, observation, user_id) VALUES ($1, $2, $3, $4, $5)',
          [
            goalId,
            row.value,
            row.date || new Date().toISOString().split('T')[0],
            row.observation || null,
            userId,
          ],
        );
        results.push(`Goal contribution for "${row.goal_name}" imported`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        results.push(`Error importing goal contribution: ${msg}`);
      }
    }

    const exclusionExpenseRows = rows.filter((r) => r.type === 'expense_exclusion');
    for (const row of exclusionExpenseRows) {
      try {
        let expenseId = null;
        if (row.entity_name && expenseMap.has(row.entity_name + (row.date || ''))) {
          expenseId = expenseMap.get(row.entity_name + (row.date || ''));
        }
        if (!expenseId) {
          const found = await this.databaseService.query(
            'SELECT id FROM expense WHERE user_id = $1 AND name = $2 LIMIT 1',
            [userId, row.entity_name],
          );
          if (found.rows.length > 0) expenseId = found.rows[0].id;
        }
        if (!expenseId) {
          results.push(`Expense "${row.entity_name}" not found for exclusion, skipped`);
          continue;
        }
        await this.databaseService.query(
          'INSERT INTO expense_exclusion (expense_id, exclusion_date, user_id) VALUES ($1, $2, $3)',
          [expenseId, row.exclusion_date, userId],
        );
        results.push(`Expense exclusion for "${row.entity_name}" imported`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        results.push(`Error importing expense exclusion: ${msg}`);
      }
    }

    const exclusionIncomeRows = rows.filter((r) => r.type === 'income_exclusion');
    for (const row of exclusionIncomeRows) {
      try {
        let incomeId = null;
        if (row.entity_name && incomeMap.has(row.entity_name + (row.date || ''))) {
          incomeId = incomeMap.get(row.entity_name + (row.date || ''));
        }
        if (!incomeId) {
          const found = await this.databaseService.query(
            'SELECT id FROM income WHERE user_id = $1 AND name = $2 LIMIT 1',
            [userId, row.entity_name],
          );
          if (found.rows.length > 0) incomeId = found.rows[0].id;
        }
        if (!incomeId) {
          results.push(`Income "${row.entity_name}" not found for exclusion, skipped`);
          continue;
        }
        await this.databaseService.query(
          'INSERT INTO income_exclusion (income_id, exclusion_date, user_id) VALUES ($1, $2, $3)',
          [incomeId, row.exclusion_date, userId],
        );
        results.push(`Income exclusion for "${row.entity_name}" imported`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        results.push(`Error importing income exclusion: ${msg}`);
      }
    }

    return { results };
  }
}
