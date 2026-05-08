'use client'

import { useEffect, useState } from 'react'
import { Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js'
import { formatCurrency } from "@/app/terminology/currency"
import { Currency } from "@/types/auth"
import { dashboard } from '@/app/terminology/language/dashboard'
import { useLanguage } from '@/app/terminology/LanguageContext'

ChartJS.register(ArcElement, Tooltip, Legend)

interface CategoryData {
  category: string
  value: number
}

interface DespesasChartProps {
  data: CategoryData[]
  moeda: Currency
}

export default function DespesasChart({ data, moeda }: DespesasChartProps) {
  const [containerKey, setContainerKey] = useState(0)
  const { t } = useLanguage()

  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const handleResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(
        () => setContainerKey(prev => prev + 1),
        150
      )
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(timeoutId)
    }
  }, [])

  const tooltipBg = '#ffffff'
  const tooltipText = '#111111'

  const colors = [
    '#5B8FF9',
    '#F6BD60',
    '#F28B82',
    '#81C784',
    '#BA68C8',
    '#FFD54F',
    '#4DD0E1',
    '#FF8A65',
    '#6EC6FF',
    '#A1887F',
    '#B39DDB',
    '#FFB74D',
    '#C5E1A5',
    '#90A4AE',
    '#DCE775',
  ]

  const chartData = {
    labels: data.map(item => item.category),
    datasets: [
      {
        data: data.map(item => item.value),
        backgroundColor: colors.slice(0, data.length),
        borderWidth: 0,
        cutout: '75%',
      }
    ]
  }

  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },

      tooltip: {
        backgroundColor: tooltipBg,
        titleColor: tooltipText,
        bodyColor: tooltipText,
        borderColor: '#ddd',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label(context) {
            const value = context.parsed
            return formatCurrency(value, moeda)
          }
        }
      }
    }
  }

  return (
    <div className="flex flex-col h-full">
      <h2
        className={`text-base md:text-lg font-semibold mb-4 transition-colors ${
          'text-gray-800'
        }`}
      >
        {t(dashboard.expensesByCategory)}
      </h2>

      <div
        key={containerKey}
        className="flex-1 flex items-center justify-center mb-4"
      >
        <div className="w-full max-w-[200px] h-[200px]">
          <Doughnut data={chartData} options={options} />
        </div>
      </div>

      <div className="flex flex-wrap gap-3 justify-center">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: colors[index % colors.length] }}
            />
            <span
              className={`text-xs transition-colors ${
                'text-gray-600'
              }`}
            >
              {item.category}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
