<script setup lang="ts">
const SITE_URL = 'https://thaubing-esg.gcaa.org.tw'
const SITE_NAME = '排碳大戶觀測站'

const route = useRoute()

const canonicalUrl = computed(() => SITE_URL + (route.path.endsWith('/') ? route.path : `${route.path}/`))

useSeoMeta({
  ogSiteName: SITE_NAME,
  ogType: 'website',
  ogLocale: 'zh_TW',
  ogUrl: canonicalUrl,
  ogImage: `${SITE_URL}/og-default.png`,
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogImageAlt: `${SITE_NAME}首頁：追蹤台灣排碳大戶，一鍵看清氣候責任`,
  twitterCard: 'summary_large_image',
})

useHead({
  titleTemplate: (title) => (title ? `${title} | ${SITE_NAME}` : SITE_NAME),
  link: [
    {
      rel: 'canonical',
      href: canonicalUrl,
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
