'use client'

import { Calendar as CalendarIcon, Filter } from 'lucide-react'
import { useLanguage } from '@/app/terminology/LanguageContext'
import { analysis } from '@/app/terminology/language/analysis'
import Calendar from '@/components/Calendar'

type TimePreset = '3months' | '6months' | '12months' | 'ytd' | 'custom'

export interface FilterState {
  timePreset: TimePreset
  customStart: string
  customEnd: string
  year: number | null
  selectedCategories: number[]
  selectedGoals: number[]
}

interface FilterBarProps {
  filters: FilterState
  onChange: (filters: FilterState) => void
  availableCategories: { id: number; name: string }[]
  availableYears: number[]
}

const timePresets: { value: TimePreset; label: { pt: string; en: string; es: string } }[] = [
  { value: '3months', label: { pt: '3 Meses', en: '3 Months', es: '3 Meses' } },
  { value: '6months', label: { pt: '6 Meses', en: '6 Months', es: '6 Meses' } },
  { value: '12months', label: { pt: '12 Meses', en: '12 Months', es: '12 Meses' } },
  { value: 'ytd', label: { pt: 'Ano Atual', en: 'YTD', es: 'Año Actual' } },
  { value: 'custom', label: { pt: 'Personalizado', en: 'Custom', es: 'Personalizado' } },
]

export default function FilterBar({
  filters,
  onChange,
  availableCategories,
  availableYears,
}: FilterBarProps) {
  const { t } = useLanguage()

  const update = (partial: Partial<FilterState>) =>
    onChange({ ...filters, ...partial })

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-gray-100">

      <div className="flex bg-gray-100 rounded-lg p-0.5">
        {timePresets.map((preset) => (
          <button
            key={preset.value}
            onClick={() => update({ timePreset: preset.value })}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
              filters.timePreset === preset.value
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {t(preset.label)}
          </button>
        ))}
      </div>

      {filters.timePreset === 'custom' && (
        <div className="flex items-center gap-2">
          <Calendar
            selectedDate={filters.customStart}
            onDateSelect={(val) => update({ customStart: val })}
            compact
          />
          <span className="text-sm text-gray-400">—</span>
          <Calendar
            selectedDate={filters.customEnd}
            onDateSelect={(val) => update({ customEnd: val })}
            compact
          />
        </div>
      )}

      {availableYears.length > 0 && (
        <div className="flex items-center gap-1.5">
          <CalendarIcon className="w-3.5 h-3.5 text-gray-400" />
          <select
            value={filters.year ?? ''}
            onChange={(e) => update({ year: e.target.value ? Number(e.target.value) : null })}
            className="px-2 py-1.5 text-sm border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">{t(analysis.selectYear)}</option>
            {availableYears.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      )}

      {availableCategories.length > 0 && (
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-gray-400" />
          <select
            multiple
            value={filters.selectedCategories.map(String)}
            onChange={(e) =>
              update({
                selectedCategories: Array.from(
                  e.target.selectedOptions,
                  (o) => Number(o.value),
                ),
              })
            }
            className="px-2 py-1.5 text-sm border border-gray-300 rounded-md max-w-[200px] bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            {availableCategories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}
