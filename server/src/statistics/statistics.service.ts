import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { StatisticsQueryDto } from './dto/statistics-query.dto';

@Injectable()
export class StatisticsService {
  constructor(private databaseService: DatabaseService) {}

  private defaultDateRange(query: StatisticsQueryDto) {
    const now = new Date();
    const end = query.end || now.toISOString().split('T')[0];
    const defaultStart = new Date(now.getFullYear(), now.getMonth() - 11, 1)
      .toISOString()
      .split('T')[0];
    const start = query.start || defaultStart;
    return { start, end };
  }

  async getKpi(userId: number, query: StatisticsQueryDto) {
    const { start, end } = this.defaultDateRange(query);
    const categoryIds = query.categories
      ? query.categories.split(',').map(Number)
      : null;
    const goalIds = query.goals
      ? query.goals.split(',').map(Number)
      : null;

    const expenseFilter =
      categoryIds && categoryIds.length > 0
        ? `AND e.expense_category_id = ANY(${4}::int[])`
        : '';
    const params: any[] = [userId, start, end];
    if (categoryIds && categoryIds.length > 0) params.push(categoryIds);

    const result = await this.databaseService.query(
      `
      WITH months AS (
        SELECT generate_series(
          date_trunc('month', $2::date),
          date_trunc('month', $3::date),
          '1 month'::interval
        )::date AS month_start
      ),
      expanded_expenses AS (
        SELECT e.id, e.name, e.value, e.expense_category_id, m.month_start
        FROM expense e
        CROSS JOIN months m
        WHERE e.user_id = $1
          AND e.recurring = true
          AND date_trunc('month', e.date) <= m.month_start
          AND (e.due_date IS NULL OR date_trunc('month', e.due_date) >= m.month_start)
          AND NOT EXISTS (
            SELECT 1 FROM expense_exclusion ex
            WHERE ex.expense_id = e.id
              AND date_trunc('month', ex.exclusion_date) = m.month_start
              AND ex.user_id = $1
          )
          ${categoryIds && categoryIds.length > 0 ? expenseFilter : ''}
        UNION ALL
        SELECT e.id, e.name, e.value, e.expense_category_id, date_trunc('month', e.date) AS month_start
        FROM expense e
        WHERE e.user_id = $1
          AND e.recurring = false
          AND e.date BETWEEN $2 AND $3
          ${categoryIds && categoryIds.length > 0 ? expenseFilter : ''}
      ),
      expanded_incomes AS (
        SELECT i.id, i.name, i.value, m.month_start
        FROM income i
        CROSS JOIN months m
        WHERE i.user_id = $1
          AND i.recurring = true
          AND date_trunc('month', i.date) <= m.month_start
          AND (i.due_date IS NULL OR date_trunc('month', i.due_date) >= m.month_start)
          AND NOT EXISTS (
            SELECT 1 FROM income_exclusion iex
            WHERE iex.income_id = i.id
              AND date_trunc('month', iex.exclusion_date) = m.month_start
              AND iex.user_id = $1
          )
        UNION ALL
        SELECT i.id, i.name, i.value, date_trunc('month', i.date) AS month_start
        FROM income i
        WHERE i.user_id = $1
          AND i.recurring = false
          AND i.date BETWEEN $2 AND $3
      ),
      monthly_balance AS (
        SELECT
          COALESCE(e.month_start, i.month_start) AS month_start,
          COALESCE(SUM(e.total_expenses), 0) AS total_expenses,
          COALESCE(SUM(i.total_incomes), 0) AS total_incomes
        FROM (
          SELECT month_start, SUM(value) AS total_expenses FROM expanded_expenses GROUP BY month_start
        ) e
        FULL OUTER JOIN (
          SELECT month_start, SUM(value) AS total_incomes FROM expanded_incomes GROUP BY month_start
        ) i ON e.month_start = i.month_start
        GROUP BY COALESCE(e.month_start, i.month_start)
      ),
      top_categories AS (
        SELECT c.name, c.icon, SUM(ee.value) AS total
        FROM expanded_expenses ee
        JOIN expense_category c ON c.id = ee.expense_category_id
        GROUP BY c.id, c.name, c.icon
        ORDER BY total DESC
        LIMIT 3
      ),
      goal_stats AS (
        SELECT
          COUNT(*)::int AS total_goals,
          COALESCE(SUM(g.value), 0) AS total_target,
          COALESCE(SUM(g.current_value), 0) AS total_current,
          COALESCE(SUM(g.monthly_savings), 0) AS total_monthly_savings
        FROM goal g
        WHERE g.user_id = $1
        ${goalIds && goalIds.length > 0 ? `AND g.id = ANY(${5}::int[])` : ''}
      ),
      balance_summary AS (
        SELECT
          COALESCE(SUM(total_incomes), 0) AS total_incomes,
          COALESCE(SUM(total_expenses), 0) AS total_expenses,
          COUNT(*) AS months_with_data,
          COUNT(*) FILTER (WHERE total_incomes > 0) AS months_with_income,
          COUNT(*) FILTER (WHERE total_expenses > 0) AS months_with_expenses,
          COALESCE(AVG(total_incomes), 0) AS avg_monthly_income,
          COALESCE(AVG(total_incomes - total_expenses), 0) AS avg_balance
        FROM monthly_balance
      ),
      balance_trend AS (
        SELECT
          CASE
            WHEN COALESCE(AVG(balance_recent), 0) > COALESCE(AVG(balance_prev), 0) * 1.1 THEN 'up'
            WHEN COALESCE(AVG(balance_recent), 0) < COALESCE(AVG(balance_prev), 0) * 0.9 THEN 'down'
            ELSE 'stable'
          END AS trend
        FROM (
          SELECT
            CASE WHEN ROW_NUMBER() OVER (ORDER BY month_start DESC) <= 3
              THEN total_incomes - total_expenses END AS balance_recent,
            CASE WHEN ROW_NUMBER() OVER (ORDER BY month_start DESC) > 3
              AND ROW_NUMBER() OVER (ORDER BY month_start DESC) <= 6
              THEN total_incomes - total_expenses END AS balance_prev
          FROM monthly_balance
          ORDER BY month_start DESC
          LIMIT 6
        ) sub
      )
      SELECT
        bs.total_incomes,
        bs.total_expenses,
        bs.months_with_data,
        bs.months_with_income,
        bs.months_with_expenses,
        bs.avg_monthly_income,
        bs.avg_balance,
        COALESCE(bt.trend, 'stable') AS balance_trend,
        COALESCE((SELECT json_agg(row_to_json(tc.*)) FROM top_categories tc), '[]') AS top_categories,
        COALESCE((SELECT json_agg(row_to_json(gs.*)) FROM goal_stats gs), '[]') AS goal_stats
      FROM balance_summary bs
      CROSS JOIN balance_trend bt
      `,
      params,
    );

    const row = result.rows[0];
    const goalStatsRaw = Array.isArray(row.goal_stats) ? row.goal_stats : JSON.parse(row.goal_stats);
    const goalStats = goalStatsRaw[0] || {};

    const totalMonthlyGoalAllocation =
      Number(goalStats.total_monthly_savings) || 0;
    const avgMonthlyIncome = Number(row.avg_monthly_income) || 0;
    const avgExpenses =
      Number(row.total_expenses) /
      Math.max(1, Number(row.months_with_expenses));

    const savingsRate =
      avgMonthlyIncome > 0
        ? ((avgMonthlyIncome - avgExpenses) / avgMonthlyIncome) * 100
        : 0;
    const goalAllocationRate =
      avgMonthlyIncome > 0
        ? (totalMonthlyGoalAllocation / avgMonthlyIncome) * 100
        : 0;

    const expectedAllocation =
      totalMonthlyGoalAllocation * Math.max(1, Number(row.months_with_data));
    const goalAchievementRate =
      expectedAllocation > 0
        ? ((Number(goalStats.total_current) || 0) / expectedAllocation) * 100
        : 0;

    return {
      totalIncomes: Number(row.total_incomes),
      totalExpenses: Number(row.total_expenses),
      netBalance: Number(row.total_incomes) - Number(row.total_expenses),
      monthsWithData: Number(row.months_with_data),
      avgMonthlyIncome,
      avgBalance: Number(row.avg_balance),
      balanceTrend: row.balance_trend,
      savingsRate: Math.round(savingsRate * 10) / 10,
      goalAllocationRate: Math.round(goalAllocationRate * 10) / 10,
      goalAchievementRate: Math.round(goalAchievementRate * 10) / 10,
      topCategories: Array.isArray(row.top_categories) ? row.top_categories : JSON.parse(row.top_categories),
      goalStats: {
        totalGoals: Number(goalStats.total_goals) || 0,
        totalTarget: Number(goalStats.total_target) || 0,
        totalCurrent: Number(goalStats.total_current) || 0,
        totalMonthlySavings: totalMonthlyGoalAllocation,
      },
      timeRange: { start, end },
    };
  }

