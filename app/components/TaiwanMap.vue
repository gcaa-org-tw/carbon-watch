<!-- eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars -->
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import * as d3 from 'd3'
import { feature } from 'topojson-client'
import type { Topology, GeometryCollection } from 'topojson-specification'

interface MapMarker {
  經度: number
  緯度: number
}

interface Props {
  highlightedRegion?: string | null
  highlightedRegions?: string[]
  allowZoom?: boolean
  focusedRegion?: string | null
  validRegions?: string[]
  /** false = 純展示模式：hover 不變色、游標不變手指（首頁前十大用） */
  hoverHighlight?: boolean
  /** 廠區點位（wgs84），畫在縣市之上、不攔截滑鼠事件 */
  markers?: MapMarker[]
}

interface RegionProperties {
  id: string
  name: string
}

const props = withDefaults(defineProps<Props>(), {
  highlightedRegion: null,
  highlightedRegions: () => [],
  allowZoom: true,
  focusedRegion: null,
  validRegions: () => [],
  hoverHighlight: true,
  markers: () => [],
})

const emit = defineEmits<{
  regionClick: [regionName: string]
  regionHover: [regionName: string, clientX: number, clientY: number]
  regionLeave: [regionName: string]
  mapLoaded: []
}>()

const svgRef = ref<SVGSVGElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)

let svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null
let g: d3.Selection<SVGGElement, unknown, null, undefined> | null = null
let zoom: d3.ZoomBehavior<SVGSVGElement, unknown> | null = null
let markersG: d3.Selection<SVGGElement, unknown, null, undefined> | null = null
let mapProjection: d3.GeoProjection | null = null
let offshoreBounds = new Map<string, [[number, number], [number, number]]>()
// Timestamp until which synthetic clicks are ignored (set right after a
// touch tap is handled, to swallow the browser's follow-up ghost click).
let suppressClickUntil = 0
// Start point of an in-progress single-finger touch on a county path.
let tapOrigin: { x: number, y: number } | null = null

let drawnSize = { width: 0, height: 0 }
let drawRun = 0
let resizeObserver: ResizeObserver | null = null

