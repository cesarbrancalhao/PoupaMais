'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
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
  const searchParams = useSearchParams()
  const exportMode = searchParams.get('export') === '1'
  const exportSections = searchParams.get('sections') || ''

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

  useEffect(() => {
    if (!exportMode) return

    const maxAttempts = 10
    let attempts = 0

    const tryExport = () => {
      attempts++
      const sectionsToExport = exportSections ? exportSections.split(',') : []

      const sectionMap: Record<string, string> = {
        averages: 'analysis-averages',
        balanceSavings: 'analysis-balanceSavings',
        goals: 'analysis-goals',
        expenses: 'analysis-expenses',
        transactions: 'analysis-transactions',
        comparative: 'analysis-comparative',
      }

      const targets = sectionsToExport.length > 0 ? sectionsToExport : Object.keys(sectionMap)

      const images: { title: string; dataUrl: string }[] = []

      for (const key of targets) {
        const elId = sectionMap[key]
        if (!elId) continue
        const sectionEl = document.getElementById(elId)
        if (!sectionEl) continue

        const canvases = sectionEl.querySelectorAll('canvas')
        if (canvases.length > 0) {
          for (let i = 0; i < canvases.length; i++) {
            try {
              const dataUrl = canvases[i].toDataURL('image/png')
              const h3 = sectionEl.querySelector('h3')
              images.push({ title: h3?.textContent || key, dataUrl })
            } catch { /* skip tainted */ }
          }
        }
      }

      if (images.length > 0) {
        const imagesHtml = images
          .map(
            (img) =>
              '<div style="margin-bottom:30px;page-break-inside:avoid">' +
              '<h3 style="font-family:Arial,sans-serif;color:#333;margin-bottom:10px">' +
              img.title +
              '</h3>' +
              '<img src="' +
              img.dataUrl +
              '" style="max-width:100%;border:1px solid #e5e7eb;border-radius:8px" />' +
              '</div>'
          )
          .join('')

        const w = window.open('', '_blank')
        if (w) {
          w.document.write(
            '<!DOCTYPE html><html><head><title>PoupaMais</title>' +
            '<style>body{padding:40px;font-family:Arial,sans-serif}h1{font-size:24px;color:#1f2937;margin-bottom:30px}@media print{body{padding:20px}}</style>' +
            '</head><body><h1>PoupaMais</h1>' +
            imagesHtml +
            '<script>window.onload=function(){window.print()}</' + 'script>' +
            '</body></html>'
          )
          w.document.close()
        }
      } else if (attempts < maxAttempts) {
        setTimeout(tryExport, 1500)
      }
    }

    setTimeout(tryExport, 2000)
  }, [exportMode, exportSections])

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
            <div id="analysis-kpi"><KPISummary params={statisticsParams} /></div>
            <div id="analysis-averages"><AveragesSection params={statisticsParams} /></div>
            <div id="analysis-heatmap"><ExpenseHeatmapSection params={statisticsParams} /></div>
            <div id="analysis-balanceSavings"><BalanceSavingsSection params={statisticsParams} /></div>
            <div id="analysis-goals"><GoalsSection params={statisticsParams} /></div>
            <div id="analysis-expenses"><ExpensesSection params={statisticsParams} /></div>
            <div id="analysis-transactions"><TransactionsAnomalies params={statisticsParams} /></div>
            <div id="analysis-comparative"><ComparativeTrend params={statisticsParams} /></div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
