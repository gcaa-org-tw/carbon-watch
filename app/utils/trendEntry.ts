import trendMap from '~/assets/data/trend-map.json'
import type { CompanyData } from '~/types/company'

interface TrendPoint {
  year: number
  value: number
}

export interface TrendEntry {
  ghg?: TrendPoint[]
  ghgIntensity?: TrendPoint[]
  energy?: TrendPoint[]
  energyIntensity?: TrendPoint[]
}

const entries = trendMap as Record<string, TrendEntry>

export const findTrendEntry = (company: CompanyData): TrendEntry => {
  const ubn = (company['事業統編'] ?? '').trim()
  return (ubn && entries[ubn.padStart(8, '0')]) || {}
}
