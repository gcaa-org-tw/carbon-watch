<script setup lang="ts">
import fundPeriod from '~/assets/data/fund-period.json'

const holdingsQuarter = `${fundPeriod.年度 + 1911} Q${fundPeriod.季別}`
</script>

<template>
  <p class="page-note flex">
    <span class="shrink-0">資料說明：</span>
    <span>
      <span class="block">基金持股為 <strong>{{ holdingsQuarter }}</strong> 申報（ETF 為公開資訊觀測站全持股；非 ETF 為投信投顧公會季報、僅含占淨值 1% 以上部位）。</span>
      <span class="block">企業排碳量以 <strong>2024</strong> 年、燃煤用量以 <strong>2025</strong> 年全年計算（環境部年度申報）。</span>
    </span>
  </p>
</template>

<style scoped>
.page-note {
  max-width: 56.25rem;
  margin-top: 12px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--color-text-secondary);
}

.page-note strong {
  color: var(--color-green-spring);
  font-weight: 500;
}
</style>
