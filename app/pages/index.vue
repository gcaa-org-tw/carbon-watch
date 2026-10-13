<script setup lang="ts">
import type { CompanyData } from '~/types/company'
import top10CompaniesData from '~/assets/data/top-10-companies.json'

definePageMeta({
  layout: 'landing'
})

useSeoMeta({
  description: '追蹤台灣排碳大戶，分析溫室氣體排放與氣候表現、檢視基金永續作為，透過氣候績效方法論協助快速辨識企業氣候責任。',
})

const top10Companies = top10CompaniesData as CompanyData[]
</script>

<template>
  <div>
    <!-- Hero + Stat Strip -->
    <SiteHero />

    <!-- Section 1: 前十大碳排企業縣市分布 -->
    <TopCompanyMapSection />

    <!-- Section 2: 各縣市排碳大戶排放量 -->
    <RegionEmissionSection />

    <!-- Section 3: 前十大溫室氣體排放企業 -->
    <section class="page-section">
      <div class="section-head">
        <h2>前十大排碳大戶</h2>
      </div>
      <CompanyTable :rows="top10Companies" show-rank />
    </section>

    <!-- Section 4: 氣候績效指標方法論 -->
    <ClimatePillarSection />
  </div>
</template>

<style scoped>
.page-section {
  padding: 56px 64px;
  border-top: 1px solid var(--color-bg-border);
}

.section-head {
  margin-bottom: 22px;
}

.section-head h2 {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.015em;
}

@media (max-width: 900px) {
  .page-section {
    padding: 40px 24px;
  }
}
</style>
