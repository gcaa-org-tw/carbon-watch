<script setup lang="ts">
import type { CompanyData } from '~/types/company'
import top10CompaniesData from '~/assets/data/top-10-companies.json'

// Use landing layout for this page
definePageMeta({
  layout: 'landing'
})

// SEO metadata
useSeoMeta({
  title: '排碳大戶觀測站 - 台灣排碳大戶氣候績效分析',
  description: '追蹤台灣排碳大戶，分析溫室氣體排放與氣候表現、檢視基金永續作為，透過氣候績效方法論協助快速辨識企業氣候責任。',
})

useHead({
  htmlAttrs: {
    lang: 'zh-TW'
  },
  link: [
    {
      rel: 'canonical',
      href: 'https://carbon-watch.gcaa.org.tw/'
    }
  ]
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
          title="氣候績效指標方法論"
          description="依據法規與國際標準，制定企業氣候表現檢核表"
          class="methodology-section"
          :ui="{container: 'gap-6 sm:gap-6'}"
        >
          <template #description>
            <p>綠盟參考台灣氣候法規及國際標準，</p>
            <p>制定涵蓋承諾、行動與透明度三大面向，</p>
            <p>共十項指標的氣候績效檢核表，檢驗企業氣候表現。</p>
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
          title="前十大溫室氣體排放企業"
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
