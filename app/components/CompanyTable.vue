<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Column, Row } from '@tanstack/vue-table'
import { RouterLink } from 'vue-router'
import type { CompanyData } from '~/types/company'
import companyGradeMap from '~/assets/data/company-grade-map.json'

interface Props {
  rows: CompanyData[]
  isPro?: boolean
  showLegend?: boolean
  coalFirst?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isPro: false,
  showLegend: true,
  coalFirst: false
})

// Helper function to parse value (handle commas and percentages)
const parseValue = (value: string | number): number => {
  if (typeof value === 'number') return value

  // Remove commas and trim
  let cleanValue = value.replace(/,/g, '').trim()

  // Handle percentage values (e.g., "28.0%")
  if (cleanValue.endsWith('%')) {
    cleanValue = cleanValue.slice(0, -1)
    const percentValue = parseFloat(cleanValue)
    return isNaN(percentValue) ? NaN : percentValue / 100
  }

  return parseFloat(cleanValue)
}

// Numeric sort comparator: parses comma-formatted numbers and percentages before comparing.
// Treats unparseable/empty values as the smallest rank so they sink to the bottom when sorting descending.
const numericSortingFn = (rowA: Row<CompanyData>, rowB: Row<CompanyData>, columnId: string): number => {
  const rawA = rowA.getValue(columnId)
  const rawB = rowB.getValue(columnId)
  const a = parseValue((rawA ?? '') as string | number)
  const b = parseValue((rawB ?? '') as string | number)
  const aIsNum = !isNaN(a)
  const bIsNum = !isNaN(b)
  if (!aIsNum && !bIsNum) return 0
  if (!aIsNum) return -1
  if (!bIsNum) return 1
  if (a === b) return 0
  return a < b ? -1 : 1
}

// Helper function to create sortable header
const createSortableHeader = (column: Column<CompanyData>, label: string, align: 'left' | 'right' = 'left') => {
  const isSorted = column.getIsSorted()

  return h(
    'button',
    {
      class: `flex items-center gap-1 whitespace-normal break-words ${align === 'right' ? 'w-full justify-end' : ''} hover:opacity-80 transition-opacity cursor-pointer`,
      onClick: () => {
        const currentSort = column.getIsSorted()
        if (currentSort === false) {
          column.toggleSorting(true)
        } else if (currentSort === 'desc') {
          column.toggleSorting(false)
        } else {
          column.clearSorting()
        }
      },
    },
    [
      h('span', label),
      isSorted !== false && h('span', { class: 'text-xs' }, isSorted === 'asc' ? '↑' : '↓'),
    ]
  )
}

// Helper function to get grade for a value
const getGrade = (field: string, value: string | number) => {
  const gradeConfig = companyGradeMap[field as keyof typeof companyGradeMap] as Array<{
    label: string
    min: number
    max?: number
  }> | undefined
  if (!gradeConfig) return null
  
  const numValue = parseValue(value)
  if (isNaN(numValue)) return null
  
  return gradeConfig.find(grade => {
    if (grade.max !== undefined) {
      return numValue >= grade.min && numValue <= grade.max
    }
    return numValue >= grade.min
  }) || null
}

// Helper function to get grade colors
const getGradeColors = (label: string) => {
  const colorMap = {
    '遠低於期望': { bg: 'bg-accent-red', text: 'text-white', border: 'border-accent-red/30' },
    '有待加強': { bg: 'bg-accent-yellow', text: 'text-black', border: 'border-accent-yellow/30' },
    '合乎標準': { bg: 'bg-accent-blue', text: 'text-white', border: 'border-accent-blue/30' },
    '超乎期待': { bg: 'bg-green-pure', text: 'text-white', border: 'border-green-pure/30' }
  }
  return colorMap[label as keyof typeof colorMap] || { bg: '', text: '', border: '' }
}

// Helper function to render radar grade (circle)
const renderRadarGrade = (value: string | number) => {
  const numValue = parseValue(value)
  if (isNaN(numValue)) return h('span', '-')
  
  const grade = getGrade('雷達圖', value)
  if (!grade) return h('span', String(value))
  
  const colors = getGradeColors(grade.label)
  return h('div', { 
    class: `w-[1.125rem] h-[1.125rem] rounded-full ${colors.bg} border-2 ${colors.border}`
  })
}

