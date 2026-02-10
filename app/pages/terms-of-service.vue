<script setup lang="ts">
const { data: page } = await useAsyncData('terms-of-service', () => {
  return queryCollection('content').path('/terms-of-service').first()
})

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}


// SEO metadata using unified helper
useSeo({
  title: '免責聲明與資料來源',
  description: '了解排碳大戶觀測站的使用條款、免責聲明與資料來源說明。',
  canonical: 'https://carbon-watch.gcaa.org.tw/terms-of-service',

})
</script>

<template>
  <div class="terms-page">
    <ContentRenderer
      v-if="page"
      :value="page"
      class="terms-content"
    />
  </div>
</template>

<style scoped>
.terms-page {
  padding: 2rem 0;
  background-color: var(--ui-bg);
  min-height: 100vh;
}

.terms-content :deep(h1) {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--color-green-deep);
  margin-top: 2rem;
  margin-bottom: 1.5rem;
  line-height: 1.2;
  border-bottom: 3px solid var(--color-green-pure);
  padding-bottom: 0.5rem;
}

.terms-content :deep(h2) {
  font-size: 1.875rem;
  font-weight: 600;
  color: var(--color-earth-brown);
  margin-top: 2.5rem;
  margin-bottom: 1rem;
  line-height: 1.3;
  border-left: 4px solid var(--color-green-spring);
  padding-left: 1rem;
}

.terms-content :deep(h3) {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-earth-brown);
  margin-top: 2rem;
  margin-bottom: 0.75rem;
  line-height: 1.4;
}

.terms-content :deep(p) {
  font-size: 1rem;
  line-height: 1.75;
  color: var(--color-earth-brown);
  margin-bottom: 1.25rem;
}

.terms-content :deep(ul),
.terms-content :deep(ol) {
  margin: 1rem 0 1.5rem 0;
  padding-left: 1.5rem;
  color: var(--color-earth-brown);
}

.terms-content :deep(ul) {
  list-style-type: disc;
}

.terms-content :deep(ol) {
  list-style-type: decimal;
}

.terms-content :deep(li) {
  margin-bottom: 0.75rem;
  color: var(--color-earth-brown);
  line-height: 1.75;
  padding-left: 0.5rem;
}

.terms-content :deep(li::marker) {
  color: var(--color-green-pure);
  font-weight: 600;
}

.terms-content :deep(strong) {
  color: var(--color-green-deep);
  font-weight: 600;
}

/* Dark mode specific adjustments */
.dark .terms-content :deep(h1) {
  color: var(--color-green-mint);
  border-bottom-color: var(--color-green-spring);
}

.dark .terms-content :deep(h2) {
  border-left-color: var(--color-green-mint);
}

.dark .terms-content :deep(li::marker) {
  color: var(--color-green-spring);
}
</style>
