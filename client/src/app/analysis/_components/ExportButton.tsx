'use client'

import { FileText } from 'lucide-react'
import { useLanguage } from '@/app/terminology/LanguageContext'
import { analysis } from '@/app/terminology/language/analysis'

interface ExportButtonProps {
  data: Record<string, unknown> | null
  filename?: string
}

export function ExportCSV({ data, filename = 'export' }: ExportButtonProps) {
  const { t } = useLanguage()

  const handleExport = () => {
    if (!data) return

    const flatten = (obj: unknown, prefix = ''): Record<string, string> => {
      if (Array.isArray(obj)) {
        const result: Record<string, string> = {}
        obj.forEach((item, i) => {
          const flat = flatten(item, `${prefix}[${i}]`)
          Object.assign(result, flat)
        })
        return result
      }
      if (typeof obj === 'object' && obj !== null) {
        const result: Record<string, string> = {}
        for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
          const key = prefix ? `${prefix}.${k}` : k
          if (typeof v === 'object' && v !== null) {
            Object.assign(result, flatten(v, key))
          } else {
            result[key] = String(v ?? '')
          }
        }
        return result
      }
      return { [prefix]: String(obj) }
    }

    const flat = flatten(data)
    const headers = Object.keys(flat)
    const csv = [headers.join(','), headers.map((h) => `"${flat[h]}"`).join(',')].join(
      '\n',
    )

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={handleExport}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
      title={t(analysis.exportCsv)}
    >
      <FileText className="w-3.5 h-3.5" />
      CSV
    </button>
  )
}

export function ExportPNG({ elementId }: { elementId: string; filename?: string }) {
  const { t } = useLanguage()

  const handleExport = () => {
    const el = document.getElementById(elementId)
    if (!el) return

    const canvasEl = el.querySelector('canvas')
    if (!canvasEl) {
      alert('No chart found to export')
      return
    }

    const url = canvasEl.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = `${elementId}.png`
    a.click()
  }

  return (
    <button
      onClick={handleExport}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
      title={t(analysis.exportPng)}
    >
      <FileText className="w-3.5 h-3.5" />
      PNG
    </button>
  )
}
