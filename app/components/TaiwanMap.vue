<!-- eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars -->
<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import * as d3 from 'd3'
import { feature } from 'topojson-client'
import type { Topology, GeometryCollection } from 'topojson-specification'

interface Props {
  highlightedRegion?: string | null
  allowZoom?: boolean
  focusedRegion?: string | null
  validRegions?: string[]
}

interface RegionProperties {
  id: string
  name: string
}

const props = withDefaults(defineProps<Props>(), {
  highlightedRegion: null,
  allowZoom: true,
  focusedRegion: null,
  validRegions: () => [],
})

const emit = defineEmits<{
  regionClick: [regionName: string]
  mapLoaded: []
}>()

const svgRef = ref<SVGSVGElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)

let svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null
let g: d3.Selection<SVGGElement, unknown, null, undefined> | null = null
let zoom: d3.ZoomBehavior<SVGSVGElement, unknown> | null = null

const initMap = async () => {
  if (!svgRef.value || !containerRef.value) return

  // Clear any existing content
  d3.select(svgRef.value).selectAll('*').remove()

  const container = containerRef.value
  const width = container.clientWidth
  const height = container.clientHeight

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

  const path = d3.geoPath().projection(projection)

  // Draw counties
  g.selectAll('path')
    .data(geoData.features)
    .enter()
    .append('path')
    .attr('d', path as any)
    .attr('class', 'county')
    .attr('data-name', (d: any) => d.properties?.name || '')
    .attr('fill', 'var(--color-surface-warm, #f5f5dc)')
    .attr('stroke', 'var(--color-earth-brown, #8B4513)')
    .attr('stroke-width', 1)
    .style('cursor', (d: any) => {
      const regionName = d.properties?.name
      const isValid = props.validRegions.length === 0 || props.validRegions.includes(regionName)
      return isValid ? 'pointer' : 'default'
    })
    .on('click', function(_event: any, d: any) {
      const regionName = d.properties?.name
      const isValid = props.validRegions.length === 0 || props.validRegions.includes(regionName)
      if (regionName && isValid) {
        emit('regionClick', regionName)
      }
    })
    .on('mouseenter', function(this: SVGPathElement, _event: any, d: any) {
      const regionName = d.properties?.name
      const isValid = props.validRegions.length === 0 || props.validRegions.includes(regionName)
      if (!props.focusedRegion && isValid) {
        d3.select(this)
          .attr('fill', 'var(--color-earth-brown-light, #D2691E)')
          .attr('stroke-width', 2)
      }
    })
    .on('mouseleave', function(this: SVGPathElement, _event: any, d: any) {
      const regionName = d.properties?.name
      const isHighlighted = regionName === props.highlightedRegion || regionName === props.focusedRegion
      
      d3.select(this)
        .attr('fill', isHighlighted ? 'var(--color-earth-brown, #8B4513)' : 'var(--color-surface-warm, #f5f5dc)')
        .attr('stroke-width', isHighlighted ? 2 : 1)
    })

  zoom = d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent([1, 8])
    .on('zoom', (event) => {
      g?.attr('transform', event.transform)
    })

  if (props.allowZoom) {
    // For mobile, require 2 fingers for zoom/pan
    if ('ontouchstart' in window) {
      // Track touch state
      let activeTouches = 0

      svg.on('touchstart', function(event: TouchEvent) {
        activeTouches = event.touches.length
        // Only allow zoom/pan with 2+ fingers
        if (activeTouches < 2) {
          event.preventDefault()
          return false
        }
      }, { passive: false })

      svg.on('touchmove', function(event: TouchEvent) {
        activeTouches = event.touches.length
        // Only allow zoom/pan with 2+ fingers
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

const updateHighlight = () => {
  if (!g) return

  g.selectAll<SVGPathElement, any>('path.county')
    .attr('fill', (d: any) => {
      const regionName = d.properties?.name
      const isHighlighted = regionName === props.highlightedRegion || regionName === props.focusedRegion
      return isHighlighted ? 'var(--color-earth-brown, #8B4513)' : 'var(--color-surface-warm, #f5f5dc)'
    })
    .attr('stroke-width', (d: any) => {
      const regionName = d.properties?.name
      const isHighlighted = regionName === props.highlightedRegion || regionName === props.focusedRegion
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
  if (!regionFeature) return

  // Create projection
  const projection = d3.geoMercator()
    .fitSize([width, height], geoData)

  const path = d3.geoPath().projection(projection)

  // Get bounds of the region
  const bounds = path.bounds(regionFeature as any)
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

  // Handle window resize
  const handleResize = () => {
    initMap()
  }

  window.addEventListener('resize', handleResize)

  // Cleanup
  return () => {
    window.removeEventListener('resize', handleResize)
  }
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
