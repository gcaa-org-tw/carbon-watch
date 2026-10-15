<script setup lang="ts">
import { COAL_YEARS, coalValueOf, type CoalMapFactory } from '~/types/coalMap'

interface Props {
  factory: CoalMapFactory
  year: number
}

defineProps<Props>()

const formatTonnes = (n: number) => Math.round(n).toLocaleString('en-US')
</script>

<template>
  <table class="w-full text-sm">
    <thead>
      <tr class="text-earth-brown/70 text-left">
        <th class="py-1 font-normal">年度</th>
        <th class="py-1 font-normal text-right">用煤量（公噸）</th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="y in COAL_YEARS"
        :key="y"
        class="border-t border-earth-brown/10"
        :class="y === year ? 'text-green-mint font-semibold' : 'text-earth-brown'"
      >
        <td class="py-1">{{ y }} 年</td>
        <td class="py-1 text-right tabular-nums whitespace-nowrap">
          {{ coalValueOf(factory, y) > 0 ? formatTonnes(coalValueOf(factory, y)) : '—' }}<CoalTrend
            :current="coalValueOf(factory, y)"
            :previous="coalValueOf(factory, y - 1)"
          />
        </td>
      </tr>
    </tbody>
  </table>
</template>
