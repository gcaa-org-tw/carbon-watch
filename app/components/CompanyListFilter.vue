<script setup lang="ts">
import regionList from '~/assets/data/region-list.json'
import industryList from '~/assets/data/industry-list.json'

interface Props {
  modelValue: {
    search: string
    region: string
    industry: string
  }
}

interface Emits {
  (e: 'update:modelValue', value: Props['modelValue']): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { setMode } = useViewMode()
const route = useRoute()

// Highlight follows the URL — the viewMode cookie can desync from the route
const isPro = computed(() => route.path.endsWith('/pro'))

// Local state
const localValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Region options with "全部地區" as default
const regionOptions = computed(() => [
  '全部地區',
  ...regionList
])

// Industry options with "全部產業" as default
const industryOptions = computed(() => [
  '全部產業',
  ...industryList.map(item => item.industry)
])

// Compute target links preserving query params
const regularModeLink = computed(() => ({
  path: '/companies',
  query: route.query
}))

const proModeLink = computed(() => ({
  path: '/companies/pro',
  query: route.query
}))

// Handle mode changes
const handleModeClick = (mode: 'regular' | 'pro') => {
  setMode(mode)
}

// Update search
const updateSearch = (value: string) => {
  localValue.value = { ...localValue.value, search: value }
}

const selectUi = {
  base: 'text-earth-brown',
  content: 'bg-surface-warm border border-green-deep/40',
  item: 'text-earth-brown data-highlighted:bg-green-deep/30 data-highlighted:text-white',
}
</script>

<template>
  <div class="space-y-4">
    <!-- Desktop layout (2 rows × 2 columns) -->
    <div class="hidden md:grid md:grid-cols-2 gap-4">
      <!-- Row 1, Column 1: Page title -->
      <div class="flex items-center">
        <h1 class="text-3xl sm:text-[2.5rem] font-bold text-earth-brown mt-0 sm:mt-8 mb-6 leading-[1.2] pb-4">
          排碳大戶觀測企業清單
        </h1>
      </div>

      <!-- Row 1, Column 2: Mode toggle -->
      <div class="flex items-center justify-end">
        <div class="inline-flex rounded-full bg-surface-mint p-1">
          <NuxtLink
            :to="regularModeLink"
            :class="[
              'px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer',
              !isPro
                ? 'bg-green-pure text-white'
                : 'bg-transparent text-earth-brown hover:bg-surface-mint/50'
            ]"
            @click="handleModeClick('regular')"
          >
            易讀版
          </NuxtLink>
          <NuxtLink
            :to="proModeLink"
            :class="[
              'px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer',
              isPro
                ? 'bg-green-pure text-white'
                : 'bg-transparent text-earth-brown hover:bg-surface-mint/50'
            ]"
            @click="handleModeClick('pro')"
          >
            專業版
          </NuxtLink>
        </div>
      </div>

      <!-- Row 2, Column 1: Search input (wider) -->
      <div class="col-span-1">
        <UInput
          :model-value="modelValue.search"
          icon="i-heroicons-magnifying-glass"
          placeholder="搜尋你關注的企業..."
          size="lg"
          class="max-w-full w-80"
          :ui="{
            base: 'text-earth-brown placeholder:text-earth-brown/50'
          }"
          @update:model-value="updateSearch"
        />
      </div>

      <!-- Row 2, Column 2: Filter dropdowns in same row -->
      <div class="flex gap-2 justify-end">
        <USelect
          v-model="localValue.region"
          :items="regionOptions"
          placeholder="指定地區"
          size="md"
          trailing-icon="i-heroicons-chevron-down"
          class="w-30"
          :ui="selectUi"
        />
        <USelect
          v-model="localValue.industry"
          :items="industryOptions"
          placeholder="指定產業別"
          size="md"
          trailing-icon="i-heroicons-chevron-down"
          class="w-30"
          :ui="selectUi"
        />
      </div>
    </div>

    <!-- Mobile layout (single column) -->
    <div class="md:hidden space-y-4">
      <!-- Page title with info icon -->
      <div class="flex items-center gap-2">
        <h1 class="text-3xl sm:text-[2.5rem] font-bold text-green-deep mt-0 sm:mt-2 mb-4 leading-[1.2] pb-4">
          排碳大戶觀測企業清單
        </h1>
      </div>

      <!-- Mode toggle -->
      <div class="flex justify-center">
        <div class="inline-flex rounded-full bg-surface-mint p-1 w-full max-w-xs">
          <NuxtLink
            :to="regularModeLink"
            :class="[
              'flex-1 px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer text-center',
              !isPro
                ? 'bg-green-pure text-white'
                : 'bg-transparent text-earth-brown'
            ]"
            @click="handleModeClick('regular')"
          >
            易讀版
          </NuxtLink>
          <NuxtLink
            :to="proModeLink"
            :class="[
              'flex-1 px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer text-center',
              isPro
                ? 'bg-green-pure text-white'
                : 'bg-transparent text-earth-brown'
            ]"
            @click="handleModeClick('pro')"
          >
            專業版
          </NuxtLink>
        </div>
      </div>

      <!-- Search input -->
      <UInput
        :model-value="modelValue.search"
        icon="i-heroicons-magnifying-glass"
        placeholder="搜尋你關注的企業..."
        size="lg"
        class="max-w-full w-full"
        style="min-width: 20rem;"
        :ui="{
          base: 'text-earth-brown placeholder:text-earth-brown/50'
        }"
        @update:model-value="updateSearch"
      />

      <!-- Filter dropdowns in same row -->
      <div class="flex gap-2">
        <USelect
          v-model="localValue.region"
          :items="regionOptions"
          placeholder="指定地區"
          size="md"
          trailing-icon="i-heroicons-chevron-down"
          class="w-30"
          :ui="selectUi"
        />
        <USelect
          v-model="localValue.industry"
          :items="industryOptions"
          placeholder="指定產業別"
          size="md"
          trailing-icon="i-heroicons-chevron-down"
          class="w-30"
          :ui="selectUi"
        />
      </div>
    </div>
  </div>
</template>
