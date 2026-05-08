'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight, Save, Trash } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { contribuicaoMetaService } from '@/services/contribuicao-meta.service'
import { useAuth } from '@/contexts/AuthContext'
import { getCurrencySymbol } from '@/app/terminology/currency'
import { useLanguage } from '@/app/terminology/LanguageContext'
import { editContribuicaoModal } from '@/app/terminology/language/modals/editContribuicao'
import { common } from '@/app/terminology/language/common'

interface EditContribuicaoModalProps {
  isOpen: boolean
  onClose: () => void
  editItem: {
    id: number
    valor: number
    data: string
    observacao?: string
  }
  onDelete?: (id: number) => void
}

interface CalendarProps {
  selectedDate: string
  onDateSelect: (date: string) => void
}

function Calendar({ selectedDate, onDateSelect}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const { language, t } = useLanguage()

  useEffect(() => {
    if (selectedDate) {
      const selectedDateParts = selectedDate.split('-')
      if (selectedDateParts.length === 3) {
        const selectedYear = parseInt(selectedDateParts[0], 10)
        const selectedMonth = parseInt(selectedDateParts[1], 10) - 1
        if (!isNaN(selectedYear) && !isNaN(selectedMonth)) {
          setCurrentMonth(new Date(selectedYear, selectedMonth, 1))
        }
      }
    }
  }, [selectedDate])

  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day)
    }

    return days
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
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
  }

  const formatDisplayDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  const formatSelectedDate = (dateString: string) => {
    if (!dateString) return formatDisplayDate(currentMonth)
    const parts = dateString.split('-')
    if (parts.length !== 3) return formatDisplayDate(currentMonth)
    const [year, month, day] = parts
    return `${day}/${month}/${year}`
  }

  const days = getDaysInMonth(currentMonth)

  const monthNames = editContribuicaoModal.calendarMonths[language]
  const currentMonthLabel = `${monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`
  const infoTextColor = 'text-gray-500'
  const highlightTextColor = 'text-gray-800'
  const selectedDateLabel = selectedDate
    ? formatSelectedDate(selectedDate)
    : t(editContribuicaoModal.calendarNoDateSelected)

  return (
    <div className={`rounded-lg shadow-lg p-4 border ${
      'bg-white border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-4 gap-4">
        <div>
          <p className={`text-lg font-semibold ${highlightTextColor}`}>
            {currentMonthLabel}
          </p>
          <p className={`text-xs mt-2 ${infoTextColor}`}>
            {t(editContribuicaoModal.calendarSelectedDateLabel)}: {selectedDateLabel}
          </p>
        </div>
        <div className="flex items-center gap-2 self-start">
          <button
            type="button"
            onClick={() => navigateMonth('prev')}
            className={`p-1 ${
              'text-gray-400 hover:text-gray-600'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => navigateMonth('next')}
            className={`p-1 ${
              'text-gray-400 hover:text-gray-600'
            }`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day, index) => (
          <div key={index} className={`text-center text-sm font-medium py-2 ${
            'text-gray-600'
          }`}>
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          if (!day) {
            return <div key={index} className="h-8"></div>
          }

          const currentDateString = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const isSelected = selectedDate === currentDateString

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
}

export default function EditContribuicaoModal({ isOpen, onClose, editItem, onDelete }: EditContribuicaoModalProps) {
  const { user } = useAuth()
  const userCurrency = user?.moeda || 'real'
  const { t } = useLanguage()
  
  const normalizeDateString = (dateString: string): string => {
    if (!dateString) return ''

    if (dateString.length === 10 && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) return dateString

    const date = new Date(dateString)
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    return dateString
  }

  const formatValueWithoutSymbol = useCallback((value: number) => {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }, [])

  const [valor, setValor] = useState(formatValueWithoutSymbol(Number(editItem.valor)))
  const [data, setData] = useState(normalizeDateString(editItem.data))
  const [observacao, setObservacao] = useState(editItem.observacao || '')
  const formRef = useRef<HTMLFormElement>(null)
  const [showError, setShowError] = useState(false)
  const [confirmDeleteMode, setConfirmDeleteMode] = useState(false)

  useEffect(() => {
    setValor(formatValueWithoutSymbol(Number(editItem.valor)))
    setData(normalizeDateString(editItem.data))
    setObservacao(editItem.observacao || '')
    setShowError(false)
    setConfirmDeleteMode(false)
  }, [editItem, userCurrency, formatValueWithoutSymbol])

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '')
    const number = parseInt(rawValue || '0', 10)
    
    if (!number) {
      setValor('')
      return
    }
    
    const float = number / 100
    setValor(float.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const cleanValor = valor.replace(/R\$\s*/g, '').replace(/\./g, '').replace(',', '.').trim()
      const numericValor = parseFloat(cleanValor)

      if (isNaN(numericValor) || numericValor < 0) {
        setShowError(true)
        setTimeout(() => setShowError(false), 3000)
        return
      }

      await contribuicaoMetaService.update(editItem.id, {
        valor: numericValor,
        data: data || undefined,
        observacao: observacao || undefined,
      })

      onClose()
    } catch (error) {
      console.error('Erro ao atualizar contribuição:', error)
      setShowError(true)
      setTimeout(() => setShowError(false), 3000)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/30 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className={`fixed right-0 top-0 h-full w-full max-w-md shadow-xl z-50 flex flex-col p-6 overflow-y-auto ${
              'bg-white text-gray-800'
            }`}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <AnimatePresence>
              {showError && (
                <motion.div
                  className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white px-6 py-4 rounded-lg shadow-2xl z-[60] flex items-center gap-3 ${
                    'bg-red-500'
                  }`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                >
                  <div className="w-6 h-6 border-2 border-white rounded-full flex items-center justify-center">
                    <X className="w-4 h-4" />
                  </div>
                  <span className="font-medium">{t(editContribuicaoModal.errorUpdating)}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-lg font-semibold ${
                'text-gray-800'
              }`}>{t(editContribuicaoModal.title)}</h2>
              <button onClick={onClose} className={'text-gray-500 hover:text-gray-700'}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  'text-gray-800'
                }`}>{t(common.value)}</label>
                <div className={`
                  flex items-center rounded-lg overflow-hidden
                  ${'bg-gray-50'}
                `}>
                  <span className={`
                    px-3 py-2 font-medium
                    ${'text-gray-600'}
                  `}>
                    {getCurrencySymbol(userCurrency)}
                  </span>
                  <input
                    type="text"
                    placeholder="0,00"
                    value={valor}
                    onChange={handleValueChange}
                    className={`
                      flex-1 px-3 py-2 outline-none transition bg-transparent
                      ${'text-gray-700 placeholder-gray-500 focus:ring-2 focus:ring-blue-500'}
                    `}
                    required
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  'text-gray-800'
                }`}>{t(common.date)}</label>
                <Calendar
                  selectedDate={data}
                  onDateSelect={setData}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  'text-gray-800'
                }`}>{t(common.description)}</label>
                <textarea
                  placeholder={t(common.description)}
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  className={`w-full rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none resize-none ${
                    'bg-gray-50 text-gray-700 placeholder-gray-500'
                  }`}
                  rows={3}
                />
              </div>

              {!confirmDeleteMode && (
                <button
                  type="submit"
                  className={`w-full mt-4 py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                    'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  <Save className="w-4 h-4" />
                  {t(common.save)} {t(editContribuicaoModal.contributionLabel)}
                </button>
              )}

              {onDelete && (
                <>
                  {confirmDeleteMode ? (
                    <div className="flex gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteMode(false)}
                        className={`flex-1 py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                          'bg-gray-500 hover:bg-gray-600 text-white'
                        }`}
                      >
                        <X className="w-4 h-4" />
                        {t(common.cancel)}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onDelete(editItem.id)
                          onClose()
                        }}
                        className={`flex-1 py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                          'bg-yellow-500 hover:bg-yellow-600 text-white'
                        }`}
                      >
                        <Trash className="w-4 h-4" />
                        {t(common.confirm)} {t(common.delete)}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteMode(true)}
                      className={`w-full mt-2 py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                        'bg-red-600 hover:bg-red-700 text-white'
                      }`}
                    >
                      <Trash className="w-4 h-4" />
                      {t(common.delete)}
                    </button>
                  )}
                </>
              )}
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
