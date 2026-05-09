import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateExpenseDto } from '../src/expenses/dto/create-expense.dto';
import { CreateExpenseExclusionDto } from '../src/expenses/dto/create-expense-exclusion.dto';
import { CreateIncomeDto } from '../src/incomes/dto/create-income.dto';
import { CreateIncomeExclusionDto } from '../src/incomes/dto/create-income-exclusion.dto';
import { CreateGoalDto } from '../src/goals/dto/create-goal.dto';
import { CreateGoalContributionDto } from '../src/goal-contribution/dto/create-goal-contribution.dto';
import { CreateExpenseCategoryDto } from '../src/expense-category/dto/create-expense-category.dto';
import { CreateIncomeSourceDto } from '../src/income-source/dto/create-income-source.dto';

describe('CRUD DTO Field Name Compatibility', () => {
  describe('CreateExpenseDto', () => {
    it('should accept English field names', async () => {
      const dto = plainToInstance(CreateExpenseDto, {
        name: 'Supermarket',
        value: 150.50,
        recurring: false,
        date: '2025-10-09',
        due_date: '2025-10-15',
        expense_category_id: 1,
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject Portuguese fields (nome, valor, recorrente, data)', async () => {
      const dto = plainToInstance(CreateExpenseDto, {
        nome: 'Supermercado',
        valor: 150.50,
        recorrente: false,
        data: '2025-10-09',
        data_vencimento: '2025-10-15',
        categoria_despesa_id: 1,
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(4);
    });
  });

  describe('CreateExpenseExclusionDto', () => {
    it('should accept English field exclusion_date', async () => {
      const dto = plainToInstance(CreateExpenseExclusionDto, {
        exclusion_date: '2025-11-01',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject Portuguese field data_exclusao', async () => {
      const dto = plainToInstance(CreateExpenseExclusionDto, {
        data_exclusao: '2025-11-01',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
    });
  });

  describe('CreateIncomeDto', () => {
    it('should accept English field names', async () => {
      const dto = plainToInstance(CreateIncomeDto, {
        name: 'Salary',
        value: 2500.00,
        recurring: true,
        date: '2025-10-09',
        due_date: '2025-10-15',
        income_source_id: 1,
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject Portuguese fields (nome, valor, recorrente, data)', async () => {
      const dto = plainToInstance(CreateIncomeDto, {
        nome: 'Salario',
        valor: 2500.00,
        recorrente: true,
        data: '2025-10-09',
        data_vencimento: '2025-10-15',
        fonte_receita_id: 1,
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(4);
    });
  });

  describe('CreateIncomeExclusionDto', () => {
    it('should accept English field exclusion_date', async () => {
      const dto = plainToInstance(CreateIncomeExclusionDto, {
        exclusion_date: '2025-11-01',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject Portuguese field data_exclusao', async () => {
      const dto = plainToInstance(CreateIncomeExclusionDto, {
        data_exclusao: '2025-11-01',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
    });
  });

  describe('CreateGoalDto', () => {
    it('should accept English field names', async () => {
      const dto = plainToInstance(CreateGoalDto, {
        name: 'Trip to Europe',
        description: 'Planning',
        value: 5000.00,
        monthly_savings: 500.00,
        start_date: '2025-10-09',
        target_date: '2026-12-31',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject Portuguese fields (nome, valor)', async () => {
      const dto = plainToInstance(CreateGoalDto, {
        nome: 'Viagem',
        descricao: 'Planejamento',
        valor: 5000.00,
        economia_mensal: 500.00,
        data_inicio: '2025-10-09',
        data_alvo: '2026-12-31',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(2);
    });
  });

  describe('CreateGoalContributionDto', () => {
    it('should accept English field names', async () => {
      const dto = plainToInstance(CreateGoalContributionDto, {
        goal_id: 1,
        value: 250.00,
        date: '2025-11-13',
        observation: 'Monthly contribution',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject Portuguese fields (meta_id, valor)', async () => {
      const dto = plainToInstance(CreateGoalContributionDto, {
        meta_id: 1,
        valor: 250.00,
        data: '2025-11-13',
        observacao: 'Contribuicao mensal',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(2);
    });
  });

  describe('CreateExpenseCategoryDto', () => {
    it('should accept English field names', async () => {
      const dto = plainToInstance(CreateExpenseCategoryDto, {
        name: 'Food',
        icon: 'ShoppingCart',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject Portuguese field nome', async () => {
      const dto = plainToInstance(CreateExpenseCategoryDto, {
        nome: 'Alimentacao',
        icone: 'ShoppingCart',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
    });
  });

  describe('CreateIncomeSourceDto', () => {
    it('should accept English field names', async () => {
      const dto = plainToInstance(CreateIncomeSourceDto, {
        name: 'Salary',
        icon: 'DollarSign',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject Portuguese field nome', async () => {
      const dto = plainToInstance(CreateIncomeSourceDto, {
        nome: 'Salario',
        icone: 'DollarSign',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
    });
  });
});
