<script setup lang="ts">
import type { CompanyData } from '~/types/company'
import coalUsageMap from '~/assets/data/coal-usage-map.json'
import trendMap from '~/assets/data/trend-map.json'

type TrendPoint = { year: number; value: number }
type TrendEntry = {
  ghg?: TrendPoint[]
  ghgIntensity?: TrendPoint[]
  energy?: TrendPoint[]
  energyIntensity?: TrendPoint[]
}

interface Props {
  company: CompanyData
  allCompanies: CompanyData[]
}

const props = defineProps<Props>()

// Parse emission value from string format (with commas) to number
const parseEmission = (value: string | undefined): number => {
  if (!value) return 0
  return parseInt(value.replace(/,/g, ''), 10) || 0
}

// Derived metrics
const companyEmission = computed(() => {
  return parseEmission(props.company['溫室氣體排放量（公噸二氧化碳當量）'])
})

const totalTaiwanEmissions = computed(() => {
  return props.allCompanies.reduce((sum, c) => {
    return sum + parseEmission(c['溫室氣體排放量（公噸二氧化碳當量）'])
  }, 0)
})

const taiwanPercentage = computed(() => {
  if (totalTaiwanEmissions.value === 0) return 0
  return Math.round((companyEmission.value / totalTaiwanEmissions.value) * 100)
})

//  Mock data Calculate expected carbon fee (emission * rate per ton) 
const CARBON_FEE_RATE = 300 // NTD per ton
const expectedCarbonFee = computed(() => {
  return companyEmission.value * CARBON_FEE_RATE
})

// Top 3 縣市 emission distribution (real data from IV. 企業縣市排放絕對值（公式）.csv)
// 縣市佔比 = company emission in this county / sum of all 排碳大戶 in this county × 100
const regionEmissions = computed(() => props.company.regionEmissions ?? [])

// Coal usage historical data from coal-usage-map.json (keyed by 公司全名)
const coalUsageData = computed(() => {
  const fullName = props.company['公司全名']
  if (!fullName) return []
  return (coalUsageMap as Record<string, Array<{ year: number; value: number }>>)[fullName] || []
})

// Trend data (排放量、密集度、能源、能源密集度) keyed by 公司全名
const trendEntry = computed<TrendEntry>(() => {
  const fullName = props.company['公司全名']
  if (!fullName) return {}
  return (trendMap as Record<string, TrendEntry>)[fullName] || {}
})

const parseParagraph = (value?: string): string => {
  if (!value) return ''
  return value.replace(/([。：])(?!$)/g, "$1\n")
}

const companyReductionStrategy = computed(() =>
  parseParagraph(props.company['關鍵減量策略'])
)

const parseSotNumber = (v: unknown): number | null => {
  if (v === undefined || v === null || v === '') return null
  const cleaned = String(v).replace(/[,\s%]/g, '')
  if (cleaned === '' || cleaned === 'NA' || cleaned === 'N/A' || cleaned === '無' || cleaned === '未揭露') return null
  const n = parseFloat(cleaned)
  return isNaN(n) ? null : n
}

const 現狀年 = new Date().getFullYear()

const 基準年 = computed<number | null>(() => {
  const v = parseSotNumber(props.company['中期減量基準年'])
  return v && v >= 1990 && v <= 2050 ? Math.round(v) : null
})

const 基準年排放量 = computed<number | null>(() => parseSotNumber(props.company['中期減量基準年排放量']))

const 中期目標年 = computed<number | null>(() => {
  const v = parseSotNumber(props.company['中期減量目標年'])
  return v && v >= 2020 && v <= 2100 ? Math.round(v) : null
})

const 中期減量目標 = computed<number | null>(() => {
  const raw = props.company['2030 年減量目標設定']
  if (!raw) return null
  const cleaned = String(raw).replace(/[,\s]/g, '').replace('%', '')
  const parsed = parseFloat(cleaned)
  if (isNaN(parsed)) return null
  return parsed > 1 ? parsed / 100 : parsed
})

const 淨零目標年 = computed<number | null>(() => {
  const v = parseSotNumber(props.company['淨零目標年'])
  return v && v >= 2020 && v <= 2100 ? Math.round(v) : null
})

const hasCommitmentData = computed(() => {
  return 基準年.value !== null && 基準年排放量.value !== null
    && 中期目標年.value !== null && 中期減量目標.value !== null
    && 淨零目標年.value !== null
})

const 中期目標排放量 = computed<number | null>(() => {
  if (!hasCommitmentData.value) return null
  return Math.round(基準年排放量.value! * (1 - 中期減量目標.value!))
})

const 預估路徑 = computed<{ 中期: number; 淨零: number } | null>(() => {
  const ghg = trendEntry.value.ghg ?? []
  if (ghg.length < 2 || 中期目標年.value === null || 淨零目標年.value === null) return null
  const last5 = [...ghg].sort((a, b) => a.year - b.year).slice(-5)
  const n = last5.length
  const sumX = last5.reduce((s, p) => s + p.year, 0)
  const sumY = last5.reduce((s, p) => s + p.value, 0)
  const sumXY = last5.reduce((s, p) => s + p.year * p.value, 0)
  const sumX2 = last5.reduce((s, p) => s + p.year * p.year, 0)
  const denom = n * sumX2 - sumX * sumX
  if (denom === 0) return null
  const slope = (n * sumXY - sumX * sumY) / denom
  const intercept = (sumY - slope * sumX) / n
  const project = (year: number) => Math.max(0, Math.round(slope * year + intercept))
  return { 中期: project(中期目標年.value), 淨零: project(淨零目標年.value) }
})
</script>

<template>
  <UCard :ui="{ root: 'ring-0 border-0' }">
    <CompanyHeader
      :公司="company.公司"
      :淨零目標年="company.淨零目標年"
      :年排放量="companyEmission"
      :全台佔比="taiwanPercentage"
      :年度變化="company.年度變化 ?? undefined"
      :預期碳費="expectedCarbonFee"
    />

    <div v-if="regionEmissions.length > 0" class="mt-5">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <CompanyRegionEmissionCard
          v-for="region in regionEmissions"
          :key="region.縣市"
          :縣市="region.縣市"
          :縣市佔比="region.縣市佔比"
          :排放量="region.排放量"
        />
      </div>
    </div>

    <!-- Radar Chart Section -->
    <CompanyRadarSection :company="company" />

    <!-- Reduction Strategy Section -->
    <CompanyReductionStrategy :策略內容="companyReductionStrategy" />

    <!-- 排放 / 能源歷年趨勢 -->
    <CompanyTrendCharts
      :ghg="trendEntry.ghg"
      :ghg-intensity="trendEntry.ghgIntensity"
      :energy="trendEntry.energy"
      :energy-intensity="trendEntry.energyIntensity"
    />

    <!-- Coal Usage Chart Section -->
    <CompanyCoalUsageChart
      v-if="coalUsageData.length > 0"
      :data="coalUsageData"
    />

    <CompanyNetZeroPathChart
      :has-commitment-data="hasCommitmentData"
      :基準年="基準年"
      :基準年排放量="基準年排放量"
      :現狀年="現狀年"
      :現狀排放量="companyEmission"
      :中期目標年="中期目標年"
      :中期目標排放量="中期目標排放量"
      :淨零目標年="淨零目標年"
      :預估路徑="預估路徑"
      :歷年排放="trendEntry.ghg ?? []"
    />
  </UCard>
</template>
