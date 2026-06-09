interface MonthlyEntry {
  income: number
  expenses: number
}

interface GoalData {
  monthly_savings: number
  current_value: number
}

export function countMonthsWithIncome(data: MonthlyEntry[]): number {
  return data.filter(m => m.income > 0).length
}

export function countMonthsWithExpenses(data: MonthlyEntry[]): number {
  return data.filter(m => m.expenses > 0).length
}

export function countMonthsWithData(data: MonthlyEntry[]): number {
  return data.filter(m => m.income > 0 || m.expenses > 0).length
}

export function computeAverageMonthlyIncome(totalIncomes: number, monthsWithIncome: number): number {
  return totalIncomes / Math.max(1, monthsWithIncome)
}

export function computeAverageBalance(totalBalance: number, monthsWithData: number): number {
  return totalBalance / Math.max(1, monthsWithData)
}

export function computeSavingsRate(
  averageMonthlyIncome: number,
  totalExpenses: number,
  monthsWithExpenses: number
): number {
  if (averageMonthlyIncome === 0) return 0
  const averageExpenses = totalExpenses / Math.max(1, monthsWithExpenses)
  return ((averageMonthlyIncome - averageExpenses) / averageMonthlyIncome) * 100
}

export function computeGoalAchievementRate(goals: GoalData[], monthsWithData: number): number {
  const expectedTotalAllocation = goals.reduce((sum, goal) => sum + (Number(goal.monthly_savings) || 0), 0) * monthsWithData
  if (expectedTotalAllocation === 0) return 0
  const actualTotalAllocation = goals.reduce((sum, goal) => sum + (Number(goal.current_value) || 0), 0)
  return (actualTotalAllocation / expectedTotalAllocation) * 100
}
