'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight, Save, Trash, Pencil } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { ExpenseCategory, IncomeSource } from '@/types'
import { expenseCategoryService } from '@/services/categories.service'
import { incomeSourcesService } from '@/services/income-sources.service'
import { expensesService } from '@/services/expenses.service'
import { incomesService } from '@/services/incomes.service'
import { expenseExclusionService } from '@/services/expense-exclusion.service'
import { incomeExclusionService } from '@/services/income-exclusion.service'
import { getCurrencySymbol } from "@/app/terminology/currency";
import { Currency } from "@/types/auth";
import { useLanguage } from '@/app/terminology/LanguageContext';
import { editDashboardModal } from '@/app/terminology/language/modals/editDashboard';
import { common } from '@/app/terminology/language/common';
import { addDashboardModal } from '@/app/terminology/language/modals/addDashboard';

interface EditExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'expenses' | 'incomes'
  editItem: {
    id: string
    name: string
    category: string
    value: string
    recurring: boolean
    date: string
    originalId?: number
    displayMonth?: string
    categoryId?: number
  }
  onDelete?: (id: string) => void
  moeda: Currency
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

  const monthNames = editDashboardModal.calendarMonths[language]
  const currentMonthLabel = `${monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`
  const infoTextColor = 'text-gray-500'
  const highlightTextColor = 'text-gray-800'
  const selectedDateLabel = selectedDate
    ? formatSelectedDate(selectedDate)
    : t(editDashboardModal.calendarNoDateSelected)

  return (
    <div className={`${'bg-white border-gray-200 text-gray-800'} rounded-lg shadow-lg p-4 border`}>
      <div className="flex items-center justify-between mb-4 gap-4">
        <div>
          <p className={`text-lg font-semibold ${highlightTextColor}`}>
            {currentMonthLabel}
          </p>
          <p className={`text-xs mt-2 ${infoTextColor}`}>
            {t(editDashboardModal.calendarSelectedDateLabel)}: {selectedDateLabel}
          </p>
        </div>
        <div className="flex items-center gap-2 self-start">
          <button
            type="button"
            onClick={() => navigateMonth('prev')}
            className={`${'text-gray-400 hover:text-gray-600'} p-1 rounded`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => navigateMonth('next')}
            className={`${'text-gray-400 hover:text-gray-600'} p-1 rounded`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day, index) => (
          <div key={index} className={`${'text-gray-600'} text-center text-sm font-medium py-2`}>
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
                  : `${'text-gray-700 hover:bg-gray-100'}`
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

export default function EditExpenseModal({ isOpen, onClose, type, editItem, onDelete, moeda }: EditExpenseModalProps) {
  const { t } = useLanguage();

  const formatValueWithoutSymbol = useCallback((valueString: string) => {
    const cleanValue = valueString
      .replace(/US\$|R\$|€|\$/g, '')
      .replace(/\s/g, '')
      .replace(/\./g, '')
      .replace(',', '.')
      .trim()
    
    const numericValue = parseFloat(cleanValue)
    if (isNaN(numericValue)) return ''
    
    return numericValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }, [])

  const [name, setName] = useState(editItem.name)
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | string>(editItem.categoryId ?? '')
  const [value, setValue] = useState(formatValueWithoutSymbol(editItem.value))
  const [recurring, setRecurring] = useState(editItem.recurring)
  const [date, setDate] = useState(editItem.date)
  const [dueDate, setDueDate] = useState('')
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [sources, setSources] = useState<IncomeSource[]>([])
  const formRef = useRef<HTMLFormElement>(null)
  const [dateError, setDateError] = useState(false)
  const [showError, setShowError] = useState(false)
  const [confirmDeleteMode, setConfirmDeleteMode] = useState(false)
  const [confirmEditAllMode, setConfirmEditAllMode] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setName(editItem.name)
      setSelectedCategoryId(editItem.categoryId ?? '')
      setValue(formatValueWithoutSymbol(editItem.value))
      setRecurring(editItem.recurring)
      setDate(editItem.date)
      setDateError(false)
      setShowError(false)
      setConfirmDeleteMode(false)
      setConfirmEditAllMode(false)
    } else {
      setDueDate('')
    }
  }, [editItem, formatValueWithoutSymbol, isOpen])

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

    const fetchEntryData = async () => {
      try {
        if (type === 'expenses') {
          const entry = await expensesService.getById(Number(editItem.id))
          if (entry.due_date) {
            const dateOnly = entry.due_date.split('T')[0]
            setDueDate(dateOnly)
          }
        } else {
          const entry = await incomesService.getById(Number(editItem.id))
          if (entry.due_date) {
            const dateOnly = entry.due_date.split('T')[0]
            setDueDate(dateOnly)
          }
        }
      } catch (error) {
        console.error('Error fetching entry data:', error)
      }
    }

    if (isOpen) {
      fetchOptions()
      fetchEntryData()
    }
  }, [isOpen, type, editItem.category, editItem.id])

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
  
    const number = parseInt(rawValue || "0", 10);
  
    if (!number) {
      setValue("");
      return;
    }
  
    const float = number / 100;
    setValue(float.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  };

  const handleEditThisOccurrence = async (e: React.FormEvent) => {
    e.preventDefault()

    if (date === '') {
      setDateError(true);
      return
    }

    try {
      const symbol = getCurrencySymbol(moeda);
      const cleanValue = value
        .replace(symbol, '')           
        .replace(/\s*/g, '')
        .replace(/\./g, '')
        .replace(',', '.')
        .trim();
      const numericValue = parseFloat(cleanValue);

      if (isNaN(numericValue) || numericValue <= 0) {
        setShowError(true)
        setTimeout(() => setShowError(false), 3000)
        return
      }

      if (editItem.originalId && editItem.displayMonth) {
        const [month, year] = editItem.displayMonth.split('-')
        const exclusionDate = `${year}-${month}-01`
        
        if (type === 'expenses') {
          await expenseExclusionService.create(editItem.originalId, exclusionDate)
          const categoryId = selectedCategoryId === '' ? null : Number(selectedCategoryId)
          await expensesService.create({
            name,
            value: numericValue,
            recurring: false,
            date: date,
            due_date: undefined,
            expense_category_id: categoryId as number
          })
        } else {
          await incomeExclusionService.create(editItem.originalId, exclusionDate)
          const sourceId = selectedCategoryId === '' ? null : Number(selectedCategoryId)
          await incomesService.create({
            name,
            value: numericValue,
            recurring: false,
            date: date,
            due_date: undefined,
            income_source_id: sourceId as number
          })
        }
      }

      onClose()
    } catch (error) {
      console.error('Error updating:', error)
      setShowError(true)
      setTimeout(() => setShowError(false), 3000)
    }
  }

  const handleEditAllOccurrences = async () => {
    if (date === '') {
      setDateError(true);
      return
    }

    try {
      const symbol = getCurrencySymbol(moeda);
      const cleanValue = value
        .replace(symbol, '')           
        .replace(/\s*/g, '')
        .replace(/\./g, '')
        .replace(',', '.')
        .trim();
      const numericValue = parseFloat(cleanValue);

      if (isNaN(numericValue) || numericValue <= 0) {
        setShowError(true)
        setTimeout(() => setShowError(false), 3000)
        return
      }

      if (type === 'expenses') {
        const categoryId = selectedCategoryId === '' ? null : Number(selectedCategoryId)
        await expensesService.update(Number(editItem.id), {
          name,
          value: numericValue,
          recurring: recurring,
          date: date,
          due_date: dueDate || undefined,
          expense_category_id: categoryId as unknown as number
        })
      } else {
        const sourceId = selectedCategoryId === '' ? null : Number(selectedCategoryId)
        await incomesService.update(Number(editItem.id), {
          name,
          value: numericValue,
          recurring: recurring,
          date: date,
          due_date: dueDate || undefined,
          income_source_id: sourceId as unknown as number
        })
      }

      onClose()
    } catch (error) {
      console.error('Error updating:', error)
      setShowError(true)
      setTimeout(() => setShowError(false), 3000)
    }
  }

  const handleDeleteThisMonth = async () => {
    try {
      if (editItem.originalId && editItem.displayMonth) {
        const [month, year] = editItem.displayMonth.split('-')
        const exclusionDate = `${year}-${month}-01`
        
        if (type === 'expenses') {
          await expenseExclusionService.create(editItem.originalId, exclusionDate)
        } else {
          await incomeExclusionService.create(editItem.originalId, exclusionDate)
        }
      }
      onClose()
    } catch (error) {
      console.error('Error excluding month:', error)
      setShowError(true)
      setTimeout(() => setShowError(false), 3000)
    }
  }

  const handleDeleteAll = async () => {
    try {
      if (onDelete) {
        onDelete(editItem.id)
      }
      onClose()
    } catch (error) {
      console.error('Error deleting all:', error)
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
            className={`fixed right-0 top-0 h-full w-full max-w-md ${'bg-white text-gray-800'} shadow-xl z-50 flex flex-col p-6 overflow-y-auto`}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <AnimatePresence>
              {showError && (
                <motion.div
                  className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-500 text-white px-6 py-4 rounded-lg shadow-2xl z-[60] flex items-center gap-3"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                >
                  <div className="w-6 h-6 border-2 border-white rounded-full flex items-center justify-center">
                    <X className="w-4 h-4" />
                  </div>
                  <span className="font-medium">{t(type === 'expenses' ? editDashboardModal.errorUpdating : editDashboardModal.errorUpdating)}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-lg font-semibold ${'text-gray-800'}`}>
                {t(type === 'expenses' ? editDashboardModal.editExpenseTitle : editDashboardModal.editIncomeTitle)}
              </h2>
              <button onClick={onClose} className={`${'text-gray-500 hover:text-gray-700'} p-1 rounded`}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form ref={formRef} onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-5">
              <div>
                <label className={`block text-sm font-medium mb-1 ${'text-gray-800'}`}>{t(common.name)}</label>
                <input
                  type="text"
                  placeholder={t(common.name)}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full ${'bg-gray-50 text-gray-700 placeholder-gray-500'} rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none`}
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${'text-gray-800'}`}>
                  {t(type === 'expenses' ? common.category : common.source)}
                </label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className={`w-full ${'bg-gray-50 text-gray-700'} rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none`}
                >
                  <option value="">{t(type === 'expenses' ? common.noCategory : common.noSource)}</option>
                  {type === 'expenses'
                    ? categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))
                    : sources.map((src) => (
                        <option key={src.id} value={src.id}>
                          {src.name}
                        </option>
                      ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${'text-gray-800'}`}>{t(common.value)}</label>
                <div className="flex items-center gap-4">
                  <div className={`
                    w-1/2 flex items-center rounded-lg overflow-hidden
                    ${'bg-gray-50'}
                  `}>
                    <span className={`
                      px-3 py-2 font-medium
                      ${'text-gray-600'}
                    `}>
                      {getCurrencySymbol(moeda)}
                    </span>
                    <input
                      type="text"
                      placeholder="0,00"
                      value={value}
                      onChange={handleValueChange}
                      className={`
                        flex-1 px-3 py-2 outline-none transition bg-transparent
                        ${'text-gray-700 placeholder-gray-500 focus:ring-2 focus:ring-blue-500'}
                      `}
                      required
                    />
                  </div>
                  <label className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${'text-gray-700'}`}>{t(addDashboardModal.isRecurring)}</span>
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-blue-600"
                      checked={recurring}
                      onChange={(e) => setRecurring(e.target.checked)}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${'text-gray-800'}`}>{t(common.date)}</label>
                <Calendar
                  selectedDate={date}
                  onDateSelect={setDate}
                />
                {dateError && <p className="text-xs text-red-500 mt-1">{t(common.date)}</p>}
              </div>

              {recurring && (
                <div>
                  <label className={`block text-sm font-medium mb-1 ${'text-gray-800'}`}>{t(addDashboardModal.endDate)}</label>
                  <Calendar
                    selectedDate={dueDate}
                    onDateSelect={setDueDate}
                  />
                </div>
              )}

              {!confirmDeleteMode && !confirmEditAllMode && (
                <>
                  {editItem.recurring ? (
                    <div className="flex flex-col gap-2">
                      <button
                        type="submit"
                        onClick={(e) => {
                          e.preventDefault()
                          handleEditThisOccurrence(e)
                        }}
                        className={`w-full py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 ${'bg-blue-600 hover:bg-blue-700 text-white'}`}
                      >
                        <Pencil className="w-4 h-4" />
                        {t(editDashboardModal.editSingle)}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmEditAllMode(true)}
                        className={`w-full py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 ${'bg-purple-600 hover:bg-purple-700 text-white'}`}
                      >
                        <Save className="w-4 h-4" />
                        {t(editDashboardModal.editAll)}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="submit"
                      onClick={(e) => {
                        e.preventDefault()
                        handleEditAllOccurrences()
                      }}
                      className={`w-full py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 ${'bg-blue-600 hover:bg-blue-700 text-white'}`}
                    >
                      <Save className="w-4 h-4" />
                      {t(common.save)} {type === 'expenses' ? t(common.expenses).toLowerCase() : t(common.income).toLowerCase()}
                    </button>
                  )}
                </>
              )}

              {confirmEditAllMode && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmEditAllMode(false)}
                    className={`flex-1 py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 ${'bg-gray-500 text-white hover:bg-gray-600'}`}
                  >
                    <X className="w-4 h-4" />
                    {t(common.cancel)}
                  </button>
                  <button
                    type="button"
                    onClick={handleEditAllOccurrences}
                    className={`flex-1 py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 ${'bg-blue-600 text-white hover:bg-blue-700'}`}
                  >
                    <Save className="w-4 h-4" />
                    {t(common.confirm)}
                  </button>
                </div>
              )}

              {onDelete && (
                <>
                  {confirmDeleteMode ? (
                    editItem.recurring ? (
                      <div className="flex flex-col gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteMode(false)}
                          className={`w-full py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 ${'bg-gray-500 text-white hover:bg-gray-600'}`}
                        >
                          <X className="w-4 h-4" />
                          {t(common.cancel)}
                        </button>
                        <button
                          type="button"
                          onClick={handleDeleteThisMonth}
                          className={`w-full py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 ${'bg-orange-500 text-white hover:bg-orange-600'}`}
                        >
                          <Trash className="w-4 h-4" />
                          {t(editDashboardModal.excludeSingle)}
                        </button>
                        <button
                          type="button"
                          onClick={handleDeleteAll}
                          className={`w-full py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 ${'bg-red-600 text-white hover:bg-red-700'}`}
                        >
                          <Trash className="w-4 h-4" />
                          {t(editDashboardModal.excludeAll)}
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteMode(false)}
                          className={`flex-1 py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 ${'bg-gray-500 text-white hover:bg-gray-600'}`}
                        >
                          <X className="w-4 h-4" />
                          {t(common.cancel)}
                        </button>
                        <button
                          type="button"
                          onClick={handleDeleteAll}
                          className={`flex-1 py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 ${'bg-yellow-500 text-white hover:bg-yellow-600'}`}
                        >
                          <Trash className="w-4 h-4" />
                          {t(common.confirm)}
                        </button>
                      </div>
                    )
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteMode(true)}
                      className={`w-full mt-2 py-2 rounded-lg transition flex items-center justify-center gap-2 ${'bg-red-600 text-white hover:bg-red-700'}`}
                    >
                      <Trash className="w-4 h-4" />
                      {t(common.delete)} {type === 'expenses' ? t(common.expenses).toLowerCase() : t(common.income).toLowerCase()}
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