const initMap = async () => {
  if (!svgRef.value || !containerRef.value) return

  // Clear any existing content
  d3.select(svgRef.value).selectAll('*').remove()

  const container = containerRef.value
  const width = container.clientWidth
  const height = container.clientHeight
  drawnSize = { width, height }
  const run = ++drawRun

  // Create SVG
  svg = d3.select(svgRef.value)
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', `0 0 ${width} ${height}`)

  // Create a group for zoom/pan
  g = svg.append('g')

  // Load TopoJSON data
  const topoData = await import('~/assets/tw-counties.json')
  
  // Convert TopoJSON to GeoJSON
  const topology = topoData as unknown as Topology
  const geoData = feature(
    topology,
    (topology.objects as { map: GeometryCollection }).map
  )

  // Create projection
  const projection = d3.geoMercator()
    .fitSize([width, height], geoData)
  mapProjection = projection

  const path = d3.geoPath().projection(projection)

  const offshoreTopo = await import('~/assets/tw-offshore-counties.json')
  if (run !== drawRun) return
  const offshoreTopology = offshoreTopo as unknown as Topology
  const offshoreData = feature(
    offshoreTopology,
    (offshoreTopology.objects as { map: GeometryCollection }).map
  )
  const insetPaths = drawOffshoreFrames(offshoreData.features, projection, width, height)

  // Draw counties
  g.selectAll('path')
    .data([...geoData.features, ...offshoreData.features])
    .enter()
    .append('path')
    .attr('d', (d: any) => (insetPaths.get(d.properties?.name) ?? path)(d))
    .attr('class', 'county')
    .attr('data-name', (d: any) => d.properties?.name || '')
    .attr('fill', 'var(--color-surface-warm, #f5f5dc)')
    .attr('stroke', 'var(--color-earth-brown, #8B4513)')
    .attr('stroke-width', 1)
    .style('cursor', (d: any) => {
      if (!props.hoverHighlight) return 'default'
      const regionName = d.properties?.name
      const isValid = props.validRegions.length === 0 || props.validRegions.includes(regionName)
      return isValid ? 'pointer' : 'default'
    })
    .on('click', function(_event: any, d: any) {
      // On touch devices the tap is handled in `touchend` below (the follow-up
      // synthetic click is suppressed by the svg touch handlers); skip the
      // ghost click that may still slip through.
      if (Date.now() < suppressClickUntil) return
      const regionName = d.properties?.name
      const isValid = props.validRegions.length === 0 || props.validRegions.includes(regionName)
      if (regionName && isValid) {
        emit('regionClick', regionName)
      }
    })
    .on('touchstart', function(event: any) {
      tapOrigin = event.touches?.length === 1
        ? { x: event.touches[0].clientX, y: event.touches[0].clientY }
        : null
    })
    .on('touchend', function(event: any, d: any) {
      if (!tapOrigin) return
      const ct = event.changedTouches?.[0]
      const moved = ct && Math.hypot(ct.clientX - tapOrigin.x, ct.clientY - tapOrigin.y) > 12
      tapOrigin = null
      if (moved) return
      const regionName = d.properties?.name
      const isValid = props.validRegions.length === 0 || props.validRegions.includes(regionName)
      if (regionName && isValid) {
        suppressClickUntil = Date.now() + 700
        emit('regionClick', regionName)
      }
    })
    .on('mouseenter', function(this: SVGPathElement, event: MouseEvent, d: any) {
      const regionName = d.properties?.name
      const isValid = props.validRegions.length === 0 || props.validRegions.includes(regionName)
      const isMultiHighlighted = props.highlightedRegions.includes(regionName)
      if (props.hoverHighlight && !props.focusedRegion && isValid && !isMultiHighlighted) {
        d3.select(this)
          .attr('fill', 'var(--color-earth-brown-light, #D2691E)')
          .attr('stroke-width', 2)
      }
      if (regionName) emit('regionHover', regionName, event.clientX, event.clientY)
    })
    .on('mousemove', function(this: SVGPathElement, event: MouseEvent, d: any) {
      const regionName = d.properties?.name
      if (regionName) emit('regionHover', regionName, event.clientX, event.clientY)
    })
    .on('mouseleave', function(this: SVGPathElement, _event: any, d: any) {
      const regionName = d.properties?.name
      if (regionName === props.highlightedRegion || regionName === props.focusedRegion) {
        d3.select(this)
          .attr('fill', 'var(--color-earth-brown, #8B4513)')
          .attr('stroke-width', 2)
      } else if (props.highlightedRegions.includes(regionName)) {
        d3.select(this)
          .attr('fill', 'var(--color-green-pure, #04B300)')
          .attr('stroke-width', 2)
      } else {
        d3.select(this)
          .attr('fill', 'var(--color-surface-warm, #f5f5dc)')
          .attr('stroke-width', 1)
      }
      if (regionName) emit('regionLeave', regionName)
    })

  // Factory dot layer sits above counties; never intercepts county hover
  markersG = g.append('g').attr('pointer-events', 'none')
  drawMarkers()
  // 初次載入與 resize 重畫時，props 沒有變化事件、watcher 不會跑，
  // 這裡不套用一次的話 highlight 要等下一次 props 變化（輪播切換）才出現
  updateHighlight()

  zoom = d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent([1, 8])
    .on('zoom', (event) => {
      g?.attr('transform', event.transform)
    })

  if (props.allowZoom) {
    // For mobile, require 2 fingers for zoom/pan
    if ('ontouchstart' in window) {
      // Track touch state — single finger is reserved for tapping a county
      // (handled on the path's touchend); two fingers pan/zoom.
      let activeTouches = 0

      svg.on('touchstart', function(event: TouchEvent) {
        activeTouches = event.touches.length
        if (activeTouches < 2) {
          event.preventDefault()
          return false
        }
      }, { passive: false })

      svg.on('touchmove', function(event: TouchEvent) {
        activeTouches = event.touches.length
        if (activeTouches < 2) {
          event.preventDefault()
          return false
        }
      }, { passive: false })

      svg.on('touchend', function(event: TouchEvent) {
        activeTouches = event.touches.length
      })

      // Apply zoom with touch filter
      svg.call(zoom.filter((event: any) => {
        // For touch events, only allow if 2+ touches
        if (event.type.startsWith('touch')) {
          return event.touches && event.touches.length >= 2
        }
        // Allow all other events (mouse, etc)
        return true
      }))
    } else {
      // Desktop: normal zoom behavior
      svg.call(zoom)
    }
  }
  
  // Emit map loaded event
  emit('mapLoaded')
}

