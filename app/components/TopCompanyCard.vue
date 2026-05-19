<script setup lang="ts">
defineProps<{
  公司全名: string
  全台排放量: number
  全台佔比: number
  isActive: boolean
  compact?: boolean
}>()

defineEmits<{ click: [] }>()

const formatEmissions = (n: number) => n.toLocaleString('zh-TW')
</script>

<template>
  <button
    :class="compact ? 'text-left flex-none w-[180px] snap-start' : 'w-full text-left'"
    @click="$emit('click')"
  >
    <div
      class="rounded-xl shadow-md transition-all duration-200 cursor-pointer border-2"
      :class="[
        compact ? 'p-3 h-full' : 'p-4',
        isActive
          ? 'border-green-pure bg-green-mint/20'
          : compact
            ? 'bg-surface-warm border-transparent'
            : 'bg-surface-warm border-transparent hover:shadow-xl hover:-translate-y-0.5'
      ]"
    >
      <p class="lg:text-xl sm:text-lg text-md font-semibold text-earth-brown leading-snug">{{ 公司全名 }}</p>
      <p class="font-bold text-green-forest mt-1" :class="compact ? 'text-base' : 'text-lg'">
        {{ formatEmissions(全台排放量) }}
        <span class="font-normal text-gray-400" :class="compact ? 'text-xs' : 'text-sm'">
          {{ compact ? '噸' : '噸總碳排' }}
        </span>
      </p>
      <p class="text-green-deep mt-0.5" :class="compact ? 'text-xs' : 'text-sm'">
        佔全台製造業 {{ 全台佔比.toFixed(1) }}%
      </p>
    </div>
  </button>
</template>
