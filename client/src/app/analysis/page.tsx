'use client'

import { useState, useEffect, useMemo } from 'react'
import Sidebar from '@/components/sidebar'
import ProtectedRoute from '@/components/ProtectedRoute'
import { TrendingUp, TrendingDown, Target, DollarSign, PieChart, BarChart3, Calendar, Activity } from 'lucide-react'
import { Expense, Income, Goal, ExpenseExclusion, IncomeExclusion } from '@/types'
import { expensesService, incomesService, goalsService, expenseExclusionService, incomeExclusionService, ApiError } from '@/services'
import { formatCurrency as formatMoney } from "@/app/terminology/currency"
import { useAuth } from "@/contexts/AuthContext"
import YearlyBalanceChart from '@/components/YearlyBalanceChart'
import MonthlyTrendChart from '@/components/MonthlyTrendChart'
import GoalAllocationChart from '@/components/GoalAllocationChart'
import { useLanguage } from '@/app/terminology/LanguageContext'
import { analysis } from '@/app/terminology/language/analysis'
import { common } from '@/app/terminology/language/common'

export default function AnalysisPage() {
  const { user } = useAuth()
  const { t } = useLanguage()

  const [expenses, setExpenses] = useState<Expense[]>([])
  const [incomes, setIncomes] = useState<Income[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [expenseExclusions, setExpenseExclusions] = useState<ExpenseExclusion[]>([])
  const [incomeExclusions, setIncomeExclusions] = useState<IncomeExclusion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeFilter, setTimeFilter] = useState<'12months' | 'year'>('12months')
  const [selectedYear, setSelectedYear] = useState<number | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        setLoading(true)
        setError(null)
        const [expensesResponse, incomesResponse, goalsResponse, expenseExclusionsResponse, incomeExclusionsResponse] = await Promise.all([
          expensesService.getAll(1, 2000),
          incomesService.getAll(1, 2000),
          goalsService.getAll(1, 2000),
          expenseExclusionService.getAll(),
          incomeExclusionService.getAll()
        ])

        const expensesData = Array.isArray(expensesResponse)
          ? expensesResponse
          : (expensesResponse?.data || [])
        const incomesData = Array.isArray(incomesResponse)
          ? incomesResponse
          : (incomesResponse?.data || [])
        const goalsData = Array.isArray(goalsResponse)
          ? goalsResponse
          : (goalsResponse?.data || [])

        setExpenses(expensesData)
        setIncomes(incomesData)
        setGoals(goalsData)
        setExpenseExclusions(expenseExclusionsResponse)
        setIncomeExclusions(incomeExclusionsResponse)
      } catch (err) {
        const error = err as ApiError;
        if (error && (error.status === 401 || error.status === 403)) {
          setLoading(false);
          return;
        }
        console.error('Error fetching data:', err)
        setError(t(analysis.errorLoadingAnalysis))
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [t, user])

  const yearOptions = useMemo(() => {
    const years = new Set<number>()
    const allItems = [...expenses, ...incomes]
    allItems.forEach(item => {
      if (item.date) {
        years.add(new Date(item.date).getFullYear())
      }
    })
    return Array.from(years).sort((a, b) => b - a)
  }, [expenses, incomes])

  useEffect(() => {
    if (timeFilter === 'year' && selectedYear === null && yearOptions.length > 0) {
      setSelectedYear(yearOptions[0])
    }
  }, [timeFilter, selectedYear, yearOptions])

  const formatCurrency = (value: number) => {
    return formatMoney(value, user?.currency || "real")
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

  const yearlyBalanceData = useMemo(() => {
    const balances = []

    if (timeFilter === 'year' && selectedYear) {
      for (let i = 0; i < 12; i++) {
        const month = String(i + 1).padStart(2, '0')
        const year = selectedYear
        const monthKey = `${month}-${year}`

        const monthExpenses = expandRecurringEntries(expenses, monthKey, expenseExclusions)
        const monthIncomes = expandRecurringEntries(incomes, monthKey, incomeExclusions)

        const totalIncomesMonth = monthIncomes.reduce((sum, r) => sum + (Number(r.value) || 0), 0)
        const totalExpensesMonth = monthExpenses.reduce((sum, d) => sum + (Number(d.value) || 0), 0)
        const balance = totalIncomesMonth - totalExpensesMonth

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        const monthLabel = `${monthNames[i]} ${year}`

        balances.push({
          month: monthLabel,
          balance: balance,
          income: totalIncomesMonth,
          expenses: totalExpensesMonth
        })
      }
    } else {
      const now = new Date()

      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const year = date.getFullYear()
        const monthKey = `${month}-${year}`

        const monthExpenses = expandRecurringEntries(expenses, monthKey, expenseExclusions)
        const monthIncomes = expandRecurringEntries(incomes, monthKey, incomeExclusions)

        const totalIncomesMonth = monthIncomes.reduce((sum, r) => sum + (Number(r.value) || 0), 0)
        const totalExpensesMonth = monthExpenses.reduce((sum, d) => sum + (Number(d.value) || 0), 0)
        const balance = totalIncomesMonth - totalExpensesMonth

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        const monthLabel = `${monthNames[date.getMonth()]} ${year}`

        balances.push({
          month: monthLabel,
          balance: balance,
          income: totalIncomesMonth,
          expenses: totalExpensesMonth
        })
      }
    }

    return balances
  }, [expenses, incomes, expenseExclusions, incomeExclusions, timeFilter, selectedYear])

  const monthsWithIncome = useMemo(() =>
    yearlyBalanceData.filter(m => m.income > 0).length,
    [yearlyBalanceData]
  )

  const monthsWithExpenses = useMemo(() =>
    yearlyBalanceData.filter(m => m.expenses > 0).length,
    [yearlyBalanceData]
  )

  const monthsWithData = useMemo(() =>
    yearlyBalanceData.filter(m => m.income > 0 || m.expenses > 0).length,
    [yearlyBalanceData]
  )

  const averageBalance = useMemo(() => {
    const total = yearlyBalanceData.reduce((sum, item) => sum + item.balance, 0)
    return total / Math.max(1, monthsWithData)
  }, [yearlyBalanceData, monthsWithData])

  const yearlyTotals = useMemo(() => {
    const totalIncomes = yearlyBalanceData.reduce((sum, item) => sum + item.income, 0)
    const totalExpenses = yearlyBalanceData.reduce((sum, item) => sum + item.expenses, 0)
    return { totalIncomes, totalExpenses }
  }, [yearlyBalanceData])

  const averageMonthlyIncome = useMemo(() => {
    return yearlyTotals.totalIncomes / Math.max(1, monthsWithIncome)
  }, [yearlyTotals, monthsWithIncome])

  const goalAllocationRate = useMemo(() => {
    if (averageMonthlyIncome === 0) return 0
    const totalMonthlyGoalAllocation = goals.reduce((sum, goal) => sum + (Number(goal.monthly_savings) || 0), 0)
    return (totalMonthlyGoalAllocation / averageMonthlyIncome) * 100
  }, [goals, averageMonthlyIncome])

  const goalAchievementRate = useMemo(() => {
    const expectedTotalAllocation = goals.reduce((sum, goal) => sum + (Number(goal.monthly_savings) || 0), 0) * monthsWithData

    if (expectedTotalAllocation === 0) return 0

    const actualTotalAllocation = goals.reduce((sum, goal) => sum + (Number(goal.current_value) || 0), 0)

    return (actualTotalAllocation / expectedTotalAllocation) * 100
  }, [goals, monthsWithData])

  const savingsRate = useMemo(() => {
    if (averageMonthlyIncome === 0) return 0
    const averageExpenses = yearlyTotals.totalExpenses / Math.max(1, monthsWithExpenses)
    return ((averageMonthlyIncome - averageExpenses) / averageMonthlyIncome) * 100
  }, [averageMonthlyIncome, yearlyTotals, monthsWithExpenses])

  const balanceTrend = useMemo(() => {
    if (yearlyBalanceData.length < 2) return 'stable'
    const last3 = yearlyBalanceData.slice(-3)
    const previous3 = yearlyBalanceData.slice(-6, -3)

    const recentAverage = last3.reduce((sum, item) => sum + item.balance, 0) / last3.length
    const previousAverage = previous3.reduce((sum, item) => sum + item.balance, 0) / previous3.length

    if (recentAverage > previousAverage * 1.1) return 'up'
    if (recentAverage < previousAverage * 0.9) return 'down'
    return 'stable'
  }, [yearlyBalanceData])

  const chartSubtitle = useMemo(() => {
    if (timeFilter === 'year' && selectedYear) {
      return selectedYear.toString()
    }
    return t(analysis.twelveMonths)
  }, [timeFilter, selectedYear, t])

  if (loading) {
    return (
      <ProtectedRoute>
        <div className={`flex min-h-screen ${'bg-gray-50'}`}>
          <Sidebar />
          <main className={`flex-1 p-4 md:p-8 md:ml-64 flex items-center justify-center ${''}`}>
            <div className={`${'text-gray-500'}`}>{t(analysis.loadingAnalysis)}</div>
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
            <h1 className={`${'text-xl md:text-2xl font-semibold text-gray-800 text-center md:text-left'}`}>
              {t(analysis.title)}
            </h1>
            <div className="flex items-center gap-2 ml-auto md:ml-0">
              {timeFilter === 'year' && (
                <select
                  value={selectedYear ?? ''}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {yearOptions.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              )}
              <div className={`relative flex bg-white rounded-lg w-fit`}>
                <div className={`absolute top-0 h-full bg-blue-600 rounded-lg transition-all duration-200 ease-in-out ${
                  timeFilter === '12months' ? 'left-1 w-1/2' : 'left-1/2 w-1/2'
                }`}></div>
                <button
                  onClick={() => setTimeFilter('12months')}
                  className={`relative z-10 px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 whitespace-nowrap min-w-[90px] text-center ${timeFilter === '12months' ? 'text-white' : 'text-gray-600'}`}
                >
                  {t(analysis.twelveMonths)}
                </button>
                <button
                  onClick={() => setTimeFilter('year')}
                  className={`relative z-10 px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 whitespace-nowrap min-w-[90px] text-center ${timeFilter === 'year' ? 'text-white' : 'text-gray-600'}`}
                >
                  {t(common.year)}
                </button>
              </div>
            </div>
          </header>

          <section className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 mb-6">
            <div className={`${'bg-white text-gray-800'} p-4 md:p-6 rounded-xl shadow-sm`}>
              <div className="flex items-center gap-2 md:gap-3 mb-2">
                <div className={`${'w-8 h-8 md:w-10 md:h-10 bg-blue-100 rounded-full flex items-center justify-center'} flex-shrink-0`}>
                  {balanceTrend === 'up' ? (
                    <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                  ) : balanceTrend === 'down' ? (
                    <TrendingDown className="w-4 h-4 md:w-5 md:h-5 text-red-600" />
                  ) : (
                    <Activity className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                  )}
                </div>
                <div>
                  <p className={`${'text-gray-500 text-xs md:text-sm'}`}>{t(analysis.averageMonthlyBalance)}</p>
                  <p className={`${'text-lg md:text-2xl font-semibold'} ${averageBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(averageBalance)}
                  </p>
                </div>
              </div>
            </div>

            <div className={`${'bg-white text-gray-800'} p-4 md:p-6 rounded-xl shadow-sm`}>
              <div className="flex items-center gap-2 md:gap-3 mb-2">
                <div className={`${'w-8 h-8 md:w-10 md:h-10 bg-purple-100 rounded-full flex items-center justify-center'} flex-shrink-0`}>
                  <PieChart className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
                </div>
                <div>
                  <p className={`${'text-gray-500 text-xs md:text-sm'}`}>{t(analysis.savingsRate)}</p>
                  <p className={`${'text-lg md:text-2xl font-semibold'}`}>
                    {savingsRate.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            <div className={`${'bg-white text-gray-800'} p-4 md:p-6 rounded-xl shadow-sm`}>
              <div className="flex items-center gap-2 md:gap-3 mb-2">
                <div className={`${'w-8 h-8 md:w-10 md:h-10 bg-yellow-100 rounded-full flex items-center justify-center'} flex-shrink-0`}>
                  <Target className="w-4 h-4 md:w-5 md:h-5 text-yellow-600" />
                </div>
                <div>
                  <p className={`${'text-gray-500 text-xs md:text-sm'}`}>{t(analysis.goalAllocation)}</p>
                  <p className={`${'text-lg md:text-2xl font-semibold'}`}>
                    {goalAllocationRate.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            <div className={`${'bg-white text-gray-800'} p-4 md:p-6 rounded-xl shadow-sm`}>
              <div className="flex items-center gap-2 md:gap-3 mb-2">
                <div className={`${'w-8 h-8 md:w-10 md:h-10 bg-green-100 rounded-full flex items-center justify-center'} flex-shrink-0`}>
                  <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                </div>
                <div>
                  <p className={`${'text-gray-500 text-xs md:text-sm'}`}>{t(analysis.goalAchievementRate)}</p>
                  <p className={`${'text-lg md:text-2xl font-semibold'}`}>
                    {goalAchievementRate.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6">
            <div className={`${'bg-white text-gray-800'} p-4 md:p-6 rounded-xl shadow-sm`}>
              <div className="flex items-center gap-2 md:gap-3 mb-2">
                <div className={`${'w-8 h-8 md:w-10 md:h-10 bg-blue-100 rounded-full flex items-center justify-center'} flex-shrink-0`}>
                  <DollarSign className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                </div>
                <div>
                  <p className={`${'text-gray-500 text-xs md:text-sm'}`}>{t(common.total)} {t(analysis.income)}</p>
                  <p className={`${'text-lg md:text-xl font-semibold'}`}>
                    {formatCurrency(yearlyTotals.totalIncomes)}
                  </p>
                </div>
              </div>
            </div>

            <div className={`${'bg-white text-gray-800'} p-4 md:p-6 rounded-xl shadow-sm`}>
              <div className="flex items-center gap-2 md:gap-3 mb-2">
                <div className={`${'w-8 h-8 md:w-10 md:h-10 bg-orange-100 rounded-full flex items-center justify-center'} flex-shrink-0`}>
                  <DollarSign className="w-4 h-4 md:w-5 md:h-5 text-orange-600" />
                </div>
                <div>
                  <p className={`${'text-gray-500 text-xs md:text-sm'}`}>{t(common.total)} {t(analysis.expenses)}</p>
                  <p className={`${'text-lg md:text-xl font-semibold'}`}>
                    {formatCurrency(yearlyTotals.totalExpenses)}
                  </p>
                </div>
              </div>
            </div>

            <div className={`${'bg-white text-gray-800'} p-4 md:p-6 rounded-xl shadow-sm`}>
              <div className="flex items-center gap-2 md:gap-3 mb-2">
                <div className={`${'w-8 h-8 md:w-10 md:h-10 bg-green-100 rounded-full flex items-center justify-center'} flex-shrink-0`}>
                  <Calendar className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                </div>
                <div>
                  <p className={`${'text-gray-500 text-xs md:text-sm'}`}>{t(analysis.incomeMonthlyAverage)}</p>
                  <p className={`${'text-lg md:text-xl font-semibold'}`}>
                    {formatCurrency(averageMonthlyIncome)}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <div className="flex flex-col xl:flex-row gap-4 md:gap-6">
            <div className="w-full xl:w-2/3 flex flex-col gap-4 md:gap-6">
              <div className={`${'bg-white text-gray-800'} p-4 md:p-6 rounded-xl shadow-sm`}>
                <h2 className={`${'text-base md:text-lg font-semibold text-gray-800 mb-4'}`}>
                  {t(analysis.yearlyBalance)} ({chartSubtitle})
                </h2>
                <div className="w-full h-[300px]">
                  {yearlyBalanceData.every(item => item.balance === 0) ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                      <TrendingUp className="w-10 h-10 mb-3 text-gray-300" />
                      <p className="text-sm text-center">{t(analysis.noDataAvailable)}</p>
                    </div>
                  ) : (
                    <YearlyBalanceChart data={yearlyBalanceData} currency={user?.currency ?? "real"} />
                  )}
                </div>
              </div>

              <div className={`${'bg-white text-gray-800'} p-4 md:p-6 rounded-xl shadow-sm`}>
                <h2 className={`${'text-base md:text-lg font-semibold text-gray-800 mb-4'}`}>
                  {t(analysis.income)} vs {t(analysis.expenses)} ({chartSubtitle})
                </h2>
                <div className="w-full h-[300px]">
                  {yearlyBalanceData.every(item => item.income === 0 && item.expenses === 0) ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                      <BarChart3 className="w-10 h-10 mb-3 text-gray-300" />
                      <p className="text-sm text-center">{t(analysis.noDataAvailable)}</p>
                    </div>
                  ) : (
                    <MonthlyTrendChart data={yearlyBalanceData} currency={user?.currency ?? "real"} />
                  )}
                </div>
              </div>
            </div>

            <div className="w-full xl:w-1/3 flex flex-col gap-4 md:gap-6">
              <div className={`${'bg-white text-gray-800'} p-4 md:p-6 rounded-xl shadow-sm min-h-[300px]`}>
                <h2 className={`${'text-base md:text-lg font-semibold text-gray-800 mb-4'}`}>
                  {t(analysis.goalAllocation)}
                </h2>
                {goals.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 py-12">
                    <Target className="w-12 h-12 mb-4 text-gray-300" />
                    <p className="text-sm text-center">{t(analysis.noDataAvailable)}</p>
                  </div>
                ) : (
                    <GoalAllocationChart goals={goals} currency={user?.currency ?? "real"} />
                )}
              </div>

              <div className={`${'bg-white text-gray-800'} p-4 md:p-6 rounded-xl shadow-sm`}>
                <h2 className={`${'text-base md:text-lg font-semibold text-gray-800 mb-4'}`}>
                  {t(analysis.goalSummary)}
                </h2>
                {goals.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                    <Target className="w-10 h-10 mb-3 text-gray-300" />
                    <p className="text-sm text-center">{t(analysis.noDataAvailable)}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {goals.map((goal) => {
                      const progress = Number(goal.value) > 0 ? (Number(goal.current_value) / Number(goal.value)) * 100 : 0
                      return (
                        <div key={goal.id} className={`p-3 rounded-lg ${'bg-gray-50'}`}>
                          <div className="flex justify-between items-center mb-2">
                            <span className={`text-sm font-medium ${'text-gray-800'}`}>{goal.name}</span>
                            <span className={`text-xs ${'text-gray-500'}`}>{progress.toFixed(0)}%</span>
                          </div>
                          <div className={`w-full rounded-full h-2 ${'bg-gray-200'}`}>
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between mt-1">
                            <span className={`text-xs ${'text-gray-500'}`}>
                              {formatCurrency(Number(goal.current_value) || 0)}
                            </span>
                            <span className={`text-xs ${'text-gray-500'}`}>
                              {formatCurrency(Number(goal.value) || 0)}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
