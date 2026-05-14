/**
 * Trend Data Transformer
 *
 * Reads two raw CSVs from raw-data/:
 *  - 溫室氣體排放.csv (keyed by 事業統編): emissions + intensity 2022-2024
 *  - 能源消耗.csv (keyed by 證券代號): energy use + energy intensity 2022-2024
 *
 * Outputs `app/assets/data/trend-map.json` keyed by 公司全名 (full company name,
 * 臺→台 normalized to match hub).
 *
 * ## Output shape
 *
 * ```typescript
 * type Point = { year: number; value: number }
 * Record<string, {
 *   ghg?: Point[]
 *   ghgIntensity?: Point[]
 *   energy?: Point[]
 *   energyIntensity?: Point[]
 * }>
 * ```
 *
 * Each company entry only contains series that have at least one valid year.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { Logger } from './lib/logger.js'
import { normalizeCompanyName } from './lib/normalize.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const RAW_DATA_DIR = join(__dirname, '..', 'raw-data')
const OUTPUT_DIR = join(__dirname, '..', 'app', 'assets', 'data')

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  result.push(current)
  return result
}

function parseCSV(content: string): Record<string, string>[] {
  const lines = content.replace(/\r/g, '').split('\n').filter(l => l.trim())
  if (lines.length === 0) return []
  const headers = parseCSVLine(lines[0])
  const data: Record<string, string>[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    if (values.length === 0) continue
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => { row[h] = values[idx] || '' })
    data.push(row)
  }
  return data
}

function parseValue(raw: string | undefined): number | null {
  if (!raw) return null
  const trimmed = raw.trim()
  if (!trimmed || trimmed === 'NA' || trimmed === 'N/A' || trimmed.startsWith('#')) {
    return null
  }
  const cleaned = trimmed.replace(/,/g, '').replace(/\s/g, '')
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

type Point = { year: number; value: number }
type Series = Point[]
type TrendEntry = {
  ghg?: Series
  ghgIntensity?: Series
  energy?: Series
  energyIntensity?: Series
}
type TrendMap = Record<string, TrendEntry>

function ensure(map: TrendMap, name: string): TrendEntry {
  if (!map[name]) map[name] = {}
  return map[name]
}

function buildSeries(row: Record<string, string>, columns: Record<number, string>): Series {
  const points: Series = []
  for (const yearStr of Object.keys(columns)) {
    const year = parseInt(yearStr, 10)
    const col = columns[year]
    const v = parseValue(row[col])
    if (v !== null) points.push({ year, value: v })
  }
  return points.sort((a, b) => a.year - b.year)
}

async function transformTrendData() {
  const logger = new Logger()

  try {
    logger.info('Starting trend data transformation')

    const ghgPath = join(RAW_DATA_DIR, '溫室氣體排放.csv')
    const energyPath = join(RAW_DATA_DIR, '能源消耗.csv')

    if (!existsSync(ghgPath)) throw new Error(`Missing ${ghgPath}`)
    if (!existsSync(energyPath)) throw new Error(`Missing ${energyPath}`)

    const ghgData = parseCSV(readFileSync(ghgPath, 'utf-8'))
    const energyData = parseCSV(readFileSync(energyPath, 'utf-8'))
    logger.info(`溫室氣體排放: ${ghgData.length} rows`)
    logger.info(`能源消耗: ${energyData.length} rows`)

    const trendMap: TrendMap = {}

    let ghgCount = 0
    for (const row of ghgData) {
      const name = normalizeCompanyName(row['公司'])
      if (!name) continue

      const ghg = buildSeries(row, {
        2022: '2022總排放',
        2023: '2023總排放',
        2024: '2024總排放',
      })
      const ghgIntensity = buildSeries(row, {
        2022: '2022密集度',
        2023: '2023密集度',
        2024: '2024密集度',
      })
      if (ghg.length === 0 && ghgIntensity.length === 0) continue

      const entry = ensure(trendMap, name)
      if (ghg.length > 0) entry.ghg = ghg
      if (ghgIntensity.length > 0) entry.ghgIntensity = ghgIntensity
      ghgCount++
    }
    logger.success(`Loaded GHG series for ${ghgCount} companies`)

    let energyCount = 0
    for (const row of energyData) {
      const name = normalizeCompanyName(row['公司名稱'])
      if (!name) continue

      const energy = buildSeries(row, {
        2022: '2022年度總能源使用量',
        2023: '2023年度總能源使用量',
        2024: '2024年度總能源使用量',
      })
      const energyIntensity = buildSeries(row, {
        2022: '2022能效',
        2023: '2023能效',
        2024: '2024能效',
      })
      if (energy.length === 0 && energyIntensity.length === 0) continue

      const entry = ensure(trendMap, name)
      if (energy.length > 0) entry.energy = energy
      if (energyIntensity.length > 0) entry.energyIntensity = energyIntensity
      energyCount++
    }
    logger.success(`Loaded energy series for ${energyCount} companies`)

    mkdirSync(OUTPUT_DIR, { recursive: true })
    const outPath = join(OUTPUT_DIR, 'trend-map.json')
    writeFileSync(outPath, JSON.stringify(trendMap, null, 2), 'utf-8')
    logger.success(`Saved trend map to: ${outPath}`)

    const totalCompanies = Object.keys(trendMap).length
    const seriesCounts = { ghg: 0, ghgIntensity: 0, energy: 0, energyIntensity: 0 }
    for (const entry of Object.values(trendMap)) {
      if (entry.ghg) seriesCounts.ghg++
      if (entry.ghgIntensity) seriesCounts.ghgIntensity++
      if (entry.energy) seriesCounts.energy++
      if (entry.energyIntensity) seriesCounts.energyIntensity++
    }

    logger.info('='.repeat(60))
    logger.info(`Total companies in trend map: ${totalCompanies}`)
    logger.info(`  with ghg series: ${seriesCounts.ghg}`)
    logger.info(`  with ghgIntensity series: ${seriesCounts.ghgIntensity}`)
    logger.info(`  with energy series: ${seriesCounts.energy}`)
    logger.info(`  with energyIntensity series: ${seriesCounts.energyIntensity}`)
    logger.logDuration()
    logger.info('='.repeat(60))
  } catch (error) {
    logger.error('Fatal error during trend data transformation', error)
    process.exit(1)
  }
}

transformTrendData()
