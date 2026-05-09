'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight, Save, Trash } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { goalsService } from '@/services/goals.service'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency, getCurrencySymbol } from '@/app/terminology/currency'
import { useLanguage } from '@/app/terminology/LanguageContext'
import { editGoalModal } from '@/app/terminology/language/modals/editGoal'

interface EditGoalModalProps {
  isOpen: boolean
  onClose: () => void
  editItem: {
    id: number
    name: string
    description?: string
    value: number
    monthly_savings?: number
    start_date: string
    target_date?: string
  }
  onDelete?: (id: number) => void
}

interface MonthYearPickerProps {
  selectedDate: string
  onDateSelect: (date: string) => void
  minDate?: string
}

function MonthYearPicker({ selectedDate, onDateSelect, minDate}: MonthYearPickerProps) {
  const { t } = useLanguage()
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())

  useEffect(() => {
    if (selectedDate) {
      const selectedDateParts = selectedDate.split('-')
      if (selectedDateParts.length === 3) {
        const selectedYear = parseInt(selectedDateParts[0], 10)
        if (!isNaN(selectedYear)) {
          setCurrentYear(selectedYear)
        }
      }
    }
  }, [selectedDate])

  const months = [
    t(editGoalModal.january),
    t(editGoalModal.february),
    t(editGoalModal.march),
    t(editGoalModal.april),
    t(editGoalModal.may),
    t(editGoalModal.june),
    t(editGoalModal.july),
    t(editGoalModal.august),
    t(editGoalModal.september),
    t(editGoalModal.october),
    t(editGoalModal.november),
    t(editGoalModal.december)
  ]

  const navigateYear = (direction: 'prev' | 'next') => {
    setCurrentYear(prev => direction === 'prev' ? prev - 1 : prev + 1)
  }

  const isMonthBeforeMinDate = (year: number, month: number): boolean => {
    if (!minDate) return false

    const minDateParts = minDate.split('-')
    if (minDateParts.length !== 3) return false

    const minYear = parseInt(minDateParts[0])
    const minMonth = parseInt(minDateParts[1])

    if (year < minYear) return true
    if (year === minYear && month < minMonth) return true

    return false
  }

  const handleMonthClick = (monthIndex: number) => {
    if (isMonthBeforeMinDate(currentYear, monthIndex + 1)) {
      return
    }

    const dateString = `${currentYear}-${String(monthIndex + 1).padStart(2, '0')}-01`
    onDateSelect(dateString)
  }

  const formatSelectedDate = (dateString: string) => {
    if (!dateString) return t(editGoalModal.selectMonthYear)
    const parts = dateString.split('-')
    if (parts.length !== 3) return t(editGoalModal.selectMonthYear)
    const [year, month] = parts
    const monthIndex = parseInt(month) - 1
    return `${months[monthIndex]} ${year}`
  }

  const getSelectedMonth = () => {
    if (!selectedDate) return -1
    const parts = selectedDate.split('-')
    if (parts.length !== 3) return -1
    const [year, month] = parts
    if (parseInt(year) === currentYear) {
      return parseInt(month) - 1
    }
    return -1
  }

  const selectedMonth = getSelectedMonth()

  return (
    <div className={`rounded-lg shadow-lg p-4 border ${
      'bg-white border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <span className={`text-lg font-medium ${
          'text-gray-800'
        }`}>
          {formatSelectedDate(selectedDate)}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigateYear('prev')}
            className={`p-1 ${
              'text-gray-400 hover:text-gray-600'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className={`text-sm font-medium min-w-[60px] text-center ${
            'text-gray-600'
          }`}>
            {currentYear}
          </span>
          <button
            type="button"
            onClick={() => navigateYear('next')}
            className={`p-1 ${
              'text-gray-400 hover:text-gray-600'
            }`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {months.map((month, index) => {
          const isSelected = selectedMonth === index
          const isDisabled = isMonthBeforeMinDate(currentYear, index + 1)

          return (
            <button
              key={index}
              type="button"
              onClick={() => handleMonthClick(index)}
              disabled={isDisabled}
              className={`py-2 px-3 text-sm rounded-lg transition-colors ${
                isDisabled
                  ? 'text-gray-300 cursor-not-allowed bg-gray-50'
                  : isSelected
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-gray-700 hover:bg-gray-100 font-medium'
              }`}
            >
              {month}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function EditGoalModal({ isOpen, onClose, editItem, onDelete }: EditGoalModalProps) {
  const { t } = useLanguage()
  const { user } = useAuth()
  const userCurrency = user?.currency || 'real'
  
  const normalizeDateString = (dateString: string): string => {
    if (!dateString) return ''

    if (dateString.length === 10 && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateString
    }

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

  const [name, setName] = useState(editItem.name)
  const [description, setDescription] = useState(editItem.description || '')
  const [value, setValue] = useState(formatValueWithoutSymbol(Number(editItem.value)))
  const [monthlySavings, setMonthlySavings] = useState('')
  const [startDate, setStartDate] = useState(normalizeDateString(editItem.start_date))
  const [targetDate, setTargetDate] = useState(normalizeDateString(editItem.target_date || ''))
  const [goalType, setGoalType] = useState<'monthly' | 'deadline' | null>(
    editItem.target_date ? 'deadline' : editItem.monthly_savings ? 'monthly' : null
  )
  const formRef = useRef<HTMLFormElement>(null)
  const [showError, setShowError] = useState(false)
  const [confirmDeleteMode, setConfirmDeleteMode] = useState(false)

  useEffect(() => {
    setName(editItem.name)
    setDescription(editItem.description || '')
    setValue(formatValueWithoutSymbol(Number(editItem.value)))
    setStartDate(normalizeDateString(editItem.start_date))
    setTargetDate(normalizeDateString(editItem.target_date || ''))
    setShowError(false)
    setConfirmDeleteMode(false)

    if (editItem.target_date) {
      setGoalType('deadline')
      setMonthlySavings('')
    } else if (editItem.monthly_savings) {
      setGoalType('monthly')
      setMonthlySavings(formatValueWithoutSymbol(Number(editItem.monthly_savings)))
    } else {
      setGoalType(null)
      setMonthlySavings('')
    }
  }, [editItem, userCurrency, formatValueWithoutSymbol])

  useEffect(() => {
    if (startDate && targetDate && goalType === 'deadline') {
      const startParts = startDate.split('-')
      const targetParts = targetDate.split('-')

      if (startParts.length === 3 && targetParts.length === 3) {
        const startDateObj = new Date(parseInt(startParts[0]), parseInt(startParts[1]) - 1, parseInt(startParts[2]))
        const targetDateObj = new Date(parseInt(targetParts[0]), parseInt(targetParts[1]) - 1, parseInt(targetParts[2]))

        startDateObj.setHours(0, 0, 0, 0)
        targetDateObj.setHours(0, 0, 0, 0)

        if (targetDateObj < startDateObj) {
          setTargetDate('')
        }
      }
    }
  }, [startDate, targetDate, goalType])

  const handleGoalTypeChange = (type: 'monthly' | 'deadline') => {
    setGoalType(type)
    if (type === 'monthly') {
      setTargetDate('')
    } else {
      setMonthlySavings('')
    }
  }

  const calculateMonthsNeeded = (): number | null => {
    if (goalType !== 'monthly' || !value || !monthlySavings) return null

    const cleanValue = value.replace(/R\$\s*/g, '').replace(/\./g, '').replace(',', '.').trim()
    const numericValue = parseFloat(cleanValue)

    const cleanMonthlySavings = monthlySavings.replace(/R\$\s*/g, '').replace(/\./g, '').replace(',', '.').trim()
    const numericMonthlySavings = parseFloat(cleanMonthlySavings)

    if (isNaN(numericValue) || numericValue <= 0 || isNaN(numericMonthlySavings) || numericMonthlySavings <= 0) {
      return null
    }

    return Math.ceil(numericValue / numericMonthlySavings)
  }

  const calculateMonthlySavingsNeeded = (): number | null => {
    if (goalType !== 'deadline' || !value || !startDate || !targetDate) return null

    const cleanValue = value.replace(/R\$\s*/g, '').replace(/\./g, '').replace(',', '.').trim()
    const numericValue = parseFloat(cleanValue)

    if (isNaN(numericValue) || numericValue <= 0) return null

    const startParts = startDate.split('-')
    const targetParts = targetDate.split('-')

    if (startParts.length !== 3 || targetParts.length !== 3) return null

    const startDateObj = new Date(parseInt(startParts[0]), parseInt(startParts[1]) - 1, parseInt(startParts[2]))
    const targetDateObj = new Date(parseInt(targetParts[0]), parseInt(targetParts[1]) - 1, parseInt(targetParts[2]))

    if (isNaN(startDateObj.getTime()) || isNaN(targetDateObj.getTime())) return null

    const monthsDiff = (targetDateObj.getFullYear() - startDateObj.getFullYear()) * 12 + (targetDateObj.getMonth() - startDateObj.getMonth())

    if (monthsDiff <= 0) return null

    return numericValue / monthsDiff
  }

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (value: string) => void) => {
    const rawValue = e.target.value.replace(/\D/g, '')
    const number = parseInt(rawValue || '0', 10)
    
    if (!number) {
      setter('')
      return
    }
    
    const float = number / 100
    setter(float.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const cleanValue = value.replace(/R\$\s*/g, '').replace(/\./g, '').replace(',', '.').trim()
      const numericValue = parseFloat(cleanValue)

      const cleanMonthlySavings = monthlySavings ? monthlySavings.replace(/R\$\s*/g, '').replace(/\./g, '').replace(',', '.').trim() : '0'
      const numericMonthlySavings = parseFloat(cleanMonthlySavings)

      if (isNaN(numericValue) || numericValue <= 0) {
        setShowError(true)
        setTimeout(() => setShowError(false), 3000)
        return
      }

      if (goalType === 'monthly' && (!monthlySavings || numericMonthlySavings <= 0)) {
        setShowError(true)
        setTimeout(() => setShowError(false), 3000)
        return
      }

      if (goalType === 'deadline' && !targetDate) {
        setShowError(true)
        setTimeout(() => setShowError(false), 3000)
        return
      }

      let monthlySavingsToSave: number | undefined = undefined

      if (goalType === 'monthly' && numericMonthlySavings > 0) {
        monthlySavingsToSave = numericMonthlySavings
      } else if (goalType === 'deadline' && targetDate) {
        const calculatedSavings = calculateMonthlySavingsNeeded()
        if (calculatedSavings !== null && calculatedSavings > 0) {
          monthlySavingsToSave = calculatedSavings
        }
      }

      await goalsService.update(editItem.id, {
        name,
        description: description || undefined,
        value: numericValue,
        monthly_savings: monthlySavingsToSave,
        start_date: startDate || undefined,
        target_date: goalType === 'deadline' && targetDate ? targetDate : undefined,
      })

      onClose()
    } catch (error) {
      console.error('Error updating goal:', error)
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
                  <span className="font-medium">{t(editGoalModal.error)}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-lg font-semibold ${
                'text-gray-800'
              }`}>{t(editGoalModal.title)}</h2>
              <button onClick={onClose} className={'text-gray-500 hover:text-gray-700'}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  'text-gray-800'
                }`}>{t(editGoalModal.name)}</label>
                <input
                  type="text"
                  placeholder={t(editGoalModal.namePlaceholder)}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none ${
                    'bg-gray-50 text-gray-700 placeholder-gray-500'
                  }`}
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  'text-gray-800'
                }`}>{t(editGoalModal.description)}</label>
                <textarea
                  placeholder={t(editGoalModal.descriptionPlaceholder)}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`w-full rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none resize-none ${
                    'bg-gray-50 text-gray-700 placeholder-gray-500'
                  }`}
                  rows={3}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  'text-gray-800'
                }`}>{t(editGoalModal.totalValue)}</label>
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
                    value={value}
                    onChange={(e) => handleValueChange(e, setValue)}
                    className={`
                      flex-1 px-3 py-2 outline-none transition bg-transparent
                      ${'text-gray-700 placeholder-gray-500 focus:ring-2 focus:ring-blue-500'}
                    `}
                    required
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-3 ${
                  'text-gray-800'
                }`}>{t(editGoalModal.defineGoalBy)}</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="goalType"
                      value="monthly"
                      checked={goalType === 'monthly'}
                      onChange={() => handleGoalTypeChange('monthly')}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className={`text-sm ${
                      'text-gray-700'
                    }`}>{t(editGoalModal.monthlySavings)}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="goalType"
                      value="deadline"
                      checked={goalType === 'deadline'}
                      onChange={() => handleGoalTypeChange('deadline')}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className={`text-sm ${
                      'text-gray-700'
                    }`}>{t(editGoalModal.deadline)}</span>
                  </label>
                </div>
                {goalType === 'monthly' && (() => {
                  const months = calculateMonthsNeeded()
                  return months !== null ? (
                    <p className="mt-3 text-sm font-bold text-blue-600">
                      {t(editGoalModal.willNeedMonths)} {months} {months === 1 ? t(editGoalModal.monthsNeeded) : t(editGoalModal.monthsNeededPlural)} {t(editGoalModal.toReachGoal)}
                    </p>
                  ) : null
                })()}
                {goalType === 'deadline' && (() => {
                  const monthlySavings = calculateMonthlySavingsNeeded()
                  return monthlySavings !== null ? (
                    <p className="mt-3 text-sm font-bold text-blue-600">
                      {t(editGoalModal.willNeedToSave)} {formatCurrency(monthlySavings, userCurrency)} {t(editGoalModal.perMonth)}
                    </p>
                  ) : null
                })()}
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  'text-gray-800'
                }`}>{t(editGoalModal.startDate)}</label>
                <MonthYearPicker
                  selectedDate={startDate}
                  onDateSelect={setStartDate}
                />
              </div>

              {goalType === 'monthly' && (
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    'text-gray-800'
                  }`}>{t(editGoalModal.monthlySavings)}</label>
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
                      value={monthlySavings}
                      onChange={(e) => handleValueChange(e, setMonthlySavings)}
                      className={`
                        flex-1 px-3 py-2 outline-none transition bg-transparent
                        ${'text-gray-700 placeholder-gray-500 focus:ring-2 focus:ring-blue-500'}
                      `}
                      required
                    />
                  </div>
                </div>
              )}

              {goalType === 'deadline' && (
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    'text-gray-800'
                  }`}>{t(editGoalModal.deadline)}</label>
                  <MonthYearPicker
                    selectedDate={targetDate}
                    onDateSelect={setTargetDate}
                    minDate={startDate}
                  />
                </div>
              )}

              {!confirmDeleteMode && (
                <button
                  type="submit"
                  className={`w-full mt-4 py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                    'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  <Save className="w-4 h-4" />
                  {t(editGoalModal.saveGoal)}
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
                        {t(editGoalModal.cancel)}
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
                        {t(editGoalModal.confirmDelete)}
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
                      {t(editGoalModal.deleteGoal)}
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
