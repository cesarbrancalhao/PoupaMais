import {
  countMonthsWithIncome,
  countMonthsWithExpenses,
  countMonthsWithData,
  computeAverageMonthlyIncome,
  computeAverageBalance,
  computeSavingsRate,
  computeGoalAchievementRate,
} from './calculations'

describe('countMonthsWithIncome', () => {
  it('should return 0 for empty array', () => {
    expect(countMonthsWithIncome([])).toBe(0)
  })

  it('should count only months with income > 0', () => {
    const data = [
      { income: 100, expenses: 50 },
      { income: 0, expenses: 50 },
      { income: 200, expenses: 0 },
      { income: 0, expenses: 0 },
    ]
    expect(countMonthsWithIncome(data)).toBe(2)
  })

  it('should return 0 when all incomes are zero', () => {
    const data = [
      { income: 0, expenses: 50 },
      { income: 0, expenses: 30 },
    ]
    expect(countMonthsWithIncome(data)).toBe(0)
  })
})

describe('countMonthsWithExpenses', () => {
  it('should count only months with expenses > 0', () => {
    const data = [
      { income: 100, expenses: 50 },
      { income: 100, expenses: 0 },
      { income: 0, expenses: 80 },
      { income: 0, expenses: 0 },
    ]
    expect(countMonthsWithExpenses(data)).toBe(2)
  })
})

describe('countMonthsWithData', () => {
  it('should count months with either income or expenses', () => {
    const data = [
      { income: 100, expenses: 0 },
      { income: 0, expenses: 50 },
      { income: 100, expenses: 50 },
      { income: 0, expenses: 0 },
    ]
    expect(countMonthsWithData(data)).toBe(3)
  })

  it('should return 0 when all are zero', () => {
    const data = [
      { income: 0, expenses: 0 },
      { income: 0, expenses: 0 },
    ]
    expect(countMonthsWithData(data)).toBe(0)
  })
})

describe('computeAverageMonthlyIncome', () => {
  it('should divide total by count of months with income', () => {
    expect(computeAverageMonthlyIncome(600, 3)).toBe(200)
  })

  it('should handle zero months by returning total (divided by 1)', () => {
    expect(computeAverageMonthlyIncome(500, 0)).toBe(500)
  })

  it('should return 0 when total is 0 regardless of months', () => {
    expect(computeAverageMonthlyIncome(0, 12)).toBe(0)
  })

  it('should handle a single month', () => {
    expect(computeAverageMonthlyIncome(150, 1)).toBe(150)
  })
})

describe('computeAverageBalance', () => {
  it('should divide total balance by months with data', () => {
    expect(computeAverageBalance(300, 3)).toBe(100)
  })

  it('should handle zero months with data', () => {
    expect(computeAverageBalance(500, 0)).toBe(500)
  })
})

describe('computeSavingsRate', () => {
  it('should calculate savings rate with adjusted averages', () => {
    const rate = computeSavingsRate(200, 300, 3)
    expect(rate).toBe(50)
  })

  it('should return 0 when income is zero', () => {
    expect(computeSavingsRate(0, 500, 3)).toBe(0)
  })

  it('should return 100 when there are no expenses', () => {
    const rate = computeSavingsRate(200, 0, 3)
    expect(rate).toBe(100)
  })

  it('should return negative when expenses exceed income', () => {
    const rate = computeSavingsRate(100, 400, 2)
    expect(rate).toBe(-100)
  })

  it('should handle zero expense months (divide by 1)', () => {
    const rate = computeSavingsRate(200, 100, 0)
    expect(rate).toBe(50)
  })
})

describe('computeGoalAchievementRate', () => {
  const goals = [
    { monthly_savings: 100, current_value: 500 },
    { monthly_savings: 50, current_value: 200 },
  ]

  it('should calculate rate based on months with data', () => {
    const rate = computeGoalAchievementRate(goals, 6)
    const expectedAllocation = (100 + 50) * 6
    expect(expectedAllocation).toBe(900)
    expect(rate).toBe((700 / 900) * 100)
  })

  it('should use monthsWithData as multiplier', () => {
    const rate6 = computeGoalAchievementRate(goals, 6)
    const rate3 = computeGoalAchievementRate(goals, 3)
    expect(rate6).not.toBe(rate3)
    expect(rate3).toBeGreaterThan(rate6)
  })

  it('should return 0 when no goals have monthly_savings', () => {
    const emptyGoals = [
      { monthly_savings: 0, current_value: 100 },
    ]
    expect(computeGoalAchievementRate(emptyGoals, 6)).toBe(0)
  })

  it('should handle zero months with data', () => {
    expect(computeGoalAchievementRate(goals, 0)).toBe(0)
  })
})
