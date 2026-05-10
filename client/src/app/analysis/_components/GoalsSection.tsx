'use client'

import { Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js'
import { Target, Calendar, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/app/terminology/LanguageContext'
import { analysis } from '@/app/terminology/language/analysis'
import { formatCurrency as formatMoney } from '@/app/terminology/currency'
import { useIntersectionLoader } from '../_hooks/useIntersectionLoader'
import { useStatisticsQuery } from '../_hooks/useStatisticsQuery'
import {
  statisticsService,
  GoalsResponse,
  StatisticsQueryParams,
} from '@/services/statistics.service'

ChartJS.register(ArcElement, Tooltip, Legend)

interface GoalsSectionProps {
  params?: StatisticsQueryParams
}

const COLORS = [
  'rgba(59, 130, 246, 0.8)',
  'rgba(168, 85, 247, 0.8)',
  'rgba(234, 179, 8, 0.8)',
  'rgba(34, 197, 94, 0.8)',
  'rgba(239, 68, 68, 0.8)',
  'rgba(14, 165, 233, 0.8)',
  'rgba(249, 115, 22, 0.8)',
  'rgba(236, 72, 153, 0.8)',
]

export default function GoalsSection({ params }: GoalsSectionProps) {
  const { user } = useAuth()
  const { t } = useLanguage()
  const { ref, isVisible } = useIntersectionLoader()
  const { data, loading } = useStatisticsQuery<GoalsResponse>({
    fetcher: statisticsService.getGoals,
    params,
    enabled: isVisible,
  })

  const fmt = (v: number) => formatMoney(v, user?.currency || 'real')

  const doughnutData = data
    ? {
        labels: data.goals.map((g) => g.name),
        datasets: [
          {
            data: data.goals.map((g) => g.monthlySavings),
            backgroundColor: COLORS.slice(0, data.goals.length),
            borderWidth: 1,
            borderColor: '#fff',
          },
        ],
      }
    : null

  const doughnutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 12,
          usePointStyle: true,
          pointStyle: 'rect',
          pointStyleWidth: 8,
          color: '#4b5563',
          font: { size: 10 },
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
          label: (ctx) => {
            const v = ctx.parsed ?? 0
            return `${ctx.label}: ${fmt(v)}`
          },
        },
      },
    },
  }

  if (!isVisible) {
    return <div ref={ref} />
  }

  if (loading) {
    return (
      <div ref={ref} className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="h-4 bg-gray-200 rounded w-24 mb-4 animate-pulse" />
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 h-[250px] bg-gray-100 rounded animate-pulse" />
          <div className="flex-1 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!data || data.goals.length === 0) {
    return (
      <div ref={ref} className="space-y-4 md:space-y-6">
        <h2 className="text-base md:text-lg font-semibold text-gray-800">
          {t(analysis.goalsSection)}
        </h2>

        <div ref={ref} className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center py-12 text-gray-400">
          <Target className="w-12 h-12 mb-4" />
          <p className="text-sm">{t(analysis.noGoalsYet)}</p>
        </div>
      </div>
    )
  }

  return (
    <div ref={ref} className="space-y-4 md:space-y-6">
      <h2 className="text-base md:text-lg font-semibold text-gray-800">
        {t(analysis.goalsSection)}
      </h2>

      <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
        <div className="flex-1 bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-600 mb-3">
            {t(analysis.goalAllocation)}
          </h3>
          <div className="w-full max-w-[280px] aspect-square mx-auto">
            {doughnutData && (
              <Doughnut data={doughnutData} options={doughnutOptions} />
            )}
          </div>
          <p className="text-xs text-center text-gray-500 mt-2">
            {t(analysis.overallProgress)}: {data.overallProgress}%
          </p>
        </div>

        <div className="flex-1 bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-600 mb-3">
            {t(analysis.goalProgress)}
          </h3>
          <div className="space-y-3 max-h-[350px] overflow-y-auto">
            {data.goals.map((goal, idx) => (
              <div key={goal.id} className="p-3 rounded-lg bg-gray-50">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm font-medium text-gray-800 truncate max-w-[60%]">
                    {goal.name}
                  </span>
                  <span
                    className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                      goal.progress >= 100
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {goal.progress}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(goal.progress, 100)}%`,
                      backgroundColor: COLORS[idx % COLORS.length],
                    }}
                  />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-xs text-gray-500">
                    {fmt(goal.current)} / {fmt(goal.target)}
                  </span>
                  <span className="text-xs text-gray-400">
                    {fmt(goal.monthlySavings)}/{t(analysis.monthlyAverage)}
                  </span>
                </div>
                {goal.projectedCompletionDate && (
                  <div className="flex items-center gap-1 mt-1.5">
                    {goal.projectedCompletionDate === 'achieved' ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                        <span className="text-xs text-green-600">
                          {t(analysis.achieved)}
                        </span>
                      </>
                    ) : (
                      <>
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {t(analysis.projectedCompletion)}:{' '}
                          {new Date(goal.projectedCompletionDate).toLocaleDateString(
                            user?.language === 'portuguese'
                              ? 'pt-BR'
                              : user?.language === 'spanish'
                                ? 'es'
                                : 'en',
                            { month: 'short', year: 'numeric' },
                          )}
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
