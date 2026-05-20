<script setup lang="ts">
import { ref, computed } from 'vue'

const mobileMenuOpen = ref(false)
const { isPro } = useViewMode()

const menuItems = computed(() => [
  { to: isPro.value ? '/companies/pro' : '/companies', label: '依企業查詢' },
  { to: '/funds', label: '依基金持股查詢' },
  { to: '/methodology', label: '氣候績效指標方法論' }
])

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

const closeMobileMenu = () => {
  mobileMenuOpen.value = false
}
</script>

<template>
  <nav class="nav-bg">
    <ContentContainer>
      <div class="h-[4.5rem] md:h-[6rem] flex items-center justify-between">
        <!-- Site Title - Two-tone -->
        <NuxtLink 
          to="/" 
          class="text-2xl md:text-3xl font-bold tracking-tight"
        >
          <span class="text-earth-brown">排碳大戶</span><span class="text-green-deep">觀測站</span>
        </NuxtLink>

        <!-- Desktop Menu -->
        <div class="hidden md:flex items-center gap-12">
          <NuxtLink
            v-for="item in menuItems"
            :key="item.to"
            :to="item.to"
            class="text-earth-brown hover:text-green-spring font-medium transition-colors relative group"
          >
            {{ item.label }}
            <span class="absolute bottom-[-0.5rem] left-0 right-0 h-[2px] bg-green-spring scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
          </NuxtLink>
          <UButton
            to="https://gcaa.neticrm.tw/civicrm/contribute/transact?reset=1&id=41&utm_source=Web&utm_content=ESG&utm_campaign=HEAD"
            target="_blank"
            color="primary"
            size="md"
          >
            捐款支持
          </UButton>
        </div>

        <!-- Mobile Hamburger Button -->
        <button 
          class="md:hidden flex flex-col justify-center items-center w-10 h-10 gap-1.5"
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
    </ContentContainer>

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
        class="md:hidden bg-surface-mint border-t border-surface-warm shadow-lg"
      >
        <ContentContainer>
          <div class="flex flex-col py-4 gap-6">
            <NuxtLink
              v-for="item in menuItems"
              :key="item.to"
              :to="item.to"
              class="text-earth-brown hover:text-green-spring font-medium transition-colors py-2 border-b border-transparent hover:border-green-spring"
              @click="closeMobileMenu"
            >
              {{ item.label }}
            </NuxtLink>
            <UButton
              to="https://gcaa.neticrm.tw/civicrm/contribute/transact?reset=1&id=41&utm_source=Web&utm_content=ESG&utm_campaign=HEAD"
              target="_blank"
              color="primary"
              size="md"
              class="w-full justify-center"
            >
              捐款支持
            </UButton>
          </div>
        </ContentContainer>
      </div>
    </Transition>
  </nav>
</template>

<style scoped>
/* nav-bg SVG removed: site uses dark forest green theme */

/* Active route styling */
a.router-link-active {
  font-weight: 700;
  color: var(--color-green-spring);
}

/* Show underline on active route */
a.router-link-active span {
  transform: scaleX(1);
}
</style>