  async getBalance(userId: number, query: StatisticsQueryDto) {
    const { start, end } = this.defaultDateRange(query);

    const result = await this.databaseService.query(
      `
      WITH months AS (
        SELECT generate_series(
          date_trunc('month', $2::date),
          date_trunc('month', $3::date),
          '1 month'::interval
        )::date AS month_start
      ),
      expanded_expenses AS (
        SELECT e.value, m.month_start
        FROM expense e CROSS JOIN months m
        WHERE e.user_id = $1 AND e.recurring = true
          AND date_trunc('month', e.date) <= m.month_start
          AND (e.due_date IS NULL OR date_trunc('month', e.due_date) >= m.month_start)
          AND NOT EXISTS (
            SELECT 1 FROM expense_exclusion ex
            WHERE ex.expense_id = e.id
              AND date_trunc('month', ex.exclusion_date) = m.month_start
              AND ex.user_id = $1
          )
        UNION ALL
        SELECT e.value, date_trunc('month', e.date) AS month_start
        FROM expense e
        WHERE e.user_id = $1 AND e.recurring = false AND e.date BETWEEN $2 AND $3
      ),
      expanded_incomes AS (
        SELECT i.value, m.month_start
        FROM income i CROSS JOIN months m
        WHERE i.user_id = $1 AND i.recurring = true
          AND date_trunc('month', i.date) <= m.month_start
          AND (i.due_date IS NULL OR date_trunc('month', i.due_date) >= m.month_start)
          AND NOT EXISTS (
            SELECT 1 FROM income_exclusion iex
            WHERE iex.income_id = i.id
              AND date_trunc('month', iex.exclusion_date) = m.month_start
              AND iex.user_id = $1
          )
        UNION ALL
        SELECT i.value, date_trunc('month', i.date) AS month_start
        FROM income i
        WHERE i.user_id = $1 AND i.recurring = false AND i.date BETWEEN $2 AND $3
      )
      SELECT
        m.month_start,
        COALESCE(e.total_expenses, 0) AS total_expenses,
        COALESCE(i.total_incomes, 0) AS total_incomes,
        COALESCE(i.total_incomes, 0) - COALESCE(e.total_expenses, 0) AS balance
      FROM months m
      LEFT JOIN (
        SELECT month_start, SUM(value) AS total_expenses FROM expanded_expenses GROUP BY month_start
      ) e ON m.month_start = e.month_start
      LEFT JOIN (
        SELECT month_start, SUM(value) AS total_incomes FROM expanded_incomes GROUP BY month_start
      ) i ON m.month_start = i.month_start
      ORDER BY m.month_start
      `,
      [userId, start, end],
    );

    const data = result.rows.map((r) => ({
      month: r.month_start.toISOString().split('T')[0].substring(0, 7),
      income: Number(r.total_incomes),
      expenses: Number(r.total_expenses),
      balance: Number(r.balance),
    }));

    const movingAvg: number[] = [];
    const window = 3;
    for (let i = 0; i < data.length; i++) {
      const slice = data.slice(Math.max(0, i - window + 1), i + 1);
      const avg =
        slice.reduce((sum, d) => sum + d.balance, 0) / slice.length;
      movingAvg.push(Math.round(avg * 100) / 100);
    }

    return { data, movingAverage: movingAvg, timeRange: { start, end } };
  }

