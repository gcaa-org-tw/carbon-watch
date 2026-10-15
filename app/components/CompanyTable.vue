<script setup lang="ts">
import type { CompanyData } from '~/types/company'

interface Props {
  rows: CompanyData[]
  isPro?: boolean
  showLegend?: boolean
  showRank?: boolean
  // 基金頁的倡議框架：在企業名稱／產業分類之後插入單一燃煤使用量欄，
  // 並預設以燃煤用量遞減排序（溫室氣體排放量為次要排序）。首頁與
  // /companies 不傳，維持無燃煤欄。
  coalFirst?: boolean
  moreLink?: { label: string, to: string }
}

withDefaults(defineProps<Props>(), {
  isPro: false,
  showLegend: true,
  showRank: false,
  coalFirst: false,
  moreLink: undefined,
})
</script>

<template>
  <!-- 易讀版：氣候績效檢核表（分組表頭 + 燈號），首頁與 /companies 共用 -->
  <ClimateScoreTable
    v-if="!isPro"
    :rows="rows"
    :show-rank="showRank"
    :show-legend="showLegend"
    :coal-first="coalFirst"
    :more-link="moreLink"
  />

  <!-- 專業版：同一套 .tbl 表格設計，純數據、無燈號（設計稿 .tbl-pro） -->
  <ProCompanyTable
    v-else
    :rows="rows"
    :coal-first="coalFirst"
  />
</template>
