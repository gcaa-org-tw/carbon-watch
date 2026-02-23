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
  </UCard>
</template>
