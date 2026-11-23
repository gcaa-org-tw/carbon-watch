<script setup lang="ts">
import { ref, computed } from 'vue'

const DONATE_URL = 'https://gcaa.neticrm.tw/civicrm/contribute/transact?reset=1&id=41&utm_source=Web&utm_content=ESG&utm_campaign=HEAD'

const mobileMenuOpen = ref(false)
const { isPro } = useViewMode()

interface MenuItem {
  to?: string
  label: string
  disabled?: boolean
  hidden?: boolean
}

const menuItems = computed<MenuItem[]>(() => [
  { to: isPro.value ? '/companies/pro' : '/companies', label: '依企業查詢' },
  { to: '/funds', label: '依基金查詢' },
  { to: '/coal-map', label: '依用煤查詢' },
  { to: '/methodology', label: '氣候績效指標方法論' },
  ...(__RECORDS_ENABLED__
    ? [
        { to: '/records', label: '裁罰、工安與司法案件' },
        { to: '/download', label: '資料下載' },
      ]
    : []),
])

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

const closeMobileMenu = () => {
  mobileMenuOpen.value = false
}
</script>

<template>
  <nav class="site-nav">
    <div class="nav-inner">
      <!-- Logo -->
      <NuxtLink to="/" class="nav-logo">
        <span class="nav-dot" />
        排碳大戶觀測站
      </NuxtLink>

      <div class="flex items-center gap-3 lg:gap-6">
        <!-- Desktop Menu -->
        <div class="hidden lg:flex items-center gap-6">
          <template v-for="item in menuItems" :key="item.label">
            <span v-if="!item.hidden && item.disabled" class="nav-link nav-link--disabled">
              {{ item.label }}
            </span>
            <NuxtLink
              v-else-if="!item.hidden"
              :to="item.to!"
              class="nav-link"
            >
              {{ item.label }}
            </NuxtLink>
          </template>
        </div>

        <a
          :href="DONATE_URL"
          target="_blank"
          rel="noopener noreferrer"
          class="btn-donate"
        >
          <UIcon name="i-heroicons-heart-20-solid" class="btn-donate-icon" aria-hidden="true" />
          捐款支持
        </a>

        <!-- Mobile Hamburger -->
        <button
          class="lg:hidden flex flex-col justify-center items-center w-10 h-10 gap-1.5"
          aria-label="Toggle menu"
          @click="toggleMobileMenu"
        >
          <span
            class="w-6 h-0.5 bg-earth-brown transition-all duration-300"
            :class="mobileMenuOpen ? 'rotate-45 translate-y-2' : ''"
          />
          <span
            class="w-6 h-0.5 bg-earth-brown transition-all duration-300"
            :class="mobileMenuOpen ? 'opacity-0' : ''"
          />
          <span
            class="w-6 h-0.5 bg-earth-brown transition-all duration-300"
            :class="mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''"
          />
        </button>
      </div>
    </div>

    <!-- Mobile Menu Drawer -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 -translate-y-4"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-4"
    >
      <div
        v-if="mobileMenuOpen"
        class="lg:hidden border-t border-bg-border shadow-lg mobile-drawer"
      >
        <div class="max-w-[90rem] mx-auto px-8 py-4 flex flex-col gap-6">
          <template v-for="item in menuItems" :key="item.label">
            <span
              v-if="!item.hidden && item.disabled"
              class="nav-link nav-link--disabled py-2"
            >
              {{ item.label }}
            </span>
            <NuxtLink
              v-else-if="!item.hidden"
              :to="item.to!"
              class="nav-link py-2 border-b border-transparent hover:border-green-spring"
              @click="closeMobileMenu"
            >
              {{ item.label }}
            </NuxtLink>
          </template>
        </div>
      </div>
    </Transition>
  </nav>
</template>

<style scoped>
.site-nav {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(9, 13, 10, 0.94);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-bottom: 1px solid var(--color-bg-border);
}

.mobile-drawer {
  background: rgba(9, 13, 10, 0.97);
}

.nav-inner {
  max-width: 120rem;
  margin: 0 auto;
  padding: 0 2rem;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* Logo */
.nav-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 700;
  color: var(--color-green-spring);
  letter-spacing: -0.01em;
  text-decoration: none;
  white-space: nowrap;
}

.nav-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-green-pure);
  flex-shrink: 0;
}

/* Nav links */
.nav-link {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-earth-brown);
  cursor: pointer;
  transition: color 0.15s;
  text-decoration: none;
  position: relative;
}

.nav-link:hover {
  color: var(--color-green-spring);
}

.nav-link--disabled {
  color: var(--color-text-muted);
  cursor: default;
}

/* Active route */
a.router-link-active.nav-link {
  color: var(--color-green-200);
  font-weight: 700;
}

a.router-link-active.nav-link::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -19px;
  height: 2px;
  background: var(--color-green-200);
  border-radius: 1px;
}

/* Donate button */
.btn-donate {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--color-green-200);
  color: var(--color-text-inverted);
  border-radius: 8px;
  padding: 7px 14px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s;
  text-decoration: none;
  white-space: nowrap;
}

.btn-donate:hover {
  background: var(--color-green-50);
}

.btn-donate:focus-visible {
  outline: 2px solid var(--color-green-50);
  outline-offset: 2px;
}

.btn-donate-icon {
  width: 15px;
  height: 15px;
  flex-shrink: 0;
}

@media (max-width: 359px) {
  .nav-inner {
    padding: 0 1rem;
  }

  .btn-donate-icon {
    display: none;
  }
}
</style>
