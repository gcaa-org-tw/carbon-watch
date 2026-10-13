import type { CompanyData } from '~/types/company'

export const DATA_YEAR = 2024

export const fallbackEmissionYear = (company: CompanyData): number | null => {
  const years = (findTrendEntry(company).ghg ?? []).filter(p => p.value > 0).map(p => p.year)
  if (years.length === 0) return null
  const latest = Math.max(...years)
  return latest === DATA_YEAR ? null : latest
}
