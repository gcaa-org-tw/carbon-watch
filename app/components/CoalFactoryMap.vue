<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import * as d3 from 'd3'
import { feature } from 'topojson-client'
import type { Topology, GeometryCollection } from 'topojson-specification'
import type { CoalMapFactory } from '~/types/coalMap'

interface Props {
  factories: CoalMapFactory[]
  colorByIndustry: Record<string, string>
  selectedCno: string | null
  /** Global max 用煤量2024 — keeps bubble scale stable across industry filtering */
  maxValue: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  factoryHover: [factory: CoalMapFactory, clientX: number, clientY: number]
  factoryLeave: []
  factorySelect: [factory: CoalMapFactory]
}>()

const containerRef = ref<HTMLDivElement | null>(null)
const svgRef = ref<SVGSVGElement | null>(null)

const MIN_RADIUS = 3.5
const SURFACE_COLOR = '#1A2C1A'
const SELECT_COLOR = '#5AE694'

const renderMap = async () => {
  if (!svgRef.value || !containerRef.value) return

  const width = containerRef.value.clientWidth
  const height = containerRef.value.clientHeight
  if (width === 0 || height === 0) return

  d3.select(svgRef.value).selectAll('*').remove()

  const svg = d3.select(svgRef.value)
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', `0 0 ${width} ${height}`)

  const topoData = await import('~/assets/tw-counties.json')
  const topology = topoData as unknown as Topology
  const geoData = feature(
    topology,
    (topology.objects as { map: GeometryCollection }).map
  )

  // Padded fit so coastal bubbles (中鋼小港, 中龍龍井) don't clip at the edges
  const pad = Math.min(width, height) * 0.08
  const projection = d3.geoMercator().fitExtent(
    [[pad, pad], [width - pad, height - pad]],
    geoData
  )
  const path = d3.geoPath().projection(projection)

  // County outlines — land tone against the page surface, no value encoding
  svg.append('g')
    .selectAll('path')
    .data(geoData.features)
    .enter()
    .append('path')
    .attr('d', d => path(d) ?? '')
    .attr('fill', 'var(--color-surface-warm, #213620)')
    .attr('stroke', 'rgba(196, 190, 154, 0.4)')
    .attr('stroke-width', 1)

  // Bubbles — area proportional to 2024 coal usage, anchored at the global max
  const maxRadius = Math.min(width, height) * 0.085
  const radiusOf = (value: number) => {
    if (props.maxValue <= 0 || value <= 0) return MIN_RADIUS
    return Math.max(MIN_RADIUS, maxRadius * Math.sqrt(value / props.maxValue))
  }

  // Draw big bubbles first so small ones stay reachable on top
  const sorted = [...props.factories].sort((a, b) => b.用煤量2024 - a.用煤量2024)

  svg.append('g')
    .selectAll('circle')
    .data(sorted)
    .enter()
    .append('circle')
    .attr('class', 'factory-dot')
    .attr('cx', d => projection([d.經度, d.緯度])?.[0] ?? -100)
    .attr('cy', d => projection([d.經度, d.緯度])?.[1] ?? -100)
    .attr('r', d => radiusOf(d.用煤量2024))
    .attr('fill', d => props.colorByIndustry[d.業別] ?? '#898781')
    .attr('fill-opacity', d => d.管制編號 === props.selectedCno ? 1 : 0.78)
    .attr('stroke', d => d.管制編號 === props.selectedCno ? SELECT_COLOR : SURFACE_COLOR)
    .attr('stroke-width', d => d.管制編號 === props.selectedCno ? 2.5 : 1.5)
    .style('cursor', 'pointer')
    .on('mouseenter', function (event: MouseEvent, d) {
      d3.select(this).attr('fill-opacity', 1)
      emit('factoryHover', d, event.clientX, event.clientY)
    })
    .on('mousemove', (event: MouseEvent, d) => {
      emit('factoryHover', d, event.clientX, event.clientY)
    })
    .on('mouseleave', function (_event: MouseEvent, d) {
      if (d.管制編號 !== props.selectedCno) {
        d3.select(this).attr('fill-opacity', 0.78)
      }
      emit('factoryLeave')
    })
    .on('click', (_event: MouseEvent, d) => {
      emit('factorySelect', d)
    })
}

watch(() => [props.factories, props.selectedCno], () => {
  renderMap()
}, { deep: false })

let resizeHandler: (() => void) | null = null

onMounted(() => {
  renderMap()
  resizeHandler = () => renderMap()
  window.addEventListener('resize', resizeHandler)
})

onUnmounted(() => {
  if (resizeHandler) window.removeEventListener('resize', resizeHandler)
})
</script>

<template>
  <div ref="containerRef" class="w-full h-full relative">
    <svg ref="svgRef" class="block" />
  </div>
</template>

<style scoped>
svg :deep(.factory-dot) {
  transition: fill-opacity 0.15s ease, stroke-width 0.15s ease;
}
</style>
