<script setup lang="ts">
import type { CompanyData } from '~/types/company'
import coalUsageMap from '~/assets/data/coal-usage-map.json'

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

// Region data (placeholder until real data is available)
const regionEmissions = computed(() => {
  if (!props.company.代表縣市) return []
  // Mock data matching design: 3 regions with same values
  return [
    { 縣市: '新竹市', 縣市佔比: 24, 排放量: 548990 },
    { 縣市: '台南市', 縣市佔比: 24, 排放量: 548990 },
    { 縣市: '台中市', 縣市佔比: 24, 排放量: 548990 }
  ]
})

// Coal usage historical data from coal-usage-map.json (keyed by 公司全名)
const coalUsageData = computed(() => {
  const fullName = props.company['公司全名']
  if (!fullName) return []
  return (coalUsageMap as Record<string, Array<{ year: number; value: number }>>)[fullName] || []
})

const parseParagraph = (value?: string): string => {
  if (!value) return ''
  return value.replace(/([。：])(?!$)/g, "$1\n")
}

const companyReductionStrategy = computed(() =>
  parseParagraph(props.company['有具體減量策略'])
)

// Net Zero Path Simulator data (mock baseline + real targets)
const 基準年 = 2020
const 基準年排放量 = computed(() => {
  // Mock: baseline is ~10% higher than current emissions
  return Math.round(companyEmission.value * 1.1)
})

const 現狀年 = new Date().getFullYear()
const 中期目標年 = 2030
const 中期減量目標 = computed(() => {
  // Parse "28.0%" → 0.28
  const raw = props.company['2030 年減量目標設定']
  if (!raw) return 0.2 // default mock
  const parsed = parseFloat(raw.replace('%', ''))
  return isNaN(parsed) ? 0.2 : parsed / 100
})
const 中期預估排放量 = computed(() => {
  return Math.round(基準年排放量.value * (1 - 0.15))
})

// Interpolate current year target: linear between base year and mid-term target
const 現狀目標排放量 = computed(() => {
  const totalYears = 中期目標年 - 基準年
  const elapsed = 現狀年 - 基準年
  const ratio = totalYears > 0 ? elapsed / totalYears : 0
  const targetReduction = 中期減量目標.value * ratio
  return Math.round(基準年排放量.value * (1 - targetReduction))
})

const 中期目標排放量 = computed(() => {
  return Math.round(基準年排放量.value * (1 - 中期減量目標.value))
})

const 淨零目標年 = computed(() => {
  const year = parseInt(props.company['淨零目標年'], 10)
  return isNaN(year) ? 2050 : year
})

const 淨零年預估排放量 = computed(() => {
 return Math.round(基準年排放量.value * (1 - 0.7))
})
</script>

<template>
  <UCard>
    <CompanyHeader
      :公司="company.公司"
      :淨零目標年="company.淨零目標年"
      :年排放量="companyEmission"
      :全台佔比="taiwanPercentage"
      :年度變化="-5"
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

    <!-- Coal Usage Chart Section -->
    <CompanyCoalUsageChart
      v-if="coalUsageData.length > 0"
      :data="coalUsageData"
    />

     <!-- Net Zero Path Simulator -->
    <CompanyNetZeroPathChart
      :基準年="基準年"
      :基準年排放量="基準年排放量"
      :現狀年="現狀年"
      :現狀排放量="companyEmission"
      :現狀目標排放量="現狀目標排放量"
      :中期目標年="中期目標年"
      :中期目標排放量="中期目標排放量"
      :中期預估排放量="中期預估排放量"
      :淨零目標年="淨零目標年"
      :淨零年預估排放量="淨零年預估排放量"
    />
  </UCard>
</template>
