'use client'

import { useState, useRef, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight, Save } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { ExpenseCategory, IncomeSource } from '@/types'
import { expenseCategoryService } from '@/services/categories.service'
import { incomeSourcesService } from '@/services/income-sources.service'
import { expensesService } from '@/services/expenses.service'
import { incomesService } from '@/services/incomes.service'
import { getCurrencySymbol } from "@/app/terminology/currency";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from '@/app/terminology/LanguageContext';
import { addDashboardModal } from '@/app/terminology/language/modals/addDashboard';
import { common } from '@/app/terminology/language/common';

interface AddExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'expenses' | 'incomes'
  defaultMonth?: string
}

interface CalendarProps {
  selectedDate: string
  onDateSelect: (date: string) => void
}

function Calendar({ selectedDate, onDateSelect }: CalendarProps) {
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
  
  const days = getDaysInMonth(currentMonth)
  
  const monthNames = addDashboardModal.calendarMonths[language]
  const currentMonthLabel = `${monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`
  const infoTextColor = 'text-gray-500'
  const highlightTextColor = 'text-gray-800'

  const formatSelectedDate = (value: string) => {
    const parts = value.split('-')
    if (parts.length !== 3) return value
    const [year, month, day] = parts
    return `${day}/${month}/${year}`
  }

  const selectedDateLabel = selectedDate
    ? formatSelectedDate(selectedDate)
    : t(addDashboardModal.calendarNoDateSelected)

  return (
    <div
      className={`
        rounded-lg p-4 border shadow-lg transition-colors
        ${'bg-white border-gray-200 text-gray-800'
        }
      `}
    >
      <div className="flex items-center justify-between mb-4 gap-4">
        <div>
          <p className={`text-lg font-semibold ${highlightTextColor}`}>
            {currentMonthLabel}
          </p>
          <p className={`text-xs mt-2 ${infoTextColor}`}>
            {t(addDashboardModal.calendarSelectedDateLabel)}: {selectedDateLabel}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start">
          <button
            type="button"
            onClick={() => navigateMonth('prev')}
            className={`
              p-1 rounded transition
              ${'text-gray-600 hover:bg-gray-100'}
            `}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => navigateMonth('next')}
            className={`
              p-1 rounded transition
              ${'text-gray-600 hover:bg-gray-100'}
            `}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day, index) => (
          <div key={index} className={`text-center text-sm font-medium ${
            'text-gray-600'
          }`}
          >
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

export default function AddExpenseModal({ isOpen, onClose, type, defaultMonth }: AddExpenseModalProps) {
  const { t } = useLanguage();
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [value, setValue] = useState('')
  const [recurring, setRecurring] = useState(false)
  const [date, setDate] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [sources, setSources] = useState<IncomeSource[]>([])
  const formRef = useRef<HTMLFormElement>(null)
  const [dateError, setDateError] = useState(false)
  const [showError, setShowError] = useState(false)
  const { user } = useAuth();
  const userCurrency = user?.currency || "real";

  useEffect(() => {
    if (!isOpen) {
      setName('')
      setCategory('')
      setValue('')
      setRecurring(false)
      setDate('')
      setDueDate('')
      setDateError(false)
      setShowError(false)
    } else if (defaultMonth) {
      const [month, year] = defaultMonth.split('-')
      const today = new Date()
      const isCurrentMonth = parseInt(month) === today.getMonth() + 1 && parseInt(year) === today.getFullYear()
      const day = isCurrentMonth ? String(today.getDate()).padStart(2, '0') : '01'
      setDate(`${year}-${month}-${day}`)
    }
  }, [isOpen, defaultMonth])

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        if (type === 'expenses') {
          const data = await expenseCategoryService.getAll()
          setCategories(data)
        } else {
          const data = await incomeSourcesService.getAll()
          setSources(data)
        }
      } catch (error) {
        console.error('Error fetching options:', error)
      }
    }

    if (isOpen) {
      fetchOptions()
    }
  }, [isOpen, type])

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    const number = parseInt(raw || "0", 10);
  
    if (!number) {
      setValue("");
      return;
    }
  
    const float = number / 100;
    setValue(float.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (date === '') {
      setDateError(true);
      return
    }

    try {
      const cleaned = value.replace(/[^\d.,]/g, "");
      const normalized = cleaned.replace(/\./g, "").replace(",", ".");
      const numericValue = parseFloat(normalized);

      if (isNaN(numericValue)) {
        setShowError(true);
        setTimeout(() => setShowError(false), 3000);
        return;
      }

      if (type === 'expenses') {
        const categoryId = category ? categories.find((cat) => cat.name === category)?.id : undefined

        await expensesService.create({
          name,
          value: numericValue,
          recurring: recurring,
          date: date,
          due_date: dueDate || undefined,
          expense_category_id: categoryId
        })
      } else {
        const sourceId = category ? sources.find((src) => src.name === category)?.id : undefined

        await incomesService.create({
          name,
          value: numericValue,
          recurring: recurring,
          date: date,
          due_date: dueDate || undefined,
          income_source_id: sourceId
        })
      }

      onClose()
    } catch (error) {
      console.error('Error creating:', error)
      setShowError(true)
      setTimeout(() => setShowError(false), 3000)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/40 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className={`
              fixed right-0 top-0 h-full w-full max-w-md z-50 flex flex-col p-6
              overflow-y-auto shadow-xl transition-colors
              ${'bg-white text-gray-800'}
            `}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <AnimatePresence>
              {showError && (
                <motion.div
                  className={`
                    fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                    px-6 py-4 rounded-lg shadow-2xl z-[60] flex items-center gap-3
                    ${'bg-red-500 text-white'}
                  `}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                >
                  <div className="w-6 h-6 border-2 border-white rounded-full flex items-center justify-center">
                    <X className="w-4 h-4" />
                  </div>
                  <span className="font-medium">{t(addDashboardModal.errorAdding)}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">
                {type === 'expenses' ? t(addDashboardModal.addExpenseTitle) : t(addDashboardModal.addIncomeTitle)}
              </h2>
              <button
                className={'text-gray-500 hover:text-gray-700'}
                onClick={onClose}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label className="text-sm font-medium">{t(common.name)}</label>
                <input
                  type="text"
                  placeholder={t(addDashboardModal.namePlaceholder)}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`
                    w-full rounded-lg px-3 py-2 mt-1 outline-none transition
                    ${'bg-gray-50 text-gray-700 placeholder-gray-600 focus:ring-2 focus:ring-blue-500'}
                  `}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">
                  {type === 'expenses' ? t(addDashboardModal.category) : t(addDashboardModal.source)}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={`
                    w-full rounded-lg px-3 py-2 mt-1 outline-none transition
                    ${'bg-gray-50 text-gray-700 border border-gray-300 focus:ring-blue-500'}
                  `}
                >
                  <option value="">{type === 'expenses' ? t(addDashboardModal.selectCategory) : t(addDashboardModal.selectSource)}</option>
                  {type === 'expenses'
                    ? categories.map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.name}
                        </option>
                      ))
                    : sources.map((src) => (
                        <option key={src.id} value={src.name}>
                          {src.name}
                        </option>
                      ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium">{t(addDashboardModal.value)}</label>
                <div className="flex items-center gap-4">
                  <div className={`
                    w-1/2 mt-1 flex items-center rounded-lg overflow-hidden
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
                      onChange={handleValueChange}
                      className={`
                        flex-1 px-3 py-2 outline-none transition bg-transparent
                        ${'text-gray-700 placeholder-gray-600 focus:ring-2 focus:ring-blue-500'}
                      `}
                      required
                    />
                  </div>
                <label className="ml-4 text-sm flex items-center gap-2">
                  <span className={'text-gray-700'}>
                    {t(addDashboardModal.isRecurring)}
                  </span>
                    <input
                      type="checkbox"
                      checked={recurring}
                      onChange={(e) => setRecurring(e.target.checked)}
                    className="w-4 h-4 accent-blue-600"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">{t(addDashboardModal.date)}</label>
                <Calendar
                  selectedDate={date}
                  onDateSelect={setDate}
                />
                {dateError && <p className="text-xs text-red-500 mt-1">{t(addDashboardModal.dateRequired)}</p>}
              </div>

              {recurring && (
                <div>
                  <label className="text-sm font-medium">{t(addDashboardModal.endDate)}</label>
                  <Calendar
                    selectedDate={dueDate}
                    onDateSelect={setDueDate}
                  />
                </div>
              )}

              <button
                type="submit"
                className={`
                  w-full py-2 mt-4 rounded-lg font-medium flex items-center justify-center gap-2 transition
                  ${'bg-blue-600 hover:bg-blue-700 text-white'}
                `}
              >
                <Save className="w-4 h-4" />
                {t(common.save)} {type === 'expenses' ? t(common.expenses).toLowerCase() : t(common.income).toLowerCase()}
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