// Helper function to render emoji-free boolean/status values
const EMOJI_CHECK = String.fromCodePoint(0x2705)
const EMOJI_CROSS = String.fromCodePoint(0x274C)
const TEXT_CHECK = String.fromCodePoint(0x2713)
const TEXT_CROSS = String.fromCodePoint(0x2717)
const SBTI_TIER_VALUES = new Set(['遠低於2°C', '符合1.5°C目標', '承諾設定科學基礎目標'])
const renderStatus = (value: string | undefined) => {
  if (!value || value.trim() === '') return h('span', '')
  if (value === EMOJI_CHECK) {
    return h('span', { class: 'text-green-deep font-bold' }, TEXT_CHECK)
  }
  if (value === EMOJI_CROSS) {
    return h('span', { class: 'text-accent-red font-bold' }, TEXT_CROSS)
  }
  if (SBTI_TIER_VALUES.has(value)) {
    return h('span', { class: 'inline-block px-2 py-0.5 rounded-full bg-green-pure text-white text-xs whitespace-nowrap' }, value)
  }
  return h('span', value)
}

// Render the 2030 年減量目標設定 cell. When the value is linearly derived
// (target year ≠ 2030) the pill itself becomes the hover trigger for the
// derivation explainer — no separate icon, so the % column stays vertically
// aligned with neighbouring numeric columns.
const render2030Cell = (row: CompanyData) => {
  const value = row['2030 年減量目標設定']
  const tooltip = row['2030 年減量目標設定_推估說明']
  const pill = renderValueWithGrade('2030 年減量目標設定', value, false)
  if (!tooltip) return pill
  return h(
    resolveComponent('UTooltip'),
    {
      text: tooltip,
      delayDuration: 0,
      ui: {
        content: 'h-auto !max-w-[150px] !text-white bg-gray-900 px-3 py-2.5 ring-0 shadow-md',
        text: '!whitespace-normal !text-white leading-relaxed text-xs block',
      },
    },
    () => h('span', { class: 'cursor-help' }, [pill])
  )
}

// Helper function to render value with grade
const renderValueWithGrade = (field: string, value: string | number, isNumeric: boolean = false) => {
  const grade = getGrade(field, value)
  if (!grade) {
    if (isNumeric && typeof value === 'number') {
      return h('span', value.toLocaleString('zh-TW'))
    }
    return h('span', String(value))
  }
  
  const colors = getGradeColors(grade.label)
  
  // Always use pill for graded values
  let displayValue = String(value)
  
  // For 2030 年減量目標設定, remove decimal point and show as integer percentage
  if (field === '2030 年減量目標設定' && displayValue.includes('%')) {
    const numValue = parseValue(value) * 100 // Convert back to percentage
    displayValue = `${Math.round(numValue)}%`
  }
  
  return h('div', { class: 'inline-flex items-center' }, [
    h('span', { 
      class: `px-2 py-1 rounded-full ${colors.bg} ${colors.text} text-sm`
    }, displayValue)
  ])
}

// Render a coal-usage cell. 0 or blank shows as empty (no pill / no colour
// block), per the 燃煤 0 → 空白 decision; non-zero keeps the graded number.
const renderCoal = (value: string | number | undefined) => {
  const n = parseValue((value ?? '') as string | number)
  if (!value || isNaN(n) || n === 0) return h('div', { class: 'text-right' }, '')
  return h('div', { class: 'text-right' }, renderValueWithGrade('燃煤使用量（公噸）', value, true))
}

// Single coal column, shared by pro mode and the coalFirst injection in the
// columns computed below. Deliberately NOT part of nonProColumns so the
// homepage and /companies (which never pass coalFirst) stay coal-free; it
// only surfaces on fund pages.
const coalColumn: TableColumn<CompanyData> = {
  accessorKey: '燃煤使用量（公噸）',
  header: ({ column }) => createSortableHeader(column, '燃煤使用量（公噸）', 'right'),
  enableSorting: true,
  sortingFn: numericSortingFn,
  cell: ({ row }) => renderCoal(row.original['燃煤使用量（公噸）']),
  meta: {
    class: {
      th: 'text-right',
    }
  }
}

