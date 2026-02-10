<script setup lang="ts">
const route = useRoute()
const companySlug = route.params.slug as string

// SEO metadata using unified helper
useSeo({
  title: `${companySlug} - 企業詳細資訊`,
  description: `查看${companySlug}的溫室氣體排放量、減量目標與氣候行動詳細資訊`,
})
</script>

<template>
  <div>
    <h1 class="text-4xl font-bold">企業詳細頁</h1>
  </div>
</template>
