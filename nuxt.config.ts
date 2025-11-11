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
  devtools: { enabled: true },
  future: {
    compatibilityVersion: 4,
  },
  typescript: {
    typeCheck: true,
  },
  compatibilityDate: '2024-04-03',
})