  async getSavings(userId: number, query: StatisticsQueryDto) {
    const { start, end } = this.defaultDateRange(query);

    const result = await this.databaseService.query(
      `
      WITH months AS (
        SELECT generate_series(
          date_trunc('month', $2::date),
          date_trunc('month', $3::date),
          '1 month'::interval
        )::date AS month_start
      ),
      expanded_expenses AS (
        SELECT e.value, m.month_start
        FROM expense e CROSS JOIN months m
        WHERE e.user_id = $1 AND e.recurring = true
          AND date_trunc('month', e.date) <= m.month_start
          AND (e.due_date IS NULL OR date_trunc('month', e.due_date) >= m.month_start)
          AND NOT EXISTS (
            SELECT 1 FROM expense_exclusion ex
            WHERE ex.expense_id = e.id
              AND date_trunc('month', ex.exclusion_date) = m.month_start
              AND ex.user_id = $1
          )
        UNION ALL
        SELECT e.value, date_trunc('month', e.date) AS month_start
        FROM expense e
        WHERE e.user_id = $1 AND e.recurring = false AND e.date BETWEEN $2 AND $3
      ),
      expanded_incomes AS (
        SELECT i.value, m.month_start
        FROM income i CROSS JOIN months m
        WHERE i.user_id = $1 AND i.recurring = true
          AND date_trunc('month', i.date) <= m.month_start
          AND (i.due_date IS NULL OR date_trunc('month', i.due_date) >= m.month_start)
          AND NOT EXISTS (
            SELECT 1 FROM income_exclusion iex
            WHERE iex.income_id = i.id
              AND date_trunc('month', iex.exclusion_date) = m.month_start
              AND iex.user_id = $1
          )
        UNION ALL
        SELECT i.value, date_trunc('month', i.date) AS month_start
        FROM income i
        WHERE i.user_id = $1 AND i.recurring = false AND i.date BETWEEN $2 AND $3
      ),
      monthly_savings AS (
        SELECT
          m.month_start,
          COALESCE(i.total_incomes, 0) - COALESCE(e.total_expenses, 0) AS savings
        FROM months m
        LEFT JOIN (
          SELECT month_start, SUM(value) AS total_expenses FROM expanded_expenses GROUP BY month_start
        ) e ON m.month_start = e.month_start
        LEFT JOIN (
          SELECT month_start, SUM(value) AS total_incomes FROM expanded_incomes GROUP BY month_start
        ) i ON m.month_start = i.month_start
      )
      SELECT
        month_start,
        savings,
        SUM(savings) OVER (ORDER BY month_start) AS cumulative
      FROM monthly_savings
      ORDER BY month_start
      `,
      [userId, start, end],
    );

    const data = result.rows.map((r) => ({
      month: r.month_start.toISOString().split('T')[0].substring(0, 7),
      savings: Number(r.savings),
      cumulative: Number(r.cumulative),
    }));

    return { data, timeRange: { start, end } };
  }

