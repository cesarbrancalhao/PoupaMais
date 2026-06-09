'use client'

import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
} from 'chart.js'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/app/terminology/LanguageContext'
import { analysis } from '@/app/terminology/language/analysis'
import { formatCurrency as formatMoney } from '@/app/terminology/currency'
import { Currency } from '@/types/auth'
import { useIntersectionLoader } from '../_hooks/useIntersectionLoader'
import { useStatisticsQuery } from '../_hooks/useStatisticsQuery'
import { getLegendConfig } from '../_utils/chartUtils'
import {
  statisticsService,
  ComparativeResponse,
  StatisticsQueryParams,
} from '@/services/statistics.service'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Filler,
)

interface ComparativeTrendProps {
  params?: StatisticsQueryParams
}

function formatAxisValue(value: number, currency: Currency) {
  const formatted = formatMoney(1, currency)
  const symbol = formatted.replace(/[\d.,\s]/g, '')
  if (Math.abs(value) >= 1000) return `${symbol} ${Math.round(value / 1000)}K`
  return `${symbol} ${Math.round(value)}`
}

export default function ComparativeTrend({ params }: ComparativeTrendProps) {
  const { user } = useAuth()
  const { t } = useLanguage()
  const { ref, isVisible } = useIntersectionLoader()
  const { data, loading } = useStatisticsQuery<ComparativeResponse>({
    fetcher: statisticsService.getComparative,
    params: { ...params, compareTo: params?.compareTo || 'prev-year' },
    enabled: isVisible,
  })

  const currency: Currency = (user?.currency || 'real') as Currency
  const fmt = (v: number) => formatMoney(v, currency)
  const textColor = '#1f2937'
  const gridColor = 'rgba(0,0,0,0.05)'

  if (!isVisible) return <div ref={ref} />

  if (loading) {
    return (
      <div ref={ref} className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="h-4 bg-gray-200 rounded w-32 mb-4 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
        <div className="h-[250px] bg-gray-100 rounded animate-pulse" />
      </div>
    )
  }

  if (!data) {
    return <div ref={ref} />
  }

  const trendChart = {
    labels: [
      ...data.monthlyTrend.map((d) => d.month),
      ...data.predictive.map((d) => d.month),
    ],
    datasets: [
      {
        label: t(analysis.balance),
        data: data.monthlyTrend.map((d) => d.balance),
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.05)',
        borderWidth: 2,
        fill: true,
        tension: 0.3,
        pointRadius: 3,
      },
      ...(data.predictive.length > 0
        ? [
            {
              label: t(analysis.prediction),
              data: [
                ...Array(data.monthlyTrend.length).fill(null),
                ...data.predictive.map((d) => d.balance),
              ],
              borderColor: 'rgba(234, 88, 12, 0.7)',
              backgroundColor: 'transparent',
              borderWidth: 2,
              borderDash: [6, 4],
              fill: false,
              tension: 0.3,
              pointRadius: 3,
              pointBackgroundColor: 'rgba(234, 88, 12, 1)',
            },
          ]
        : []),
    ],
  }

  const lineOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: getLegendConfig(textColor),
      tooltip: {
        backgroundColor: '#fff',
        titleColor: '#111',
        bodyColor: '#111',
        borderColor: '#ddd',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (ctx) => {
            const v = ctx.parsed.y ?? 0
            return `${ctx.dataset.label}: ${formatAxisValue(v, currency)}`
          },
        },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: textColor, maxRotation: 45 } },
      y: {
        grid: { color: gridColor },
        ticks: { color: textColor, callback: (v) => formatAxisValue(v as number, currency) },
      },
    },
  }

  return (
    <div ref={ref} className="space-y-4 md:space-y-6">
      <h2 className="text-base md:text-lg font-semibold text-gray-800">
        {t(analysis.comparative)}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">{t(analysis.income)}</p>
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-gray-800">
              {fmt(data.current.totalIncomes)}
            </span>
            <div className={`flex items-center gap-0.5 text-xs ${data.deltas.incomeDelta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.deltas.incomeDelta >= 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {data.deltas.incomeDelta}%
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            {t(analysis.previousPeriod)}: {fmt(data.previous.totalIncomes)}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">{t(analysis.expenses)}</p>
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-gray-800">
              {fmt(data.current.totalExpenses)}
            </span>
            <div className={`flex items-center gap-0.5 text-xs ${data.deltas.expenseDelta <= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.deltas.expenseDelta <= 0 ? (
                <TrendingDown className="w-3 h-3" />
              ) : (
                <TrendingUp className="w-3 h-3" />
              )}
              {data.deltas.expenseDelta}%
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            {t(analysis.previousPeriod)}: {fmt(data.previous.totalExpenses)}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">{t(analysis.netBalance)}</p>
          <div className="flex items-center gap-2">
            <span className={`text-lg font-semibold ${data.current.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {fmt(data.current.netBalance)}
            </span>
            <div className={`flex items-center gap-0.5 text-xs ${data.deltas.balanceDelta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.deltas.balanceDelta >= 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {data.deltas.balanceDelta}%
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            {t(analysis.previousPeriod)}: {fmt(data.previous.netBalance)}
          </p>
        </div>
      </div>

      <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-sm font-medium text-gray-600 mb-3">
          {t(analysis.predictiveTrend)}
        </h3>
        <div className="w-full h-[280px]">
          <Line data={trendChart} options={lineOptions} />
        </div>
      </div>
    </div>
  )
}
