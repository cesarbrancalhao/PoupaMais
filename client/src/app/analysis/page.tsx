'use client'

import { useState, useMemo, useCallback } from 'react'
import Sidebar from '@/components/sidebar'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useLanguage } from '@/app/terminology/LanguageContext'
import { analysis } from '@/app/terminology/language/analysis'
import { StatisticsQueryParams } from '@/services/statistics.service'
import FilterBar, { FilterState } from './_components/FilterBar'
import KPISummary from './_components/KPISummary'
import BalanceSavingsSection from './_components/BalanceSavingsSection'
import GoalsSection from './_components/GoalsSection'
import ExpensesSection from './_components/ExpensesSection'
import ExpenseHeatmapSection from './_components/ExpenseHeatmapSection'
import TransactionsAnomalies from './_components/TransactionsAnomaliesSection'
import ComparativeTrend from './_components/ComparativeTrendSection'
import AveragesSection from './_components/AveragesSection'

function getDefaultFilters(): FilterState {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  return {
    timePreset: '12months',
    customStart: start.toISOString().split('T')[0],
    customEnd: now.toISOString().split('T')[0],
    year: null,
    selectedCategories: [],
    selectedGoals: [],
  }
}

function computeDateRange(filters: FilterState): { start: string; end: string } {
  const now = new Date()

  switch (filters.timePreset) {
    case '3months': {
      const start = new Date(now.getFullYear(), now.getMonth() - 2, 1)
      return {
        start: start.toISOString().split('T')[0],
        end: now.toISOString().split('T')[0],
      }
    }
    case '6months': {
      const start = new Date(now.getFullYear(), now.getMonth() - 5, 1)
      return {
        start: start.toISOString().split('T')[0],
        end: now.toISOString().split('T')[0],
      }
    }
    case '12months': {
      const start = new Date(now.getFullYear(), now.getMonth() - 11, 1)
      return {
        start: start.toISOString().split('T')[0],
        end: now.toISOString().split('T')[0],
      }
    }
    case 'ytd': {
      const start = new Date(now.getFullYear(), 0, 1)
      return {
        start: start.toISOString().split('T')[0],
        end: now.toISOString().split('T')[0],
      }
    }
    case 'custom':
      return { start: filters.customStart, end: filters.customEnd }
    default:
      return { start: '', end: '' }
  }
}

export default function AnalysisPage() {
  const { t } = useLanguage()

  const [filters, setFilters] = useState<FilterState>(getDefaultFilters)

  const statisticsParams = useMemo((): StatisticsQueryParams => {
    const { start, end } = computeDateRange(filters)
    return {
      start,
      end,
      categories:
        filters.selectedCategories.length > 0
          ? filters.selectedCategories.join(',')
          : undefined,
      goals:
        filters.selectedGoals.length > 0
          ? filters.selectedGoals.join(',')
          : undefined,
    }
  }, [filters])

  const handleFiltersChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters)
  }, [])

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8 md:ml-64">
          <header className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-3">
            <h1 className="text-xl md:text-2xl font-semibold text-gray-800">
              {t(analysis.title)}
            </h1>
          </header>

          <div className="mb-6">
            <FilterBar
              filters={filters}
              onChange={handleFiltersChange}
              availableCategories={[]}
              availableYears={[]}
            />
          </div>

          <div className="space-y-6">
            <KPISummary params={statisticsParams} />
            <AveragesSection params={statisticsParams} />
            <ExpenseHeatmapSection params={statisticsParams} />
            <BalanceSavingsSection params={statisticsParams} />
            <GoalsSection params={statisticsParams} />
            <ExpensesSection params={statisticsParams} />
            <TransactionsAnomalies params={statisticsParams} />
            <ComparativeTrend params={statisticsParams} />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