// 插圖框不超出主投影 (120.03°E, 22.95°N) 以西以南的範圍，該處主圖只有海面
const OFFSHORE_ORDER = ['連江縣', '金門縣']
const OFFSHORE_CORNER: [number, number] = [120.03, 22.95]

const drawOffshoreFrames = (
  features: GeoJSON.Feature[],
  projection: d3.GeoProjection,
  width: number,
  height: number,
) => {
  const insetPaths = new Map<string, d3.GeoPath<any, d3.GeoPermissibleObjects>>()
  offshoreBounds = new Map()
  const corner = projection(OFFSHORE_CORNER)
  if (!g || !corner) return insetPaths

  const pad = Math.max(4, width * 0.015)
  const gap = Math.max(4, height * 0.015)
  const availH = (height - pad - corner[1] - gap) / 2
  const frameW = Math.min(corner[0] - pad, availH * 1.8)
  const frameH = Math.min(availH, frameW * 0.9)
  const stackTop = height - pad - 2 * frameH - gap
  const left = corner[0] - frameW
  const fontSize = Math.max(9, Math.min(12, frameH * 0.16))
  const inner = Math.max(3, frameH * 0.08)
  if (frameH <= 0 || frameW <= 0) return insetPaths

  OFFSHORE_ORDER.forEach((name, i) => {
    const f = features.find(ft => ft.properties?.name === name)
    if (!f) return
    const top = stackTop + i * (frameH + gap)

    g!.append('rect')
      .attr('x', left)
      .attr('y', top)
      .attr('width', frameW)
      .attr('height', frameH)
      .attr('rx', 2)
      .attr('fill', 'none')
      .attr('stroke', 'var(--color-earth-brown, #8B4513)')
      .attr('stroke-opacity', 0.4)
      .attr('stroke-width', 0.75)
      .attr('pointer-events', 'none')

    g!.append('text')
      .attr('x', left + inner)
      .attr('y', top + inner)
      .attr('dominant-baseline', 'hanging')
      .attr('font-size', fontSize)
      .attr('fill', 'var(--color-earth-brown, #8B4513)')
      .attr('pointer-events', 'none')
      .text(name)

    const insetProjection = d3.geoMercator().fitExtent(
      [[left + inner, top + inner + fontSize * 1.3], [left + frameW - inner, top + frameH - inner]],
      f,
    )
    const insetPath = d3.geoPath().projection(insetProjection)
    insetPaths.set(name, insetPath)
    offshoreBounds.set(name, insetPath.bounds(f))
  })

  return insetPaths
}

// 廠區點位：淡紅實心圓點。淡紅 fill 對亮綠 highlight 亮度對比僅約 1:1（紅綠色弱
// 也難靠色相區辨），邊界由深色外圈承擔——surface-warm 對綠 6.8:1，亮度差對各型
// 色覺都成立；外徑 2r＋ring＝8px，與先前 × 記號同跨距
const MARKER_R = 3.25
const MARKER_RING = 1.5

const drawMarkers = () => {
  if (!markersG || !mapProjection) return
  const marks = markersG
    .selectAll<SVGCircleElement, MapMarker>('circle.factory-dot')
    .data(props.markers, d => `${d.經度},${d.緯度}`)

  marks.exit().remove()

  marks.enter()
    .append('circle')
    .attr('class', 'factory-dot')
    .attr('r', MARKER_R)
    .attr('fill', 'var(--color-accent-red-light, #FFA0A0)')
    .attr('stroke', 'var(--color-surface-warm, #213620)')
    .attr('stroke-width', MARKER_RING)
    .attr('opacity', 0)
    .merge(marks)
    .attr('transform', (d) => {
      const p = mapProjection!([d.經度, d.緯度])
      return p ? `translate(${p[0]}, ${p[1]})` : 'translate(-100, -100)'
    })
    .transition()
    .duration(200)
    .attr('opacity', 1)
}

