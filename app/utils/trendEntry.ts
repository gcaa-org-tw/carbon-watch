import trendMap from '~/assets/data/trend-map.json'
import type { CompanyData } from '~/types/company'

interface TrendPoint {
  year: number
  value: number
}

export interface TrendEntry {
  事業統編?: string
  ghg?: TrendPoint[]
  ghgIntensity?: TrendPoint[]
  energy?: TrendPoint[]
  energyIntensity?: TrendPoint[]
}

const entries = trendMap as Record<string, TrendEntry>
const entriesByUbn = new Map<string, TrendEntry>(
  Object.values(entries).flatMap(e => (e.事業統編 ? [[e.事業統編, e] as [string, TrendEntry]] : [])),
)

export const findTrendEntry = (company: CompanyData): TrendEntry => {
  const fullName = (company['公司全名'] ?? '').replace(/臺/g, '台').trim()
  const byName = fullName ? entries[fullName] : undefined
  if (byName) return byName
  const ubn = (company['事業統編'] ?? '').trim()
  return (ubn && entriesByUbn.get(ubn.padStart(8, '0'))) || {}
}
