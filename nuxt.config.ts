// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/content',
    '@nuxt/test-utils',
    '@nuxt/scripts',
    '@nuxt/image',
    '@nuxt/eslint',
    '@nuxt/ui',
  ],
  css: ['~/assets/css/main.css'],
  fonts: {
    families: [{ name: 'Noto Sans TC', provider: 'none' }],
  },
  app: {
    head: {
      htmlAttrs: { lang: 'zh-TW' },
      link: [
        {
          rel: 'preconnect',
          href: 'https://fonts.googleapis.com',
        },
        {
          rel: 'preconnect',
          href: 'https://fonts.gstatic.com',
          crossorigin: '',
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap',
        },
      ],
    },
  },
  devtools: { enabled: true },
  future: {
    compatibilityVersion: 4,
  },
  experimental: {
    defaults: {
      nuxtLink: { trailingSlash: 'append' },
    },
  },
  typescript: {
    typeCheck: true,
  },
  colorMode: {
    preference: 'light',
    fallback: 'light',
  },
  compatibilityDate: '2024-04-03',
  nitro: {
    preset: 'static',
  },
  srcDir: 'app/',
})