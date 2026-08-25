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
      <p class="hero-sub">追蹤 350+ 家企業溫室氣體排放量、減量承諾與行動成果，以透明數據推動台灣氣候行動。</p>
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
    <section class="methodology-section">
      <ContentContainer>
        <div class="section-head">
          <h2>氣候績效指標方法論</h2>
          <p>綠盟參考台灣氣候法規及國際標準，制定涵蓋承諾、行動與透明度三大面向，共十項指標的氣候績效檢核表，檢驗企業氣候表現。</p>
        </div>

        <div class="pillar-grid">
          <div class="pillar">
            <div class="pillar-head"><span class="pillar-title">承諾</span><span class="pillar-count">2 項指標</span></div>
            <div class="pillar-item"><span class="pillar-num">1</span><span class="pillar-text">承諾在 2050 年或更早實現淨零排放（範疇一＋二）</span></div>
            <div class="pillar-item"><span class="pillar-num">2</span><span class="pillar-text">2030 年的減量目標不低於國家目標（26%），或是有取得科學基礎減量目標（SBT）</span></div>
          </div>

          <div class="pillar">
            <div class="pillar-head"><span class="pillar-title">行動</span><span class="pillar-count">5 項指標</span></div>
            <div class="pillar-item"><span class="pillar-num">3</span><span class="pillar-text">近三年的能源密集度（2022 年–2024 年）平均進步幅度達 2%</span></div>
            <div class="pillar-item"><span class="pillar-num">4</span><span class="pillar-text">中期（2030 年）的平均年節能率或年節電率目標大於 1.5%</span></div>
            <div class="pillar-item"><span class="pillar-num">5</span><span class="pillar-text">用電大戶完成法規要求「再生能源建置義務為契約容量的 10%」</span></div>
            <div class="pillar-item"><span class="pillar-num">6</span><span class="pillar-text">說明既有法規義務之上的再生能源中長期規劃</span></div>
            <div class="pillar-item"><span class="pillar-num">7</span><span class="pillar-text">說明關鍵減量策略的進展與未來規劃，包括該策略的執行及預期完成時間點、評量指標、預期減排量等</span></div>
          </div>

          <div class="pillar">
            <div class="pillar-head"><span class="pillar-title">透明度</span><span class="pillar-count">3 項指標</span></div>
            <div class="pillar-item"><span class="pillar-num">8</span><span class="pillar-text">揭露近三年範疇一及範疇二的排放量，以及範疇三主要類別的排放量</span></div>
            <div class="pillar-item"><span class="pillar-num">9</span><span class="pillar-text">揭露當年度各類能源消費量（煤炭、石油、天然氣、非再生電力與再生電力），並且說明再生電力形式及佔比</span></div>
            <div class="pillar-item"><span class="pillar-num">10</span><span class="pillar-text">揭露公司當年度「支持轉型至低碳經濟之產品／服務」之收入佔總營收之比例。公司須說明該低碳產品與服務之定義</span></div>
          </div>
        </div>

        <div class="methodology-cta">
          <NuxtLink to="/methodology" class="btn-secondary">查看方法論定義 →</NuxtLink>
        </div>
      </ContentContainer>
    </section>

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

/* ── 方法論三大面向 (依 改設計0825.html SECTION 3 設計) ── */
.methodology-section {
  padding: 56px 0;
  background: #090D0A;
}

.methodology-section .section-head {
  margin-bottom: 22px;
}

.methodology-section .section-head h2 {
  font-size: 22px;
  font-weight: 700;
  color: #DDE8DF;
  letter-spacing: -.015em;
  margin-bottom: 6px;
}

.methodology-section .section-head p {
  font-size: 14px;
  color: #8A9E8D;
}

.pillar-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  align-items: start;
}

.pillar {
  background: #0F1511;
  border: 1px solid #1F2D22;
  border-radius: 12px;
  padding: 22px 24px 20px;
}

.pillar-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding-bottom: 14px;
  border-bottom: 1px solid #1F2D22;
  margin-bottom: 6px;
}

.pillar-title {
  font-size: 17px;
  font-weight: 700;
  color: #5BB278;
  letter-spacing: .02em;
}

.pillar-count {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px;
  color: #556A58;
}

.pillar-item {
  display: flex;
  gap: 11px;
  padding: 12px 0;
  border-bottom: 1px solid rgba(31, 45, 34, .55);
}

.pillar-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.pillar-num {
  width: 22px;
  height: 22px;
  border-radius: 4px;
  flex-shrink: 0;
  margin-top: 1px;
  background: #134020;
  color: #8ECBA0;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pillar-text {
  font-size: 12.5px;
  color: #8A9E8D;
  line-height: 1.65;
}

.methodology-cta {
  margin-top: 24px;
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

@media (max-width: 1100px) {
  .pillar-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .methodology-section {
    padding: 40px 24px;
  }
}
</style>
