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
  /** Global max 用煤量2024 — keeps bubble scale stable across re-renders */
  maxValue: number
  /** Industries to highlight; empty array = highlight all */
  highlightIndustries?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  highlightIndustries: () => [],
})

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
const ZOOM_MIN = 1
const ZOOM_MAX = 8

let svgSel: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null
let zoomBehavior: d3.ZoomBehavior<SVGSVGElement, unknown> | null = null
let dotsSel: d3.Selection<SVGCircleElement, CoalMapFactory, SVGGElement, unknown> | null = null
let countiesG: d3.Selection<SVGGElement, unknown, null, undefined> | null = null
let radiusOf: (value: number) => number = () => MIN_RADIUS
// Survives style updates and resizes so the view doesn't jump back
let currentTransform: d3.ZoomTransform = d3.zoomIdentity

const isHighlighted = (f: CoalMapFactory) =>
  props.highlightIndustries.length === 0 || props.highlightIndustries.includes(f.業別)

// Dot styling (highlight dim + selection ring) updates in place — the map
// itself (paths, zoom state) is not redrawn, so pan/zoom survives pill clicks.
// Radii and strokes counter-scale on zoom (constant screen size), so zooming
// in separates clustered dots (麥寮, 臨海) instead of magnifying them.
const applyMarkStyles = () => {
  const k = currentTransform.k
  if (dotsSel) {
    dotsSel
      .attr('r', d => radiusOf(d.用煤量2024) / k)
      .attr('fill-opacity', d => {
        if (!isHighlighted(d)) return 0.1
        return d.管制編號 === props.selectedCno ? 1 : 0.78
      })
      .attr('stroke', d => d.管制編號 === props.selectedCno ? SELECT_COLOR : SURFACE_COLOR)
      .attr('stroke-opacity', d => isHighlighted(d) ? 1 : 0.25)
      .attr('stroke-width', d => (d.管制編號 === props.selectedCno ? 2.5 : 1.5) / k)
  }
  if (countiesG) {
    countiesG.selectAll('path').attr('stroke-width', 1 / k)
  }
}

const renderMap = async () => {
  if (!svgRef.value || !containerRef.value) return

  const width = containerRef.value.clientWidth
  const height = containerRef.value.clientHeight
  if (width === 0 || height === 0) return

  d3.select(svgRef.value).selectAll('*').remove()

  svgSel = d3.select(svgRef.value)
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', `0 0 ${width} ${height}`)

  const g = svgSel.append('g')

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
  countiesG = g.append('g')
  countiesG
    .selectAll('path')
    .data(geoData.features)
    .enter()
    .append('path')
    .attr('d', d => path(d) ?? '')
    .attr('fill', 'var(--color-surface-warm, #213620)')
    .attr('stroke', 'rgba(196, 190, 154, 0.4)')

  // Bubbles — area proportional to 2024 coal usage, anchored at the global max
  const maxRadius = Math.min(width, height) * 0.085
  radiusOf = (value: number) => {
    if (props.maxValue <= 0 || value <= 0) return MIN_RADIUS
    return Math.max(MIN_RADIUS, maxRadius * Math.sqrt(value / props.maxValue))
  }

  // Draw big bubbles first so small ones stay reachable on top
  const sorted = [...props.factories].sort((a, b) => b.用煤量2024 - a.用煤量2024)

  dotsSel = g.append('g')
    .selectAll<SVGCircleElement, CoalMapFactory>('circle')
    .data(sorted)
    .enter()
    .append('circle')
    .attr('class', 'factory-dot')
    .attr('cx', d => projection([d.經度, d.緯度])?.[0] ?? -100)
    .attr('cy', d => projection([d.經度, d.緯度])?.[1] ?? -100)
    .attr('fill', d => props.colorByIndustry[d.業別] ?? '#898781')
    .style('cursor', 'pointer')
    .on('mouseenter', function (event: MouseEvent, d) {
      if (isHighlighted(d)) d3.select(this).attr('fill-opacity', 1)
      emit('factoryHover', d, event.clientX, event.clientY)
    })
    .on('mousemove', (event: MouseEvent, d) => {
      emit('factoryHover', d, event.clientX, event.clientY)
    })
    .on('mouseleave', function (_event: MouseEvent, d) {
      if (d.管制編號 !== props.selectedCno && isHighlighted(d)) {
        d3.select(this).attr('fill-opacity', 0.78)
      }
      emit('factoryLeave')
    })
    .on('click', (_event: MouseEvent, d) => {
      emit('factorySelect', d)
    })

  zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent([ZOOM_MIN, ZOOM_MAX])
    // Buttons/pinch/drag/dblclick zoom; plain wheel keeps scrolling the page
    .filter((event: Event) => {
      if (event.type === 'wheel') {
        const wheel = event as WheelEvent
        return wheel.ctrlKey || wheel.metaKey
      }
      return !(event as MouseEvent).button
    })
    .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
      currentTransform = event.transform
      g.attr('transform', event.transform.toString())
      applyMarkStyles()
    })

  svgSel.call(zoomBehavior)

  // Restore the view from before this re-render (also runs applyMarkStyles)
  svgSel.call(zoomBehavior.transform, currentTransform)
}

const zoomBy = (factor: number) => {
  if (!svgSel || !zoomBehavior) return
  svgSel.transition().duration(250).call(zoomBehavior.scaleBy, factor)
}

const resetZoom = () => {
  if (!svgSel || !zoomBehavior) return
  svgSel.transition().duration(350).call(zoomBehavior.transform, d3.zoomIdentity)
}

// Full redraw only when the dot set changes
watch(() => props.factories, () => {
  renderMap()
})

// Style-only updates keep the current pan/zoom
watch(() => [props.selectedCno, props.highlightIndustries], () => {
  applyMarkStyles()
})

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
    <svg ref="svgRef" class="block touch-none" />
    <div class="absolute top-2 right-2 flex flex-col gap-1.5">
      <button
        type="button"
        aria-label="放大"
        class="zoom-btn"
        @click="zoomBy(1.6)"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
      <button
        type="button"
        aria-label="縮小"
        class="zoom-btn"
        @click="zoomBy(1 / 1.6)"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M5 12h14" />
        </svg>
      </button>
      <button
        type="button"
        aria-label="重設縮放"
        class="zoom-btn"
        @click="resetZoom"
      >
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 12a9 9 0 1 0 3-6.7" />
          <path d="M3 4v4h4" />
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
svg :deep(.factory-dot) {
  transition: fill-opacity 0.15s ease;
}

.zoom-btn {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(196, 190, 154, 0.4);
  background: var(--color-surface-warm, #213620);
  color: var(--color-earth-brown, #C4BE9A);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease;
}

.zoom-btn:hover {
  color: var(--color-green-mint, #5AE694);
  border-color: rgba(90, 230, 148, 0.5);
}
</style>
