<script setup lang="ts">
import type { CompanyData } from '~/types/company'
import fundListData from '~/assets/data/fund-list.json'

interface FundMeta {
  基金代號: string
  基金名稱: string
  總市值: number
  排碳大戶家數: number
  排碳大戶佔比: number
  排碳大戶總碳排量: number
  使用燃煤家數: number
}

interface FundData {
  meta: FundMeta
  companies: CompanyData[]
}

const route = useRoute()

// Get fund code from route params
const fundCode = computed(() => route.params.slug as string)

// Try the per-fund detail JSON first. transform-fund-data.ts only writes a
// detail file when a fund has at least one 排碳大戶 holding; pure 0-排碳大戶
// funds (e.g. 0055 元大金融) appear in fund-list.json but have no detail
// file. For those we fall back to the meta row + an empty companies list,
// and the existing v-if='companies.length === 0' empty state takes over.
// Only a genuinely-unknown 基金代號 (not in fund-list.json either) 404s.
let fundData: FundData
try {
  fundData = await import(`~/assets/data/funds/${fundCode.value}.json`).then(m => m.default)
} catch {
  const meta = (fundListData as FundMeta[]).find(f => f['基金代號'] === fundCode.value)
  if (!meta) {
    throw createError({
      statusCode: 404,
      statusMessage: '找不到此基金',
      message: `基金代號 ${fundCode.value} 不存在`,
    })
  }
  fundData = { meta, companies: [] }
}

// Convert fund companies to CompanyData format
const companies = computed<CompanyData[]>(() => {
  return fundData.companies as CompanyData[]
})

// SEO metadata
useHead({
  title: `${fundData.meta.基金名稱} - 基金詳情`,
  meta: [
    { name: 'description', content: `檢視${fundData.meta.基金名稱}投資的排碳大戶企業詳細資訊` }
  ]
})
</script>

<template>
  <div class="py-8 space-y-6">
    <!-- Header with title and view mode switch -->
    <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
      <div>
        <h1 class="text-3xl sm:text-[2.5rem] font-bold text-green-deep mt-0 sm:mt-8 mb-2 leading-[1.2] pb-2">
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
      <CompanyTable :rows="companies" :is-pro="false" />
    </div>

    <div v-if="companies.length === 0" class="text-center py-12">
      <p class="text-gray-400">
        此基金無排碳大戶企業資料
      </p>
    </div>
  </div>
</template>
