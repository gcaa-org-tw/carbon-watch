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
  devtools: { enabled: true },
  future: {
    compatibilityVersion: 4,
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