<script setup lang="ts">
import type { CompanyData } from '~/types/company'
import top10CompaniesData from '~/assets/data/top-10-companies.json'

// Use landing layout for this page
definePageMeta({
  layout: 'landing'
})

// SEO metadata using unified helper
useSeo({
  title: '碳排大戶觀測站 - 台灣企業碳排放追蹤與分析',
  description: '台灣企業碳排放觀測平台，追蹤排碳大戶、分析區域排放量、檢視投資基金碳排表現。綠盟十項檢驗標準，協助您快速辨識企業環境責任表現。',
  canonical: 'https://carbon-watch.gcaa.org.tw/',
  appendSiteName: false, // This page already includes the full site name in the title
})

// Get top 10 companies
const top10Companies = top10CompaniesData as CompanyData[]
</script>

<template>
  <div>
    <!-- Region Emission Map Section -->
    <RegionEmissionSection />

    <!-- Methodology Section -->
    <div class="py-12">
      <ContentContainer>
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
      </ContentContainer>
    </div>

    <!-- Top 10 Companies Section -->
    <div class="py-6 top-10-section">
      <ContentContainer>
        <UPageHero
          title="觀測企業清單 Top 10"
          class="custom-hero"
          :ui="{container: 'gap-8 sm:gap-8'}"
        >
          <CompanyTable :rows="top10Companies" :show-legend="false" />
        </UPageHero>
      </ContentContainer>
    </div>
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

.top-10-section {
  background: linear-gradient(to bottom right, var(--color-surface-mint, #e0f2f1), var(--color-surface-warm, #f5f5dc));
}
</style>
