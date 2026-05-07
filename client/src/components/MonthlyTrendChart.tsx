'use client'

import { useEffect, useState } from 'react'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js'
import { formatCurrency } from "@/app/terminology/currency"
import { Moeda } from "@/types/auth"

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

interface MonthlyTrendData {
  month: string
  balance: number
  receitas: number
  despesas: number
}

interface MonthlyTrendChartProps {
  data: MonthlyTrendData[]
  moeda: Moeda
}

export default function MonthlyTrendChart({ data, moeda }: MonthlyTrendChartProps) {
  const [containerKey, setContainerKey] = useState(0)

  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    const handleResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => setContainerKey(prev => prev + 1), 150)
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(timeoutId)
    }
  }, [])

  const textColor = '#1f2937'
  const gridColor = 'rgba(0,0,0,0.05)'
  const tooltipBg = '#ffffff'
  const tooltipText = '#111111'

  const chartData = {
    labels: data.map(item => item.month),
    datasets: [
      {
        label: 'Receitas',
        data: data.map(item => item.receitas),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1,
        borderRadius: 4
      },
      {
        label: 'Despesas',
        data: data.map(item => item.despesas),
        backgroundColor: 'rgba(251, 146, 120, 0.8)',
        borderColor: 'rgba(251, 146, 120, 1)',
        borderWidth: 1,
        borderRadius: 4
      }
    ]
  }

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: textColor,
          padding: 15,
          font: {
            size: 12
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
          label: function (context) {
            const value = context.parsed.y ?? 0
            const formatted = formatCurrency(1, moeda)
            const symbol = formatted.replace(/[\d.,\s]/g, '')

            if (Math.abs(value) >= 1000) {
              const shortened = Math.round(value / 1000)
              return `${context.dataset.label}: ${symbol} ${shortened}K`
            }

            return `${context.dataset.label}: ${symbol} ${Math.round(value)}`
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: textColor,
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          color: gridColor
        },
        ticks: {
          color: textColor,
          callback: (value) => {
            const num = value as number
            const formatted = formatCurrency(1, moeda)
            const symbol = formatted.replace(/[\d.,\s]/g, '')

            if (Math.abs(num) >= 1000) {
              const shortened = Math.round(num / 1000)
              return `${symbol} ${shortened}K`
            }

            return `${symbol} ${Math.round(num)}`
          }
        }
      }
    }
  }

  return (
    <div
      key={containerKey}
      className="relative w-full h-full"
    >
      <Bar data={chartData} options={options} />
    </div>
  )
}
