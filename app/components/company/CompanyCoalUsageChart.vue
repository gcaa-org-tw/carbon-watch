<script setup lang="ts">
import * as d3 from 'd3'

interface DataPoint {
  year: number
  value: number
}

interface Props {
  data: DataPoint[]
}

const props = defineProps<Props>()

const chartRef = ref<HTMLDivElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)
const tooltipState = ref<{
  visible: boolean
  x: number
  y: number
  label: string
  value: string
} | null>(null)

const valueFormat = d3.format(',.0f')

onMounted(() => {
  if (chartRef.value && props.data.length > 0) {
    drawChart()
  }
  const handleResize = () => {
    if (chartRef.value && props.data.length > 0) {
      drawChart()
    }
  }
  window.addEventListener('resize', handleResize)
  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
  })
})

watch(() => props.data, () => {
  if (chartRef.value && props.data.length > 0) {
    drawChart()
  }
}, { deep: true })

type ChartGroup = d3.Selection<SVGGElement, unknown, null, undefined>

function drawSingleBar(
  g: ChartGroup,
  point: DataPoint,
  yScale: d3.ScaleLinear<number, number>,
  innerWidth: number,
  innerHeight: number
) {
  const xScale = d3.scaleBand<number>()
    .domain([point.year])
    .range([0, innerWidth])
  const barWidth = Math.min(64, innerWidth * 0.3)
  const barX = (xScale(point.year) ?? 0) + xScale.bandwidth() / 2 - barWidth / 2
  const barTop = yScale(point.value)

  g.append('g')
    .attr('class', 'grid')
    .selectAll('line')
    .data(yScale.ticks(5))
    .enter()
    .append('line')
    .attr('x1', 0)
    .attr('x2', innerWidth)
    .attr('y1', d => yScale(d))
    .attr('y2', d => yScale(d))
    .attr('stroke', '#D9D7CA')
    .attr('stroke-opacity', 0.25)
    .attr('stroke-dasharray', '3,3')

  g.append('rect')
    .attr('x', barX)
    .attr('y', barTop)
    .attr('width', barWidth)
    .attr('height', innerHeight - barTop)
    .attr('rx', 2)
    .attr('fill', '#207443')
    .attr('cursor', 'pointer')
    .on('mousemove', (event: MouseEvent) => {
      const containerRect = containerRef.value?.getBoundingClientRect()
      if (!containerRect) return
      tooltipState.value = {
        visible: true,
        x: event.clientX - containerRect.left,
        y: event.clientY - containerRect.top,
        label: `${point.year} 年`,
        value: `${valueFormat(point.value)} 公噸`,
      }
    })
    .on('mouseleave', () => {
      tooltipState.value = null
    })

  g.append('text')
    .attr('x', barX + barWidth / 2)
    .attr('y', barTop - 6)
    .attr('text-anchor', 'middle')
    .attr('fill', '#C4BE9A')
    .attr('font-size', '12px')
    .attr('pointer-events', 'none')
    .text(valueFormat(point.value))

  g.append('g')
    .attr('transform', `translate(0, ${innerHeight})`)
    .call(d3.axisBottom(xScale).tickValues([point.year]).tickFormat(d => String(d)))
    .selectAll('text')
    .attr('fill', '#C4BE9A')
    .attr('font-size', '12px')

  g.append('g')
    .call(d3.axisLeft(yScale).ticks(5).tickFormat(d => d3.format(',.0f')(d as number)))
    .selectAll('text')
    .attr('fill', '#C4BE9A')
    .attr('font-size', '12px')

  g.selectAll('.domain, .tick line')
    .attr('stroke', '#D9D7CA')
}

