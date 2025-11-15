<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Column } from '@tanstack/vue-table'
import type { CompanyData } from '~/types/company'
import companyGradeMap from '~/assets/data/company-grade-map.json'

interface Props {
  rows: CompanyData[]
  isPro?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isPro: false
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

// Helper function to split header with units
const splitHeader = (text: string) => {
  const match = text.match(/^(.+?)（(.+)）$/)
  if (match) {
    return { main: match[1], unit: `（${match[2]}）` }
  }
  return { main: text, unit: null }
}

// Helper function to create sortable header
const createSortableHeader = (column: Column<CompanyData>, label: string, align: 'left' | 'right' = 'left') => {
  const isSorted = column.getIsSorted()
  const { main, unit } = splitHeader(label)
  
  return h(
    'button',
    {
      class: `flex flex-col gap-0.5 ${align === 'right' ? 'items-end w-full' : 'items-start'} hover:opacity-80 transition-opacity cursor-pointer`,
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
      h('span', { class: 'flex items-center gap-1' }, [
        h('span', main),
        isSorted !== false && h('span', { class: 'text-xs' }, 
          isSorted === 'asc' ? '↑' : '↓'
        )
      ]),
      unit && h('span', { class: 'text-xs opacity-70' }, unit)
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

// Define columns for non-pro mode
const nonProColumns: TableColumn<CompanyData>[] = [
  {
    accessorKey: '公司',
    header: ({ column }) => createSortableHeader(column, '企業名稱'),
    enableSorting: true,
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
    cell: ({ row }) => h('div', { class: 'text-right' }, row.original['溫室氣體排放量（公噸二氧化碳當量）']),
    meta: {
      class: {
        th: 'text-right',
      }
    }
  },
  {
    accessorKey: '淨零目標年',
    header: ({ column }) => createSortableHeader(column, '淨零目標年'),
    enableSorting: true,
  },
  {
    accessorKey: '2030 年減量目標設定',
    header: ({ column }) => createSortableHeader(column, '2030 年減量目標設定'),
    enableSorting: true,
    cell: ({ row }) => h('div', { class: 'text-right' }, 
      renderValueWithGrade('2030 年減量目標設定', row.original['2030 年減量目標設定'], false)
    ),
  },
  {
    accessorKey: 'SBTi 承諾',
    header: ({ column }) => createSortableHeader(column, 'SBTi 承諾'),
    enableSorting: true,
  },
  {
    accessorKey: '2030年溫室氣體絕對減量目標',
    header: ({ column }) => createSortableHeader(column, '2030 年溫室氣體絕對減量目標'),
    enableSorting: true,
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
    cell: ({ row }) => h('div', { class: 'text-right' }, row.original['溫室氣體排放量（公噸二氧化碳當量）']),
    meta: {
      class: {
        th: 'text-right',
      }
    }
  },
  {
    accessorKey: '淨零目標年',
    header: ({ column }) => createSortableHeader(column, '淨零目標年'),
    enableSorting: true,
  },
  {
    accessorKey: '2030 年減量目標設定',
    header: ({ column }) => createSortableHeader(column, '2030 年減量目標設定'),
    enableSorting: true,
    cell: ({ row }) => h('div', { class: 'text-right' }, 
      renderValueWithGrade('2030 年減量目標設定', row.original['2030 年減量目標設定'], false)
    ),
  },
  {
    accessorKey: 'SBTi 承諾',
    header: ({ column }) => createSortableHeader(column, 'SBTi 承諾'),
    enableSorting: true,
  },
  {
    accessorKey: '有具體減量策略',
    header: ({ column }) => createSortableHeader(column, '有具體減量策略'),
    enableSorting: true,
    cell: ({ row }) => {
      const hasStrategy = row.original['有具體減量策略']
      const icon = hasStrategy && hasStrategy.trim() !== '' ? '✅' : '❌'
      return h('div', { 
        class: 'text-center cursor-help',
        title: hasStrategy || '無資料'
      }, icon)
    },
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
    cell: ({ row }) => h('div', { class: 'text-center' }, row.original['範疇三揭露']),
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
    cell: ({ row }) => h('div', { class: 'text-center' }, row.original['範疇三減量規劃']),
    meta: {
      class: {
        th: 'text-center',
      }
    }
  },
  {
    accessorKey: '近三年能效進步率',
    header: ({ column }) => createSortableHeader(column, '近三年能效進步率'),
    enableSorting: true,
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
    cell: ({ row }) => h('div', { class: 'text-right' }, 
      renderValueWithGrade('再生能源設置容量', row.original['再生能源設置容量'], true)
    ),
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
    cell: ({ row }) => h('div', { class: 'text-center' }, row.original['是否完成用電大戶再生能源設置義務']),
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
    cell: ({ row }) => h('div', { class: 'text-right' }, row.original['中期再生能源目標設定']),
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
    cell: ({ row }) => h('div', { class: 'text-center' }, row.original['RE100 承諾']),
    meta: {
      class: {
        th: 'text-center',
      }
    }
  },
  {
    accessorKey: '燃煤使用量（公噸）',
    header: ({ column }) => createSortableHeader(column, '燃煤使用量（公噸）', 'right'),
    enableSorting: true,
    cell: ({ row }) => h('div', { class: 'text-right' }, 
      renderValueWithGrade('燃煤使用量（公噸）', row.original['燃煤使用量（公噸）'], true)
    ),
    meta: {
      class: {
        th: 'text-right',
      }
    }
  },
]

// Select columns based on isPro prop
const columns = computed(() => props.isPro ? proColumns : nonProColumns)

// Default sort
const sorting = ref([
  {
    id: '溫室氣體排放量（公噸二氧化碳當量）',
    desc: true,
  }
])
</script>

<template>
  <div class="space-y-4">
    <!-- Color Legend -->
    <div class="flex gap-4 items-center text-sm">
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

    <!-- Table -->
    <UTable
      v-model:sorting="sorting"
      sticky
      :columns="columns"
      :data="rows"
      class="max-h-200 border-1 border-gray-300 dark:border-gray-600 -mx-4"
      :ui="{
        th: 'bg-green-forest text-white min-w-20',
        tr: 'even:bg-surface-mint dark:even:bg-surface-mint/10 odd:bg-white dark:odd:bg-gray-900',
        td: 'text-black dark:text-white'
      }"
    />
  </div>
</template>
