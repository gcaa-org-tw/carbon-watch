<script setup lang="ts">
import type { CompanyData } from '~/types/company'

interface Props {
  company: CompanyData
}

const props = defineProps<Props>()

// Convert emoji status to text
const CROSS = String.fromCodePoint(0x274C)
const CHECK = String.fromCodePoint(0x2705)
const statusText = (val: string | undefined, fallback = String.fromCodePoint(0x7121)): { value: string, isNegative: boolean } => {
  if (!val) return { value: fallback, isNegative: true }
  if (val === CROSS) return { value: fallback, isNegative: true }
  if (val === CHECK) return { value: String.fromCodePoint(0x2713), isNegative: false }
  return { value: val, isNegative: false }
}

// Format decimal as percentage; handle inputs that are already "X%" strings.
const formatPercent = (value: string | undefined): string => {
  if (!value || value === '-') return '-'
  const cleaned = value.replace(/[,\s]/g, '')
  const decimal = cleaned.endsWith('%')
    ? parseFloat(cleaned.slice(0, -1)) / 100
    : parseFloat(cleaned)
  if (isNaN(decimal)) return value
  return `${Math.round(decimal * 100)}%`
}

// Parse coal usage value
const formatCoalUsage = (value: string | undefined): string => {
  if (!value) return '-'
  const num = parseInt(value.replace(/,/g, ''), 10)
  return isNaN(num) ? '-' : `${num.toLocaleString('zh-TW')} 公噸`
}

// Format renewable installed capacity (preserves decimals, adds thousand separator)
const formatCapacity = (value: string | undefined): string => {
  if (!value) return '-'
  const num = parseFloat(value.replace(/,/g, ''))
  return isNaN(num) ? '-' : `${num.toLocaleString('zh-TW')} kW`
}

// All metrics in display order
const allMetrics = computed(() => [
  {
    label: '2030 減量目標設定',
    value: props.company['2030 年減量目標設定'] || '-',
    isNegative: false,
    isPositive: false,
    tooltip: props.company['2030 年減量目標設定_推估說明']
  },
  {
    label: 'SBTi 承諾',
    ...statusText(props.company['SBTi 承諾']),
    isPositive: false,
    tooltip: undefined
  },
  {
    label: '範疇三揭露',
    ...statusText(props.company['範疇三揭露']),
    isPositive: false,
    tooltip: undefined
  },
  {
    label: '範疇三減量規劃',
    ...statusText(props.company['範疇三減量規劃']),
    isPositive: false,
    tooltip: undefined
  },
  {
    label: '近三年能效進步率',
    value: props.company['近三年能效進步率'] || '-',
    isNegative: props.company['近三年能效進步率']?.startsWith('-'),
    isPositive: false,
    tooltip: undefined
  },
  {
    label: '節能目標設定',
    value: props.company['節能目標設定'] || '無',
    isNegative: props.company['節能目標設定'] === '無' || !props.company['節能目標設定'],
    isPositive: false,
    tooltip: undefined
  },
  {
    label: '再生能源使用率',
    value: props.company['再生能源使用率'] || '-',
    isNegative: false,
    isPositive: false,
    tooltip: undefined
  },
  {
    label: '再生能源設置容量',
    value: formatCapacity(props.company['再生能源設置容量']),
    isNegative: false,
    isPositive: false,
    tooltip: undefined
  },
  {
    label: '是否完成用電大戶再生能源設置義務',
    ...statusText(props.company['是否完成用電大戶再生能源設置義務']),
    isPositive: false,
    tooltip: undefined
  },
  {
    label: '中期再生能源目標設定',
    value: formatPercent(props.company['中期再生能源目標設定']),
    isNegative: props.company['中期再生能源目標設定'] === 'NA',
    isPositive: !!props.company['中期再生能源目標設定'] && !['-', 'NA'].includes(props.company['中期再生能源目標設定'])
  },
  {
    label: 'RE100 承諾',
    ...statusText(props.company['RE100 承諾']),
    isPositive: false,
    tooltip: undefined
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
      class="flex items-baseline justify-between gap-4 py-1 text-earth-brown"
    >
      <span class="text-sm flex items-center gap-1">
        {{ item.label }}
        <UTooltip
          v-if="item.tooltip"
          :text="item.tooltip"
          :delay-duration="0"
          :ui="{
            content: 'h-auto !max-w-[130px] !text-white bg-gray-900 px-3 py-2.5 ring-0 shadow-md',
            text: '!whitespace-normal !text-white leading-relaxed text-xs block'
          }"
        >
          <UIcon
            name="i-heroicons-information-circle"
            class="w-3.5 h-3.5 text-earth-brown/60 cursor-help shrink-0"
            aria-label="說明"
            tabindex="0"
          />
        </UTooltip>
      </span>
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
