'use client'

import { useEffect, useState } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  ChartOptions,
  Filler
} from 'chart.js'
import { formatCurrency } from "@/app/terminology/currency"
import { Currency } from "@/types/auth"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler)

interface YearlyBalanceData {
  month: string
  balance: number
  income: number
  expenses: number
}

interface YearlyBalanceChartProps {
  data: YearlyBalanceData[]
  moeda: Currency
}

export default function YearlyBalanceChart({ data, moeda }: YearlyBalanceChartProps) {
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
        label: 'Balance',
        data: data.map(item => item.balance),
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2
      }
    ]
  }

  const options: ChartOptions<'line'> = {
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
          label: function (context) {
            const value = context.parsed.y ?? 0
            const formatted = formatCurrency(1, moeda)
            const symbol = formatted.replace(/[\d.,\s]/g, '')

            if (Math.abs(value) >= 1000) {
              const shortened = Math.round(value / 1000)
              return `Balance: ${symbol} ${shortened}K`
            }

            return `Balance: ${symbol} ${Math.round(value)}`
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
      <Line data={chartData} options={options} />
    </div>
  )
}
