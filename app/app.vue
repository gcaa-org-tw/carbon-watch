<script setup lang="ts">
const SITE_URL = 'https://thaubing-esg.gcaa.org.tw'
const SITE_NAME = '排碳大戶觀測站'

const route = useRoute()

useHead({
  titleTemplate: (title) => (title ? `${title} | ${SITE_NAME}` : SITE_NAME),
  link: [
    {
      rel: 'canonical',
      href: computed(() => SITE_URL + (route.path.endsWith('/') ? route.path : `${route.path}/`)),
    },
  ],
})
</script>

<template>
  <UApp>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
