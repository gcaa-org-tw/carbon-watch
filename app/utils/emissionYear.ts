import trendMap from '~/assets/data/trend-map.json'
import type { CompanyData } from '~/types/company'

interface GhgPoint {
  year: number
  value: number
}

interface GhgEntry {
  ghg?: GhgPoint[]
}

export const DATA_YEAR = 2024

export const fallbackEmissionYear = (company: CompanyData): number | null => {
  const fullName = (company['公司全名'] ?? '').replace(/臺/g, '台').trim()
  if (!fullName) return null
  const ghg = (trendMap as Record<string, GhgEntry>)[fullName]?.ghg ?? []
  const years = ghg.filter(p => p.value > 0).map(p => p.year)
  if (years.length === 0) return null
  const latest = Math.max(...years)
  return latest === DATA_YEAR ? null : latest
}
