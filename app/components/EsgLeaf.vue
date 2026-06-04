<script setup lang="ts">
// Inline green leaf marker for ESG funds (境內發行之 ESG 基金). No emoji — an
// SVG so it renders identically everywhere. Sits after the fund name on the
// list and detail pages; the legend explains it.
withDefaults(defineProps<{ title?: string }>(), { title: '境內發行之 ESG 基金' })
</script>

<template>
  <span class="inline-flex items-center align-middle ml-1" :title="title" :aria-label="title">
    <svg viewBox="0 0 24 24" class="w-4 h-4 text-green-pure" fill="currentColor" aria-hidden="true">
      <path d="M5 21c0-7 4-13 14-15-1 9-6 14-12 14 1-4 4-7 8-9-5 1-8 4-10 10z" />
    </svg>
  </span>
</template>
