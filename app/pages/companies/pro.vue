<script setup lang="ts">
// Initialize view mode composable
const { mode } = useViewMode()

// Use shared company filter logic
const { filters, filteredCompanies } = useCompanyFilter()

// Watch for mode changes and redirect if needed
watch(mode, (newMode) => {
  if (newMode === 'regular') {
    navigateTo('/companies')
  }
})

// SEO metadata
useHead({
  title: '排碳大戶觀測企業清單 - 專業版',
  meta: [
    { name: 'description', content: '檢視台灣排碳大戶企業的詳細氣候數據與減碳策略' }
  ]
})
</script>

<template>
  <div class="py-8">
    <CompanyListFilter v-model="filters" />
    
    <div class="mt-8">
      <CompanyTable :rows="filteredCompanies" :is-pro="true" />
    </div>

    <div v-if="filteredCompanies.length === 0" class="text-center py-12">
      <p class="text-gray-500 dark:text-gray-400">
        找不到符合條件的企業
      </p>
    </div>
  </div>
</template>
