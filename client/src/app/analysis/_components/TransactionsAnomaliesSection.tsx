'use client'

import { AlertTriangle, Repeat } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/app/terminology/LanguageContext'
import { analysis } from '@/app/terminology/language/analysis'
import { formatCurrency as formatMoney } from '@/app/terminology/currency'
import { useIntersectionLoader } from '../_hooks/useIntersectionLoader'
import { useStatisticsQuery } from '../_hooks/useStatisticsQuery'
import {
  statisticsService,
  AnomaliesResponse,
  StatisticsQueryParams,
} from '@/services/statistics.service'

interface TransactionsAnomaliesProps {
  params?: StatisticsQueryParams
}

export default function TransactionsAnomalies({ params }: TransactionsAnomaliesProps) {
  const { user } = useAuth()
  const { t } = useLanguage()
  const { ref, isVisible } = useIntersectionLoader()
  const { data, loading } = useStatisticsQuery<AnomaliesResponse>({
    fetcher: statisticsService.getAnomalies,
    params,
    enabled: isVisible,
  })

  const fmt = (v: number) => formatMoney(v, user?.currency || 'real')

  if (!isVisible) return <div ref={ref} />

  if (loading) {
    return (
      <div ref={ref} className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="h-4 bg-gray-200 rounded w-36 mb-4 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-[180px] bg-gray-100 rounded animate-pulse" />
          <div className="h-[180px] bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
    )
  }

  if (
    !data ||
    (data.largeTransactions.length === 0 && data.recurringPayments.length === 0)
  ) {
    return <div ref={ref} />
  }

  return (
    <div ref={ref} className="space-y-4 md:space-y-6">
      <h2 className="text-base md:text-lg font-semibold text-gray-800">
        {t(analysis.transactions)}
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {data.largeTransactions.length > 0 && (
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-red-50">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <h3 className="text-sm font-medium text-gray-600">
                {t(analysis.largeTransactions)}
              </h3>
            </div>
            <div className="space-y-2 max-h-[280px] overflow-y-auto">
              {data.largeTransactions.map((tx, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded bg-red-50/50">
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-gray-800 block truncate max-w-[140px]">
                      {tx.name}
                    </span>
                    <span className="text-xs text-gray-400">
                      {tx.date} · {tx.category}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-red-600 ml-2 flex-shrink-0">
                    {fmt(tx.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.recurringPayments.length > 0 && (
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Repeat className="w-4 h-4 text-blue-500" />
              <h3 className="text-sm font-medium text-gray-600">
                {t(analysis.recurringPayments)}
              </h3>
            </div>
            <div className="space-y-2 max-h-[280px] overflow-y-auto">
              {data.recurringPayments.map((rp) => (
                <div key={rp.id} className="flex items-center justify-between p-2 rounded bg-gray-50">
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-gray-800 block truncate max-w-[130px]">
                      {rp.name}
                    </span>
                    <span className="text-xs text-gray-400">
                      {rp.category}
                      {rp.endDate ? ` · até ${rp.endDate}` : ` · ${t(analysis.noEndDate)}`}
                    </span>
                  </div>
                  <div className="text-right ml-2 flex-shrink-0">
                    <span className="text-sm font-medium text-gray-800 block">
                      {fmt(rp.value)}
                    </span>
                    {rp.nextDue && (
                      <span className="text-xs text-gray-400">
                        {t(analysis.nextDue)}: {rp.nextDue}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
