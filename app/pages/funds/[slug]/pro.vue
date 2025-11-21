<script setup lang="ts">
import type { CompanyData } from '~/types/company'

const route = useRoute()
const { mode } = useViewMode()

// Get fund code from route params
const fundCode = computed(() => route.params.slug as string)

// Load fund data
const fundData = await import(`~/assets/data/funds/${fundCode.value}.json`).then(m => m.default)

// Convert fund companies to CompanyData format
const companies = computed<CompanyData[]>(() => {
  return fundData.companies as CompanyData[]
})

// Watch for mode changes and redirect if needed
watch(mode, (newMode) => {
  if (newMode === 'regular') {
    navigateTo(`/funds/${fundCode.value}`)
  }
})

// SEO metadata using unified helper
useSeo({
  title: `${fundData.meta.基金名稱} - 基金詳情 - 專業版`,
  description: `檢視${fundData.meta.基金名稱}投資的排碳大戶企業詳細資訊（專業版）`,
})
</script>

<template>
  <div class="py-8 space-y-6">
    <!-- Header with title and view mode switch -->
    <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
      <div>
        <h1 class="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
          {{ fundData.meta.基金名稱 }}
        </h1>
        <p class="text-lg text-earth-brown mt-2">
          {{ fundData.meta.基金代號 }}
        </p>
      </div>
      <div class="flex-shrink-0">
        <ViewModeSwitch :base-path="`/funds/${fundCode}`" />
      </div>
    </div>

    <!-- Company Table -->
    <div class="mt-8">
      <CompanyTable :rows="companies" :is-pro="true" />
    </div>

    <div v-if="companies.length === 0" class="text-center py-12">
      <p class="text-gray-500 dark:text-gray-400">
        此基金無排碳大戶企業資料
      </p>
    </div>
  </div>
</template>
