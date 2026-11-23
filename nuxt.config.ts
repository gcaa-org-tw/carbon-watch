// https://nuxt.com/docs/api/configuration/nuxt-config
import { fileURLToPath } from 'node:url'

const recordsEnabled = process.env.RECORDS_ENABLED === 'true'
const mirrorBuild = process.env.MIRROR_BUILD === 'true'
const recordsRoutes = ['/records', '/download']

export default defineNuxtConfig({
  modules: [
    '@nuxt/content',
    '@nuxt/test-utils',
    '@nuxt/scripts',
    '@nuxt/image',
    '@nuxt/eslint',
    '@nuxt/ui',
  ],
  ssr: !mirrorBuild,
  css: ['~/assets/css/main.css'],
  icon: {
    clientBundle: { scan: true },
  },
  fonts: {
    families: [{ name: 'Noto Sans TC', provider: 'none' }],
    assets: { prefix: mirrorBuild ? '/fonts' : '/_fonts' },
  },
  app: {
    buildAssetsDir: mirrorBuild ? '/nuxt/' : '/_nuxt/',
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
  vite: {
    define: {
      __RECORDS_ENABLED__: JSON.stringify(recordsEnabled),
    },
  },
  hooks: {
    'pages:extend'(pages) {
      if (recordsEnabled) return
      const kept = pages.filter(page => !recordsRoutes.some(route => page.path === route || page.path.startsWith(`${route}/`)))
      pages.splice(0, pages.length, ...kept)
    },
    'pages:routerOptions'({ files }) {
      if (mirrorBuild) files.push({ path: fileURLToPath(new URL('./app/router.mirror.ts', import.meta.url)) })
    },
    'prerender:routes'({ routes }) {
      const add = routes.add.bind(routes)
      routes.add = route => add(/^(?:\/[^/.]+)+$/.test(route) ? `${route}/` : route)
    },
  },
  srcDir: 'app/',
})