'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Sidebar from '@/components/sidebar'
import AddGoalModal from '@/components/addGoalModal'
import AddContributionModal from '@/components/addContributionModal'
import EditGoalModal from '@/components/editGoalModal'
import EditContributionModal from '@/components/editContributionModal'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Plus, Target, Calendar, DollarSign, Search, ArrowUp, ArrowDown } from 'lucide-react'
import { Goal, GoalContribution, ExpenseExclusion, IncomeExclusion, Expense, Income } from '@/types'
import { goalsService, goalContributionService, incomesService, expensesService, expenseExclusionService, incomeExclusionService, ApiError } from '@/services'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency as formatMoney } from '@/app/terminology/currency'
import { useLanguage } from '@/app/terminology/LanguageContext'
import { goals as goalsTerms } from '@/app/terminology/language/goals'
import { common } from '@/app/terminology/language/common'

export default function GoalsPage() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [goals, setGoals] = useState<Goal[]>([])
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)
  const [contributions, setContributions] = useState<GoalContribution[]>([])
  const [isAddGoalModalOpen, setIsAddGoalModalOpen] = useState(false)
  const [isAddContributionModalOpen, setIsAddContributionModalOpen] = useState(false)
  const [isEditGoalModalOpen, setIsEditGoalModalOpen] = useState(false)
  const [isEditContributionModalOpen, setIsEditContributionModalOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [editingContribution, setEditingContribution] = useState<GoalContribution | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [averageIncome, setAverageIncome] = useState(0)
  const [averageExpenses, setAverageExpenses] = useState(0)

  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 4
  const [searchTerm, setSearchTerm] = useState('')
  const [minValue, setMinValue] = useState('')
  const [maxValue, setMaxValue] = useState('')
  const [sortColumn, setSortColumn] = useState<'target' | 'progress' | 'remaining'>('target')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  const filteredGoals = useMemo(() => {
    return goals.filter((goal) => {
      if (searchTerm && !goal.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false
      }
      
      const targetValue = Number(goal.value) || 0
      
      if (minValue) {
        const min = parseFloat(minValue) || 0
        if (targetValue < min) {
          return false
        }
      }
      
      if (maxValue) {
        const max = parseFloat(maxValue) || 0
        if (targetValue > max) {
          return false
        }
      }
      
      return true
    })
  }, [goals, searchTerm, minValue, maxValue])

  const sortedGoals = useMemo(() => {
    const sorted = [...filteredGoals]
    sorted.sort((a, b) => {
      let comparison = 0
      
      switch (sortColumn) {
        case 'target': {
          comparison = (Number(a.value) || 0) - (Number(b.value) || 0)
          break
        }
        case 'progress': {
          const valueA = Number(a.value) || 0
          const valueB = Number(b.value) || 0
          const currentValueA = Number(a.current_value) || 0
          const currentValueB = Number(b.current_value) || 0
          const progressA = valueA > 0 ? (currentValueA / valueA) * 100 : 0
          const progressB = valueB > 0 ? (currentValueB / valueB) * 100 : 0
          comparison = progressA - progressB
          break
        }
        case 'remaining': {
          const monthlySavingsA = Number(a.monthly_savings) || 0
          const monthlySavingsB = Number(b.monthly_savings) || 0
          const valueA = Number(a.value) || 0
          const valueB = Number(b.value) || 0
          const currentValueA = Number(a.current_value) || 0
          const currentValueB = Number(b.current_value) || 0
          const remainingA = valueA - currentValueA
          const remainingB = valueB - currentValueB
          
          let monthsA = Infinity
          let monthsB = Infinity
          
          if (monthlySavingsA > 0) {
            monthsA = Math.ceil(remainingA / monthlySavingsA)
          }
          if (monthlySavingsB > 0) {
            monthsB = Math.ceil(remainingB / monthlySavingsB)
          }
          
          comparison = monthsA - monthsB
          break
        }
      }
      
      return sortDirection === 'asc' ? comparison : -comparison
    })
    return sorted
  }, [filteredGoals, sortColumn, sortDirection])

  const totalPages = Math.ceil(sortedGoals.length / ITEMS_PER_PAGE)
  const paginatedGoals = sortedGoals.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, minValue, maxValue, sortColumn, sortDirection])

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const handleSort = (column: 'target' | 'progress' | 'remaining') => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const expandRecurringEntries = <T extends Expense | Income>(
    items: T[],
    selectedMonth: string,
    exclusions: (ExpenseExclusion | IncomeExclusion)[]
  ): T[] => {
    if (!selectedMonth) return items

    const [month, year] = selectedMonth.split('-')
    const targetDate = new Date(parseInt(year), parseInt(month) - 1, 1)

    const expandedItems: T[] = []

    items.forEach(item => {
      const itemStartDate = new Date(item.date)
      const itemStartYear = itemStartDate.getFullYear()
      const itemStartMonth = itemStartDate.getMonth()
      const startOfItemMonth = new Date(itemStartYear, itemStartMonth, 1)

      if (item.recurring) {
        const targetYear = targetDate.getFullYear()
        const targetMonth = targetDate.getMonth()
        const targetMonthStart = new Date(targetYear, targetMonth, 1)

        if (startOfItemMonth <= targetMonthStart) {
          let isWithinEndDate = true
          if (item.due_date) {
            const endDate = new Date(item.due_date)
            const endYear = endDate.getFullYear()
            const endMonth = endDate.getMonth()
            const endMonthStart = new Date(endYear, endMonth, 1)
            isWithinEndDate = targetMonthStart <= endMonthStart
          }

          if (isWithinEndDate) {
            const monthKey = `${year}-${month}-01`
            const isExcluded = exclusions.some(exc => {
              const isExpense = 'expense_id' in exc
              const itemId = isExpense ? (exc as ExpenseExclusion).expense_id : (exc as IncomeExclusion).income_id
              const excDate = new Date(exc.exclusion_date)
              const excYear = excDate.getFullYear()
              const excMonth = String(excDate.getMonth() + 1).padStart(2, '0')
              const excKey = `${excYear}-${excMonth}-01`

              return itemId === item.id && excKey === monthKey
            })

            if (!isExcluded) {
              const virtualEntry = { ...item }
              expandedItems.push(virtualEntry)
            }
          }
        }
      } else {
        const itemMonth = String(itemStartDate.getMonth() + 1).padStart(2, '0')
        const itemYear = itemStartDate.getFullYear().toString()
        if (itemMonth === month && itemYear === year) {
          expandedItems.push(item)
        }
      }
    })

    return expandedItems
  }

  const fetchData = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true)
      setError(null)
      const [goalsResponse, incomesResponse, expensesResponse, expenseExclusionsResponse, incomeExclusionsResponse] = await Promise.all([
        goalsService.getAll(1, 2000),
        incomesService.getAll(1, 2000),
        expensesService.getAll(1, 2000),
        expenseExclusionService.getAll(),
        incomeExclusionService.getAll()
      ])

      const goalsData = Array.isArray(goalsResponse)
        ? goalsResponse
        : (goalsResponse?.data || [])

      const incomesDataFetched = Array.isArray(incomesResponse)
        ? incomesResponse
        : (incomesResponse?.data || [])

      const expensesDataFetched = Array.isArray(expensesResponse)
        ? expensesResponse
        : (expensesResponse?.data || [])

      setGoals(goalsData)

      const now = new Date()
      let totalIncomesAccumulated = 0
      let totalExpensesAccumulated = 0

      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const year = date.getFullYear()
        const monthKey = `${month}-${year}`

        const monthExpenses = expandRecurringEntries(expensesDataFetched, monthKey, expenseExclusionsResponse)
        const monthIncomes = expandRecurringEntries(incomesDataFetched, monthKey, incomeExclusionsResponse)

        totalIncomesAccumulated += monthIncomes.reduce((sum, r) => sum + (Number(r.value) || 0), 0)
        totalExpensesAccumulated += monthExpenses.reduce((sum, d) => sum + (Number(d.value) || 0), 0)
      }

      setAverageIncome(totalIncomesAccumulated / 12)
      setAverageExpenses(totalExpensesAccumulated / 12)
    } catch (err) {
      const error = err as ApiError;
      if (error && (error.status === 401 || error.status === 403)) {
        setLoading(false);
        return;
      }
      console.error('Error fetching data:', err)
      setError(`${t(goalsTerms.errorLoadingGoals)}. ${t(common.checkConnection)}.`)
    } finally {
      setLoading(false)
    }
  }, [t, user])

  const fetchContributions = useCallback(async (goalId: number) => {
    try {
      const response = await goalContributionService.getAllByGoal(goalId, 1, 2000)
      const contributionsData = Array.isArray(response)
        ? response
        : (response?.data || [])
      setContributions(contributionsData)
    } catch (err) {
      console.error('Error fetching contributions:', err)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (goals.length > 0 && !selectedGoal) {
      setSelectedGoal(goals[0])
    }
  }, [goals, selectedGoal])

  useEffect(() => {
    if (selectedGoal) {
      fetchContributions(selectedGoal.id)
    }
  }, [selectedGoal, fetchContributions])

  const openAddGoalModal = () => setIsAddGoalModalOpen(true)
  const closeAddGoalModal = () => {
    setIsAddGoalModalOpen(false)
    fetchData()
  }

  const openAddContributionModal = () => setIsAddContributionModalOpen(true)
  const closeAddContributionModal = () => {
    setIsAddContributionModalOpen(false)
    if (selectedGoal) {
      fetchContributions(selectedGoal.id)
      fetchData()
    }
  }

  const openEditGoalModal = (goal: Goal) => {
    setEditingGoal(goal)
    setIsEditGoalModalOpen(true)
  }

  const closeEditGoalModal = () => {
    setIsEditGoalModalOpen(false)
    setEditingGoal(null)
    fetchData()
  }

  const openEditContributionModal = (contribution: GoalContribution) => {
    setEditingContribution(contribution)
    setIsEditContributionModalOpen(true)
  }

  const closeEditContributionModal = () => {
    setIsEditContributionModalOpen(false)
    setEditingContribution(null)
    if (selectedGoal) {
      fetchContributions(selectedGoal.id)
      fetchData()
    }
  }

  const handleDeleteGoal = async (id: number) => {
    try {
      await goalsService.delete(id)
      if (selectedGoal?.id === id) {
        setSelectedGoal(null)
      }
      fetchData()
    } catch (err) {
      console.error('Error deleting goal:', err)
    }
  }

  const handleDeleteContribution = async (id: number) => {
    try {
      await goalContributionService.delete(id)
      if (selectedGoal) {
        fetchContributions(selectedGoal.id)
        fetchData()
      }
    } catch (err) {
      console.error('Error deleting contribution:', err)
    }
  }

  const formatCurrency = (value: number) => {
    return formatMoney(value, user?.currency || "real")
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  const calculateProgress = (goal: Goal) => {
    const value = Number(goal.value) || 0
    const currentValue = Number(goal.current_value) || 0
    return value > 0 ? (currentValue / value) * 100 : 0
  }

  const calculateTimeRemaining = (goal: Goal) => {
    const monthlySavings = Number(goal.monthly_savings) || 0

    if (monthlySavings === 0) return '∞'

    const totalValue = Number(goal.value) || 0
    const currentValue = Number(goal.current_value) || 0
    const remaining = totalValue - currentValue

    if (remaining <= 0) return `0 ${t(goalsTerms.months)}`

    const monthsRemaining = Math.ceil(remaining / monthlySavings)
    return `${monthsRemaining} ${t(goalsTerms.months)}`
  }

  const allocationPercentage = useMemo(() => {
    if (averageIncome === 0) return 0
    const totalMonthlySavings = goals.reduce((sum, goal) => sum + (Number(goal.monthly_savings) || 0), 0)
    return (totalMonthlySavings / averageIncome) * 100
  }, [goals, averageIncome])

  const totalRequiredValue = useMemo(() => {
    return goals.reduce((sum, goal) => sum + (Number(goal.value) || 0), 0)
  }, [goals])

  if (loading) {
    return (
      <ProtectedRoute>
        <div className={`flex min-h-screen ${'bg-gray-50'}`}>
          <Sidebar />
          <main className={`flex-1 p-4 md:p-8 md:ml-64 flex items-center justify-center ${''}`}>
            <div className={'text-gray-500'}>{t(goalsTerms.loadingGoals)}</div>
          </main>
        </div>
      </ProtectedRoute>
    )
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className={`flex min-h-screen ${'bg-gray-50'}`}>
          <Sidebar />
          <main className={`flex-1 p-4 md:p-8 md:ml-64 flex items-center justify-center ${''}`}>
            <div className="text-red-500">{error}</div>
          </main>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className={`flex min-h-screen ${'bg-gray-50'}`}>
        <Sidebar />
        <main className={`flex-1 p-4 md:p-8 md:ml-64 ${''}`}>
          <header className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 md:mb-8 gap-4">
            <h1 className={`${'text-xl md:text-2xl font-semibold text-gray-800 text-center md:text-left'}`}>{t(goalsTerms.title)}</h1>
            <button
              onClick={openAddGoalModal}
              className="bg-blue-600 text-white px-4 py-2 font-bold rounded-md text-sm hover:bg-blue-700 transition w-full md:w-auto whitespace-nowrap flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {t(goalsTerms.addGoal)}
            </button>
          </header>

          <div className="flex flex-col xl:flex-row gap-4 md:gap-6">
            <div className="w-full xl:w-4/6 flex flex-col gap-4 md:gap-6">
              <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                <div className={`${'bg-white text-gray-800'} p-4 md:p-6 rounded-xl shadow-sm`}>
                  <div className="flex items-center gap-2 md:gap-3 mb-2">
                    <div className={`${'w-8 h-8 md:w-10 md:h-10 bg-yellow-100 rounded-full flex items-center justify-center'} flex-shrink-0`}>
                      <Target className="w-4 h-4 md:w-5 md:h-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className={`${'text-gray-500 text-xs md:text-sm'}`}>{t(goalsTerms.allocatedPercentage)}</p>
                      <p className={`${'text-lg md:text-2xl font-semibold'}`}>{allocationPercentage.toFixed(0)}%</p>
                    </div>
                  </div>
                </div>

                <div className={`${'bg-white text-gray-800'} p-4 md:p-6 rounded-xl shadow-sm`}>
                  <div className="flex items-center gap-2 md:gap-3 mb-2">
                    <div className={`${'w-8 h-8 md:w-10 md:h-10 bg-blue-100 rounded-full flex items-center justify-center'} flex-shrink-0`}>
                      <DollarSign className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className={`${'text-gray-500 text-xs md:text-sm'}`}>{t(goalsTerms.totalRequired)}</p>
                      <p className={`${'text-lg md:text-2xl font-semibold'}`}>{formatCurrency(totalRequiredValue)}</p>
                    </div>
                  </div>
                </div>
              </section>

              <section className={`${'bg-white text-gray-800'} p-4 md:p-6 rounded-xl shadow-sm`}>
                <h2 className={`${'text-base md:text-lg font-semibold text-gray-800 mb-4'}`}>{t(goalsTerms.title)}</h2>

                <div className={`mb-4 p-4 rounded-lg ${'bg-gray-50 border border-gray-200'}`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                    <div className="relative">
                      <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${'text-gray-500'}`} />
                      <input
                        type="text"
                        placeholder={t(common.search)}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`w-full pl-10 pr-3 py-2 text-sm rounded-md border ${
                          'bg-white border-gray-300 text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                        } focus:outline-none`}
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder={t(common.minValue)}
                        value={minValue}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^\d,.-]/g, '')
                          setMinValue(value)
                        }}
                        min="0"
                        step="0.01"
                        className={`w-full px-3 py-2 text-sm rounded-md border ${
                          'bg-white border-gray-300 text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                        } focus:outline-none`}
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder={t(common.maxValue)}
                        value={maxValue}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^\d,.-]/g, '')
                          setMaxValue(value)
                        }}
                        min="0"
                        step="0.01"
                        className={`w-full px-3 py-2 text-sm rounded-md border ${
                          'bg-white border-gray-300 text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                        } focus:outline-none`}
                      />
                    </div>
                  </div>
                </div>

                {sortedGoals.length === 0 ? (
                  <div className={`text-center py-12 ${'text-gray-500'}`}>
                    <Target className={`w-12 h-12 mx-auto mb-4 ${'text-gray-300'}`} />
                    <p>{t(goalsTerms.noGoalsYet)}</p>
                    <p className="text-sm mt-2">{t(goalsTerms.clickToAddGoal)}</p>
                  </div>
                ) : (
                  <>
                    <div className={`grid grid-cols-3 gap-4 text-sm mb-3 pb-2 border-b ${'border-gray-200'}`}>
                      <div 
                        className={`cursor-pointer hover:opacity-80 transition-opacity select-none flex items-center gap-1 ${'text-gray-500'} font-medium`}
                        onClick={(e) => { e.stopPropagation(); handleSort('target'); }}
                      >
                        {t(goalsTerms.targetValue)}
                        {sortColumn === 'target' && (
                          sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                        )}
                      </div>
                      <div 
                        className={`cursor-pointer hover:opacity-80 transition-opacity select-none flex items-center gap-1 ${'text-gray-500'} font-medium`}
                        onClick={(e) => { e.stopPropagation(); handleSort('progress'); }}
                      >
                        {t(goalsTerms.progress)}
                        {sortColumn === 'progress' && (
                          sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                        )}
                      </div>
                      <div 
                        className={`cursor-pointer hover:opacity-80 transition-opacity select-none flex items-center gap-1 ${'text-gray-500'} font-medium`}
                        onClick={(e) => { e.stopPropagation(); handleSort('remaining'); }}
                      >
                        {t(goalsTerms.remaining)}
                        {sortColumn === 'remaining' && (
                          sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                        )}
                      </div>
                    </div>
                    <div className="space-y-4">
                    {paginatedGoals.map((goal) => {
                      const progress = calculateProgress(goal)
                      const timeRemaining = calculateTimeRemaining(goal)

                      return (
                        <div
                          key={goal.id}
                          className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                            selectedGoal?.id === goal.id
                              ? 'border-blue-600 bg-blue-50'
                              : 'border-gray-200 hover:border-blue-300 bg-white'
                          }`}
                          onClick={() => openEditGoalModal(goal)}
                        >
                          <div className="flex gap-3 items-start mb-2">
                            <div className="flex items-start pt-1" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="radio"
                                name="goal-selection"
                                checked={selectedGoal?.id === goal.id}
                                onChange={() => setSelectedGoal(goal)}
                                className="w-4 h-4 text-blue-600 cursor-pointer"
                              />
                            </div>
                            <div className="flex justify-between items-start flex-1">
                              <div className="flex-1">
                                <h3 className={`font-semibold ${'text-gray-800'}`}>{goal.name}</h3>
                                {goal.description && (
                                  <p className={`text-sm mt-1 ${'text-gray-600'}`}>{goal.description}</p>
                                )}
                              </div>
                              <div className="text-right ml-4">
                                <p className={`text-sm ${'text-gray-500'}`}>
                                  {formatCurrency(Number(goal.monthly_savings) || 0)}/{t(goalsTerms.month)}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="ml-7">
                            <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                              <div>
                                <p className={'text-gray-500'}>{t(goalsTerms.targetValue)}</p>
                                <p className={`font-medium ${'text-gray-800'}`}>{formatCurrency(Number(goal.value) || 0)}</p>
                              </div>
                              <div>
                                <p className={'text-gray-500'}>{t(goalsTerms.progress)}</p>
                                <p className="font-medium text-green-600">{formatCurrency(Number(goal.current_value) || 0)}</p>
                              </div>
                              <div>
                                <p className={'text-gray-500'}>{t(goalsTerms.remaining)}</p>
                                <p className={`font-medium ${'text-gray-800'}`}>{timeRemaining}</p>
                              </div>
                            </div>

                            <div className={`w-full rounded-full h-2.5 ${'bg-gray-200'}`}>
                              <div
                                className="bg-blue-600 h-2.5 rounded-full transition-all"
                                style={{ width: `${Math.min(progress, 100)}%` }}
                              ></div>
                            </div>
                            <p className={`text-xs mt-1 text-right ${'text-gray-500'}`}>{progress.toFixed(1)}%</p>
                          </div>
                        </div>
                      )
                    })}

                    {totalPages > 1 && (
                      <div className="flex justify-center items-center gap-2 mt-4 pt-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); goToPage(currentPage - 1); }}
                          disabled={currentPage === 1}
                          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                            'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed'
                          }`}
                        >
                          {t(common.previous)}
                        </button>
                        <span className={`text-sm ${'text-gray-600'}`}>
                          {currentPage} {t(common.of)} {totalPages}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); goToPage(currentPage + 1); }}
                          disabled={currentPage === totalPages}
                          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                            'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed'
                          }`}
                        >
                          {t(common.next)}
                        </button>
                      </div>
                    )}
                  </div>
                  </>
                )}
              </section>
            </div>

            <div className="w-full xl:w-2/6 flex flex-col gap-4 md:gap-6">
              {selectedGoal ? (
                <section className={`${'bg-white text-gray-800'} p-4 md:p-6 rounded-xl shadow-sm`}>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className={`${'text-base md:text-lg font-semibold text-gray-800'}`}>{t(goalsTerms.contributions)}</h2>
                    <button
                      onClick={openAddContributionModal}
                      className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-blue-700 transition flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      {t(goalsTerms.addContribution)}
                    </button>
                  </div>

                  {contributions.length === 0 ? (
                    <div className={`text-center py-8 ${'text-gray-500'}`}>
                      <Calendar className={`w-10 h-10 mx-auto mb-3 ${'text-gray-300'}`} />
                      <p className="text-sm">{t(goalsTerms.noContributions)}</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto">
                      {contributions.map((contribution) => (
                        <div
                          key={contribution.id}
                          onClick={() => openEditContributionModal(contribution)}
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${
                            'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-blue-300'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <p className={`font-medium ${'text-gray-800'}`}>{formatCurrency(contribution.value)}</p>
                            <p className={`text-xs ${'text-gray-500'}`}>{formatDate(contribution.date)}</p>
                          </div>
                          {contribution.observation && (
                            <p className={`text-sm mt-1 ${'text-gray-600'}`}>{contribution.observation}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              ) : (
                <section className={`${'bg-white text-gray-800'} p-4 md:p-6 rounded-xl shadow-sm`}>
                  <div className={`text-center py-12 ${'text-gray-500'}`}>
                    <Target className={`w-12 h-12 mx-auto mb-4 ${'text-gray-300'}`} />
                    <p>{t(goalsTerms.selectGoalToSeeContributions)}</p>
                  </div>
                </section>
              )}

              <section className={`${'bg-white text-gray-800'} p-4 md:p-6 rounded-xl shadow-sm`}>
                <h3 className={`text-sm font-semibold mb-3 ${'text-gray-800'}`}>{t(goalsTerms.statistics)}</h3>
                <div className="space-y-3">
                  <div>
                    <p className={`text-xs ${'text-gray-500'}`}>{t(goalsTerms.averageIncome)}</p>
                    <p className={`text-lg font-semibold ${'text-gray-800'}`}>{formatCurrency(averageIncome)}</p>
                  </div>
                  <div>
                    <p className={`text-xs ${'text-gray-500'}`}>{t(goalsTerms.averageExpenses)}</p>
                    <p className={`text-lg font-semibold ${'text-gray-800'}`}>{formatCurrency(averageExpenses)}</p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </main>

        <AddGoalModal isOpen={isAddGoalModalOpen} onClose={closeAddGoalModal} />
        {selectedGoal && (
          <AddContributionModal
            isOpen={isAddContributionModalOpen}
            onClose={closeAddContributionModal}
            goalId={selectedGoal.id}
          />
        )}
        {editingGoal && (
          <EditGoalModal
            isOpen={isEditGoalModalOpen}
            onClose={closeEditGoalModal}
            editItem={{
              id: editingGoal.id,
              name: editingGoal.name,
              description: editingGoal.description,
              value: editingGoal.value,
              monthly_savings: editingGoal.monthly_savings,
              start_date: editingGoal.start_date,
              target_date: editingGoal.target_date,
            }}
            onDelete={handleDeleteGoal}
          />
        )}
        {editingContribution && (
          <EditContributionModal
            isOpen={isEditContributionModalOpen}
            onClose={closeEditContributionModal}
            editItem={{
              id: editingContribution.id,
              value: editingContribution.value,
              date: editingContribution.date,
              observation: editingContribution.observation,
            }}
            onDelete={handleDeleteContribution}
          />
        )}
      </div>
    </ProtectedRoute>
  )
}
