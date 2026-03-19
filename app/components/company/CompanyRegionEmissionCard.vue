<script setup lang="ts">
interface Props {
  縣市: string
  縣市佔比: number
  排放量: number
}

const props = defineProps<Props>()

const formattedEmission = computed(() => {
  return props.排放量.toLocaleString('zh-TW')
})
</script>

<template>
  <div>
    <div class="flex items-baseline justify-between gap-2 mb-1">
      <span class="text-sm text-earth-brown">{{ 縣市 }}</span>
      <span class="text-xs text-earth-brown/70 whitespace-nowrap">
        佔縣市碳排 {{ 縣市佔比 }}%
      </span>
    </div>
    <div class="h-5 bg-surface-warm rounded mb-1">
      <div
        class="h-full bg-earth-brown dark:bg-earth-brown-light rounded transition-all duration-300"
        :style="{ width: `${Math.min(縣市佔比, 100)}%` }"
      />
    </div>
    <p class="text-sm text-earth-brown">
      {{ formattedEmission }} 公噸
    </p>
  </div>
</template>
