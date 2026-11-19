import type { RouterConfig } from '@nuxt/schema'
import { createWebHashHistory } from 'vue-router'

export default <RouterConfig>{
  hashMode: true,
  history: () => createWebHashHistory(),
}
