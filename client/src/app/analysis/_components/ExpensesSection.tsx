'use client'

import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  ChartOptions,
  Filler,
  LineElement,
  PointElement,
} from 'chart.js'
import { DollarSign } from 'lucide-react'
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
  ExpensesByCategoryResponse,
  ExpensesOverTimeResponse,
  TopMerchantsResponse,
  StatisticsQueryParams,
} from '@/services/statistics.service'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  Filler,
  LineElement,
  PointElement,
)

interface ExpensesSectionProps {
  params?: StatisticsQueryParams
}

const CATEGORY_COLORS = [
  'rgba(59, 130, 246, 0.75)',
  'rgba(168, 85, 247, 0.75)',
  'rgba(234, 179, 8, 0.75)',
  'rgba(34, 197, 94, 0.75)',
  'rgba(239, 68, 68, 0.75)',
  'rgba(14, 165, 233, 0.75)',
  'rgba(249, 115, 22, 0.75)',
  'rgba(236, 72, 153, 0.75)',
]

function formatAxisValue(value: number, currency: Currency) {
  const formatted = formatMoney(1, currency)
  const symbol = formatted.replace(/[\d.,\s]/g, '')
  if (Math.abs(value) >= 1000) return `${symbol} ${Math.round(value / 1000)}K`
  return `${symbol} ${Math.round(value)}`
}