  async getExpensesByCategory(userId: number, query: StatisticsQueryDto) {
    const { start, end } = this.defaultDateRange(query);

    const result = await this.databaseService.query(
      `
      WITH months AS (
        SELECT generate_series(
          date_trunc('month', $2::date),
          date_trunc('month', $3::date),
          '1 month'::interval
        )::date AS month_start
      ),
      expanded_expenses AS (
        SELECT e.id, e.name, e.value, e.expense_category_id, m.month_start
        FROM expense e CROSS JOIN months m
        WHERE e.user_id = $1 AND e.recurring = true
          AND date_trunc('month', e.date) <= m.month_start
          AND (e.due_date IS NULL OR date_trunc('month', e.due_date) >= m.month_start)
          AND NOT EXISTS (
            SELECT 1 FROM expense_exclusion ex
            WHERE ex.expense_id = e.id
              AND date_trunc('month', ex.exclusion_date) = m.month_start
              AND ex.user_id = $1
          )
        UNION ALL
        SELECT e.id, e.name, e.value, e.expense_category_id, date_trunc('month', e.date) AS month_start
        FROM expense e
        WHERE e.user_id = $1 AND e.recurring = false AND e.date BETWEEN $2 AND $3
      )
      SELECT
        COALESCE(c.name, 'Uncategorized') AS category,
        COALESCE(c.icon, 'HelpCircle') AS icon,
        SUM(ee.value) AS total,
        COUNT(DISTINCT ee.id) AS transaction_count
      FROM expanded_expenses ee
      LEFT JOIN expense_category c ON c.id = ee.expense_category_id
      GROUP BY c.name, c.icon
      ORDER BY total DESC
      `,
      [userId, start, end],
    );

    const data = result.rows.map((r) => ({
      category: r.category,
      icon: r.icon,
      total: Number(r.total),
      transactionCount: Number(r.transaction_count),
    }));

    const grandTotal = data.reduce((sum, d) => sum + d.total, 0);

    return {
      data: data.map((d) => ({
        ...d,
        percentage:
          grandTotal > 0
            ? Math.round((d.total / grandTotal) * 1000) / 10
            : 0,
      })),
      grandTotal,
      timeRange: { start, end },
    };
  }

  async getExpensesOverTime(userId: number, query: StatisticsQueryDto) {
    const { start, end } = this.defaultDateRange(query);

    const result = await this.databaseService.query(
      `
      WITH months AS (
        SELECT generate_series(
          date_trunc('month', $2::date),
          date_trunc('month', $3::date),
          '1 month'::interval
        )::date AS month_start
      ),
      expanded_expenses AS (
        SELECT e.id, e.name, e.value, e.expense_category_id, m.month_start
        FROM expense e CROSS JOIN months m
        WHERE e.user_id = $1 AND e.recurring = true
          AND date_trunc('month', e.date) <= m.month_start
          AND (e.due_date IS NULL OR date_trunc('month', e.due_date) >= m.month_start)
          AND NOT EXISTS (
            SELECT 1 FROM expense_exclusion ex
            WHERE ex.expense_id = e.id
              AND date_trunc('month', ex.exclusion_date) = m.month_start
              AND ex.user_id = $1
          )
        UNION ALL
        SELECT e.id, e.name, e.value, e.expense_category_id, date_trunc('month', e.date) AS month_start
        FROM expense e
        WHERE e.user_id = $1 AND e.recurring = false AND e.date BETWEEN $2 AND $3
      )
      SELECT
        TO_CHAR(ee.month_start, 'YYYY-MM') AS month,
        COALESCE(c.name, 'Uncategorized') AS category,
        SUM(ee.value) AS total
      FROM expanded_expenses ee
      LEFT JOIN expense_category c ON c.id = ee.expense_category_id
      GROUP BY ee.month_start, c.name
      ORDER BY ee.month_start, total DESC
      `,
      [userId, start, end],
    );

    const categories = [
      ...new Set(result.rows.map((r) => r.category)),
    ];
    const months = [
      ...new Set(result.rows.map((r) => r.month)),
    ];

    const series = categories.map((cat) => ({
      category: cat,
      data: months.map((m) => {
        const row = result.rows.find(
          (r) => r.month === m && r.category === cat,
        );
        return row ? Number(row.total) : 0;
      }),
    }));

    return { categories: months, series, timeRange: { start, end } };
  }

