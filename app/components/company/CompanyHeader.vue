<script setup lang="ts">
interface Props {
  公司: string
  淨零目標年?: string
  年排放量: number
  全台佔比?: number
  年度變化?: number
  預期碳費: number
}

const props = defineProps<Props>()

const formattedEmission = computed(() => {
  return props.年排放量.toLocaleString('zh-TW')
})

const formattedFee = computed(() => {
  return props.預期碳費.toLocaleString('zh-TW')
})

// Positive means increase, negative means decrease
const changeText = computed(() => {
  if (props.年度變化 === undefined || props.年度變化 === null) return null
  const absChange = Math.abs(props.年度變化)
  return props.年度變化 < 0
    ? `較去年下降 ${absChange}%`
    : `較去年上升 ${absChange}%`
})

const isDecrease = computed(() => props.年度變化 !== undefined && props.年度變化 < 0)
</script>

<template>
  <div>
    <!-- Header row: company name + net-zero year -->
    <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <h1 class="text-4xl font-bold text-earth-brown">
        {{ 公司 }}
      </h1>

      <div class="flex flex-wrap items-center gap-3">
        <div v-if="淨零目標年" class="flex items-baseline gap-2">
          <span class="text-lg font-bold text-earth-brown/70">淨零承諾年度</span>
          <span class="text-xl font-bold text-green-deep dark:text-green-mint">
            {{ 淨零目標年 }}
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
            年碳排 <span class="font-semibold">{{ formattedEmission }}</span> 噸
          </p>
          <div class="flex items-center gap-3 text-sm">
            <span v-if="全台佔比 !== undefined" class="flex items-center gap-1.5 text-earth-brown/70">
              <span class="inline-block w-2 h-2 rounded-full bg-earth-brown/50" />
              佔全台總碳排 {{ 全台佔比 }}%
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
            class="h-full bg-earth-brown dark:bg-earth-brown-light rounded transition-all duration-300"
            :style="{ width: `${Math.min(全台佔比, 100)}%` }"
          />
        </div>
      </div>

      <!-- Carbon fee -->
      <div class="md:text-right">
        <p class="text-l font-bold text-earth-brown">
          預期碳費 : <span class="font-semibold">{{ formattedFee }} NTD</span>
        </p>
      </div>
    </div>
  </div>
</template>
