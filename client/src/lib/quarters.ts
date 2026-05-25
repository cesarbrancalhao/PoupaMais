const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'] as const

export function getCurrentYearQuarter(): string {
  const now = new Date()
  const yy = now.getFullYear().toString().slice(-2)
  const q = Math.floor(now.getMonth() / 3) + 1
  return `${yy}Q${q}`
}

export function generateQuarterOptions(): string[] {
  const now = new Date()
  const currentYear = now.getFullYear()
  const options: string[] = []

  for (let year = currentYear - 2; year <= currentYear + 2; year++) {
    const yy = year.toString().slice(-2)
    for (const q of QUARTERS) {
      options.push(`${yy}${q}`)
    }
  }

  return options
}