// Define columns for non-pro mode
const nonProColumns: TableColumn<CompanyData>[] = [
  {
    accessorKey: '公司',
    header: ({ column }) => createSortableHeader(column, '企業名稱'),
    enableSorting: true,
    cell: ({ row }) =>{
      const companyName = row.original['公司']
      return h(
        RouterLink,
        {
          to: `/companies/${encodeURIComponent(companyName)}`,
          class: 'hover:underline'
        },
        () => companyName
      )
    },
  },
  {
    accessorKey: '產業分類',
    header: ({ column }) => createSortableHeader(column, '產業分類'),
    enableSorting: true,
  },
  {
    accessorKey: '溫室氣體排放量（公噸二氧化碳當量）',
    header: ({ column }) => createSortableHeader(column, '溫室氣體排放量（公噸二氧化碳當量）', 'right'),
    enableSorting: true,
    sortingFn: numericSortingFn,
    cell: ({ row }) => h('div', { class: 'text-right' }, row.original['溫室氣體排放量（公噸二氧化碳當量）']),
    meta: {
      class: {
        th: 'text-right max-w-[7rem]',
      }
    }
  },
  {
    accessorKey: '淨零目標年',
    header: ({ column }) => createSortableHeader(column, '淨零目標年'),
    enableSorting: true,
    sortingFn: numericSortingFn,
  },
  {
    accessorKey: '2030 年減量目標設定',
    header: ({ column }) => createSortableHeader(column, '2030 年減量目標設定'),
    enableSorting: true,
    sortingFn: numericSortingFn,
    cell: ({ row }) => h('div', { class: 'text-right' }, render2030Cell(row.original)),
  },
  {
    accessorKey: 'SBTi 承諾',
    header: ({ column }) => createSortableHeader(column, 'SBTi 承諾'),
    enableSorting: true,
    cell: ({ row }) => h('div', { class: 'text-center' }, renderStatus(row.original['SBTi 承諾'])),
    meta: {
      class: {
        th: 'text-center',
      }
    }
  },
  {
    accessorKey: '2030年溫室氣體絕對減量目標',
    header: ({ column }) => createSortableHeader(column, '2030 年溫室氣體絕對減量目標'),
    enableSorting: true,
    sortingFn: numericSortingFn,
    cell: ({ row }) => h('div', { class: 'flex justify-center' },
      renderRadarGrade(row.original['2030年溫室氣體絕對減量目標'])
    ),
    meta: {
      class: {
        th: 'text-center',
      }
    }
  },
  {
    accessorKey: '2030年再生能源使用率目標',
    header: ({ column }) => createSortableHeader(column, '2030 年再生能源使用率目標'),
    enableSorting: true,
    sortingFn: numericSortingFn,
    cell: ({ row }) => h('div', { class: 'flex justify-center' },
      renderRadarGrade(row.original['2030年再生能源使用率目標'])
    ),
    meta: {
      class: {
        th: 'text-center',
      }
    }
  },
  {
    accessorKey: '2030年能源效率進步目標',
    header: ({ column }) => createSortableHeader(column, '2030 年能源效率進步目標'),
    enableSorting: true,
    sortingFn: numericSortingFn,
    cell: ({ row }) => h('div', { class: 'flex justify-center' },
      renderRadarGrade(row.original['2030年能源效率進步目標'])
    ),
    meta: {
      class: {
        th: 'text-center',
      }
    }
  },
  {
    accessorKey: '2024年再生能源使用率',
    header: ({ column }) => createSortableHeader(column, '去年再生能源使用率'),
    enableSorting: true,
    sortingFn: numericSortingFn,
    cell: ({ row }) => h('div', { class: 'flex justify-center' },
      renderRadarGrade(row.original['2024年再生能源使用率'])
    ),
    meta: {
      class: {
        th: 'text-center',
      }
    }
  },
  {
    accessorKey: '2022-2024年能源效率進步率',
    header: ({ column }) => createSortableHeader(column, '近三年能效進步率'),
    enableSorting: true,
    sortingFn: numericSortingFn,
    cell: ({ row }) => h('div', { class: 'flex justify-center' },
      renderRadarGrade(row.original['2022-2024年能源效率進步率'])
    ),
    meta: {
      class: {
        th: 'text-center',
      }
    }
  },
  {
    accessorKey: '範疇三減量規劃',
    header: ({ column }) => createSortableHeader(column, '範疇三減量規劃'),
    enableSorting: true,
    sortingFn: numericSortingFn,
    cell: ({ row }) => h('div', { class: 'flex justify-center' },
      renderRadarGrade(row.original['範疇三及減量策略'])
    ),
    meta: {
      class: {
        th: 'text-center',
      }
    }
  },
]

