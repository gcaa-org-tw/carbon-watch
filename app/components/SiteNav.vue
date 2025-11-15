<script setup lang="ts">
import { ref, computed } from 'vue'

const mobileMenuOpen = ref(false)
const { isPro } = useViewMode()

const menuItems = computed(() => [
  { to: isPro.value ? '/companies/pro' : '/companies', label: '企業觀測清單' },
  { to: '/funds', label: '基金觀測' },
  { to: '/methodology', label: '綠盟的氣候績效指標' }
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
        class="md:hidden bg-gray-800 border-t border-gray-700 shadow-lg"
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
          </div>
        </ContentContainer>
      </div>
    </Transition>
  </nav>
</template>

<style scoped>
@media (min-width: 768px) {
  .nav-bg {
    background-image: url('~/assets/images/nav-bg.svg');
    background-position: top;
    background-repeat: repeat-x;
  }
}

@media (prefers-color-scheme: dark) {
  .nav-bg {
    background-image: none;
  }
}

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
