<script setup lang="ts">
import type { CompanyData } from '~/types/company'

interface Props {
  公司: string
  公司全名?: string
  產業分類?: string
  事業統編?: string
  公司代號?: string
  淨零目標年?: string
  有永續報告書?: boolean
  年排放量: number
  排放年度?: number
  全台佔比?: number
  年度變化?: number
  碳費: Pick<CompanyData, '碳費表廠數' | '碳費_一般費率（元）' | '高碳洩漏廠數' | '自主減量A級廠數' | '自主減量B級廠數' | '自主減量未申請廠數' | '碳費_優惠費率（元）'>
}

const props = defineProps<Props>()

const title = computed(() => props.公司全名 ? `${props.公司全名}（${props.公司}）` : props.公司)

const UNLISTED = '非上市櫃'
const identifiers = computed(() => [
  props.事業統編 ? `統編 ${props.事業統編}` : '',
  props.公司代號 && props.公司代號 !== UNLISTED ? `股票代號 ${props.公司代號}` : '',
].filter(Boolean).join('；'))

const formattedEmission = computed(() => formatApproxWithUnit(props.年排放量, '公噸'))

const netZeroText = computed(() => {
  const placeholder = reportPlaceholder(props.淨零目標年, props.有永續報告書 !== false)
  if (placeholder) return placeholder
  const raw = String(props.淨零目標年).trim()
  return raw === '無' || raw === '無承諾' ? NOT_DISCLOSED : raw
})

const generalFee = computed(() => props.碳費['碳費_一般費率（元）'] ?? null)

const formattedFee = computed(() =>
  generalFee.value === null ? '無資料' : formatApproxWithUnit(generalFee.value, '元')
)

const leakageText = computed(() => {
  const leakage = props.碳費['高碳洩漏廠數'] ?? 0
  const others = (props.碳費['碳費表廠數'] ?? 0) - leakage
  if (others === 0) return '屬'
  if (leakage === 0) return '非屬'
  return `${leakage} 廠屬、${others} 廠非屬`
})

const reductionPlanText = computed(() =>
  ([
    ['A 級', props.碳費['自主減量A級廠數']],
    ['B 級', props.碳費['自主減量B級廠數']],
    ['未申請', props.碳費['自主減量未申請廠數']],
  ] as const)
    .filter(([, count]) => (count ?? 0) > 0)
    .map(([label, count]) => `${label} ${count} 廠`)
    .join('、')
)

const canHover = ref(false)
onMounted(() => {
  canHover.value = window.matchMedia('(hover: hover)').matches
})
const feePopoverMode = computed(() => canHover.value ? 'hover' : 'click')

const feeDetails = computed(() => {
  if (generalFee.value === null) return []
  return [
    `高碳洩漏風險行業：${leakageText.value}`,
    `自主減量計畫：${reductionPlanText.value}`,
    `依優惠費率計算：${formatApproxWithUnit(props.碳費['碳費_優惠費率（元）'] ?? 0, '元')}`,
  ]
})

// Positive means increase, negative means decrease
const changeText = computed(() => {
  if (props.年度變化 === undefined || props.年度變化 === null) return null
  const absChange = Math.abs(props.年度變化)
  return props.年度變化 < 0
    ? `較去年下降 ${absChange}%`
    : `較去年上升 ${absChange}%`
})

const formattedTaiwanShare = computed(() => {
  if (props.全台佔比 === undefined) return null
  if (props.全台佔比 < 0.1) return '<0.1'
  return props.全台佔比.toFixed(1)
})

const isDecrease = computed(() => props.年度變化 !== undefined && props.年度變化 < 0)
</script>

<template>
  <div>
    <!-- Header row: company name + net-zero year -->
    <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div class="mt-0 sm:mt-8 mb-8 pb-8 min-w-0">
        <h1 class="text-3xl sm:text-[2.5rem] font-bold text-earth-brown leading-[1.2]">
          {{ title }}
        </h1>
        <p v-if="產業分類" class="mt-2 text-sm text-earth-brown/70">
          {{ 產業分類 }}
        </p>
        <p v-if="identifiers" class="mt-1 text-sm text-earth-brown/70">
          {{ identifiers }}
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-3 pt-10">
        <div class="flex items-baseline gap-2">
          <span class="text-lg font-bold text-earth-brown">淨零承諾年度</span>
          <span class="text-xl font-bold text-green-mint">
            {{ netZeroText }}
          </span>
        </div>
      </div>
    </div>

    <!-- Stats row: emission summary + carbon fee -->
    <div class="mt-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-12">
      <!-- Emission summary -->
      <div class="flex-1">
        <div class="flex items-center justify-between gap-4 flex-wrap">
          <p class="text-l font-bold text-earth-brown">
            {{ 排放年度 ? `${排放年度} 年碳排` : '年碳排' }} <span class="font-semibold whitespace-nowrap">{{ formattedEmission }}</span>
          </p>
          <div class="flex items-center gap-3 text-sm">
            <span v-if="formattedTaiwanShare !== null" class="flex items-center gap-1.5 text-earth-brown">
              <span class="inline-block w-2 h-2 rounded-full bg-green-deep" />
              佔全台製造業總碳排 {{ formattedTaiwanShare }}%
            </span>
            <span
              v-if="changeText"
              class="flex items-center gap-1 text-accent-red"
            >
              <UIcon
                :name="isDecrease ? 'i-heroicons-arrow-down-20-solid' : 'i-heroicons-arrow-up-20-solid'"
                class="w-4 h-4"
              />
              {{ changeText }}
            </span>
          </div>
        </div>
        <div v-if="全台佔比 !== undefined" class="h-4 bg-surface-warm rounded mb-3 mt-3">
          <div
            class="h-full bg-earth-brown-light rounded transition-all duration-300"
            :style="{ width: `${Math.min(全台佔比, 100)}%` }"
          />
        </div>
      </div>

      <!-- Carbon fee -->
      <div class="md:text-right">
        <div class="flex items-center gap-1 md:justify-end text-l font-bold text-earth-brown">
          <span>預期碳費：<span class="font-semibold whitespace-nowrap">{{ formattedFee }}</span></span>
          <UPopover
            v-if="feeDetails.length > 0"
            :key="feePopoverMode"
            :mode="feePopoverMode"
            :ui="{ content: 'max-w-60 bg-gray-900 px-3 py-2.5 ring-0 shadow-md' }"
          >
            <UButton
              icon="i-heroicons-information-circle"
              color="neutral"
              variant="link"
              size="xs"
              square
              class="p-0 text-earth-brown/60 cursor-help"
              aria-label="說明"
            />
            <template #content>
              <div class="flex flex-col gap-1 text-left text-xs font-normal leading-relaxed text-white">
                <p v-for="line in feeDetails" :key="line">
                  {{ line }}
                </p>
              </div>
            </template>
          </UPopover>
        </div>
        <p v-if="generalFee !== null" class="mt-1 text-xs text-earth-brown/60">
          以每公噸 300 元計算，未計入自主減量計畫的優惠費率
        </p>
      </div>
    </div>
  </div>
</template>