  async getTopMerchants(userId: number, query: StatisticsQueryDto) {
    const { start, end } = this.defaultDateRange(query);
    const limit = query.limit || 10;

    const result = await this.databaseService.query(
      `
      WITH months AS (
        SELECT generate_series(
          date_trunc('month', $2::date),
          date_trunc('month', $3::date),
          '1 month'::interval
        )::date AS month_start
      ),
      expanded_expenses AS (
        SELECT e.name, e.value, m.month_start
        FROM expense e CROSS JOIN months m
        WHERE e.user_id = $1 AND e.recurring = true
          AND date_trunc('month', e.date) <= m.month_start
          AND (e.due_date IS NULL OR date_trunc('month', e.due_date) >= m.month_start)
          AND NOT EXISTS (
            SELECT 1 FROM expense_exclusion ex
            WHERE ex.expense_id = e.id
              AND date_trunc('month', ex.exclusion_date) = m.month_start
              AND ex.user_id = $1
          )
        UNION ALL
        SELECT e.name, e.value, date_trunc('month', e.date) AS month_start
        FROM expense e
        WHERE e.user_id = $1 AND e.recurring = false AND e.date BETWEEN $2 AND $3
      )
      SELECT
        name AS merchant,
        SUM(value) AS total,
        COUNT(*) AS occurrences,
        MIN(month_start) AS first_seen,
        MAX(month_start) AS last_seen
      FROM expanded_expenses
      GROUP BY name
      ORDER BY total DESC
      LIMIT $4
      `,
      [userId, start, end, limit],
    );

    const data = result.rows.map((r) => ({
      merchant: r.merchant,
      total: Number(r.total),
      occurrences: Number(r.occurrences),
      firstSeen: r.first_seen.toISOString().split('T')[0],
      lastSeen: r.last_seen.toISOString().split('T')[0],
    }));

    return { data, timeRange: { start, end } };
  }

  async getHeatmap(userId: number, query: StatisticsQueryDto) {
    const { start, end } = this.defaultDateRange(query);

    const result = await this.databaseService.query(
      `
      WITH months AS (
        SELECT generate_series(
          date_trunc('month', $2::date),
          date_trunc('month', $3::date),
          '1 month'::interval
        )::date AS month_start
      ),
      expanded_expenses AS (
        SELECT e.value, m.month_start
        FROM expense e CROSS JOIN months m
        WHERE e.user_id = $1 AND e.recurring = true
          AND date_trunc('month', e.date) <= m.month_start
          AND (e.due_date IS NULL OR date_trunc('month', e.due_date) >= m.month_start)
          AND NOT EXISTS (
            SELECT 1 FROM expense_exclusion ex
            WHERE ex.expense_id = e.id
              AND date_trunc('month', ex.exclusion_date) = m.month_start
              AND ex.user_id = $1
          )
        UNION ALL
        SELECT e.value, e.date::date AS day
        FROM expense e
        WHERE e.user_id = $1 AND e.recurring = false AND e.date BETWEEN $2 AND $3
      )
      SELECT
        ee.month_start::date AS day,
        SUM(ee.value) AS total,
        COUNT(*) AS count
      FROM expanded_expenses ee
      GROUP BY ee.month_start::date
      ORDER BY day
      `,
      [userId, start, end],
    );

    const data = result.rows.map((r) => ({
      date: r.day.toISOString().split('T')[0],
      total: Number(r.total),
      count: Number(r.count),
    }));

    const maxTotal = data.reduce(
      (max, d) => Math.max(max, d.total),
      0,
    );

    return {
      data: data.map((d) => ({
        ...d,
        intensity: maxTotal > 0 ? d.total / maxTotal : 0,
      })),
      maxTotal,
      timeRange: { start, end },
    };
  }

