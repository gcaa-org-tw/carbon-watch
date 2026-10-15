<script setup lang="ts">
import type { CompanyData } from '~/types/company'

interface FundMeta {
  基金代號: string
  基金名稱: string
  基金統編: string
  總市值: number
  排碳大戶家數: number
  排碳大戶佔比: number
  排碳大戶總碳排量: number
  使用燃煤家數: number
  是否ESG基金: boolean
  fundKey: string
}

interface FundData {
  meta: FundMeta
  companies: CompanyData[]
}

definePageMeta({
  layout: 'landing',
})

const route = useRoute()

// Get fund code from route params
const fundCode = computed(() => route.params.slug as string)

let fundData: FundData
try {
  fundData = await import(`~/assets/data/funds/${fundCode.value}.json`).then(m => m.default)
} catch {
  throw createError({
    statusCode: 404,
    statusMessage: '找不到此基金',
    message: `基金 ${fundCode.value} 不存在`,
  })
}

// Convert fund companies to CompanyData format
const companies = computed<CompanyData[]>(() => {
  return fundData.companies as CompanyData[]
})

// SEO metadata
useHead({
  title: `${fundData.meta.基金名稱}（專業版）`,
  meta: [
    { name: 'description', content: `檢視${fundData.meta.基金名稱}投資的排碳大戶企業詳細資訊（專業版）` }
  ]
})
</script>

<template>
  <div class="co-page">
    <FundDetailHeader
      :fund-key="fundData.meta.fundKey"
      :code="fundData.meta.基金代號"
      :unified-id="fundData.meta.基金統編"
      :name="fundData.meta.基金名稱"
      :is-esg="fundData.meta.是否ESG基金"
    />

    <div class="co-body">
      <CompanyTable v-if="companies.length" :rows="companies" :is-pro="true" :coal-first="true" />

      <p v-else class="empty-note">
        此基金無排碳大戶企業資料
      </p>
    </div>
  </div>
</template>

<style scoped>
.co-page {
  padding: 40px 64px 56px;
}

.empty-note {
  padding: 48px 0;
  text-align: center;
  font-size: 14px;
  color: var(--color-text-muted);
}

@media (max-width: 900px) {
  .co-page {
    padding: 32px 24px 40px;
  }
}
</style>
