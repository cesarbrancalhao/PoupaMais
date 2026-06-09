'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useLanguage } from '@/app/terminology/LanguageContext'

interface CalendarProps {
  selectedDate: string
  onDateSelect: (date: string) => void
  compact?: boolean
  inline?: boolean
}

export default function Calendar({ selectedDate, onDateSelect, compact = false, inline = false }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [open, setOpen] = useState(inline)
  const { language } = useLanguage()

  useEffect(() => {
    if (selectedDate && (open || inline)) {
      const selectedDateParts = selectedDate.split('-')
      if (selectedDateParts.length === 3) {
        const selectedYear = parseInt(selectedDateParts[0], 10)
        const selectedMonth = parseInt(selectedDateParts[1], 10) - 1
        if (!isNaN(selectedYear) && !isNaN(selectedMonth)) {
          setCurrentMonth(new Date(selectedYear, selectedMonth, 1))
        }
      }
    }
  }, [selectedDate, open, inline])

  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

  const monthNames: Record<string, string[]> = {
    pt: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    es: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days: (number | null)[] = []
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day)
    }
    return days
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth((prev) => {
      const newMonth = new Date(prev)
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1)
      } else {
        newMonth.setMonth(prev.getMonth() + 1)
      }
      return newMonth
    })
  }

  const handleDateClick = (day: number) => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    onDateSelect(dateString)
    if (!inline) setOpen(false)
  }

  const days = getDaysInMonth(currentMonth)
  const mtNames = monthNames[language as string] || monthNames['en']
  const currentMonthLabel = `${mtNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`

  const formatDisplay = (value: string) => {
    const parts = value.split('-')
    if (parts.length !== 3) return value
    const [year, month, day] = parts
    return `${day}/${month}/${year}`
  }

  const displayLabel = selectedDate ? formatDisplay(selectedDate) : '—'

  const calendarGrid = (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-lg p-3 ${
      compact ? 'w-[230px]' : 'w-[260px]'
    } ${inline ? 'w-full border-0 shadow-none p-0' : ''}`}>
      <div className="flex items-center justify-between mb-3 gap-2">
        <button
          type="button"
          onClick={() => navigateMonth('prev')}
          className="p-1 rounded text-gray-600 hover:bg-gray-100"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold text-gray-800">{currentMonthLabel}</span>
        <button
          type="button"
          onClick={() => navigateMonth('next')}
          className="p-1 rounded text-gray-600 hover:bg-gray-100"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {inline && (
        <p className="text-xs text-gray-500 mb-2">{displayLabel}</p>
      )}

      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {dayNames.map((day, index) => (
          <div key={index} className="text-center text-xs font-medium text-gray-600">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {days.map((day, index) => {
          if (!day) {
            return <div key={index} className="h-8"></div>
          }

          const isSelected =
            selectedDate ===
            `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

          return (
            <button
              key={index}
              type="button"
              onClick={() => handleDateClick(day)}
              className={`h-8 w-8 flex items-center justify-center text-sm rounded-full transition-colors ${
                isSelected
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )

  if (inline) {
    return calendarGrid
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-gray-700 hover:bg-gray-50 transition ${
          compact ? 'px-2 py-1.5 text-sm' : 'px-3 py-2 text-sm'
        }`}
      >
        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
        <span className="truncate max-w-[100px]">{displayLabel}</span>
      </button>

      {open && (
        <>
          <div className="absolute z-30 mt-1 left-0">
            {calendarGrid}
          </div>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
        </>
      )}
    </div>
  )
}
