<script setup lang="ts">
const { data: page } = await useAsyncData('methodology', () => {
  return queryCollection('content').path('/methodology').first()
})

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

// SEO metadata
useSeoMeta({
  title: '氣候績效指標方法論',
  description: '綠盟參考台灣氣候法規及國際標準，制定涵蓋承諾、行動與透明度三大面向，共十項指標的氣候績效檢核表，檢驗企業氣候表現。',
})
</script>

<template>
  <div class="methodology-page">
    <ULink to="/" class="back-link">← 回首頁</ULink>

    <ContentRenderer
      v-if="page"
      :value="page"
      class="methodology-content"
    />
  </div>
</template>

<style scoped>
/* Ported from 設計稿 (改設計0828) — 氣候績效指標方法論 明細頁 */
.methodology-page {
  padding-bottom: 48px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 14px;
  font-size: 13px;
  color: var(--color-text-secondary);
  transition: color 0.15s;
}

.back-link:hover {
  color: var(--color-green-spring);
}

/* ── 標題 ─────────────────────────────────────────────── */
.methodology-content :deep(h1) {
  font-size: 30px;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.2;
  color: var(--color-text-primary);
  /* 設計稿：detail-head 底部 22px + detail-body 起始 */
  margin-bottom: 22px;
}

.methodology-content :deep(h2) {
  font-size: 19px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 36px 0 12px;
  padding-bottom: 9px;
  border-bottom: 1px solid var(--color-bg-border);
}

.methodology-content :deep(h1 a),
.methodology-content :deep(h2 a) {
  color: inherit;
  text-decoration: none;
  pointer-events: none;
}

/* ── 內文 ─────────────────────────────────────────────── */
.methodology-content :deep(p) {
  max-width: 900px;
  font-size: 14px;
  line-height: 1.9;
  color: var(--color-text-secondary);
  margin-bottom: 12px;
}

.methodology-content :deep(p a) {
  color: var(--color-link);
}

.methodology-content :deep(p a:hover) {
  color: var(--color-link-hover);
}

/* ── 指標三大面向 ─────────────────────────────────────── */
.methodology-content :deep(.aspect-grid) {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  margin-top: 6px;
}

.methodology-content :deep(.aspect) {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-bg-border);
  border-radius: 12px;
  padding: 20px 22px;
}

.methodology-content :deep(.aspect h4) {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-green-spring);
  margin-bottom: 10px;
}

.methodology-content :deep(.aspect p) {
  max-width: none;
  font-size: 13.5px;
  line-height: 1.8;
  color: var(--color-text-secondary);
  margin-bottom: 0;
}

/* 十項績效指標列表 → components/content/ClimateIndicatorList.vue */

/* ── 指標評估流程 ─────────────────────────────────────── */
.methodology-content :deep(.flow) {
  counter-reset: f;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 6px 0 0;
  padding: 0;
  list-style: none;
}

.methodology-content :deep(.flow li) {
  display: flex;
  gap: 12px;
  font-size: 14px;
  line-height: 1.8;
  color: var(--color-text-secondary);
}

.methodology-content :deep(.flow li::before) {
  counter-increment: f;
  content: counter(f);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  margin-top: 3px;
  border-radius: 50%;
  background: var(--color-bg-overlay);
  color: var(--color-green-spring);
  font-family: 'IBM Plex Mono', 'Cascadia Code', monospace;
  font-size: 12px;
}

/* ── 量化評級標準 ─────────────────────────────────────── */
.methodology-content :deep(.rule-grid) {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 14px;
}

.methodology-content :deep(.rule) {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-bg-border);
  border-radius: 12px;
  padding: 16px 20px;
}

.methodology-content :deep(.rule h5) {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 10px;
}

.methodology-content :deep(.rule-r) {
  display: flex;
  gap: 9px;
  align-items: flex-start;
  padding: 4px 0;
  font-size: 13px;
  line-height: 1.7;
  color: var(--color-text-secondary);
}

.methodology-content :deep(.dot) {
  display: inline-block;
  flex-shrink: 0;
  width: 10px;
  height: 10px;
  margin-top: 6px;
  border-radius: 50%;
}

.methodology-content :deep(.dot-great) { background: var(--color-status-great); }
.methodology-content :deep(.dot-ok) { background: var(--color-status-ok); }
.methodology-content :deep(.dot-warn) { background: var(--color-status-warn); }
.methodology-content :deep(.dot-bad) { background: var(--color-status-bad); }
</style>
