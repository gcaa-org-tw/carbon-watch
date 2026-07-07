<script setup lang="ts">
import { computed } from 'vue'
import type { CoalYearPoint } from '~/types/coalMap'

interface Props {
  data: CoalYearPoint[]
  width?: number
  height?: number
}

const props = withDefaults(defineProps<Props>(), {
  width: 132,
  height: 36,
})

const YEAR_MIN = 2020
const YEAR_MAX = 2025
const PAD = 4

interface SparkPoint {
  x: number
  y: number
  year: number
  value: number
}

const points = computed<SparkPoint[]>(() => {
  if (props.data.length === 0) return []
  const maxValue = Math.max(...props.data.map(p => p.value))
  if (maxValue <= 0) return []
  return props.data.map(p => ({
    x: PAD + ((p.year - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)) * (props.width - PAD * 2),
    y: props.height - PAD - (p.value / maxValue) * (props.height - PAD * 2),
    year: p.year,
    value: p.value,
  }))
})

const linePath = computed(() =>
  points.value.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
)
</script>

<template>
  <svg
    :width="width"
    :height="height"
    :viewBox="`0 0 ${width} ${height}`"
    role="img"
    aria-label="歷年用煤量趨勢"
  >
    <path
      v-if="points.length > 1"
      :d="linePath"
      fill="none"
      stroke="rgba(196, 190, 154, 0.85)"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <circle
      v-for="p in points"
      :key="p.year"
      :cx="p.x"
      :cy="p.y"
      :r="p.year === 2024 ? 3 : 2"
      :fill="p.year === 2024 ? '#5AE694' : 'rgba(196, 190, 154, 0.85)'"
    />
  </svg>
</template>