// Define columns for pro mode
const proColumns: TableColumn<CompanyData>[] = [
  {
    accessorKey: '公司',
    header: ({ column }) => createSortableHeader(column, '企業名稱'),
    enableSorting: true,
    cell: ({ row }) =>{
      const companyName = row.original['公司']
      return h(
        RouterLink,
        {
          to: `/companies/${encodeURIComponent(companyName)}`,
          class: 'hover:underline'
        },
        () => companyName
      )
    }
  },
  {
    accessorKey: '產業分類',
    header: ({ column }) => createSortableHeader(column, '產業分類'),
    enableSorting: true,
  },
  {
    accessorKey: '溫室氣體排放量（公噸二氧化碳當量）',
    header: ({ column }) => createSortableHeader(column, '溫室氣體排放量（公噸二氧化碳當量）', 'right'),
    enableSorting: true,
    sortingFn: numericSortingFn,
    cell: ({ row }) => h('div', { class: 'text-right' }, row.original['溫室氣體排放量（公噸二氧化碳當量）']),
    meta: {
      class: {
        th: 'text-right max-w-[7rem]',
      }
    }
  },
  {
    accessorKey: '淨零目標年',
    header: ({ column }) => createSortableHeader(column, '淨零目標年'),
    enableSorting: true,
    sortingFn: numericSortingFn,
  },
  {
    accessorKey: '2030 年減量目標設定',
    header: ({ column }) => createSortableHeader(column, '2030 年減量目標設定'),
    enableSorting: true,
    sortingFn: numericSortingFn,
    cell: ({ row }) => h('div', { class: 'text-right' }, render2030Cell(row.original)),
  },
  {
    accessorKey: 'SBTi 承諾',
    header: ({ column }) => createSortableHeader(column, 'SBTi 承諾'),
    enableSorting: true,
    cell: ({ row }) => h('div', { class: 'text-center' }, renderStatus(row.original['SBTi 承諾'])),
    meta: {
      class: {
        th: 'text-center',
      }
    }
  },
  {
    accessorKey: '有具體減量策略',
    header: ({ column }) => createSortableHeader(column, '有具體減量策略'),
    enableSorting: true,
    cell: ({ row }) => h('div', { class: 'text-center' }, renderStatus(row.original['有具體減量策略'])),
    meta: {
      class: {
        th: 'text-center',
      }
    }
  },
  {
    accessorKey: '範疇三揭露',
    header: ({ column }) => createSortableHeader(column, '範疇三揭露'),
    enableSorting: true,
    cell: ({ row }) => h('div', { class: 'text-center' }, renderStatus(row.original['範疇三揭露'])),
    meta: {
      class: {
        th: 'text-center',
      }
    }
  },
  {
    accessorKey: '範疇三減量規劃',
    header: ({ column }) => createSortableHeader(column, '範疇三減量規劃'),
    enableSorting: true,
    cell: ({ row }) => h('div', { class: 'text-center' }, renderStatus(row.original['範疇三減量規劃'])),
    meta: {
      class: {
        th: 'text-center',
      }
    }
  },
  {
    accessorKey: '近三年能效進步率',
    header: ({ column }) => createSortableHeader(column, '能源密集度變化率'),
    enableSorting: true,
    sortingFn: numericSortingFn,
    cell: ({ row }) => h('div', { class: 'text-right' }, row.original['近三年能效進步率']),
    meta: {
      class: {
        th: 'text-right',
      }
    }
  },
  {
    accessorKey: '節能目標設定',
    header: ({ column }) => createSortableHeader(column, '節能目標設定'),
    enableSorting: true,
    sortingFn: numericSortingFn,
    cell: ({ row }) => h('div', { class: 'text-right' }, row.original['節能目標設定']),
    meta: {
      class: {
        th: 'text-right',
      }
    }
  },
  {
    accessorKey: '再生能源使用率',
    header: ({ column }) => createSortableHeader(column, '再生能源使用率'),
    enableSorting: true,
    sortingFn: numericSortingFn,
    cell: ({ row }) => h('div', { class: 'text-right' }, row.original['再生能源使用率']),
    meta: {
      class: {
        th: 'text-right',
      }
    }
  },
  {
    accessorKey: '再生能源設置容量',
    header: ({ column }) => createSortableHeader(column, '再生能源設置容量'),
    enableSorting: true,
    cell: ({ row }) => {
      const v = row.original['再生能源設置容量']
      const num = parseValue((v ?? '') as string)
      return h('div', { class: 'text-right' }, isNaN(num) ? (v ?? '') : num.toLocaleString('zh-TW'))
    },
    meta: {
      class: {
        th: 'text-right',
      }
    }
  },
  {
    accessorKey: '是否完成用電大戶再生能源設置義務',
    header: ({ column }) => createSortableHeader(column, '是否完成用電大戶再生能源設置義務'),
    enableSorting: true,
    cell: ({ row }) => h('div', { class: 'text-center' }, renderStatus(row.original['是否完成用電大戶再生能源設置義務'])),
    meta: {
      class: {
        th: 'text-center',
      }
    }
  },
  {
    accessorKey: '中期再生能源目標設定',
    header: ({ column }) => createSortableHeader(column, '中期再生能源目標設定'),
    enableSorting: true,
    sortingFn: numericSortingFn,
    cell: ({ row }) => {
      const val = row.original['中期再生能源目標設定']
      if (!val) return h('div', { class: 'text-right' }, '')
      const num = parseValue(val)
      if (isNaN(num)) return h('div', { class: 'text-right' }, val)
      return h('div', { class: 'text-right' }, `${Math.round(num * 100)}%`)
    },
    meta: {
      class: {
        th: 'text-right',
      }
    }
  },
  {
    accessorKey: 'RE100 承諾',
    header: ({ column }) => createSortableHeader(column, 'RE100 承諾'),
    enableSorting: true,
    cell: ({ row }) => h('div', { class: 'text-center' }, renderStatus(row.original['RE100 承諾'])),
    meta: {
      class: {
        th: 'text-center',
      }
    }
  },
  coalColumn,
]

