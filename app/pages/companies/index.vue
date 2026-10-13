<script setup lang="ts">
// Use shared company filter logic
const { filters, filteredCompanies } = useCompanyFilter()

definePageMeta({
  layout: 'landing',
})

// SEO metadata
useHead({
  title: '依企業查詢',
  meta: [
    { name: 'description', content: '檢視台灣排碳大戶企業的溫室氣體排放量、減量目標與氣候行動' }
  ]
})
</script>

<template>
  <div class="co-page">
    <CompanyListFilter v-model="filters" :result-count="filteredCompanies.length" />

    <div class="co-body">
      <CompanyTable :rows="filteredCompanies" :is-pro="false" />
    </div>
  </div>
</template>

<style scoped>
.co-page {
  padding: 40px 64px 56px;
}

@media (max-width: 900px) {
  .co-page {
    padding: 32px 24px 40px;
  }
}
</style>
