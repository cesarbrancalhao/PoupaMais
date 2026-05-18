'use client'

import { useState } from 'react'
import { FileText } from 'lucide-react'
import { useLanguage } from '@/app/terminology/LanguageContext'
import { reports } from '@/app/terminology/language/reports'

interface Section {
  key: string
  labelKey: keyof typeof reports.sections
}

const sections: Section[] = [
  { key: 'averages', labelKey: 'averages' },
  { key: 'balanceSavings', labelKey: 'balanceSavings' },
  { key: 'goals', labelKey: 'goals' },
  { key: 'expenses', labelKey: 'expenses' },
  { key: 'transactions', labelKey: 'transactions' },
  { key: 'comparative', labelKey: 'comparative' },
]

export default function ExportGraphsTab() {
  const { t } = useLanguage()
  const [selected, setSelected] = useState<Set<string>>(new Set(sections.map((s) => s.key)))

  const toggleSection = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const handleSelectAll = () => {
    if (selected.size === sections.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(sections.map((s) => s.key)))
    }
  }

  const handleExportPDF = () => {
    if (selected.size === 0) return
    const sectionList = Array.from(selected).join(',')
    window.open('/analysis?export=1&sections=' + sectionList, '_blank')
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <p className="text-sm text-gray-500 mb-6">{t(reports.exportGraphsDesc)}</p>

      <div className="mb-4">
        <button
          onClick={handleSelectAll}
          className="text-sm text-indigo-600 hover:text-indigo-800"
        >
          {selected.size === sections.length ? 'Deselect all' : 'Select all'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        {sections.map((section) => (
          <label
            key={section.key}
            className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <input
              type="checkbox"
              checked={selected.has(section.key)}
              onChange={() => toggleSection(section.key)}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700">
              {t(reports.sections[section.labelKey])}
            </span>
          </label>
        ))}
      </div>

      <button
        onClick={handleExportPDF}
        disabled={selected.size === 0}
        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
      >
        <FileText className="w-4 h-4" />
        {t(reports.exportPdf)}
      </button>

      <p className="mt-3 text-xs text-gray-400">
        This will open a new tab with the selected charts. Use the browser print dialog to save as PDF.
      </p>
    </div>
  )
}
