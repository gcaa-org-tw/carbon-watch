<script setup lang="ts">
import type { CompanyData } from '~/types/company'

interface Props {
  company: CompanyData
}

const props = defineProps<Props>()

// Responsive state
const isPhone = ref(false)

onMounted(() => {
  const checkViewport = () => {
    isPhone.value = window.innerWidth < 768
  }
  checkViewport()
  window.addEventListener('resize', checkViewport)

  onUnmounted(() => {
    window.removeEventListener('resize', checkViewport)
  })
})

// Radar chart axes labels with category prefix
const radarAxesWithPrefix = [
  '2030年溫室氣體絕對減量目標',
  '2030年再生能源使用率目標',
  '2030年能源效率進步目標',
  '2024年再生能源使用率',
  '2022-2024年能源效率進步率',
  '範疇三及減量策略'
]

// Parse radar value from company data (expecting 0-3 scale)
const parseRadarValue = (value: string | undefined): number => {
  if (!value) return 0
  const num = parseFloat(value)
  return isNaN(num) ? 0 : Math.min(3, Math.max(0, num))
}

// Company radar data field mapping
const radarFieldMap: (keyof CompanyData)[] = [
  '2030年溫室氣體絕對減量目標',
  '2030年再生能源使用率目標',
  '2030年能源效率進步目標',
  '2024年再生能源使用率',
  '2022-2024年能源效率進步率',
  '範疇三及減量策略'
]

// Company radar data
const companyRadarData = computed(() => {
  return radarAxesWithPrefix.map((axis, index) => {
    const field = radarFieldMap[index]
    return {
      axis,
      value: parseRadarValue(field ? props.company[field] as string : undefined)
    }
  })
})

// Industry average radar data (mock data - typically around 1.5-2)
const industryRadarData = computed(() => {
  return radarAxesWithPrefix.map(axis => ({
    axis,
    value: 0
  }))
})

const companyName = computed(() => props.company.公司)
const industryName = computed(() => `${props.company.產業分類}業平均`)

// Score legend items
const scoreLegend = [
  { score: '0分', label: '不符期待/資料不足', color: '--color-gray-400' },
  { score: '1分', label: '有待加強', color: '--color-accent-yellow' },
  { score: '2分', label: '合乎標準', color: '--color-green-pure' },
  { score: '3分', label: '超乎期待', color: '--color-accent-blue' }
]
</script>

<template>
  <div class="mt-8">
    <!-- Mobile: stacked layout (full width each) -->
    <!-- Desktop/Tablet: 2 columns (radar left, metrics right) -->
    <div :class="isPhone ? 'flex flex-col gap-8' : 'flex items-stretch gap-7'">
      <!-- Radar Chart Section -->
      <div :class="isPhone ? '' : 'w-3/5 min-w-0'">
        <!-- Top Legend -->
        <div class="flex items-center justify-center gap-8 md:mb-8 mb-4">
          <div class="flex items-center gap-2">
            <span class="w-4 h-4 rounded-full bg-red-400" />
            <span class="md:text-sm text-xs text-earth-brown">{{ companyName }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-4 h-4 rounded-full bg-gray-400" />
            <span class="md:text-sm text-xs text-earth-brown">{{ industryName }}</span>
          </div>
        </div>

        <!-- Radar Chart -->
        <CompanyRadarChart
          :company-data="companyRadarData"
          :industry-data="industryRadarData"
          :score-legend="scoreLegend"
        />

        <!-- Bottom Score Legend -->
        <div class="flex flex-wrap items-center justify-center gap-6 md:mt-6 mt-3">
          <div
            v-for="item in scoreLegend"
            :key="item.score"
            class="flex items-center gap-2"
          >
            <span class="w-6 h-0.5" :style="{ backgroundColor: `var(${item.color})` }" />
            <span class="md:text-sm text-xs text-earth-brown/70">
              {{ item.score }}：{{ item.label }}
            </span>
          </div>
        </div>
      </div>

      <!-- Metrics Table Section -->
      <div :class="isPhone ? '' : 'w-2/5 min-w-0'">
        <CompanyMetricsTable :company="company" class="h-full" />
      </div>
    </div>
  </div>
</template>
