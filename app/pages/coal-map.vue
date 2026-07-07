<script setup lang="ts">
import { ref, computed } from 'vue'
import coalMapJson from '~/assets/data/coal-map.json'
import type { CoalMapData, CoalMapFactory } from '~/types/coalMap'

const coalMap = coalMapJson as unknown as CoalMapData
const meta = coalMap.meta
const factories = coalMap.factories

// Soft launch: reachable by URL only — no nav/homepage entry, and hidden
// from search engines until the page officially ships.
useHead({
  title: '燃煤工廠地圖 - 排碳大戶觀測站',
  meta: [
    { name: 'robots', content: 'noindex, nofollow' },
    { name: 'description', content: '台灣排碳大戶燃煤工廠分布地圖：以生煤使用申報資料呈現各廠 2024 年燃煤使用量。' },
  ],
})

// Categorical palette validated against the site surface #1A2C1A
// (dataviz six-checks: lightness band, chroma floor, CVD ΔE 23.7, contrast ≥ 3:1).
// Assigned to industries in meta.業別排序 fixed order — never re-derived on filter.
const PALETTE = ['#3987e5', '#199e70', '#c98500', '#9085e9', '#e66767', '#d55181', '#d95926']
const colorByIndustry: Record<string, string> = Object.fromEntries(
  meta.業別排序.map((industry, i) => [industry, PALETTE[i % PALETTE.length] ?? '#898781'])
)

const activeIndustries = ref<Set<string>>(new Set(meta.業別排序))

const toggleIndustry = (industry: string) => {
  const next = new Set(activeIndustries.value)
  if (next.has(industry)) {
    next.delete(industry)
  } else {
    next.add(industry)
  }
  activeIndustries.value = next
}

const resetIndustries = () => {
  activeIndustries.value = new Set(meta.業別排序)
}

const industryCounts = computed<Record<string, number>>(() => {
  const counts: Record<string, number> = {}
  for (const f of factories) {
    counts[f.業別] = (counts[f.業別] ?? 0) + 1
  }
  return counts
})

// Bubble scale anchors on the all-data max so filtering never resizes survivors
const maxValue = Math.max(...factories.map(f => f.用煤量2024))

// Map dots: 2024 > 0 only (zero rows stay in the table below)
const dotFactories = computed(() =>
  factories.filter(f => f.用煤量2024 > 0 && activeIndustries.value.has(f.業別))
)

const filteredSorted = computed(() =>
  [...factories]
    .filter(f => activeIndustries.value.has(f.業別))
    .sort((a, b) => b.用煤量2024 - a.用煤量2024)
)

const top10 = computed(() => filteredSorted.value.filter(f => f.用煤量2024 > 0).slice(0, 10))

const zeroCount = computed(() => factories.filter(f => f.用煤量2024 <= 0).length)

const selected = ref<CoalMapFactory | null>(null)

const handleSelect = (factory: CoalMapFactory) => {
  selected.value = selected.value?.管制編號 === factory.管制編號 ? null : factory
}

// Hover tooltip
const TOOLTIP_OFFSET = 14
const TOOLTIP_MAX_WIDTH = 300
const hovered = ref<CoalMapFactory | null>(null)
const mousePos = ref<{ x: number, y: number }>({ x: 0, y: 0 })

const handleHover = (factory: CoalMapFactory, clientX: number, clientY: number) => {
  hovered.value = factory
  mousePos.value = { x: clientX, y: clientY }
}

const handleLeave = () => {
  hovered.value = null
}

const tooltipStyle = computed(() => {
  let x = mousePos.value.x + TOOLTIP_OFFSET
  let y = mousePos.value.y + TOOLTIP_OFFSET
  if (typeof window !== 'undefined') {
    if (x + TOOLTIP_MAX_WIDTH > window.innerWidth) {
      x = Math.max(8, mousePos.value.x - TOOLTIP_MAX_WIDTH - TOOLTIP_OFFSET)
    }
    if (y + 120 > window.innerHeight) {
      y = Math.max(8, mousePos.value.y - 120 - TOOLTIP_OFFSET)
    }
  }
  return { left: `${x}px`, top: `${y}px` }
})

const formatTonnes = (n: number) => Math.round(n).toLocaleString('en-US')

