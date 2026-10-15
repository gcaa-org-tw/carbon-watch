<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  current: number
  previous: number
}

const props = defineProps<Props>()

const direction = computed<'up' | 'down' | null>(() => {
  if (props.current <= 0 || props.previous <= 0) return null
  if (props.current === props.previous) return null
  return props.current > props.previous ? 'up' : 'down'
})
</script>

<template>
  <span class="inline-block w-4 shrink-0 align-middle">
    <template v-if="direction">
      <UIcon
        :name="direction === 'up' ? 'i-heroicons-arrow-up-20-solid' : 'i-heroicons-arrow-down-20-solid'"
        class="size-4"
        :class="direction === 'up' ? 'text-status-bad' : 'text-status-great'"
        aria-hidden="true"
      />
      <span class="sr-only">{{ direction === 'up' ? '較前一年增加' : '較前一年減少' }}</span>
    </template>
  </span>
</template>
