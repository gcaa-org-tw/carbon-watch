<script setup lang="ts">
import type { CompanyData } from '~/types/company'
import top10CompaniesData from '~/assets/data/top-10-companies.json'

// Get top 10 companies
const top10Companies = top10CompaniesData as CompanyData[]
</script>

<template>
  <div class="space-y-8">
    <!-- Hero Section -->
    <UPageHero
      title="觀測企業清單 Top 10"
      class="custom-hero"
      :ui="{container: 'gap-8 sm:gap-8'}"
    >
      <CompanyTable :rows="top10Companies" :show-legend="false" />
    </UPageHero>
  </div>
</template>

<style scoped>
.custom-hero :deep(h1) {
  font-size: 2.25rem;
}
</style>
