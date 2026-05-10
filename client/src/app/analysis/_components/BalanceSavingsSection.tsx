'use client'

import { Line, Bar } from 'react-chartjs-2'
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
import { TrendingUp } from 'lucide-react'
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
  BalanceResponse,
  SavingsResponse,
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

interface BalanceSavingsSectionProps {
  params?: StatisticsQueryParams
}

function formatAxisValue(value: number, currency: Currency) {
  const formatted = formatMoney(1, currency)
  const symbol = formatted.replace(/[\d.,\s]/g, '')
  if (Math.abs(value) >= 1000) return `${symbol} ${Math.round(value / 1000)}K`
  return `${symbol} ${Math.round(value)}`
}

export default function BalanceSavingsSection({ params }: BalanceSavingsSectionProps) {
  const { user } = useAuth()
  const { t } = useLanguage()
  const { ref, isVisible } = useIntersectionLoader()

  const balanceQuery = useStatisticsQuery<BalanceResponse>({
    fetcher: statisticsService.getBalance,
    params,
    enabled: isVisible,
  })

  const savingsQuery = useStatisticsQuery<SavingsResponse>({
    fetcher: statisticsService.getSavings,
    params,
    enabled: isVisible,
  })

  const currency: Currency = (user?.currency || 'real') as Currency
  const textColor = '#1f2937'
  const gridColor = 'rgba(0,0,0,0.05)'

  if (
    !isVisible ||
    (balanceQuery.loading && savingsQuery.loading)
  ) {
    return (
      <div ref={ref} className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="h-4 bg-gray-200 rounded w-48 mb-4 animate-pulse" />
        <div className="h-[300px] bg-gray-100 rounded animate-pulse" />
      </div>
    )
  }

  const balanceData = balanceQuery.data
  const savingsData = savingsQuery.data

  const balanceChart = balanceData
    ? {
        labels: balanceData.data.map((d) => d.month),
        datasets: [
          {
            label: t(analysis.balance),
            data: balanceData.data.map((d) => d.balance),
            borderColor: 'rgba(59, 130, 246, 1)',
            backgroundColor: 'rgba(59, 130, 246, 0.05)',
            borderWidth: 2,
            fill: true,
            tension: 0.3,
            pointRadius: 3,
          },
          {
            label: t(analysis.movingAverage),
            data: balanceData.movingAverage,
            borderColor: 'rgba(234, 88, 12, 0.7)',
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderDash: [6, 4],
            fill: false,
            tension: 0.3,
            pointRadius: 0,
          },
        ],
      }
    : null

  const savingsChart = savingsData
    ? {
        labels: savingsData.data.map((d) => d.month),
        datasets: [
          {
            label: t(analysis.monthlySavings),
            data: savingsData.data.map((d) => d.savings),
            backgroundColor: savingsData.data.map((d) =>
              d.savings >= 0
                ? 'rgba(34, 197, 94, 0.6)'
                : 'rgba(239, 68, 68, 0.6)',
            ),
            borderColor: savingsData.data.map((d) =>
              d.savings >= 0 ? 'rgba(34, 197, 94, 1)' : 'rgba(239, 68, 68, 1)',
            ),
            borderWidth: 1,
            borderRadius: 4,
          },
        ],
      }
    : null

  const cumulativeChart = savingsData
    ? {
        labels: savingsData.data.map((d) => d.month),
        datasets: [
          {
            label: t(analysis.cumulativeSavings),
            data: savingsData.data.map((d) => d.cumulative),
            borderColor: 'rgba(99, 102, 241, 1)',
            backgroundColor: 'rgba(99, 102, 241, 0.05)',
            borderWidth: 2,
            fill: true,
            tension: 0.3,
            pointRadius: 3,
          },
        ],
      }
    : null

  const lineOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
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
        beginAtZero: true,
        grid: { color: gridColor },
        ticks: { color: textColor, callback: (v) => formatAxisValue(v as number, currency) },
      },
    },
  }

  const barOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
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
            return `${t(analysis.savings)}: ${formatAxisValue(v, currency)}`
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
        {t(analysis.balanceSavings)}
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-600 mb-3">
            {t(analysis.yearlyBalance)}
          </h3>
          {balanceData && balanceData.data.length > 0 ? (
            <div className="w-full h-[280px]">
              <Line data={balanceChart!} options={lineOptions} />
            </div>
          ) : (
            <div className="flex flex-col items-center py-12 text-gray-400">
              <TrendingUp className="w-10 h-10 mb-3" />
              <p className="text-sm">{t(analysis.noBalanceData)}</p>
            </div>
          )}
        </div>

        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-600 mb-3">
            {t(analysis.monthlySavingsHistogram)}
          </h3>
          {savingsData && savingsData.data.length > 0 ? (
            <div className="w-full h-[280px]">
              <Bar data={savingsChart!} options={barOptions} />
            </div>
          ) : (
            <div className="flex flex-col items-center py-12 text-gray-400">
              <TrendingUp className="w-10 h-10 mb-3" />
              <p className="text-sm">{t(analysis.noSavingsData)}</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-sm font-medium text-gray-600 mb-3">
          {t(analysis.cumulativeSavings)}
        </h3>
        {savingsData && savingsData.data.length > 0 ? (
          <div className="w-full h-[280px]">
            <Line data={cumulativeChart!} options={lineOptions} />
          </div>
        ) : (
          <div className="flex flex-col items-center py-12 text-gray-400">
            <TrendingUp className="w-10 h-10 mb-3" />
            <p className="text-sm">{t(analysis.noCumulativeData)}</p>
          </div>
        )}
      </div>
    </div>
  )
}
