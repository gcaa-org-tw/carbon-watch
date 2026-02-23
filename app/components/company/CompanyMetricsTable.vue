<script setup lang="ts">
import type { CompanyData } from '~/types/company'

interface Props {
  company: CompanyData
}

const props = defineProps<Props>()

// Parse coal usage value
const formatCoalUsage = (value: string | undefined): string => {
  if (!value) return '-'
  const num = parseInt(value.replace(/,/g, ''), 10)
  return isNaN(num) ? '-' : `${num.toLocaleString('zh-TW')} 公噸`
}

// All metrics in display order
const allMetrics = computed(() => [
  {
    label: '2030 減量目標設定',
    value: props.company['2030 年減量目標設定'] || '-',
    isNegative: false,
    isPositive: false
  },
  {
    label: 'SBTi 承諾',
    value: props.company['SBTi 承諾'] === '❌' ? '無' : props.company['SBTi 承諾'] || '無',
    isNegative: props.company['SBTi 承諾'] === '❌',
    isPositive: false
  },
  {
    label: '範疇三揭露',
    value: props.company['範疇三揭露'] === '❌' ? '無' : props.company['範疇三揭露'] || '無',
    isNegative: props.company['範疇三揭露'] === '❌',
    isPositive: false
  },
  {
    label: '範疇三減量規劃',
    value: props.company['範疇三減量規劃'] === '❌' ? '無' : props.company['範疇三減量規劃'] || '無',
    isNegative: props.company['範疇三減量規劃'] === '❌',
    isPositive: false
  },
  {
    label: '近三年能效進步率',
    value: props.company['近三年能效進步率'] || '-',
    isNegative: props.company['近三年能效進步率']?.startsWith('-'),
    isPositive: false
  },
  {
    label: '節能目標設定',
    value: props.company['節能目標設定'] || '無',
    isNegative: props.company['節能目標設定'] === '無' || !props.company['節能目標設定'],
    isPositive: false
  },
  {
    label: '再生能源使用率',
    value: props.company['再生能源使用率'] || '-',
    isNegative: false,
    isPositive: false
  },
  {
    label: '再生能源設置容量',
    value: props.company['再生能源設置容量'] ? `${props.company['再生能源設置容量']} kW` : '-',
    isNegative: false,
    isPositive: false
  },
  {
    label: '是否完成用電大戶再生能源設置義務',
    value: props.company['是否完成用電大戶再生能源設置義務'] === '❌' ? '無' : props.company['是否完成用電大戶再生能源設置義務'] || '無',
    isNegative: props.company['是否完成用電大戶再生能源設置義務'] === '❌',
    isPositive: false
  },
  {
    label: '中期再生能源目標設定',
    value: props.company['中期再生能源目標設定'] || '-',
    isNegative: false,
    isPositive: !!props.company['中期再生能源目標設定'] && props.company['中期再生能源目標設定'] !== '-'
  },
  {
    label: 'RE100 承諾',
    value: props.company['RE100 承諾'] === '❌' ? '無' : props.company['RE100 承諾'] || '無',
    isNegative: props.company['RE100 承諾'] === '❌',
    isPositive: false
  },
  {
    label: '燃煤使用量（公噸）',
    value: formatCoalUsage(props.company['燃煤使用量（公噸）']),
    isNegative: false,
    isPositive: false
  }
])
</script>

<template>
  <div class="flex h-full flex-col flex-wrap justify-between gap-x-8">
    <div
      v-for="item in allMetrics"
      :key="item.label"
      class="flex items-baseline justify-between gap-4 py-1"
    >
      <span class="text-sm">{{ item.label }}</span>
      <span
        class="text-sm font-medium text-right"
        :class="{
          'text-accent-red': item.isNegative,
          'text-green-deep': item.isPositive
        }"
      >
        {{ item.value }}
      </span>
    </div>
  </div>
</template>
