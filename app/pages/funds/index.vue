<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Column } from '@tanstack/vue-table'
import fundListData from '~/assets/data/fund-list.json'

interface FundData {
  基金代號: string
  基金名稱: string
  總市值: number
  排碳大戶家數: number
  排碳大戶佔比: number
  排碳大戶總碳排量: number
  使用燃煤家數: number
}

// Get view mode
const { isPro } = useViewMode()

// Search filter
const search = ref('')

// Helper function to create sortable header
const createSortableHeader = (column: Column<FundData>, label: string, align: 'left' | 'right' = 'left') => {
  const isSorted = column.getIsSorted()
  
  return h(
    'button',
    {
      class: `flex items-center gap-2 ${align === 'right' ? 'justify-end w-full' : ''} hover:opacity-80 transition-opacity cursor-pointer`,
      onClick: () => {
        const currentSort = column.getIsSorted()
        if (currentSort === false) {
          // First click: sort descending
          column.toggleSorting(true)
        } else if (currentSort === 'desc') {
          // Second click: sort ascending
          column.toggleSorting(false)
        } else {
          // Third click: clear sorting
          column.clearSorting()
        }
      },
    },
    [
      h('span', label),
      h('span', { class: 'text-xs' }, 
        isSorted === 'asc' ? '↑' : isSorted === 'desc' ? '↓' : '↕'
      )
    ]
  )
}

// Define table columns using Nuxt UI v4 API
const columns: TableColumn<FundData>[] = [
  {
    accessorKey: '基金代號',
    header: ({ column }) => createSortableHeader(column, '基金代號'),
    enableSorting: true,
    cell: ({ row }) => {
      const fundPath = `/funds/${row.original.基金代號}${isPro.value ? '/pro' : ''}`
      return h(
        'a',
        {
          href: fundPath,
          class: 'flex items-center gap-1.5 hover:underline cursor-pointer group',
          onClick: (e: MouseEvent) => {
            e.preventDefault()
            navigateTo(fundPath)
          }
        },
        [
          h('span', { class: 'i-heroicons-link-20-solid text-sm text-gray-400 group-hover:text-green-pure transition-colors' }),
          h('span', row.original.基金代號)
        ]
      )
    },
  },
  {
    accessorKey: '基金名稱',
    header: ({ column }) => createSortableHeader(column, '基金名稱'),
    enableSorting: true,
  },
  {
    accessorKey: '總市值',
    header: ({ column }) => createSortableHeader(column, '總市值（百萬新台幣）', 'right'),
    enableSorting: true,
    cell: ({ row }) => h('div', { class: 'text-right' }, row.original.總市值.toLocaleString('zh-TW')),
    meta: {
      class: {
        th: 'text-right',
      }
    }
  },
  {
    accessorKey: '排碳大戶家數',
    header: ({ column }) => createSortableHeader(column, '排碳大戶家數', 'right'),
    enableSorting: true,
    cell: ({ row }) => h('div', { class: 'text-right' }, row.original.排碳大戶家數.toLocaleString('zh-TW')),
    meta: {
      class: {
        th: 'text-right',
      }
    }
  },
  {
    accessorKey: '排碳大戶佔比',
    header: ({ column }) => createSortableHeader(column, '排碳大戶佔比', 'right'),
    enableSorting: true,
    cell: ({ row }) => h('div', { class: 'text-right' }, `${row.original.排碳大戶佔比.toFixed(1)}%`),
    meta: {
      class: {
        th: 'text-right',
      }
    }
  },
  {
    accessorKey: '排碳大戶總碳排量',
    header: ({ column }) => createSortableHeader(column, '排碳大戶總碳排量', 'right'),
    enableSorting: true,
    cell: ({ row }) => h('div', { class: 'text-right' }, row.original.排碳大戶總碳排量.toLocaleString('zh-TW')),
    meta: {
      class: {
        th: 'text-right',
      }
    }
  },
  {
    accessorKey: '使用燃煤家數',
    header: ({ column }) => createSortableHeader(column, '使用燃煤家數', 'right'),
    enableSorting: true,
    cell: ({ row }) => h('div', { class: 'text-right' }, row.original.使用燃煤家數.toLocaleString('zh-TW')),
    meta: {
      class: {
        th: 'text-right',
      }
    }
  },
]

// Default sort using Nuxt UI v4 sorting format
const sorting = ref([
  {
    id: '排碳大戶總碳排量',
    desc: true,
  }
])

// Filter funds by search query
const filteredFunds = computed(() => {
  const funds = fundListData as FundData[]
  
  if (!search.value) {
    return funds
  }
  
  const query = search.value.toLowerCase()
  return funds.filter((fund) => {
    return (
      fund.基金代號.toLowerCase().includes(query) ||
      fund.基金名稱.toLowerCase().includes(query)
    )
  })
})
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-4xl font-bold mb-2">投資基金觀測表</h1>
      <p class="text-earth-brown">
        追蹤台灣投資基金的排碳大戶投資狀況
      </p>
    </div>

    <!-- Search Filter -->
    <div class="flex gap-4 items-center">
      <UInput
        v-model="search"
        icon="i-heroicons-magnifying-glass-20-solid"
        placeholder="搜尋基金代號或名稱..."
        class="flex-1 max-w-md"
      />
      <div class="text-sm text-earth-brown">
        共 {{ filteredFunds.length }} 筆基金
      </div>
    </div>

    <!-- Table -->
    <UTable
      v-model:sorting="sorting"
      sticky
      :columns="columns"
      :data="filteredFunds"
      class="max-h-200 border-1 border-gray-300 dark:border-gray-600"
      :ui="{
        th: 'bg-green-forest text-white',
        tr: 'even:bg-surface-mint dark:even:bg-surface-mint/10 odd:bg-white dark:odd:bg-gray-900',
        td: 'text-black dark:text-white'
      }"
    />
  </div>
</template>
