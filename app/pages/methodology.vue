<script setup lang="ts">
const { data: page } = await useAsyncData('methodology', () => {
  return queryCollection('content').path('/methodology').first()
})

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

// SEO metadata
useSeoMeta({
  title: '關於氣候績效指標 | 碳排大戶觀測站',
  description: '了解綠盟制定的十項企業碳排放檢驗標準。參考國際標準，綜合承諾、實作進度等指標，協助快速辨識企業環境表現與減碳責任。',
})

useHead({
  htmlAttrs: {
    lang: 'zh-TW'
  },
  link: [
    {
      rel: 'canonical',
      href: 'https://carbon-watch.gcaa.org.tw/methodology'
    }
  ]
})
</script>

<template>
  <div class="methodology-page">
    <ContentRenderer
      v-if="page"
      :value="page"
      class="methodology-content"
    />
  </div>
</template>

<style scoped>
.methodology-page {
  padding: 2rem 0;
  background-color: var(--ui-bg);
  min-height: 100vh;
}

.methodology-content :deep(h1) {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--color-green-deep);
  margin-top: 2rem;
  margin-bottom: 1.5rem;
  line-height: 1.2;
  border-bottom: 3px solid var(--color-green-pure);
  padding-bottom: 0.5rem;
}

.methodology-content :deep(h2) {
  font-size: 1.875rem;
  font-weight: 600;
  color: var(--color-earth-brown);
  margin-top: 2.5rem;
  margin-bottom: 1rem;
  line-height: 1.3;
  border-left: 4px solid var(--color-green-spring);
  padding-left: 1rem;
}

.methodology-content :deep(p) {
  font-size: 1rem;
  line-height: 1.75;
  color: var(--color-earth-brown);
  margin-bottom: 1.25rem;
}

.methodology-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1.5rem 0;
  background-color: var(--ui-bg);
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  border-radius: 0.5rem;
  overflow: hidden;
  border: 1px solid var(--color-surface-warm);
}

.methodology-content :deep(thead) {
  background-color: var(--color-green-deep);
  color: white;
}

.methodology-content :deep(th) {
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.95rem;
  letter-spacing: 0.025em;
  color: white;
}

.methodology-content :deep(td) {
  padding: 1rem;
  border-top: 1px solid var(--color-surface-warm);
  color: var(--color-earth-brown);
  font-size: 0.95rem;
  line-height: 1.6;
}

.methodology-content :deep(tbody tr:hover) {
  background-color: var(--color-surface-mint);
}

.methodology-content :deep(ul),
.methodology-content :deep(ol) {
  margin: 1rem 0 1.5rem 0;
  padding-left: 1.5rem;
  color: var(--color-earth-brown);
}

.methodology-content :deep(ul) {
  list-style-type: disc;
}

.methodology-content :deep(ol) {
  list-style-type: decimal;
}

.methodology-content :deep(li) {
  margin-bottom: 0.75rem;
  color: var(--color-earth-brown);
  line-height: 1.75;
  padding-left: 0.5rem;
}

.methodology-content :deep(li::marker) {
  color: var(--color-green-pure);
  font-weight: 600;
}

.methodology-content :deep(strong) {
  color: var(--color-green-deep);
  font-weight: 600;
}

/* Dark mode specific adjustments */
.dark .methodology-content :deep(h1) {
  color: var(--color-green-mint);
  border-bottom-color: var(--color-green-spring);
}

.dark .methodology-content :deep(h2) {
  border-left-color: var(--color-green-mint);
}

.dark .methodology-content :deep(thead) {
  background-color: var(--color-green-forest);
}

.dark .methodology-content :deep(tbody tr:hover) {
  background-color: var(--color-surface-warm);
}

.dark .methodology-content :deep(table) {
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.3);
}

.dark .methodology-content :deep(li::marker) {
  color: var(--color-green-spring);
}
</style>
