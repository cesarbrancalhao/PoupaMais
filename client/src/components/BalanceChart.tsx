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
import { formatCurrency } from "@/app/terminology/currency";
import { Currency } from "@/types/auth";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

interface MonthlyBalance {
  month: string
  balance: number
}

interface BalanceChartProps {
  data: MonthlyBalance[];
  currency: Currency;
}

export default function BalanceChart({ data, currency }: BalanceChartProps) {
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

  const positiveBar = 'rgba(59, 130, 246, 0.8)'

  const positiveBorder = 'rgba(59, 130, 246, 1)'

  const negativeBar = 'rgba(251, 146, 120, 0.8)'

  const negativeBorder = 'rgba(251, 146, 120, 1)'

  const chartData = {
    labels: data.map(item => item.month),
    datasets: [
      {
        label: 'Balance',
        data: data.map(item => item.balance),
        backgroundColor: data.map(item =>
          item.balance >= 0 ? positiveBar : negativeBar
        ),
        borderColor: data.map(item =>
          item.balance >= 0 ? positiveBorder : negativeBorder
        ),
        borderWidth: 1,
        borderRadius: 6
      }
    ]
  }

  const options: ChartOptions<'bar'> = {
    indexAxis: 'y',
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
            const value = context.parsed.x ?? 0
            const formatted = formatCurrency(1, currency)
            const symbol = formatted.replace(/[\d.,\s]/g, '')
            
            if (Math.abs(value) >= 1000) {
              const shortened = Math.round(value / 1000)
              return `${symbol} ${shortened}K`
            }
            
            return `${symbol} ${Math.round(value)}`
          }
        }
      }
    },

    scales: {
      x: {
        beginAtZero: true,
        grid: {
          display: true,
          color: gridColor
        },
        ticks: {
          color: textColor,
          callback: (value) => {
            const num = value as number
            
            const formatted = formatCurrency(1, currency)
            const symbol = formatted.replace(/[\d.,\s]/g, '')

            if (Math.abs(num) >= 1000) {
              const shortened = Math.round(num / 1000)
              return `${symbol} ${shortened}K`
            }

            return `${symbol} ${Math.round(num)}`
          }
        }
      },

      y: {
        grid: { display: false },
        ticks: {
          color: textColor
        }
      }
    }
  }

  return (
    <div
      key={containerKey}
      className={`
        relative w-full h-full rounded-xl p-4 transition
        ${'bg-white'}
      `}
    >
      <Bar data={chartData} options={options} />
    </div>
  )
}
