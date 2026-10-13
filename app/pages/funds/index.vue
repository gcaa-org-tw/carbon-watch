<script setup lang="ts">
import fundListData from '~/assets/data/fund-list.json'

definePageMeta({
  layout: 'landing',
})

// SEO metadata
useSeoMeta({
  title: '依基金持股查詢',
  description: '追蹤台灣投資基金的排碳大戶投資狀況，分析基金持股企業碳排放、燃煤使用等環境指標。協助投資人做出更負責任的投資決策。',
})

</script>

<template>
  <div class="co-page">
    <header class="co-header">
      <NuxtLink to="/" class="back-link">
        ← 回首頁
      </NuxtLink>
      <h1>依基金持股查詢</h1>
      <p class="page-note">
        追蹤台灣投資基金的排碳大戶投資狀況
      </p>
      <FundDataNote />
    </header>

    <FundTable :rows="fundListData" />
  </div>
</template>

<style scoped>
.co-page {
  padding: 40px 64px 56px;
}

.co-header {
  padding-bottom: 24px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-bottom: 14px;
  transition: color 0.15s;
}

.back-link:hover {
  color: var(--color-green-spring);
}

.co-header h1 {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.015em;
  margin-bottom: 18px;
}

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

@media (max-width: 900px) {
  .co-page {
    padding: 32px 24px 40px;
  }
}
</style>
