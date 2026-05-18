import { apiService } from './api';

export interface ReportsExportParams {
  start?: string;
  end?: string;
  categories?: string;
  sources?: string;
}

export interface ReportsExportData {
  expenseCategories: Array<{ id: number; name: string; icon: string }>;
  incomeSources: Array<{ id: number; name: string; icon: string }>;
  expenses: Array<{ id: number; name: string; value: number; recurring: boolean; date: string; due_date: string | null; expense_category_id: number | null }>;
  incomes: Array<{ id: number; name: string; value: number; recurring: boolean; date: string; due_date: string | null; income_source_id: number | null }>;
  goals: Array<{ id: number; name: string; description: string | null; value: number; current_value: number; monthly_savings: number; start_date: string; target_date: string | null }>;
  goalContributions: Array<{ id: number; goal_id: number; value: number; date: string; observation: string | null; goal_name: string }>;
  expenseExclusions: Array<{ id: number; expense_id: number; exclusion_date: string; expense_name: string }>;
  incomeExclusions: Array<{ id: number; income_id: number; exclusion_date: string; income_name: string }>;
}

export interface ImportRow {
  type: string;
  name?: string;
  icon?: string;
  value?: number;
  recurring?: boolean;
  date?: string;
  due_date?: string;
  category_name?: string;
  source_name?: string;
  description?: string;
  current_value?: number;
  monthly_savings?: number;
  start_date?: string;
  target_date?: string;
  goal_name?: string;
  observation?: string;
  entity_name?: string;
  entity_type?: string;
  exclusion_date?: string;
}

export interface ImportResult {
  results: string[];
}

export const reportsService = {
  async exportData(params?: ReportsExportParams): Promise<ReportsExportData> {
    const query = new URLSearchParams();
    if (params?.start) query.set('start', params.start);
    if (params?.end) query.set('end', params.end);
    if (params?.categories) query.set('categories', params.categories);
    if (params?.sources) query.set('sources', params.sources);
    const qs = query.toString();
    return apiService.get(`/reports/export${qs ? `?${qs}` : ''}`);
  },

  async importData(rows: ImportRow[]): Promise<ImportResult> {
    return apiService.post('/reports/import', { rows });
  },
};
