'use client'

import { useEffect, useState } from 'react'
import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, ChartOptions } from 'chart.js'
import { formatCurrency } from "@/app/terminology/currency"
import { Currency } from "@/types/auth"
import { dashboard } from '@/app/terminology/language/dashboard'
import { useLanguage } from '@/app/terminology/LanguageContext'

ChartJS.register(ArcElement, Tooltip, Legend)

interface SourceData {
  source: string
  value: number
}

interface ReceitasChartProps {
  data: SourceData[]
  moeda: Currency
}

export default function ReceitasChart({ data, moeda }: ReceitasChartProps) {
  const [containerKey, setContainerKey] = useState(0)
  const { t } = useLanguage()

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

  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const handleResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        setContainerKey(prev => prev + 1)
      }, 150)
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(timeoutId)
    }
  }, [])

  const chartData = {
    labels: data.map(item => item.source),
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
        callbacks: {
          label: function (context) {
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
        className={`text-base md:text-lg font-semibold mb-4 ${
          'text-gray-800'
        }`}
      >
        {t(dashboard.incomeBySource)}
      </h2>

      <div key={containerKey} className="flex-1 flex items-center justify-center mb-4">
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
            <span className={`text-xs ${'text-gray-600'}`}>
              {item.source}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