const formatMillionTonnes = (n: number) => (n / 1_000_000).toLocaleString('en-US', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

const isStreetLevel = (f: CoalMapFactory) => f.座標來源.startsWith('OSM')
</script>

<template>
  <div class="py-4">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-4xl font-bold text-green-mint mb-4">
        燃煤工廠地圖
      </h1>
      <p class="text-earth-brown max-w-3xl leading-relaxed">
        台灣的排碳大戶中，有 {{ meta.公司數 }} 家企業共 {{ meta.廠數 }} 座工廠仍在使用生煤，
        {{ meta.資料年份 }} 年合計使用約 {{ formatMillionTonnes(meta.用煤量2024合計) }} 百萬公噸。
        點大小代表該廠 {{ meta.資料年份 }} 年的燃煤使用量，顏色代表產業別。
      </p>
      <p class="text-sm text-earth-brown/70 mt-3 max-w-3xl">
        範疇說明：本地圖僅涵蓋排碳大戶（本站追蹤的製造業排碳大戶）的用煤工廠，不含電力業；
        全台工業用煤另有約百家非排碳大戶的小型用煤工廠，合計約佔工業用煤總量 1%。
      </p>
    </div>

    <!-- Stat strip -->
    <div class="grid grid-cols-3 gap-4 mb-8 max-w-2xl">
      <div>
        <div class="text-3xl font-bold text-green-mint">{{ meta.公司數 }}</div>
        <div class="text-sm text-earth-brown/80 mt-1">燃煤企業</div>
      </div>
      <div>
        <div class="text-3xl font-bold text-green-mint">{{ meta.廠數 }}</div>
        <div class="text-sm text-earth-brown/80 mt-1">燃煤工廠</div>
      </div>
      <div>
        <div class="text-3xl font-bold text-green-mint">{{ formatMillionTonnes(meta.用煤量2024合計) }}<span class="text-lg font-normal ml-1">百萬公噸</span></div>
        <div class="text-sm text-earth-brown/80 mt-1">{{ meta.資料年份 }} 年燃煤使用量</div>
      </div>
    </div>

    <!-- Industry legend / filter -->
    <div class="flex flex-wrap items-center gap-2 mb-6">
      <button
        v-for="industry in meta.業別排序"
        :key="industry"
        type="button"
        class="flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm transition-opacity"
        :class="activeIndustries.has(industry)
          ? 'border-earth-brown/40 text-earth-brown bg-surface-warm'
          : 'border-earth-brown/20 text-earth-brown/40 opacity-60'"
        @click="toggleIndustry(industry)"
      >
        <span
          class="inline-block w-3 h-3 rounded-full"
          :style="{ backgroundColor: colorByIndustry[industry], opacity: activeIndustries.has(industry) ? 1 : 0.35 }"
        />
        {{ industry }}
        <span class="text-xs opacity-70">{{ industryCounts[industry] }}</span>
      </button>
      <button
        v-if="activeIndustries.size < meta.業別排序.length"
        type="button"
        class="px-3 py-1.5 rounded-full text-sm text-green-mint border border-green-mint/40 hover:bg-surface-warm"
        @click="resetIndustries"
      >
        顯示全部
      </button>
    </div>

    <!-- Desktop: map + side panel -->
    <div class="hidden lg:grid gap-8 mb-12" style="grid-template-columns: 3fr 2fr;">
      <div class="h-[620px] relative">
        <CoalFactoryMap
          :factories="dotFactories"
          :color-by-industry="colorByIndustry"
          :selected-cno="selected?.管制編號 ?? null"
          :max-value="maxValue"
          @factory-hover="handleHover"
          @factory-leave="handleLeave"
          @factory-select="handleSelect"
        />
        <div
          v-if="dotFactories.length === 0"
          class="absolute inset-0 flex items-center justify-center text-earth-brown/60"
        >
          請至少選擇一個業別
        </div>
      </div>

      <div class="flex flex-col gap-4">
        <!-- Detail card -->
        <div v-if="selected" class="bg-surface-warm rounded-lg p-5">
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span
                  class="inline-block w-3 h-3 rounded-full shrink-0"
                  :style="{ backgroundColor: colorByIndustry[selected.業別] }"
                />
                <span class="text-sm text-earth-brown/80">{{ selected.業別 }} · {{ selected.縣市 }}</span>
              </div>
              <h3 class="text-xl font-bold text-green-mint">{{ selected.廠名 }}</h3>
              <div class="text-sm text-earth-brown/80 mt-0.5">{{ selected.公司全名 }}</div>
            </div>
            <button
              type="button"
              class="text-earth-brown/60 hover:text-earth-brown text-sm shrink-0"
              @click="selected = null"
            >
              關閉
            </button>
          </div>

          <div class="mt-4">
            <div class="text-sm text-earth-brown/70">{{ meta.資料年份 }} 年燃煤使用量</div>
            <div class="text-2xl font-bold text-earth-brown mt-0.5">
              {{ selected.用煤量2024 > 0 ? `${formatTonnes(selected.用煤量2024)} 公噸` : '無申報數值' }}
            </div>
          </div>

          <div v-if="selected.歷年用煤.length > 1" class="mt-4">
            <div class="text-sm text-earth-brown/70 mb-1">歷年趨勢（2020–2025）</div>
            <CoalSparkline :data="selected.歷年用煤" :width="220" :height="48" />
          </div>

          <div v-if="isStreetLevel(selected)" class="text-xs text-earth-brown/60 mt-3">
            此廠位置為登記地址街道級定位，非精確廠址座標。
          </div>

          <UButton
            :to="`/companies/${encodeURIComponent(selected.公司簡稱)}`"
            color="primary"
            size="sm"
            class="mt-4"
            trailing-icon="i-heroicons-arrow-right-20-solid"
          >
            查看 {{ selected.公司簡稱 }} 的氣候績效
          </UButton>
        </div>

        <!-- Top 10 list -->
        <div class="bg-surface-warm rounded-lg p-5 flex-1 overflow-y-auto" :class="selected ? 'max-h-[260px]' : 'max-h-[620px]'">
          <h3 class="text-lg font-bold text-green-mint mb-3">
            前十大燃煤工廠（{{ meta.資料年份 }}）
          </h3>
          <ol class="flex flex-col gap-1">
            <li v-for="(f, i) in top10" :key="f.管制編號">
              <button
                type="button"
                class="w-full flex items-center gap-3 px-2 py-2 rounded text-left hover:bg-white/5 transition-colors"
                :class="selected?.管制編號 === f.管制編號 ? 'bg-white/10' : ''"
                @click="handleSelect(f)"
              >
                <span class="text-earth-brown/50 text-sm w-5 text-right shrink-0 tabular-nums">{{ i + 1 }}</span>
                <span
                  class="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                  :style="{ backgroundColor: colorByIndustry[f.業別] }"
                />
                <span class="flex-1 min-w-0">
                  <span class="block text-sm text-earth-brown truncate">{{ f.廠名 }}</span>
                  <span class="block text-xs text-earth-brown/60">{{ f.縣市 }}</span>
                </span>
                <span class="text-sm text-earth-brown tabular-nums shrink-0">{{ formatTonnes(f.用煤量2024) }} 公噸</span>
              </button>
            </li>
          </ol>
        </div>
      </div>
    </div>

    <!-- Mobile: map + detail + carousel -->
    <div class="lg:hidden flex flex-col gap-4 mb-12">
      <div class="h-[380px] relative">
        <CoalFactoryMap
          :factories="dotFactories"
          :color-by-industry="colorByIndustry"
          :selected-cno="selected?.管制編號 ?? null"
          :max-value="maxValue"
          @factory-hover="handleHover"
          @factory-leave="handleLeave"
          @factory-select="handleSelect"
        />
        <div
          v-if="dotFactories.length === 0"
          class="absolute inset-0 flex items-center justify-center text-earth-brown/60"
        >
          請至少選擇一個業別
        </div>
      </div>

      <div v-if="selected" class="bg-surface-warm rounded-lg p-4">
        <div class="flex items-center gap-2 mb-1">
          <span
            class="inline-block w-3 h-3 rounded-full shrink-0"
            :style="{ backgroundColor: colorByIndustry[selected.業別] }"
          />
          <span class="text-xs text-earth-brown/80">{{ selected.業別 }} · {{ selected.縣市 }}</span>
        </div>
        <h3 class="text-lg font-bold text-green-mint">{{ selected.廠名 }}</h3>
        <div class="text-sm text-earth-brown mt-1">
          {{ meta.資料年份 }} 年 {{ selected.用煤量2024 > 0 ? `${formatTonnes(selected.用煤量2024)} 公噸` : '無申報數值' }}
        </div>
        <div v-if="isStreetLevel(selected)" class="text-xs text-earth-brown/60 mt-2">
          此廠位置為登記地址街道級定位，非精確廠址座標。
        </div>
        <UButton
          :to="`/companies/${encodeURIComponent(selected.公司簡稱)}`"
          color="primary"
          size="xs"
          class="mt-3"
          trailing-icon="i-heroicons-arrow-right-20-solid"
        >
          查看 {{ selected.公司簡稱 }} 的氣候績效
        </UButton>
      </div>

      <div class="flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory">
        <button
          v-for="f in top10"
          :key="f.管制編號"
          type="button"
          class="flex-none snap-start w-[180px] bg-surface-warm rounded-lg p-3 text-left"
          :class="selected?.管制編號 === f.管制編號 ? 'ring-1 ring-green-mint' : ''"
          @click="handleSelect(f)"
        >
          <div class="flex items-center gap-1.5 mb-1">
            <span
              class="inline-block w-2.5 h-2.5 rounded-full shrink-0"
              :style="{ backgroundColor: colorByIndustry[f.業別] }"
            />
            <span class="text-xs text-earth-brown/70">{{ f.縣市 }}</span>
          </div>
          <div class="text-sm text-earth-brown font-medium leading-snug line-clamp-2">{{ f.廠名 }}</div>
          <div class="text-xs text-earth-brown/80 mt-1 tabular-nums">{{ formatTonnes(f.用煤量2024) }} 公噸</div>
        </button>
      </div>
    </div>

    <!-- Full table -->
    <div class="mb-12">
      <h2 class="text-2xl font-bold text-green-mint mb-4">
        全部燃煤工廠（{{ filteredSorted.length }} 座）
      </h2>
      <div class="overflow-x-auto rounded-lg border border-earth-brown/20">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-warm text-earth-brown/80 text-left">
              <th class="px-3 py-2 font-normal w-10 text-right">#</th>
              <th class="px-3 py-2 font-normal">廠名</th>
              <th class="px-3 py-2 font-normal">所屬企業</th>
              <th class="px-3 py-2 font-normal">業別</th>
              <th class="px-3 py-2 font-normal">縣市</th>
              <th class="px-3 py-2 font-normal text-right whitespace-nowrap">{{ meta.資料年份 }} 年燃煤使用量（公噸）</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(f, i) in filteredSorted"
              :key="f.管制編號"
              class="border-t border-earth-brown/10 hover:bg-white/5"
            >
              <td class="px-3 py-2 text-right text-earth-brown/50 tabular-nums whitespace-nowrap">{{ i + 1 }}</td>
              <td class="px-3 py-2 text-earth-brown whitespace-nowrap">
                {{ f.廠名 }}<span v-if="isStreetLevel(f)" class="text-earth-brown/50">＊</span>
              </td>
              <td class="px-3 py-2">
                <NuxtLink
                  :to="`/companies/${encodeURIComponent(f.公司簡稱)}`"
                  class="text-green-mint hover:underline"
                >
                  {{ f.公司簡稱 }}
                </NuxtLink>
              </td>
              <td class="px-3 py-2">
                <span class="inline-flex items-center gap-1.5 text-earth-brown whitespace-nowrap">
                  <span
                    class="inline-block w-2.5 h-2.5 rounded-full"
                    :style="{ backgroundColor: colorByIndustry[f.業別] }"
                  />
                  {{ f.業別 }}
                </span>
              </td>
              <td class="px-3 py-2 text-earth-brown whitespace-nowrap">{{ f.縣市 }}</td>
              <td class="px-3 py-2 text-right text-earth-brown tabular-nums whitespace-nowrap">
                {{ f.用煤量2024 > 0 ? formatTonnes(f.用煤量2024) : '—' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Notes -->
    <div class="max-w-3xl text-sm text-earth-brown/70 leading-relaxed flex flex-col gap-2 mb-8">
      <h2 class="text-lg font-bold text-green-mint">資料說明</h2>
      <p>
        燃煤使用量來自各縣市政府生煤使用許可申報資料（綠色公民行動聯盟彙整）。
        地圖僅呈現 {{ meta.資料年份 }} 年有申報數值的工廠；表格中「—」表示該廠當年無申報數值，
        可能為停用或未申報（共 {{ zeroCount }} 座），本站不逕行判定為已停用。
      </p>
      <p>
        廠區位置以環境部「環境保護許可管理系統對象基本資料」（依管制編號）之座標為準；
        標示「＊」之工廠該資料集無座標，改以登記地址之街道級定位，非精確廠址。
      </p>
      <p>
        2025 年申報資料尚未完整（鋼鐵業等尚未納入），故以 {{ meta.資料年份 }} 年為基準年；
        2020–2021 年申報涵蓋率較低，歷年趨勢僅供個別工廠參考。
      </p>
      <p>
        關心所在縣市的氣候治理？前往
        <a
          href="https://localnetzero.gcaa.org.tw/"
          target="_blank"
          rel="noopener"
          class="text-green-mint hover:underline"
        >地方淨零觀測站</a>
        檢視地方政府的實際政策作為。
      </p>
    </div>

    <!-- Hover tooltip -->
    <Teleport to="body">
      <div
        v-if="hovered"
        class="fixed z-50 pointer-events-none bg-surface-mint border border-earth-brown/30 rounded-lg shadow-xl px-3 py-2"
        :style="{ ...tooltipStyle, maxWidth: `${TOOLTIP_MAX_WIDTH}px` }"
      >
        <div class="font-semibold text-green-mint text-sm whitespace-nowrap">
          {{ hovered.廠名 }}
        </div>
        <div class="text-xs text-earth-brown mt-0.5 whitespace-nowrap">
          {{ hovered.業別 }} · {{ hovered.縣市 }} · {{ formatTonnes(hovered.用煤量2024) }} 公噸
        </div>
      </div>
    </Teleport>
  </div>
</template>
