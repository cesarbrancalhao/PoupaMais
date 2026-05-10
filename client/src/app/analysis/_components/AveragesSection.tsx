'use client'

import { TrendingUp, TrendingDown, Target, AlertCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/app/terminology/LanguageContext'
import { analysis } from '@/app/terminology/language/analysis'
import { formatCurrency as formatMoney } from '@/app/terminology/currency'
import { useIntersectionLoader } from '../_hooks/useIntersectionLoader'
import { useStatisticsQuery } from '../_hooks/useStatisticsQuery'
import { statisticsService, KpiResponse, StatisticsQueryParams } from '@/services/statistics.service'

interface AveragesSectionProps {
  params?: StatisticsQueryParams
}

function AvgCard({
  icon,
  bgColor,
  label,
  value,
}: {
  icon: React.ReactNode
  bgColor: string
  label: string
  value: string
}) {
  return (
    <div className="bg-white text-gray-800 p-4 md:p-5 rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 md:w-10 md:h-10 ${bgColor} rounded-full flex items-center justify-center flex-shrink-0`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-gray-500 text-xs truncate">{label}</p>
          <p className="text-lg md:text-xl font-semibold truncate">{value}</p>
        </div>
      </div>
    </div>
  )
}

export default function AveragesSection({ params }: AveragesSectionProps) {
  const { user } = useAuth()
  const { t } = useLanguage()
  const { ref, isVisible } = useIntersectionLoader()
  const { data, loading, error } = useStatisticsQuery<KpiResponse>({
    fetcher: statisticsService.getKpi,
    params,
    enabled: isVisible,
  })

  const fmt = (v: number) => formatMoney(v, user?.currency || 'real')
  const avgExpenses = data && data.monthsWithData > 0
    ? data.totalExpenses / data.monthsWithData
    : 0

  return (
    <div ref={ref}>
      <h2 className="text-base md:text-lg font-semibold text-gray-800 mb-4">
        {t(analysis.averagesSection)}
      </h2>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="bg-white p-4 md:p-5 rounded-xl shadow-sm animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-3 bg-gray-200 rounded w-16 mb-2" />
                  <div className="h-5 bg-gray-200 rounded w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center py-8 text-gray-400">
          <AlertCircle className="w-8 h-8 mb-2 text-amber-500" />
          <p className="text-sm">{t(analysis.errorLoadingAnalysis)}</p>
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          <AvgCard
            icon={<TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-green-600" />}
            bgColor="bg-green-100"
            label={t(analysis.avgIncome)}
            value={fmt(data.avgMonthlyIncome)}
          />
          <AvgCard
            icon={<TrendingDown className="w-4 h-4 md:w-5 md:h-5 text-red-600" />}
            bgColor="bg-red-100"
            label={t(analysis.avgExpenses)}
            value={fmt(avgExpenses)}
          />
          <AvgCard
            icon={<Target className="w-4 h-4 md:w-5 md:h-5 text-yellow-600" />}
            bgColor="bg-yellow-100"
            label={t(analysis.avgGoalAllocations)}
            value={fmt(data.goalStats.totalMonthlySavings)}
          />
        </div>
      ) : null}
    </div>
  )
}
