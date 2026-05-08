'use client'

import { useEffect, useState } from 'react'
import { Pie } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js'
import { formatCurrency } from "@/app/terminology/currency"
import { Currency } from "@/types/auth"

ChartJS.register(ArcElement, Tooltip, Legend)

interface ExpenseData {
  category: string
  value: number
}

interface ExpenseDistributionChartProps {
  data: ExpenseData[]
  moeda: Currency
}

export default function ExpenseDistributionChart({ data, moeda }: ExpenseDistributionChartProps) {
  const [containerKey, setContainerKey] = useState(0)

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
        borderWidth: 0
      }
    ]
  }

  const options: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          color: '#1f2937',
          padding: 10,
          font: {
            size: 11
          }
        }
      },

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
    <div
      key={containerKey}
      className="w-full h-full flex items-center justify-center"
    >
      <div className="w-full max-w-[250px] h-[250px]">
        <Pie data={chartData} options={options} />
      </div>
    </div>
  )
}
