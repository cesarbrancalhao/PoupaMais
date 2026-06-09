'use client'

import { useState, useRef } from 'react'
import { Upload, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useLanguage } from '@/app/terminology/LanguageContext'
import { reports } from '@/app/terminology/language/reports'
import { reportsService, ImportRow } from '@/services/reports.service'

export default function ImportDataTab() {
  const { t } = useLanguage()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [results, setResults] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const parseCSV = (text: string): ImportRow[] => {
    const lines = text.split('\n').filter((l) => l.trim())
    if (lines.length < 2) return []

    const headers = lines[0].split(',').map((h) => h.trim())
    const rows: ImportRow[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i])
      const row: Record<string, unknown> = {}
      headers.forEach((h, idx) => {
        const val = values[idx] || ''
        if (h === 'value' || h === 'current_value' || h === 'monthly_savings') {
          row[h] = val ? Number(val) : undefined
        } else if (h === 'recurring' || h === 'checked') {
          row[h] = val === 'true' ? true : false
        } else {
          row[h] = val || undefined
        }
      })
      rows.push(row as unknown as ImportRow)
    }

    return rows
  }

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (inQuotes) {
        if (char === '"') {
          if (i + 1 < line.length && line[i + 1] === '"') {
            current += '"'
            i++
          } else {
            inQuotes = false
          }
        } else {
          current += char
        }
      } else {
        if (char === '"') {
          inQuotes = true
        } else if (char === ',') {
          result.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
    }
    result.push(current.trim())
    return result
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFileName(file.name)
      setError(null)
      setResults([])
    }
  }

  const handleImport = async () => {
    const file = fileInputRef.current?.files?.[0]
    if (!file) {
      setError(t(reports.noFileSelected))
      return
    }

    setImporting(true)
    setError(null)
    setResults([])

    try {
      const text = await file.text()
      const rows = parseCSV(text)
      if (rows.length === 0) {
        setError(t(reports.importError))
        setImporting(false)
        return
      }
      const result = await reportsService.importData(rows)
      setResults(result.results)
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : '') || t(reports.importError))
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <p className="text-sm text-gray-500 mb-6">{t(reports.importDataDesc)}</p>

      <div className="mb-6">
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors"
        >
          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-600">
            {fileName || t(reports.selectFile)}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>

      <button
        onClick={handleImport}
        disabled={!fileName || importing}
        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
      >
        <Upload className="w-4 h-4" />
        {importing ? t(reports.importing) : t(reports.import)}
      </button>

      {error && (
        <div className="mt-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center gap-2 text-sm text-green-600 mb-3">
            <CheckCircle2 className="w-4 h-4" />
            {t(reports.importSuccess)}
          </div>
          <div className="max-h-64 overflow-y-auto bg-gray-50 rounded-lg p-3">
            {results.map((r, i) => (
              <p key={i} className="text-xs text-gray-600 py-0.5">
                {r}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