  async getGoals(userId: number) {
    const result = await this.databaseService.query(
      `
      SELECT
        g.id,
        g.name,
        g.description,
        g.value AS target,
        g.current_value,
        g.monthly_savings,
        g.start_date,
        g.target_date,
        COALESCE(
          (SELECT SUM(gc.value) FROM goal_contribution gc WHERE gc.goal_id = g.id),
          0
        ) AS total_contributed,
        COALESCE(
          (SELECT COUNT(*) FROM goal_contribution gc WHERE gc.goal_id = g.id),
          0
        )::int AS contribution_count
      FROM goal g
      WHERE g.user_id = $1
      ORDER BY g.created_at DESC
      `,
      [userId],
    );

    const data = result.rows.map((r) => {
      const target = Number(r.target);
      const current = Number(r.current_value);
      const progress = target > 0 ? (current / target) * 100 : 0;
      const monthlySavings = Number(r.monthly_savings);

      let projectedCompletionDate: string | null = null;
      if (target > 0 && monthlySavings > 0 && current < target) {
        const remaining = target - current;
        const monthsNeeded = Math.ceil(remaining / monthlySavings);
        const projected = new Date();
        projected.setMonth(projected.getMonth() + monthsNeeded);
        projectedCompletionDate = projected.toISOString().split('T')[0];
      } else if (current >= target) {
        projectedCompletionDate = 'achieved';
      }

      let targetDate: string | null = null;
      if (r.target_date) {
        targetDate = new Date(r.target_date).toISOString().split('T')[0];
      }

      return {
        id: r.id,
        name: r.name,
        description: r.description,
        target,
        current,
        progress: Math.round(progress * 10) / 10,
        monthlySavings,
        startDate: new Date(r.start_date).toISOString().split('T')[0],
        targetDate,
        projectedCompletionDate,
        totalContributed: Number(r.total_contributed),
        contributionCount: r.contribution_count,
      };
    });

    const totalTarget = data.reduce((sum, g) => sum + g.target, 0);
    const totalCurrent = data.reduce((sum, g) => sum + g.current, 0);
    const overallProgress =
      totalTarget > 0
        ? Math.round((totalCurrent / totalTarget) * 1000) / 10
        : 0;

    return { goals: data, overallProgress, totalTarget, totalCurrent };
  }

