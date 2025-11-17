<script setup lang="ts">
import type { CompanyData } from '~/types/company'
import top10CompaniesData from '~/assets/data/top-10-companies.json'

// Get top 10 companies
const top10Companies = top10CompaniesData as CompanyData[]
</script>

<template>
  <div class="space-y-8">
    <!-- Methodology Section -->
    <UPageHero
      title="綠盟的十項檢驗標準"
      description="我們制定了十項標準來檢驗企業組織在排碳上的表現"
      class="methodology-section"
      :ui="{container: 'gap-6 sm:gap-6'}"
    >
      <template #description>
        <p>我們制定了十項標準來檢驗企業組織在排碳上的表現</p>
        <p>參考國際多項標準，綜合了承諾、實作進度等指標，協助快速辨識企業表現。</p>
      </template>
      <template #links>
        <UButton
          to="/methodology"
          color="primary"
          size="lg"
          trailing-icon="i-heroicons-arrow-right-20-solid"
        >
          查看方法論定義
        </UButton>
      </template>
    </UPageHero>

    <!-- Top 10 Companies Section -->
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
.methodology-section :deep(h1) {
  font-size: 2rem;
}

.methodology-section :deep(h1 + div) {
  font-size: 1.125rem;
  line-height: 1.75;
  color: var(--color-green-deep);
}

.custom-hero :deep(h1) {
  font-size: 2.25rem;
}
</style>
