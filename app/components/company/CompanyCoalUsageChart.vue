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

onMounted(() => {
  if (chartRef.value && props.data.length > 0) {
    drawChart()
  }
})

watch(() => props.data, () => {
  if (chartRef.value && props.data.length > 0) {
    drawChart()
  }
}, { deep: true })

function drawChart() {
  if (!chartRef.value || props.data.length === 0) return

  // Clear previous chart
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

  // Scales
  const xScale = d3.scaleLinear()
    .domain(d3.extent(props.data, d => d.year) as [number, number])
    .range([0, innerWidth])

  const yScale = d3.scaleLinear()
    .domain([0, d3.max(props.data, d => d.value) as number * 1.1])
    .range([innerHeight, 0])

  // Area generator
  const area = d3.area<DataPoint>()
    .x(d => xScale(d.year))
    .y0(innerHeight)
    .y1(d => yScale(d.value))
    .curve(d3.curveMonotoneX)

  // Line generator
  const line = d3.line<DataPoint>()
    .x(d => xScale(d.year))
    .y(d => yScale(d.value))
    .curve(d3.curveMonotoneX)

  // Draw area with gradient
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

  // Draw line
  g.append('path')
    .datum(props.data)
    .attr('fill', 'none')
    .attr('stroke', '#207443')
    .attr('stroke-width', 2)
    .attr('d', line)

  // Draw data points
  g.selectAll('.data-point')
    .data(props.data)
    .enter()
    .append('circle')
    .attr('class', 'data-point')
    .attr('cx', d => xScale(d.year))
    .attr('cy', d => yScale(d.value))
    .attr('r', 4)
    .attr('fill', '#207443')
    .attr('stroke', 'white')
    .attr('stroke-width', 2)

  // X axis
  const xAxis = d3.axisBottom(xScale)
    .tickValues(props.data.map(d => d.year))
    .tickFormat(d => String(d))

  g.append('g')
    .attr('transform', `translate(0, ${innerHeight})`)
    .call(xAxis)
    .selectAll('text')
    .attr('fill', '#5C573D')
    .attr('font-size', '12px')

  g.selectAll('.domain, .tick line')
    .attr('stroke', '#D9D7CA')

  // Y axis
  const yAxis = d3.axisLeft(yScale)
    .ticks(5)
    .tickFormat(d => d3.format(',.0f')(d as number))

  g.append('g')
    .call(yAxis)
    .selectAll('text')
    .attr('fill', '#5C573D')
    .attr('font-size', '12px')

  g.selectAll('.domain, .tick line')
    .attr('stroke', '#D9D7CA')

  // Grid lines
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
    .attr('stroke-opacity', 0.3)
    .attr('stroke-dasharray', '3,3')
}

// Redraw on window resize
onMounted(() => {
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
</script>

<template>
  <div class="mt-8">
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
  </div>
</template>
