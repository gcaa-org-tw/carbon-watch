<script setup lang="ts">
const route = useRoute()

const { data: page } = await useAsyncData('page-' + route.path, () => {
  return queryCollection('content').path(route.path).first()
})

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

useSeoMeta({
  title: page.value.title,
  description: page.value.description,
})
</script>

<template>
  <div class="content-page">
    <ContentRenderer
      v-if="page"
      :value="page"
      class="content-body"
    />
  </div>
</template>

<style scoped>
.content-page {
  padding: 2rem 0;
  background-color: var(--ui-bg);
  min-height: 100vh;
}

.content-body :deep(h1) {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--color-green-deep);
  margin-top: 2rem;
  margin-bottom: 1.5rem;
  line-height: 1.2;
  border-bottom: 3px solid var(--color-green-pure);
  padding-bottom: 0.5rem;
}

.content-body :deep(h2) {
  font-size: 1.875rem;
  font-weight: 600;
  color: var(--color-earth-brown);
  margin-top: 2.5rem;
  margin-bottom: 1rem;
  line-height: 1.3;
  border-left: 4px solid var(--color-green-spring);
  padding-left: 1rem;
}

.content-body :deep(h3) {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-earth-brown);
  margin-top: 2rem;
  margin-bottom: 0.75rem;
  line-height: 1.4;
}
  
.content-body :deep(h2 a),
.content-body :deep(h3 a) {
  color: inherit;
  text-decoration: none;
  pointer-events: none;
}
  
.content-body :deep(p) {
  font-size: 1rem;
  line-height: 1.75;
  color: var(--color-earth-brown);
  margin-bottom: 1.25rem;
}

.content-body :deep(ul),
.content-body :deep(ol) {
  margin: 1rem 0 1.5rem 0;
  padding-left: 1.5rem;
  color: var(--color-earth-brown);
}

.content-body :deep(ul) {
  list-style-type: disc;
}

.content-body :deep(ol) {
  list-style-type: decimal;
}

.content-body :deep(li) {
  margin-bottom: 0.75rem;
  color: var(--color-earth-brown);
  line-height: 1.75;
  padding-left: 0.5rem;
}

.content-body :deep(li::marker) {
  color: var(--color-green-pure);
  font-weight: 600;
}

.content-body :deep(hr) {
  margin: 2.5rem 0;
  border-color: var(--color-bg-border);
}

.content-body :deep(strong) {
  color: var(--color-green-deep);
  font-weight: 600;
}

.content-body :deep(h1) {
  color: var(--color-green-mint);
  border-bottom-color: var(--color-green-spring);
}

.content-body :deep(h2) {
  border-left-color: var(--color-green-mint);
}

.content-body :deep(li::marker) {
  color: var(--color-green-spring);
}
</style>
