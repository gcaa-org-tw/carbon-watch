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
      href: 'https://thaubing-esg.gcaa.org.tw/'
    },
    {
      rel: 'preconnect',
      href: 'https://fonts.googleapis.com'
    },
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;700&family=IBM+Plex+Mono:wght@400;500&display=swap'
    }
  ]
})

// Get top 10 companies
const top10Companies = top10CompaniesData as CompanyData[]

// Hero section: scroll to company performance section
const companiesSection = ref<HTMLElement>()
function scrollToCompanies() {
  companiesSection.value?.scrollIntoView({ behavior: 'smooth' })
}
</script>

<template>
  <div>
    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-eyebrow">台灣氣候績效追蹤平台</div>
      <h1>追蹤台灣<em>排碳大戶</em><br>一鍵看清氣候責任</h1>
      <p class="hero-sub">追蹤 300+ 家企業溫室氣體排放量、減量承諾與行動成果，以透明數據推動台灣氣候行動。</p>
      <div class="hero-actions">
        <button class="btn-primary" @click="scrollToCompanies">了解企業表現</button>
        <NuxtLink to="/methodology" class="btn-secondary">氣候績效指標方法論</NuxtLink>
      </div>
    </section>

    <!-- Stat Strip -->
    <div class="stat-strip">
      <div class="stat-cell">
        <div class="stat-cell-label">追蹤製造業</div>
        <div class="stat-cell-val">300+</div>
        <div class="stat-cell-sub">排碳大戶公司</div>
      </div>
      <div class="stat-cell">
        <div class="stat-cell-label">涵蓋全國</div>
        <div class="stat-cell-val">54%</div>
        <div class="stat-cell-sub">溫室氣體排放</div>
      </div>
      <div class="stat-cell">
        <div class="stat-cell-label">2024年相較2023年</div>
        <div class="stat-cell-val">-1.38%</div>
        <div class="stat-cell-sub">溫室氣體排放量</div>
      </div>
      <div class="stat-cell">
        <div class="stat-cell-label">比對發現</div>
        <div class="stat-cell-val">116</div>
        <div class="stat-cell-sub">家公司排放量仍在上升</div>
      </div>
    </div>

    <!-- Top 10 Companies Region Map Section -->
    <TopCompanyMapSection />

    <!-- Region Emission Map Section -->
    <RegionEmissionSection />

    <!-- Methodology Section -->
    <div class="py-12">
      <ContentContainer>
        <UPageHero
          title="氣候績效指標方法論"
          description="依據法規與國際標準，制定企業氣候表現檢核表"
          class="methodology-section"
          :ui="{container: 'gap-6 sm:gap-6', title: 'text-earth-brown'}"
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
    <div ref="companiesSection" class="py-6 top-10-section">
      <ContentContainer>
        <UPageHero
          title="前十大溫室氣體排放企業"
          class="custom-hero text-4xl"
          :ui="{container: 'gap-8 lg:pb-8 md:pb-8 sm:gap-8 pb-8', title: 'text-earth-brown'}"
        />
        <div class="lg:mx-15 mb-20 sm:px-2">
          <CompanyTable :rows="top10Companies"/>
        </div>
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

/* ── HERO (依 排碳大戶_mockup.html 設計) ───────────────── */
.hero {
  padding: 72px 64px 56px;
  background:
    radial-gradient(ellipse 70% 60% at 10% 80%, rgba(58, 154, 92, .07) 0%, transparent 70%),
    radial-gradient(ellipse 50% 40% at 90% 10%, rgba(58, 154, 92, .05) 0%, transparent 60%),
    #090D0A;
}

.hero-eyebrow {
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: .12em;
  color: #3A9A5C;
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.hero-eyebrow::before {
  content: '';
  width: 20px;
  height: 1px;
  background: #3A9A5C;
  display: inline-block;
}

.hero h1 {
  font-family: 'Noto Sans TC', 'PingFang TC', sans-serif;
  font-size: 40px;
  font-weight: 700;
  letter-spacing: -.025em;
  line-height: 1.2;
  margin-bottom: 16px;
  color: #DDE8DF;
}

.hero h1 em {
  color: #5BB278;
  font-style: normal;
}

.hero-sub {
  font-size: 15px;
  color: #8A9E8D;
  max-width: 520px;
  margin-bottom: 36px;
  line-height: 1.75;
}

.hero-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.btn-primary {
  background: #3A9A5C;
  color: #090D0A;
  border: 1px solid #3A9A5C;
  border-radius: 8px;
  padding: 10px 22px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background .15s;
}

.btn-primary:hover {
  background: #2A7A45;
}

.btn-secondary {
  display: inline-block;
  background: transparent;
  color: #5BB278;
  border: 1px solid #1D5C31;
  border-radius: 8px;
  padding: 10px 22px;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
  text-decoration: none;
  cursor: pointer;
  transition: all .15s;
}

.btn-secondary:hover {
  background: #172019;
  border-color: #3A9A5C;
  color: #7FCF98;
}

/* ── STAT STRIP (依 排碳大戶_mockup.html 設計) ─────────── */
.stat-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1px;
  background: #1F2D22;
  border-top: 1px solid #1F2D22;
  border-bottom: 1px solid #1F2D22;
}

.stat-cell {
  background: #0F1511;
  padding: 22px 28px;
}

.stat-cell-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: .09em;
  color: #556A58;
  margin-bottom: 6px;
  font-weight: 500;
}

.stat-cell-val {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 28px;
  font-weight: 700;
  color: #5BB278;
  letter-spacing: -.02em;
  line-height: 1;
}

.stat-cell-sub {
  font-size: 12px;
  color: #8A9E8D;
  margin-top: 4px;
}

@media (max-width: 768px) {
  .hero {
    padding: 48px 24px 40px;
  }

  .hero h1 {
    font-size: 30px;
  }

  .stat-strip {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
