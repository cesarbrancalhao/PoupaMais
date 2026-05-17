'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { useLanguage } from '@/app/terminology/LanguageContext'
import { reports } from '@/app/terminology/language/reports'
import { common } from '@/app/terminology/language/common'
import { reportsService, ReportsExportData } from '@/services/reports.service'

export default function ExportDataTab() {
  const { t } = useLanguage()
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [exporting, setExporting] = useState(false)

  const generateCSV = (data: ReportsExportData): string => {
    const rows: string[] = []
    const headers = 'type,name,icon,value,recurring,date,due_date,category_name,source_name,description,current_value,monthly_savings,start_date,target_date,goal_name,observation,entity_name,entity_type,exclusion_date'
    rows.push(headers)

    const esc = (v: unknown) => {
      if (v === null || v === undefined) return ''
      const s = String(v)
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`
      }
      return s
    }

    for (const c of data.expenseCategories) {
      rows.push(`expense_category,${esc(c.name)},${esc(c.icon)},,,,,,,,,,,,,,,`)
    }
    for (const s of data.incomeSources) {
      rows.push(`income_source,${esc(s.name)},${esc(s.icon)},,,,,,,,,,,,,,,`)
    }
    for (const e of data.expenses) {
      const catName = data.expenseCategories.find((c) => c.id === e.expense_category_id)?.name || ''
      rows.push(`expense,${esc(e.name)},,${e.value},${e.recurring},${esc(e.date)},${esc(e.due_date)},${esc(catName)},,,,,,,,,,,`)
    }
    for (const i of data.incomes) {
      const srcName = data.incomeSources.find((s) => s.id === i.income_source_id)?.name || ''
      rows.push(`income,${esc(i.name)},,${i.value},${i.recurring},${esc(i.date)},${esc(i.due_date)},,${esc(srcName)},,,,,,,,,,`)
    }
    for (const g of data.goals) {
      rows.push(`goal,${esc(g.name)},,${g.value},,${esc(g.start_date)},,,,${esc(g.description)},${g.current_value},${g.monthly_savings},${esc(g.start_date)},${esc(g.target_date)},,,,,`)
    }
    for (const gc of data.goalContributions) {
      rows.push(`goal_contribution,,,,${gc.value},,${esc(gc.date)},,,,,,,,,${esc(gc.goal_name)},${esc(gc.observation)},,,,`)
    }
    for (const ee of data.expenseExclusions) {
      rows.push(`expense_exclusion,,,,,,${esc(ee.exclusion_date)},,,,,,,,,,${esc(ee.expense_name)},expense,${esc(ee.exclusion_date)}`)
    }
    for (const ie of data.incomeExclusions) {
      rows.push(`income_exclusion,,,,,,${esc(ie.exclusion_date)},,,,,,,,,,${esc(ie.income_name)},income,${esc(ie.exclusion_date)}`)
    }

    return rows.join('\n')
  }

  const handleExportCSV = async () => {
    setExporting(true)
    try {
      const data = await reportsService.exportData({
        start: startDate || undefined,
        end: endDate || undefined,
      })
      const csv = generateCSV(data)
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `poupamais_export_${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t(common.error)
      alert(message)
    } finally {
      setExporting(false)
    }
  }

  const handleExportJSON = async () => {
    setExporting(true)
    try {
      const data = await reportsService.exportData({
        start: startDate || undefined,
        end: endDate || undefined,
      })
      const json = JSON.stringify(data, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `poupamais_export_${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t(common.error)
      alert(message)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <p className="text-sm text-gray-500 mb-6">{t(reports.exportDataDesc)}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t(reports.startDate)}
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t(reports.endDate)}
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleExportCSV}
          disabled={exporting}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          {exporting ? t(common.loading) : t(reports.exportCsv)}
        </button>
        <button
          onClick={handleExportJSON}
          disabled={exporting}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          {exporting ? t(common.loading) : 'Export JSON'}
        </button>
      </div>
    </div>
  )
}
