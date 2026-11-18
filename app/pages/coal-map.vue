<script setup lang="ts">
import coalMapJson from '~/assets/data/coal-map.json'
import type { CoalMapData } from '~/types/coalMap'

const coalMap = coalMapJson as unknown as CoalMapData

useHead({
  title: '依燃煤使用查詢',
  meta: [
    { name: 'description', content: '台灣排碳大戶用煤工廠分布地圖：以用煤申報資料呈現各廠逐年用煤量。' },
  ],
})
</script>

<template>
  <CoalMapSection :data="coalMap" />
</template>
