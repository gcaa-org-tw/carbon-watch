import { InferSeoMetaPlugin } from '@unhead/vue/plugins'

export default defineNuxtPlugin(() => {
  injectHead().use(InferSeoMetaPlugin())
})