  async getComparative(userId: number, query: StatisticsQueryDto) {
    const { start, end } = this.defaultDateRange(query);

    const compareStart = new Date(start);
    const compareEnd = new Date(end);

    if (query.compareTo === 'prev-year') {
      compareStart.setFullYear(compareStart.getFullYear() - 1);
      compareEnd.setFullYear(compareEnd.getFullYear() - 1);
    } else {
      const monthsDiff =
        (compareEnd.getFullYear() - compareStart.getFullYear()) * 12 +
        (compareEnd.getMonth() - compareStart.getMonth());
      compareStart.setMonth(compareStart.getMonth() - monthsDiff - 1);
      compareEnd.setMonth(compareEnd.getMonth() - monthsDiff - 1);
    }

    const prevStart = compareStart.toISOString().split('T')[0];
    const prevEnd = compareEnd.toISOString().split('T')[0];

    async function getPeriodTotals(
      s: string,
      e: string,
      db: any,
      uid: number,
    ) {
      const r = await db.query(
        `
        WITH months AS (
          SELECT generate_series(
            date_trunc('month', $2::date),
            date_trunc('month', $3::date),
            '1 month'::interval
          )::date AS month_start
        ),
        expanded_expenses AS (
          SELECT e.value, m.month_start
          FROM expense e CROSS JOIN months m
          WHERE e.user_id = $1 AND e.recurring = true
            AND date_trunc('month', e.date) <= m.month_start
            AND (e.due_date IS NULL OR date_trunc('month', e.due_date) >= m.month_start)
            AND NOT EXISTS (
              SELECT 1 FROM expense_exclusion ex
              WHERE ex.expense_id = e.id
                AND date_trunc('month', ex.exclusion_date) = m.month_start
                AND ex.user_id = $1
            )
          UNION ALL
          SELECT e.value, date_trunc('month', e.date) AS month_start
          FROM expense e
          WHERE e.user_id = $1 AND e.recurring = false AND e.date BETWEEN $2 AND $3
        ),
        expanded_incomes AS (
          SELECT i.value, m.month_start
          FROM income i CROSS JOIN months m
          WHERE i.user_id = $1 AND i.recurring = true
            AND date_trunc('month', i.date) <= m.month_start
            AND (i.due_date IS NULL OR date_trunc('month', i.due_date) >= m.month_start)
            AND NOT EXISTS (
              SELECT 1 FROM income_exclusion iex
              WHERE iex.income_id = i.id
                AND date_trunc('month', iex.exclusion_date) = m.month_start
                AND iex.user_id = $1
            )
          UNION ALL
          SELECT i.value, date_trunc('month', i.date) AS month_start
          FROM income i
          WHERE i.user_id = $1 AND i.recurring = false AND i.date BETWEEN $2 AND $3
        )
        SELECT
          COALESCE(SUM(i.total_incomes), 0) AS total_incomes,
          COALESCE(SUM(e.total_expenses), 0) AS total_expenses,
          COALESCE(SUM(i.total_incomes), 0) - COALESCE(SUM(e.total_expenses), 0) AS net_balance
        FROM (
          SELECT month_start, SUM(value) AS total_expenses FROM expanded_expenses GROUP BY month_start
        ) e
        FULL OUTER JOIN (
          SELECT month_start, SUM(value) AS total_incomes FROM expanded_incomes GROUP BY month_start
        ) i ON e.month_start = i.month_start
        `,
        [uid, s, e],
      );
      const row = r.rows[0];
      return {
        totalIncomes: Number(row.total_incomes),
        totalExpenses: Number(row.total_expenses),
        netBalance: Number(row.net_balance),
        savingsRate:
          Number(row.total_incomes) > 0
            ? ((Number(row.total_incomes) - Number(row.total_expenses)) /
                Number(row.total_incomes)) *
              100
            : 0,
      };
    }

    const [current, previous] = await Promise.all([
      getPeriodTotals(start, end, this.databaseService, userId),
      getPeriodTotals(prevStart, prevEnd, this.databaseService, userId),
    ]);

    const incomeDelta =
      previous.totalIncomes > 0
        ? ((current.totalIncomes - previous.totalIncomes) /
            previous.totalIncomes) *
          100
        : 0;
    const expenseDelta =
      previous.totalExpenses > 0
        ? ((current.totalExpenses - previous.totalExpenses) /
            previous.totalExpenses) *
          100
        : 0;

    const months = this.defaultDateRange(query);
    const monthlyTrend = await this.databaseService.query(
      `
      WITH months AS (
        SELECT generate_series(
          date_trunc('month', $2::date),
          date_trunc('month', $3::date),
          '1 month'::interval
        )::date AS month_start
      ),
      expanded_expenses AS (
        SELECT e.value, m.month_start
        FROM expense e CROSS JOIN months m
        WHERE e.user_id = $1 AND e.recurring = true
          AND date_trunc('month', e.date) <= m.month_start
          AND (e.due_date IS NULL OR date_trunc('month', e.due_date) >= m.month_start)
          AND NOT EXISTS (
            SELECT 1 FROM expense_exclusion ex
            WHERE ex.expense_id = e.id
              AND date_trunc('month', ex.exclusion_date) = m.month_start
              AND ex.user_id = $1
          )
        UNION ALL
        SELECT e.value, date_trunc('month', e.date) AS month_start
        FROM expense e
        WHERE e.user_id = $1 AND e.recurring = false AND e.date BETWEEN $2 AND $3
      ),
      expanded_incomes AS (
        SELECT i.value, m.month_start
        FROM income i CROSS JOIN months m
        WHERE i.user_id = $1 AND i.recurring = true
          AND date_trunc('month', i.date) <= m.month_start
          AND (i.due_date IS NULL OR date_trunc('month', i.due_date) >= m.month_start)
          AND NOT EXISTS (
            SELECT 1 FROM income_exclusion iex
            WHERE iex.income_id = i.id
              AND date_trunc('month', iex.exclusion_date) = m.month_start
              AND iex.user_id = $1
          )
        UNION ALL
        SELECT i.value, date_trunc('month', i.date) AS month_start
        FROM income i
        WHERE i.user_id = $1 AND i.recurring = false AND i.date BETWEEN $2 AND $3
      )
      SELECT
        TO_CHAR(m.month_start, 'YYYY-MM') AS month,
        COALESCE(i.total_incomes, 0) AS total_incomes,
        COALESCE(e.total_expenses, 0) AS total_expenses,
        COALESCE(i.total_incomes, 0) - COALESCE(e.total_expenses, 0) AS balance
      FROM months m
      LEFT JOIN (
        SELECT month_start, SUM(value) AS total_expenses FROM expanded_expenses GROUP BY month_start
      ) e ON m.month_start = e.month_start
      LEFT JOIN (
        SELECT month_start, SUM(value) AS total_incomes FROM expanded_incomes GROUP BY month_start
      ) i ON m.month_start = i.month_start
      ORDER BY m.month_start
      `,
      [userId, months.start, months.end],
    );

    const trendData = monthlyTrend.rows.map((r) => ({
      month: r.month,
      income: Number(r.total_incomes),
      expenses: Number(r.total_expenses),
      balance: Number(r.balance),
    }));

    let predictiveData: typeof trendData = [];
    if (trendData.length >= 6) {
      const n = trendData.length;
      const last6 = trendData.slice(-6);
      const xSum = last6.reduce((s, _, i) => s + i + 1, 0);
      const ySum = last6.reduce((s, d) => s + d.balance, 0);
      const xySum = last6.reduce((s, d, i) => s + (i + 1) * d.balance, 0);
      const x2Sum = last6.reduce(
        (s, _, i) => s + (i + 1) * (i + 1),
        0,
      );
      const slope =
        (6 * xySum - xSum * ySum) / (6 * x2Sum - xSum * xSum);
      const intercept = (ySum - slope * xSum) / 6;

      predictiveData = Array.from({ length: 3 }, (_, i) => {
        const predictedDate = new Date(end);
        predictedDate.setMonth(predictedDate.getMonth() + i + 1);
        return {
          month: predictedDate.toISOString().split('T')[0].substring(0, 7),
          income: 0,
          expenses: 0,
          balance: Math.round((intercept + slope * (n + i + 1)) * 100) / 100,
        };
      });
    }

    return {
      current,
      previous,
      deltas: {
        incomeDelta: Math.round(incomeDelta * 10) / 10,
        expenseDelta: Math.round(expenseDelta * 10) / 10,
        balanceDelta:
          previous.netBalance !== 0
            ? Math.round(
                ((current.netBalance - previous.netBalance) /
                  Math.abs(previous.netBalance)) *
                  1000,
              ) / 10
            : 0,
      },
      monthlyTrend: trendData,
      predictive: predictiveData,
      comparisonLabel: query.compareTo === 'prev-year' ? 'year' : 'month',
      timeRange: { start, end, previousStart: prevStart, previousEnd: prevEnd },
    };
  }