// Select columns based on isPro prop. coalFirst inserts the single 燃煤使用量
// column right after 公司 + 產業分類 (i.e. before emissions), matching the
// advocacy framing on fund pages. Pages without coalFirst (homepage,
// /companies) are returned unchanged — non-pro never carries a coal column.
const columns = computed<TableColumn<CompanyData>[]>(() => {
  const base = props.isPro ? proColumns : nonProColumns
  if (!props.coalFirst) return base
  const coalKey = '燃煤使用量（公噸）'
  const without = base.filter(c => !('accessorKey' in c && c.accessorKey === coalKey))
  return [...without.slice(0, 2), coalColumn, ...without.slice(2)]
})

// Default sort. coalFirst sorts by 燃煤使用量 desc with 溫室氣體排放量 desc as
// secondary, so coal-heavy companies float to the top while emission ties break
// in the expected direction.
const sorting = ref(
  props.coalFirst
    ? [
        { id: '燃煤使用量（公噸）', desc: true },
        { id: '溫室氣體排放量（公噸二氧化碳當量）', desc: true },
      ]
    : [
        { id: '溫室氣體排放量（公噸二氧化碳當量）', desc: true },
      ]
)
</script>

<template>
  <div class="space-y-4">
    <!-- Color Legend -->
    <div v-if="showLegend" class="flex gap-4 items-center text-sm mx-8 text-earth-brown">
      <div class="flex gap-3">
        <div class="flex items-center gap-1.5">
          <div class="w-3 h-3 rounded-full bg-green-pure border-2 border-green-pure/30" />
          <span>超乎期待</span>
        </div>
        <div class="flex items-center gap-1.5">
          <div class="w-3 h-3 rounded-full bg-accent-blue border-2 border-accent-blue/30" />
          <span>合乎標準</span>
        </div>
        <div class="flex items-center gap-1.5">
          <div class="w-3 h-3 rounded-full bg-accent-yellow border-2 border-accent-yellow/30" />
          <span>有待加強</span>
        </div>
        <div class="flex items-center gap-1.5">
          <div class="w-3 h-3 rounded-full bg-accent-red border-2 border-accent-red/30" />
          <span>遠低於期望</span>
        </div>
      </div>
    </div>
    <div v-if="showLegend" class="mx-8">
      <NuxtLink to="/methodology" class="text-sm text-green-pure hover:underline">
        了解分級標準 →
      </NuxtLink>
    </div>

    <!-- Table -->
    <UTable
      v-model:sorting="sorting"
      sticky
      :columns="columns"
      :data="rows"
      class="max-h-[40rem] border-1 border-gray-600 mx-8"
      :ui="{
        th: 'bg-green-forest text-white min-w-20 py-2 align-bottom',
        tr: 'even:bg-surface-mint/10 odd:bg-surface-warm',
        td: 'text-white'
      }"
    />
  </div>
</template>

<style scoped>
:deep(thead) {
  position: sticky;
  top: 0;
  z-index: 25;
}

:deep(thead th:first-child) {
  position: sticky;
  left: 0;
  z-index: 40;
  background-color: var(--color-green-forest);
}

:deep(tbody td:first-child) {
  position: sticky;
  left: 0;
  z-index: 10;
  background-color: var(--color-surface-warm);
}

:deep(tbody tr:nth-child(even) td:first-child) {
  background-color: var(--color-surface-mint);
}
</style>
