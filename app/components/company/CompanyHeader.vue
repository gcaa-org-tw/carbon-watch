<script setup lang="ts">
interface Props {
  公司: string
  公司全名?: string
  產業分類?: string
  產業小類?: string
  事業統編?: string
  公司代號?: string
  淨零目標年?: string
  有永續報告書?: boolean
  年排放量: number
  排放年度?: number
  全台佔比?: number
  年度變化?: number
  預期碳費: number | null
}

const props = defineProps<Props>()

const title = computed(() => props.公司全名 ? `${props.公司全名}（${props.公司}）` : props.公司)

const industryText = computed(() => props.產業分類 ? industryLabel(props.產業分類, props.產業小類) : '')

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

const formattedFee = computed(() =>
  props.預期碳費 === null ? '無資料' : formatApproxWithUnit(props.預期碳費, '元')
)

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
        <p v-if="industryText" class="mt-2 text-sm text-earth-brown/70">
          {{ industryText }}
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
        <p class="text-l font-bold text-earth-brown">
          預期碳費：<span class="font-semibold whitespace-nowrap">{{ formattedFee }}</span>
        </p>
        <p v-if="預期碳費 !== null" class="mt-1 text-xs text-earth-brown/60">
          以每公噸 300 元計算，未計入自主減量計畫的優惠費率
        </p>
      </div>
    </div>
  </div>
</template>
