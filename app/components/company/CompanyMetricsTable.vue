<script setup lang="ts">
import type { CompanyData } from '~/types/company'

interface Props {
  company: CompanyData
}

const props = defineProps<Props>()

interface Metric {
  label: string
  value: string
  isNegative: boolean
  isPositive: boolean
  tooltip?: string
}

const hasReport = computed(() => props.company['有永續報告書'] !== false)

const plain = (value: string, isNegative = false, isPositive = false) => ({ value, isNegative, isPositive })

// Report flags: only RE100 shows ✗; any other non-✅ means the report does not say
const checkMetric = (raw: string | undefined, showCross = false) => {
  const value = reportCheck(raw, hasReport.value, showCross)
  return plain(value, value === '✗')
}

const SBTI_CHECK = String.fromCodePoint(0x2705)
const SBTI_CROSS = String.fromCodePoint(0x274C)
const sbtiMetric = (raw: string | undefined) => {
  if (!raw) return plain(NOT_DISCLOSED)
  if (raw === SBTI_CROSS) return plain(String.fromCodePoint(0x2717), true)
  if (raw === SBTI_CHECK) return plain(String.fromCodePoint(0x2713))
  return plain(raw)
}

// 用電大戶義務 comes from government records, not the report: blank means not fulfilled
const obligationMetric = (raw: string | undefined) =>
  raw === '✅' ? plain('✓') : plain('✗', true)

// 能源密集度變化率: + = intensity rose (worse → red), − = fell (improved → green)
const intensityChange = (val: string | undefined) => {
  const placeholder = reportPlaceholder(val, hasReport.value)
  if (placeholder) return plain(placeholder)
  const raw = String(val).trim()
  if (raw === '-') return plain(NOT_DISCLOSED)
  const num = parseFloat(raw.replace(/[%,\s]/g, ''))
  if (isNaN(num)) return plain(raw)
  return plain(raw, num > 0, num < 0)
}

// Format decimal as percentage; handle inputs that are already "X%" strings.
const formatPercent = (value: string): string => {
  const cleaned = value.replace(/[,\s]/g, '')
  const decimal = cleaned.endsWith('%')
    ? parseFloat(cleaned.slice(0, -1)) / 100
    : parseFloat(cleaned)
  if (isNaN(decimal)) return value
  return `${Math.round(decimal * 100)}%`
}

const targetMetric = (raw: string | undefined, format: (v: string) => string = v => v, positive = false) => {
  if (!hasReport.value) return plain(NO_REPORT)
  const s = String(raw ?? '').trim()
  if (s === '' || s === 'NA') return plain(NOT_DISCLOSED)
  return plain(format(s), false, positive)
}

const rawMetric = (raw: string | undefined) => {
  const placeholder = reportPlaceholder(raw, hasReport.value)
  return plain(placeholder ?? String(raw).trim())
}

const formatNumberWithUnit = (raw: string | undefined, unit: string) => {
  const s = String(raw ?? '').trim()
  if (s === '') return NOT_DISCLOSED
  const num = Math.round(parseFloat(s.replace(/,/g, '')))
  return isNaN(num) ? NOT_DISCLOSED : `${num.toLocaleString('zh-TW')} ${unit}`
}

const capacityMetric = (raw: string | undefined) => {
  const placeholder = reportPlaceholder(raw, hasReport.value)
  return plain(placeholder ?? formatNumberWithUnit(raw, 'kW'))
}

// Not report data: blank means not recorded
const coalMetric = (raw: string | undefined) => plain(formatNumberWithUnit(raw, '公噸'))
const coalShareMetric = (raw: string | undefined) => plain(String(raw ?? '').trim() || NOT_DISCLOSED)

// All metrics in display order
const allMetrics = computed<Metric[]>(() => [
  {
    label: '2030 減量目標設定',
    ...rawMetric(props.company['2030 年減量目標設定']),
    tooltip: props.company['2030 年減量目標設定_推估說明']
  },
  { label: 'SBTi 承諾', ...sbtiMetric(props.company['SBTi 承諾']) },
  { label: '範疇三揭露', ...checkMetric(props.company['範疇三揭露']) },
  { label: '範疇三減量規劃', ...checkMetric(props.company['範疇三減量規劃']) },
  { label: '近三年能源密集度變化率', ...intensityChange(props.company['近三年能效進步率']) },
  { label: '節能目標設定', ...targetMetric(props.company['節能目標設定']) },
  { label: '再生能源使用率', ...rawMetric(props.company['再生能源使用率']) },
  { label: '再生能源設置容量', ...capacityMetric(props.company['再生能源設置容量']) },
  { label: '是否完成用電大戶再生能源設置義務', ...obligationMetric(props.company['是否完成用電大戶再生能源設置義務']) },
  { label: '中期再生能源目標設定', ...targetMetric(props.company['中期再生能源目標設定'], formatPercent, true) },
  { label: 'RE100 承諾', ...checkMetric(props.company['RE100 承諾'], true) },
  { label: '2025 年燃煤使用量（公噸）', ...coalMetric(props.company['燃煤使用量（公噸）']) },
  { label: '2025 年用煤佔全台製造業比例', ...coalShareMetric(props.company['用煤佔全台製造業比例']) }
])
</script>

<template>
  <div class="flex h-full flex-col gap-2">
    <div class="flex flex-1 flex-col flex-wrap justify-between gap-x-8">
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
              content: 'h-auto !max-w-[150px] !text-white bg-gray-900 px-3 py-2.5 ring-0 shadow-md',
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
          class="text-sm font-medium text-right whitespace-nowrap"
          :class="{
            'text-accent-red': item.isNegative,
            'text-green-deep': item.isPositive
          }"
        >
          {{ item.value }}
        </span>
      </div>
    </div>
    <p class="text-xs text-earth-brown/60">
      無法取得資料的部分用 NA 表示
    </p>
  </div>
</template>
