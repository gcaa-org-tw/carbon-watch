<script setup lang="ts">
// Initialize view mode composable
const { mode } = useViewMode()

// Use shared company filter logic
const { filters, filteredCompanies } = useCompanyFilter()

// Watch for mode changes and redirect if needed
watch(mode, (newMode) => {
  if (newMode === 'pro') {
    navigateTo('/companies/pro')
  }
})

// SEO metadata using unified helper
useSeo({
  title: '排碳大戶觀測企業清單 - 易讀版',
  description: '檢視台灣排碳大戶企業的溫室氣體排放量、減量目標與氣候行動',
})
</script>

<template>
  <div class="py-8">
    <CompanyListFilter v-model="filters" />
    
    <div class="mt-8">
      <CompanyTable :rows="filteredCompanies" :is-pro="false" />
    </div>

    <div v-if="filteredCompanies.length === 0" class="text-center py-12">
      <p class="text-gray-500 dark:text-gray-400">
        找不到符合條件的企業
      </p>
    </div>
  </div>
</template>
