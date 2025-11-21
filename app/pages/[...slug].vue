<script setup lang="ts">
const route = useRoute()

const { data: page } = await useAsyncData('page-' + route.path, () => {
  return queryCollection('content').path(route.path).first()
})

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

// SEO metadata using unified helper - will use content title if available
useSeo({
  content: page.value,
})
</script>

<template>
  <ContentRenderer
    v-if="page"
    :value="page"
  />
</template>