function drawChart() {
  if (!chartRef.value || props.data.length === 0) return

  d3.select(chartRef.value).selectAll('*').remove()

  const containerWidth = chartRef.value.clientWidth || 600
  const width = containerWidth
  const height = 300
  const margin = { top: 20, right: 30, bottom: 40, left: 80 }
  const innerWidth = width - margin.left - margin.right
  const innerHeight = height - margin.top - margin.bottom

  const svg = d3.select(chartRef.value)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`)

  const maxValue = (d3.max(props.data, d => d.value) ?? 0) || 1
  const yScale = d3.scaleLinear()
    .domain([0, maxValue * 1.1])
    .range([innerHeight, 0])

  if (props.data.length < 2) {
    drawSingleBar(g, props.data[0]!, yScale, innerWidth, innerHeight)
    return
  }

  const xScale = d3.scaleLinear()
    .domain(d3.extent(props.data, d => d.year) as [number, number])
    .range([0, innerWidth])

  const area = d3.area<DataPoint>()
    .x(d => xScale(d.year))
    .y0(innerHeight)
    .y1(d => yScale(d.value))
    .curve(d3.curveMonotoneX)

  const line = d3.line<DataPoint>()
    .x(d => xScale(d.year))
    .y(d => yScale(d.value))
    .curve(d3.curveMonotoneX)

  const gradient = svg.append('defs')
    .append('linearGradient')
    .attr('id', 'areaGradient')
    .attr('x1', '0%')
    .attr('y1', '0%')
    .attr('x2', '0%')
    .attr('y2', '100%')

  gradient.append('stop')
    .attr('offset', '0%')
    .attr('stop-color', '#207443')
    .attr('stop-opacity', 0.3)

  gradient.append('stop')
    .attr('offset', '100%')
    .attr('stop-color', '#207443')
    .attr('stop-opacity', 0.05)

  g.append('path')
    .datum(props.data)
    .attr('fill', 'url(#areaGradient)')
    .attr('d', area)

  g.append('path')
    .datum(props.data)
    .attr('fill', 'none')
    .attr('stroke', '#207443')
    .attr('stroke-width', 2)
    .attr('d', line)

  // Grid lines first (so they sit under the data)
  g.append('g')
    .attr('class', 'grid')
    .selectAll('line')
    .data(yScale.ticks(5))
    .enter()
    .append('line')
    .attr('x1', 0)
    .attr('x2', innerWidth)
    .attr('y1', d => yScale(d))
    .attr('y2', d => yScale(d))
    .attr('stroke', '#D9D7CA')
    .attr('stroke-opacity', 0.25)
    .attr('stroke-dasharray', '3,3')

  // Data points with hover targets
  const point = g.selectAll('.coal-point')
    .data(props.data)
    .enter()
    .append('g')
    .attr('class', 'coal-point')
    .attr('transform', d => `translate(${xScale(d.year)}, ${yScale(d.value)})`)

  point.append('circle')
    .attr('r', 14)
    .attr('fill', 'transparent')
    .attr('cursor', 'pointer')
    .on('mousemove', (event: MouseEvent, d) => {
      const containerRect = containerRef.value?.getBoundingClientRect()
      if (!containerRect) return
      tooltipState.value = {
        visible: true,
        x: event.clientX - containerRect.left,
        y: event.clientY - containerRect.top,
        label: `${d.year} 年`,
        value: `${valueFormat(d.value)} 公噸`,
      }
    })
    .on('mouseleave', () => {
      tooltipState.value = null
    })

  point.append('circle')
    .attr('r', 4)
    .attr('fill', '#207443')
    .attr('stroke', 'white')
    .attr('stroke-width', 2)
    .attr('pointer-events', 'none')

  const xAxis = d3.axisBottom(xScale)
    .tickValues(props.data.map(d => d.year))
    .tickFormat(d => String(d))

  g.append('g')
    .attr('transform', `translate(0, ${innerHeight})`)
    .call(xAxis)
    .selectAll('text')
    .attr('fill', '#C4BE9A')
    .attr('font-size', '12px')

  g.selectAll('.domain, .tick line')
    .attr('stroke', '#D9D7CA')

  const yAxis = d3.axisLeft(yScale)
    .ticks(5)
    .tickFormat(d => d3.format(',.0f')(d as number))

  g.append('g')
    .call(yAxis)
    .selectAll('text')
    .attr('fill', '#C4BE9A')
    .attr('font-size', '12px')

  g.selectAll('.domain, .tick line')
    .attr('stroke', '#D9D7CA')
}
</script>

<template>
  <div ref="containerRef" class="mt-8 relative">
    <h3 class="text-lg font-bold text-earth-brown mb-4">
      歷年燃煤使用量
    </h3>
    <div ref="chartRef" class="w-full" />
    <div class="flex justify-center mt-2">
      <div class="flex items-center gap-2 text-sm text-earth-brown/70">
        <span class="w-3 h-0.5 bg-green-deep" />
        <span>燃煤使用量</span>
      </div>
    </div>
    <div
      v-if="tooltipState && tooltipState.visible"
      class="pointer-events-none absolute z-10 px-2.5 py-1.5 rounded-md bg-surface-warm border border-earth-brown/30 shadow-lg text-xs text-earth-brown whitespace-nowrap"
      :style="{ left: `${tooltipState.x + 12}px`, top: `${tooltipState.y - 8}px` }"
    >
      <div class="font-semibold">
        {{ tooltipState.label }}
      </div>
      <div>{{ tooltipState.value }}</div>
    </div>
  </div>
</template>