const updateHighlight = () => {
  if (!g) return

  g.selectAll<SVGPathElement, any>('path.county')
    .attr('fill', (d: any) => {
      const regionName = d.properties?.name
      if (regionName === props.highlightedRegion || regionName === props.focusedRegion) {
        return 'var(--color-earth-brown, #8B4513)'
      }
      if (props.highlightedRegions.includes(regionName)) {
        return 'var(--color-green-pure, #04B300)'
      }
      return 'var(--color-surface-warm, #f5f5dc)'
    })
    .attr('stroke-width', (d: any) => {
      const regionName = d.properties?.name
      const isHighlighted = regionName === props.highlightedRegion ||
        regionName === props.focusedRegion ||
        props.highlightedRegions.includes(regionName)
      return isHighlighted ? 2 : 1
    })
}

const zoomToRegion = async (regionName: string) => {
  if (!g || !svg || !svgRef.value || !containerRef.value) return

  const container = containerRef.value
  const width = container.clientWidth
  const height = container.clientHeight

  // Load TopoJSON data again for bounds calculation
  const topoData = await import('~/assets/tw-counties.json')
  const geoData = feature(
    topoData as unknown as Topology,
    (topoData as any).objects.map as GeometryCollection
  )

  // Find the feature for the region
  const regionFeature = geoData.features.find((f: any) => f.properties?.name === regionName)
  const insetBounds = offshoreBounds.get(regionName)
  if (!regionFeature && !insetBounds) return

  // Create projection
  const projection = d3.geoMercator()
    .fitSize([width, height], geoData)

  const path = d3.geoPath().projection(projection)

  // Get bounds of the region
  const bounds = insetBounds ?? path.bounds(regionFeature as any)
  const dx = bounds[1][0] - bounds[0][0]
  const dy = bounds[1][1] - bounds[0][1]
  const x = (bounds[0][0] + bounds[1][0]) / 2
  const y = (bounds[0][1] + bounds[1][1]) / 2
  
  const scale = Math.min(8, 0.5 / Math.max(dx / width, dy / height))
  const translate: [number, number] = [width / 2 - scale * x, height / 2 - scale * y]

  // Animate zoom
  svg.transition()
    .duration(750)
    .call(
      zoom!.transform as any,
      d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
    )
}

const resetZoom = () => {
  if (!svg || !zoom) return

  svg.transition()
    .duration(750)
    .call(zoom.transform as any, d3.zoomIdentity)
}

watch(() => props.highlightedRegions, () => {
  updateHighlight()
}, { deep: true })

watch(() => props.markers, () => {
  drawMarkers()
}, { deep: true })

watch(() => props.highlightedRegion, async (newRegion) => {
  updateHighlight()

  // Zoom to highlighted region on desktop/tablet
  if (newRegion) {
    await nextTick()
    await zoomToRegion(newRegion)
  } else {
    resetZoom()
  }
})

watch(() => props.focusedRegion, async (newRegion) => {
  updateHighlight()
  
  if (newRegion && props.allowZoom) {
    await nextTick()
    await zoomToRegion(newRegion)
  } else if (!newRegion && props.allowZoom) {
    resetZoom()
  }
})

onMounted(() => {
  initMap()

  // The container can change size without a window resize (e.g. the phone carousel appearing below the map)
  resizeObserver = new ResizeObserver(() => {
    const el = containerRef.value
    if (!el || (el.clientWidth === drawnSize.width && el.clientHeight === drawnSize.height)) return
    initMap()
  })
  if (containerRef.value) resizeObserver.observe(containerRef.value)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})
</script>

<template>
  <div ref="containerRef" class="w-full h-full relative bg-surface-warm rounded-lg overflow-hidden">
    <svg ref="svgRef" class="block touch-none" />
  </div>
</template>

<style scoped>
svg :deep(.county) {
  transition: fill 0.2s ease, stroke-width 0.2s ease;
}
</style>