  async getAnomalies(userId: number, query: StatisticsQueryDto) {
    const { start, end } = this.defaultDateRange(query);

    const largeResult = await this.databaseService.query(
      `
      WITH months AS (
        SELECT generate_series(
          date_trunc('month', $2::date),
          date_trunc('month', $3::date),
          '1 month'::interval
        )::date AS month_start
      ),
      expanded_expenses AS (
        SELECT e.id, e.name, e.value, e.date, e.expense_category_id, c.name AS category_name, m.month_start
        FROM expense e CROSS JOIN months m
        LEFT JOIN expense_category c ON c.id = e.expense_category_id
        WHERE e.user_id = $1 AND e.recurring = true
          AND date_trunc('month', e.date) <= m.month_start
          AND (e.due_date IS NULL OR date_trunc('month', e.due_date) >= m.month_start)
          AND NOT EXISTS (
            SELECT 1 FROM expense_exclusion ex
            WHERE ex.expense_id = e.id
              AND date_trunc('month', ex.exclusion_date) = m.month_start
              AND ex.user_id = $1
          )
        UNION ALL
        SELECT e.id, e.name, e.value, e.date, e.expense_category_id, c.name AS category_name, e.date::date AS day
        FROM expense e
        LEFT JOIN expense_category c ON c.id = e.expense_category_id
        WHERE e.user_id = $1 AND e.recurring = false AND e.date BETWEEN $2 AND $3
      ),
      stats AS (
        SELECT AVG(value) AS avg_value, STDDEV(value) AS stddev_value FROM expanded_expenses
        WHERE value IS NOT NULL
      )
      SELECT
        ee.name,
        ee.value,
        ee.date,
        ee.category_name,
        s.avg_value,
        s.stddev_value
      FROM expanded_expenses ee, stats s
      WHERE ee.value > s.avg_value + 2 * COALESCE(s.stddev_value, 0)
      ORDER BY ee.value DESC
      LIMIT 20
      `,
      [userId, start, end],
    );

    const largeTransactions = largeResult.rows.map((r) => ({
      name: r.name,
      value: Number(r.value),
      date: new Date(r.date).toISOString().split('T')[0],
      category: r.category_name || 'Uncategorized',
      avgValue: Number(r.avg_value),
      deviation: Number(r.stddev_value) || 0,
    }));

    const recurringResult = await this.databaseService.query(
      `
      SELECT
        e.id,
        e.name,
        e.value,
        e.date AS start_date,
        e.due_date,
        COALESCE(c.name, 'Uncategorized') AS category
      FROM expense e
      LEFT JOIN expense_category c ON c.id = e.expense_category_id
      WHERE e.user_id = $1 AND e.recurring = true
      ORDER BY e.value DESC
      `,
      [userId],
    );

    const recurringPayments = recurringResult.rows.map((r) => ({
      id: r.id,
      name: r.name,
      value: Number(r.value),
      startDate: new Date(r.start_date).toISOString().split('T')[0],
      endDate: r.due_date
        ? new Date(r.due_date).toISOString().split('T')[0]
        : null,
      category: r.category,
      nextDue: (() => {
        const now = new Date();
        const startDate = new Date(r.start_date);
        let next = new Date(now.getFullYear(), now.getMonth(), startDate.getDate());
        if (next < now) next.setMonth(next.getMonth() + 1);
        if (r.due_date && next > new Date(r.due_date)) return null;
        return next.toISOString().split('T')[0];
      })(),
    }));

    return {
      largeTransactions,
      recurringPayments,
      timeRange: { start, end },
    };
  }
}
