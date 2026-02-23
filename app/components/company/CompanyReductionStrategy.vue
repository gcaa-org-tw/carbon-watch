<script setup lang="ts">
interface Props {
  策略內容: string
}

defineProps<Props>()
</script>

<template>
  <div class="mt-8">
    <h3 class="text-lg font-bold text-earth-brown mb-4">
      具體減量策略
    </h3>
    <div class="bg-surface-warm/30 rounded-lg p-4">
      <p class="text-sm text-earth-brown leading-relaxed whitespace-pre-wrap">
        {{ 策略內容 || '尚無資料' }}
      </p>
    </div>
  </div>
</template>
