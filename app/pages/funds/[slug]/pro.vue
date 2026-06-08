<script setup lang="ts">
import type { CompanyData } from '~/types/company'
import fundListData from '~/assets/data/fund-list.json'

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

const route = useRoute()

// Get fund code from route params
const fundCode = computed(() => route.params.slug as string)

// Same fallback as /funds/[slug]/index.vue: when no detail JSON exists (0-排碳大戶
// fund), use the fund-list.json row + empty companies. The route slug is the
// fundKey (基金統編, or 基金代號 for the 2 code-less umbrella funds). See
// index.vue for the full rationale.
let fundData: FundData
try {
  fundData = await import(`~/assets/data/funds/${fundCode.value}.json`).then(m => m.default)
} catch {
  const meta = (fundListData as FundMeta[]).find(f => f.fundKey === fundCode.value)
  if (!meta) {
    throw createError({
      statusCode: 404,
      statusMessage: '找不到此基金',
      message: `基金 ${fundCode.value} 不存在`,
    })
  }
  fundData = { meta, companies: [] }
}

// Convert fund companies to CompanyData format
const companies = computed<CompanyData[]>(() => {
  return fundData.companies as CompanyData[]
})

// Identifier line under the title: prefer 基金代號; fall back to 基金統編 for
// the 10 code-less ESG funds; blank if neither (defensive — never happens).
const codeDisplay = computed(() => {
  const m = fundData.meta
  if (m.基金代號) return `基金代號 ${m.基金代號}`
  if (m.基金統編) return `${m.基金統編}（基金統一編號）`
  return ''
})

// SEO metadata
useHead({
  title: `${fundData.meta.基金名稱} - 基金詳情 - 專業版`,
  meta: [
    { name: 'description', content: `檢視${fundData.meta.基金名稱}投資的排碳大戶企業詳細資訊（專業版）` }
  ]
})
</script>

<template>
  <div class="py-8 space-y-6">
    <!-- Header with title and view mode switch -->
    <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
      <div>
        <h1 class="text-3xl sm:text-[2.5rem] font-bold text-green-deep mt-0 sm:mt-8 mb-2 leading-[1.2] pb-2">
          {{ fundData.meta.基金名稱 }}<EsgLeaf v-if="fundData.meta.是否ESG基金" />
        </h1>
        <p v-if="codeDisplay" class="text-lg text-earth-brown mt-2">
          {{ codeDisplay }}
        </p>
        <div v-if="fundData.meta.是否ESG基金" class="flex items-center gap-1.5 text-sm text-earth-brown mt-1">
          <EsgLeaf />
          <span>：屬於境內發行之 ESG 基金</span>
        </div>
      </div>
      <div class="flex-shrink-0">
        <ViewModeSwitch :base-path="`/funds/${fundCode}`" />
      </div>
    </div>

    <FundDataNotice />

    <!-- Company Table -->
    <div class="mt-8">
      <CompanyTable :rows="companies" :is-pro="true" :coal-first="true" :flush="true" />
    </div>

    <div v-if="companies.length === 0" class="text-center py-12">
      <p class="text-gray-400">
        此基金無排碳大戶企業資料
      </p>
    </div>
  </div>
</template>
