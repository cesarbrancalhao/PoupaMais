import { apiService } from './api';

export interface KpiResponse {
  totalIncomes: number;
  totalExpenses: number;
  netBalance: number;
  monthsWithData: number;
  avgMonthlyIncome: number;
  avgBalance: number;
  balanceTrend: 'up' | 'down' | 'stable';
  savingsRate: number;
  goalAllocationRate: number;
  goalAchievementRate: number;
  topCategories: { name: string; icon: string; total: number }[];
  goalStats: {
    totalGoals: number;
    totalTarget: number;
    totalCurrent: number;
    totalMonthlySavings: number;
  };
  timeRange: { start: string; end: string };
}

export interface BalanceDataPoint {
  month: string;
  income: number;
  expenses: number;
  balance: number;
}

export interface BalanceResponse {
  data: BalanceDataPoint[];
  movingAverage: number[];
  timeRange: { start: string; end: string };
}

export interface SavingsDataPoint {
  month: string;
  savings: number;
  cumulative: number;
}

export interface SavingsResponse {
  data: SavingsDataPoint[];
  timeRange: { start: string; end: string };
}

export interface CategoryExpense {
  category: string;
  icon: string;
  total: number;
  transactionCount: number;
  percentage: number;
}

export interface ExpensesByCategoryResponse {
  data: CategoryExpense[];
  grandTotal: number;
  timeRange: { start: string; end: string };
}

export interface ExpensesOverTimeSeries {
  category: string;
  data: number[];
}

export interface ExpensesOverTimeResponse {
  categories: string[];
  series: ExpensesOverTimeSeries[];
  timeRange: { start: string; end: string };
}

export interface MerchantEntry {
  merchant: string;
  total: number;
  occurrences: number;
  firstSeen: string;
  lastSeen: string;
}

export interface TopMerchantsResponse {
  data: MerchantEntry[];
  timeRange: { start: string; end: string };
}

export interface HeatmapDataPoint {
  date: string;
  total: number;
  count: number;
  intensity: number;
}

export interface HeatmapResponse {
  data: HeatmapDataPoint[];
  maxTotal: number;
  timeRange: { start: string; end: string };
}

export interface GoalEntry {
  id: number;
  name: string;
  description: string | null;
  target: number;
  current: number;
  progress: number;
  monthlySavings: number;
  startDate: string;
  targetDate: string | null;
  projectedCompletionDate: string | null;
  totalContributed: number;
  contributionCount: number;
}

export interface GoalsResponse {
  goals: GoalEntry[];
  overallProgress: number;
  totalTarget: number;
  totalCurrent: number;
}

export interface ComparativeResponse {
  current: {
    totalIncomes: number;
    totalExpenses: number;
    netBalance: number;
    savingsRate: number;
  };
  previous: {
    totalIncomes: number;
    totalExpenses: number;
    netBalance: number;
    savingsRate: number;
  };
  deltas: {
    incomeDelta: number;
    expenseDelta: number;
    balanceDelta: number;
  };
  monthlyTrend: BalanceDataPoint[];
  predictive: { month: string; income: number; expenses: number; balance: number }[];
  comparisonLabel: string;
  timeRange: { start: string; end: string; previousStart: string; previousEnd: string };
}

export interface LargeTransaction {
  name: string;
  value: number;
  date: string;
  category: string;
  avgValue: number;
  deviation: number;
}

export interface RecurringPayment {
  id: number;
  name: string;
  value: number;
  startDate: string;
  endDate: string | null;
  category: string;
  nextDue: string | null;
}

export interface AnomaliesResponse {
  largeTransactions: LargeTransaction[];
  recurringPayments: RecurringPayment[];
  timeRange: { start: string; end: string };
}

export interface StatisticsQueryParams {
  start?: string;
  end?: string;
  interval?: 'month' | 'week' | 'day';
  groupBy?: 'category' | 'source';
  limit?: number;
  compareTo?: 'prev-month' | 'prev-year';
  categories?: string;
  goals?: string;
}

function buildQueryString(params?: StatisticsQueryParams): string {
  if (!params) return '';
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null,
  );
  if (entries.length === 0) return '';
  const searchParams = new URLSearchParams();
  entries.forEach(([k, v]) => searchParams.set(k, String(v)));
  return `?${searchParams.toString()}`;
}

export const statisticsService = {
  getKpi(params?: StatisticsQueryParams) {
    return apiService.get<KpiResponse>(`/statistics/kpi${buildQueryString(params)}`);
  },

  getBalance(params?: StatisticsQueryParams) {
    return apiService.get<BalanceResponse>(`/statistics/balance${buildQueryString(params)}`);
  },

  getSavings(params?: StatisticsQueryParams) {
    return apiService.get<SavingsResponse>(`/statistics/savings${buildQueryString(params)}`);
  },

  getExpensesByCategory(params?: StatisticsQueryParams) {
    return apiService.get<ExpensesByCategoryResponse>(
      `/statistics/expenses-by-category${buildQueryString(params)}`,
    );
  },

  getExpensesOverTime(params?: StatisticsQueryParams) {
    return apiService.get<ExpensesOverTimeResponse>(
      `/statistics/expenses-over-time${buildQueryString(params)}`,
    );
  },

  getTopMerchants(params?: StatisticsQueryParams) {
    return apiService.get<TopMerchantsResponse>(
      `/statistics/top-merchants${buildQueryString(params)}`,
    );
  },

  getHeatmap(params?: StatisticsQueryParams) {
    return apiService.get<HeatmapResponse>(`/statistics/heatmap${buildQueryString(params)}`);
  },

  getGoals() {
    return apiService.get<GoalsResponse>('/statistics/goals');
  },

  getComparative(params?: StatisticsQueryParams) {
    return apiService.get<ComparativeResponse>(
      `/statistics/comparative${buildQueryString(params)}`,
    );
  },

  getAnomalies(params?: StatisticsQueryParams) {
    return apiService.get<AnomaliesResponse>(
      `/statistics/anomalies${buildQueryString(params)}`,
    );
  },
};