export default function ExpensesSection({ params }: ExpensesSectionProps) {
  const { user } = useAuth()
  const { t } = useLanguage()
  const { ref, isVisible } = useIntersectionLoader()

  const catQuery = useStatisticsQuery<ExpensesByCategoryResponse>({
    fetcher: statisticsService.getExpensesByCategory,
    params,
    enabled: isVisible,
  })

  const overTimeQuery = useStatisticsQuery<ExpensesOverTimeResponse>({
    fetcher: statisticsService.getExpensesOverTime,
    params,
    enabled: isVisible,
  })

  const merchantsQuery = useStatisticsQuery<TopMerchantsResponse>({
    fetcher: statisticsService.getTopMerchants,
    params: { ...params, limit: 10 },
    enabled: isVisible,
  })

  const currency: Currency = (user?.currency || 'real') as Currency
  const fmt = (v: number) => formatMoney(v, currency)
  const textColor = '#1f2937'
  const gridColor = 'rgba(0,0,0,0.05)'

  if (!isVisible) {
    return <div ref={ref} />
  }

  const allLoading = catQuery.loading && overTimeQuery.loading && merchantsQuery.loading
  const allFinished = !catQuery.loading && !overTimeQuery.loading && !merchantsQuery.loading

  if (allLoading) {
    return (
      <div ref={ref} className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="h-4 bg-gray-200 rounded w-24 mb-4 animate-pulse" />
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 h-[250px] bg-gray-100 rounded animate-pulse" />
          <div className="flex-1 h-[250px] bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
    )
  }

  const catData = catQuery.data
  const overTimeData = overTimeQuery.data
  const merchantsData = merchantsQuery.data

  const hasData =
    (catData?.data?.length ?? 0) > 0 ||
    (overTimeData?.categories?.length ?? 0) > 0 ||
    (merchantsData?.data?.length ?? 0) > 0

  if (allFinished && !hasData) {
    return (
      <div ref={ref} className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center py-12 text-gray-400">
        <DollarSign className="w-12 h-12 mb-4" />
        <p className="text-sm">{t(analysis.noDataAvailable)}</p>
      </div>
    )
  }

  const barData = catData
    ? {
        labels: catData.data.map((d) => d.category),
        datasets: [
          {
            label: t(analysis.totalSpent),
            data: catData.data.map((d) => d.total),
            backgroundColor: catData.data.map(
              (_, i) => CATEGORY_COLORS[i % CATEGORY_COLORS.length],
            ),
            borderRadius: 6,
            borderWidth: 0,
          },
        ],
      }
    : null

  const barOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
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
            const v = ctx.parsed.x ?? 0
            const cat = catData!.data[ctx.dataIndex]
            return [
              `${t(analysis.totalSpent)}: ${fmt(v)}`,
              `Share: ${cat.percentage}%`,
              `${t(analysis.transactions)}: ${cat.transactionCount}`,
            ]
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: gridColor },
        ticks: {
          color: textColor,
          callback: (v) => formatAxisValue(v as number, currency),
        },
      },
      y: {
        grid: { display: false },
        ticks: { color: textColor, font: { size: 11 } },
      },
    },
  }

  const stackedAreaData = overTimeData
    ? {
        labels: overTimeData.categories,
        datasets: overTimeData.series.map((series, i) => ({
          label: series.category,
          data: series.data,
          backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
          borderWidth: 0,
          borderRadius: 2,
        })),
      }
    : null

  const stackedOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        ...getLegendConfig(textColor),
        position: 'bottom' as const,
        labels: {
          color: textColor,
          usePointStyle: true,
          pointStyle: 'rect' as const,
          pointStyleWidth: 8,
          padding: 12,
          font: { size: 10 },
          generateLabels: (chart) => {
            const datasets = chart.data.datasets;
            return datasets.map((dataset, i) => {
              const meta = chart.getDatasetMeta(i);
              const bgColor = Array.isArray(dataset.backgroundColor) ? dataset.backgroundColor[0] : (dataset.backgroundColor as string);
              return {
                text: dataset.label || '',
                fillStyle: bgColor || 'transparent',
                strokeStyle: bgColor || '#666',
                lineWidth: 1,
                hidden: meta.hidden,
                index: i,
                pointStyle: 'rect',
                rotation: 0,
                datasetIndex: i,
              };
            });
          },
        },
        onClick: (_e, legendItem, legend) => {
          const index = legendItem.index;
          if (index === undefined) return;
          const ci = legend.chart;
          const meta = ci.getDatasetMeta(index);
          if (meta.hidden) {
            ci.show(index);
          } else {
            ci.hide(index);
          }
          ci.update();
        },
      },
      tooltip: {
        backgroundColor: '#fff',
        titleColor: '#111',
        bodyColor: '#111',
        borderColor: '#ddd',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (ctx) =>
            `${ctx.dataset.label}: ${fmt(ctx.parsed.y ?? 0)}`,
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: { display: false },
        ticks: { color: textColor, maxRotation: 45, font: { size: 10 } },
      },
      y: {
        stacked: true,
        grid: { color: gridColor },
        ticks: {
          color: textColor,
          callback: (v) => formatAxisValue(v as number, currency),
        },
      },
    },
  }

  return (
    <div ref={ref} className="space-y-4 md:space-y-6">
      <h2 className="text-base md:text-lg font-semibold text-gray-800">
        {t(analysis.expensesSection)}
      </h2>

      {catData && (
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-600">
              {t(analysis.expensesByCategory)}
            </h3>
            <span className="text-xs text-gray-400">
              {t(analysis.grandTotal)}: {fmt(catData.grandTotal)}
            </span>
          </div>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 h-[320px]">
              {barData && <Bar data={barData} options={barOptions} />}
            </div>
            <div className="flex-1 space-y-2 max-h-[320px] overflow-y-auto">
              {catData.data.map((cat, i) => (
                <div
                  key={cat.category}
                  className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-default"
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor:
                        CATEGORY_COLORS[i % CATEGORY_COLORS.length],
                    }}
                  />
                  <span className="text-sm text-gray-700 flex-1 truncate">
                    {cat.category}
                  </span>
                  <span className="text-sm font-medium text-gray-800">
                    {fmt(cat.total)}
                  </span>
                  <span className="text-xs text-gray-400 w-12 text-right">
                    {cat.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6">
        {stackedAreaData && (
          <div className="lg:col-span-3 bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-medium text-gray-600 mb-3">
              {t(analysis.expensesOverTime)}
            </h3>
            <div className="w-full h-[300px]">
              <Bar data={stackedAreaData} options={stackedOptions} />
            </div>
          </div>
        )}

        {merchantsData && merchantsData.data.length > 0 && (
          <div className="lg:col-span-2 bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-medium text-gray-600 mb-3">
              {t(analysis.topMerchants)}
            </h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {merchantsData.data.map((m, i) => (
                <div
                  key={m.merchant}
                  className="flex items-center justify-between p-2 rounded hover:bg-gray-50"
                >
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-gray-800 block truncate max-w-[160px]">
                      {i + 1}. {m.merchant}
                    </span>
                    <span className="text-xs text-gray-400">
                      {m.occurrences}x
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-800 ml-2 flex-shrink-0">
                    {fmt(m.total)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
