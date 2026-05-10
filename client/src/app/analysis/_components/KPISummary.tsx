'use client'

import {
  TrendingUp,
  TrendingDown,
  Target,
  PiggyBank,
  DollarSign,
  Activity,
  AlertCircle,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/app/terminology/LanguageContext'
import { analysis } from '@/app/terminology/language/analysis'
import { formatCurrency as formatMoney } from '@/app/terminology/currency'
import { useIntersectionLoader } from '../_hooks/useIntersectionLoader'
import { useStatisticsQuery } from '../_hooks/useStatisticsQuery'
import { statisticsService, KpiResponse, StatisticsQueryParams } from '@/services/statistics.service'

interface KPISummaryProps {
  params?: StatisticsQueryParams
}

function KpiCard({
  icon,
  bgColor,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode
  bgColor: string
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className="bg-white text-gray-800 p-4 md:p-5 rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-9 h-9 md:w-10 md:h-10 ${bgColor} rounded-full flex items-center justify-center flex-shrink-0`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-gray-500 text-xs truncate">{label}</p>
          <p className="text-lg md:text-xl font-semibold truncate">{value}</p>
          {sub && <p className="text-xs text-gray-400">{sub}</p>}
        </div>
      </div>
    </div>
  )
}

export default function KPISummary({ params }: KPISummaryProps) {
  const { user } = useAuth()
  const { t } = useLanguage()
  const { ref, isVisible } = useIntersectionLoader()
  const { data, loading, error } = useStatisticsQuery<KpiResponse>({
    fetcher: statisticsService.getKpi,
    params,
    enabled: isVisible,
  })

  const fmt = (v: number) => formatMoney(v, user?.currency || 'real')

  const TrendIcon =
    data?.balanceTrend === 'up'
      ? TrendingUp
      : data?.balanceTrend === 'down'
        ? TrendingDown
        : Activity

  const trendColor =
    data?.balanceTrend === 'up'
      ? 'text-green-600'
      : data?.balanceTrend === 'down'
        ? 'text-red-600'
        : 'text-blue-600'

  return (
    <div ref={ref}>
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
          {Array.from({ length: 5 }).map((_, idx) => (
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
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
            <KpiCard
              icon={<TrendIcon className={`w-4 h-4 md:w-5 md:h-5 ${trendColor}`} />}
              bgColor="bg-blue-100"
              label={t(analysis.netBalance)}
              value={fmt(data.netBalance)}
            />

            <KpiCard
              icon={<PiggyBank className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />}
              bgColor="bg-purple-100"
              label={t(analysis.savingsRate)}
              value={`${data.savingsRate}%`}
              sub={`${t(analysis.monthlyAverage)}: ${fmt(data.avgBalance)}`}
            />

            <KpiCard
              icon={<Target className="w-4 h-4 md:w-5 md:h-5 text-yellow-600" />}
              bgColor="bg-yellow-100"
              label={t(analysis.goalAllocation)}
              value={`${data.goalAllocationRate}%`}
            />

            <KpiCard
              icon={<DollarSign className="w-4 h-4 md:w-5 md:h-5 text-green-600" />}
              bgColor="bg-green-100"
              label={t(analysis.totalIncomes)}
              value={fmt(data.totalIncomes)}
            />

            <KpiCard
              icon={<DollarSign className="w-4 h-4 md:w-5 md:h-5 text-orange-600" />}
              bgColor="bg-orange-100"
              label={t(analysis.expenses)}
              value={fmt(data.totalExpenses)}
            />
          </div>

          {data.topCategories.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="text-xs text-gray-400">{t(analysis.topMerchants)}:</span>
              {data.topCategories.map((cat) => (
                <span
                  key={cat.name}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-600"
                >
                  {cat.name} <span className="font-medium">{fmt(cat.total)}</span>
                </span>
              ))}
            </div>
          )}
        </>
      ) : null}
    </div>
  )
}
