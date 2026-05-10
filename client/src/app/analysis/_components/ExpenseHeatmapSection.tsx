'use client'

import { CalendarDays } from 'lucide-react'
import { useLanguage } from '@/app/terminology/LanguageContext'
import { analysis } from '@/app/terminology/language/analysis'
import { useIntersectionLoader } from '../_hooks/useIntersectionLoader'
import { useStatisticsQuery } from '../_hooks/useStatisticsQuery'
import {
  statisticsService,
  HeatmapResponse,
  StatisticsQueryParams,
} from '@/services/statistics.service'

interface ExpenseHeatmapSectionProps {
  params?: StatisticsQueryParams
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function getIntensityColor(intensity: number): string {
  if (intensity === 0) return 'bg-gray-100'
  if (intensity < 0.15) return 'bg-green-100'
  if (intensity < 0.3) return 'bg-green-200'
  if (intensity < 0.5) return 'bg-green-300'
  if (intensity < 0.7) return 'bg-green-400'
  if (intensity < 0.85) return 'bg-green-500'
  return 'bg-green-600'
}

export default function ExpenseHeatmapSection({ params }: ExpenseHeatmapSectionProps) {
  const { t } = useLanguage()
  const { ref, isVisible } = useIntersectionLoader()
  const { data, loading } = useStatisticsQuery<HeatmapResponse>({
    fetcher: statisticsService.getHeatmap,
    params,
    enabled: isVisible,
  })

  if (!isVisible) return <div ref={ref} />

  if (loading) {
    return (
      <div ref={ref} className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="h-4 bg-gray-200 rounded w-36 mb-4 animate-pulse" />
        <div className="h-[220px] bg-gray-100 rounded animate-pulse" />
      </div>
    )
  }

  if (!data || data.data.length === 0) {
    return (
      <div ref={ref} className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center py-10 text-gray-400">
        <CalendarDays className="w-8 h-8 mb-2" />
        <p className="text-xs">{t(analysis.insufficientData)}</p>
      </div>
    )
  }

  const weekdayTotals = Array(7).fill(0) as number[]
  const weekdayCounts = Array(7).fill(0) as number[]
  data.data.forEach((d) => {
    const day = new Date(d.date).getDay()
    weekdayTotals[day] += d.total
    weekdayCounts[day] += d.count
  })

  const maxTotal = Math.max(...weekdayTotals, 1)

  return (
    <div ref={ref} className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600">
          {t(analysis.dailySpendIntensity)}
        </h3>
        <span className="text-xs text-gray-400">
          {t(analysis.dailyAverage)}:{' '}
          {Math.round(
            data.data.reduce((s, d) => s + d.total, 0) /
              Math.max(data.data.length, 1),
          )}
        </span>
      </div>
      <div className="flex flex-wrap gap-1 justify-center">
        {WEEKDAYS.map((day, idx) => {
          const total = weekdayTotals[idx]
          const avg = weekdayCounts[idx] > 0 ? total / weekdayCounts[idx] : 0
          const intensity = maxTotal > 0 ? total / maxTotal : 0

          return (
            <div
              key={day}
              className="flex flex-col items-center gap-1"
              title={`${day}: total ${total}`}
            >
              <span className="text-[10px] text-gray-500 w-8 text-center">
                {day}
              </span>
              <div
                className={`w-8 h-8 rounded-md transition-colors ${getIntensityColor(intensity)}`}
              />
              {avg > 0 && (
                <span className="text-[9px] text-gray-400">
                  {Math.round(avg)}
                </span>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-center gap-1 mt-4">
        <span className="text-[10px] text-gray-400">{t(analysis.insights)}</span>
        <div className="flex gap-0.5">
          {[0, 0.15, 0.3, 0.5, 0.7, 0.85].map((v) => (
            <div key={v} className={`w-3 h-3 rounded-sm ${getIntensityColor(v)}`} />
          ))}
        </div>
        <span className="text-[10px] text-gray-400">
          {WEEKDAYS[
            weekdayTotals.indexOf(Math.max(...weekdayTotals))
          ]}
        </span>
      </div>
    </div>
  )
}
