'use client'

import { useState, useRef, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight, Save } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { metasService } from '@/services/metas.service'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency, getCurrencySymbol } from '@/app/terminology/currency'
import { useLanguage } from '@/app/terminology/LanguageContext'
import { addMetaModal } from '@/app/terminology/language/modals/addMeta'

interface AddMetaModalProps {
  isOpen: boolean
  onClose: () => void
}

interface MonthYearPickerProps {
  selectedDate: string
  onDateSelect: (date: string) => void
  minDate?: string
}

function MonthYearPicker({ selectedDate, onDateSelect, minDate}: MonthYearPickerProps) {
  const { t, language } = useLanguage()
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

  const months = addMetaModal.months[language]

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
    if (!dateString) return t(addMetaModal.selectMonthYear)
    const parts = dateString.split('-')
    if (parts.length !== 3) return t(addMetaModal.selectMonthYear)
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

export default function AddMetaModal({ isOpen, onClose }: AddMetaModalProps) {
  const { t } = useLanguage()
  const { user } = useAuth()
  const userCurrency = user?.moeda || 'real'
  
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [economiaMensal, setEconomiaMensal] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataAlvo, setDataAlvo] = useState('')
  const [goalType, setGoalType] = useState<'monthly' | 'deadline' | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const [showError, setShowError] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setNome('')
      setDescricao('')
      setValor('')
      setEconomiaMensal('')
      setDataInicio('')
      setDataAlvo('')
      setGoalType(null)
      setShowError(false)
    } else {
      const today = new Date()
      const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
      setDataInicio(todayString)
    }
  }, [isOpen])

  useEffect(() => {
    if (dataInicio && dataAlvo && goalType === 'deadline') {
      const inicioParts = dataInicio.split('-')
      const alvoParts = dataAlvo.split('-')
      
      if (inicioParts.length === 3 && alvoParts.length === 3) {
        const inicioDate = new Date(parseInt(inicioParts[0]), parseInt(inicioParts[1]) - 1, parseInt(inicioParts[2]))
        const alvoDate = new Date(parseInt(alvoParts[0]), parseInt(alvoParts[1]) - 1, parseInt(alvoParts[2]))
        
        inicioDate.setHours(0, 0, 0, 0)
        alvoDate.setHours(0, 0, 0, 0)
        
        if (alvoDate < inicioDate) {
          setDataAlvo('')
        }
      }
    }
  }, [dataInicio, dataAlvo, goalType])

  const handleGoalTypeChange = (type: 'monthly' | 'deadline') => {
    setGoalType(type)
    if (type === 'monthly') {
      setDataAlvo('')
    } else {
      setEconomiaMensal('')
    }
  }

  const calculateMonthsNeeded = (): number | null => {
    if (goalType !== 'monthly' || !valor || !economiaMensal) return null
    
    const cleanValor = valor.replace(/R\$\s*/g, '').replace(/\./g, '').replace(',', '.').trim()
    const numericValor = parseFloat(cleanValor)
    
    const cleanEconomiaMensal = economiaMensal.replace(/R\$\s*/g, '').replace(/\./g, '').replace(',', '.').trim()
    const numericEconomiaMensal = parseFloat(cleanEconomiaMensal)
    
    if (isNaN(numericValor) || numericValor <= 0 || isNaN(numericEconomiaMensal) || numericEconomiaMensal <= 0) {
      return null
    }
    
    return Math.ceil(numericValor / numericEconomiaMensal)
  }

  const calculateMonthlySavingsNeeded = (): number | null => {
    if (goalType !== 'deadline' || !valor || !dataInicio || !dataAlvo) return null
    
    const cleanValor = valor.replace(/R\$\s*/g, '').replace(/\./g, '').replace(',', '.').trim()
    const numericValor = parseFloat(cleanValor)
    
    if (isNaN(numericValor) || numericValor <= 0) return null
    
    const inicioParts = dataInicio.split('-')
    const alvoParts = dataAlvo.split('-')
    
    if (inicioParts.length !== 3 || alvoParts.length !== 3) return null
    
    const inicioDate = new Date(parseInt(inicioParts[0]), parseInt(inicioParts[1]) - 1, parseInt(inicioParts[2]))
    const alvoDate = new Date(parseInt(alvoParts[0]), parseInt(alvoParts[1]) - 1, parseInt(alvoParts[2]))
    
    if (isNaN(inicioDate.getTime()) || isNaN(alvoDate.getTime())) return null
    
    const monthsDiff = (alvoDate.getFullYear() - inicioDate.getFullYear()) * 12 + 
                       (alvoDate.getMonth() - inicioDate.getMonth())
    
    if (monthsDiff <= 0) return null
    
    return numericValor / monthsDiff
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
      const cleanValor = valor.replace(/R\$\s*/g, '').replace(/\./g, '').replace(',', '.').trim()
      const numericValor = parseFloat(cleanValor)

      const cleanEconomiaMensal = economiaMensal ? economiaMensal.replace(/R\$\s*/g, '').replace(/\./g, '').replace(',', '.').trim() : '0'
      const numericEconomiaMensal = parseFloat(cleanEconomiaMensal)

      if (isNaN(numericValor) || numericValor <= 0) {
        setShowError(true)
        setTimeout(() => setShowError(false), 3000)
        return
      }

      if (goalType === 'monthly' && (!economiaMensal || numericEconomiaMensal <= 0)) {
        setShowError(true)
        setTimeout(() => setShowError(false), 3000)
        return
      }

      if (goalType === 'deadline' && !dataAlvo) {
        setShowError(true)
        setTimeout(() => setShowError(false), 3000)
        return
      }

      let economiaMensalToSave: number | undefined = undefined

      if (goalType === 'monthly' && numericEconomiaMensal > 0) {
        economiaMensalToSave = numericEconomiaMensal
      } else if (goalType === 'deadline' && dataAlvo) {
        const calculatedSavings = calculateMonthlySavingsNeeded()
        if (calculatedSavings !== null && calculatedSavings > 0) {
          economiaMensalToSave = calculatedSavings
        }
      }

      await metasService.create({
        nome,
        descricao: descricao || undefined,
        valor: numericValor,
        economia_mensal: economiaMensalToSave,
        data_inicio: dataInicio || undefined,
        data_alvo: goalType === 'deadline' && dataAlvo ? dataAlvo : undefined,
      })

      onClose()
    } catch (error) {
      console.error('Erro ao criar meta:', error)
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
                  <span className="font-medium">{t(addMetaModal.error)}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-lg font-semibold ${
                'text-gray-800'
              }`}>{t(addMetaModal.title)}</h2>
              <button onClick={onClose} className={'text-gray-500 hover:text-gray-700'}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* RF06 - O sistema deve permitir ao usuário manter Metas, podendo definir os campos: nome, valor, Economia mensal (opcional), data de início (opcional) e data final (opcional). */}
            <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  'text-gray-800'
                }`}>{t(addMetaModal.name)}</label>
                <input
                  type="text"
                  placeholder={t(addMetaModal.namePlaceholder)}
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className={`w-full rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none ${
                    'bg-gray-50 text-gray-700 placeholder-gray-500'
                  }`}
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  'text-gray-800'
                }`}>{t(addMetaModal.description)}</label>
                <textarea
                  placeholder={t(addMetaModal.descriptionPlaceholder)}
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className={`w-full rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none resize-none ${
                    'bg-gray-50 text-gray-700 placeholder-gray-500'
                  }`}
                  rows={3}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  'text-gray-800'
                }`}>{t(addMetaModal.totalValue)}</label>
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
                    onChange={(e) => handleValueChange(e, setValor)}
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
                }`}>{t(addMetaModal.defineGoalBy)}</label>
                <div className="flex gap-4">
                  {/* RN16 - O sistema deve permitir ao usuário definir a meta por Economia mensal (ele escolhe o valor-alvo de economia mensal) ou Data final (ele escolhe a data em que pretende alcançar o objetivo e o sistema calcula quanto será o valor-alvo necessário para alcançar a Meta nesse intervalo). */}
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
                    }`}>{t(addMetaModal.monthlySavings)}</span>
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
                    }`}>{t(addMetaModal.deadline)}</span>
                  </label>
                </div>
                {goalType === 'monthly' && (() => {
                  const months = calculateMonthsNeeded()
                  return months !== null ? (
                    <p className="mt-3 text-sm font-bold text-blue-600">
                      {t(addMetaModal.monthsNeeded)
                        .replace('{months}', months.toString())
                        .replace('{monthLabel}', months === 1 ? t(addMetaModal.monthSingular) : t(addMetaModal.monthPlural))}
                    </p>
                  ) : null
                })()}
                {goalType === 'deadline' && (() => {
                  const monthlySavings = calculateMonthlySavingsNeeded()
                  return monthlySavings !== null ? (
                    <p className="mt-3 text-sm font-bold text-blue-600">
                      {t(addMetaModal.monthlySavingsNeeded).replace('{amount}', formatCurrency(monthlySavings, userCurrency))}
                    </p>
                  ) : null
                })()}
                {goalType === 'monthly' && (
                <div>
                  <label className={`block text-sm font-medium mt-3 mb-1 ${
                    'text-gray-800'
                  }`}>{t(addMetaModal.monthlySavings)}</label>
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
                      value={economiaMensal}
                      onChange={(e) => handleValueChange(e, setEconomiaMensal)}
                      className={`
                        flex-1 px-3 py-2 outline-none transition bg-transparent
                        ${'text-gray-700 placeholder-gray-500 focus:ring-2 focus:ring-blue-500'}
                      `}
                      required
                    />
                  </div>
                </div>
              )}
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  'text-gray-800'
                }`}>{t(addMetaModal.startDate)}</label>
                <MonthYearPicker
                  selectedDate={dataInicio}
                  onDateSelect={setDataInicio}
                />
              </div>

              {goalType === 'deadline' && (
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    'text-gray-800'
                  }`}>{t(addMetaModal.endDate)}</label>
                  <MonthYearPicker
                    selectedDate={dataAlvo}
                    onDateSelect={setDataAlvo}
                    minDate={dataInicio}
                  />
                </div>
              )}

              <button
                type="submit"
                className={`w-full mt-4 py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                  'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <Save className="w-4 h-4" />
                {t(addMetaModal.saveGoal)}
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
