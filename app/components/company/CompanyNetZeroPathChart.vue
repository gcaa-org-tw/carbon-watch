<script setup lang="ts">
import * as d3 from 'd3'

interface Props {
  基準年: number
  基準年排放量: number
  現狀年: number
  現狀排放量: number
  現狀目標排放量: number
  中期目標年: number
  中期目標排放量: number
  中期預估排放量: number
  淨零目標年: number
  淨零年預估排放量: number
}

const props = defineProps<Props>()

const chartRef = ref<HTMLDivElement | null>(null)

interface PathPoint {
  year: number
  value: number
}

// Actual emissions path: baseline → current actual
const actualPath = computed<PathPoint[]>(() => [
  { year: props.基準年, value: props.基準年排放量 },
  { year: props.現狀年, value: props.現狀排放量 },
])

// Target reduction path: baseline → current target → mid-term target → net-zero
const targetPath = computed<PathPoint[]>(() => [
  { year: props.基準年, value: props.基準年排放量 },
  { year: props.現狀年, value: props.現狀目標排放量 },
  { year: props.中期目標年, value: props.中期目標排放量 },
  { year: props.淨零目標年, value: 0 },
])

// Dashed line from current actual to net-zero (showing gap)
const gapLine = computed<PathPoint[]>(() => [
  { year: props.現狀年, value: props.現狀排放量 },
  { year: props.中期目標年, value: props.中期預估排放量 },
  { year: props.淨零目標年, value: props.淨零年預估排放量 },
])

onMounted(() => {
  if (chartRef.value) drawChart()
})

watch(() => props, () => {
  if (chartRef.value) drawChart()
}, { deep: true })

function drawChart() {
  if (!chartRef.value) return

  d3.select(chartRef.value).selectAll('*').remove()

  const containerWidth = chartRef.value.clientWidth || 600
  const width = containerWidth
  const height = 320
  const margin = { top: 40, right: 30, bottom: 20, left: 30 }
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

  const allYears = [props.基準年, props.現狀年, props.中期目標年, props.淨零目標年]
  const maxEmission = props.基準年排放量 * 1.15

  // Scales — standard: high emissions at top, zero at bottom
  const xScale = d3.scaleLinear()
    .domain([Math.min(...allYears), Math.max(...allYears)])
    .range([0, innerWidth])

  const yScale = d3.scaleLinear()
    .domain([0, maxEmission])
    .range([innerHeight, 0])

  // Area generator: fills from x-axis (y=0) up to the data value
  const areaGen = (data: PathPoint[]) => {
    const area = d3.area<PathPoint>()
      .x(d => xScale(d.year))
      .y0(innerHeight)
      .y1(d => yScale(d.value))
    return area(data)
  }

  // Line generator
  const lineGen = d3.line<PathPoint>()
    .x(d => xScale(d.year))
    .y(d => yScale(d.value))


  // Blue area: target path (baseline → current target → mid-term → net-zero)
  g.append('path')
    .datum(targetPath.value)
    .attr('fill', getCSSVariableValue('--color-surface-mint'))
    .attr('d', areaGen(targetPath.value))

  // Pink area: actual emissions (baseline → current)
  g.append('path')
    .datum(actualPath.value)
    .attr('fill', getCSSVariableValue('--color-accent-red'))
    .attr('fill-opacity', 0.3)
    .attr('d', areaGen(actualPath.value))
  

  // Dashed red line: current actual → net-zero (the gap/challenge line)
  g.append('path')
    .datum(gapLine.value)
    .attr('fill', 'none')
    .attr('stroke', getCSSVariableValue('--color-accent-red'))
    .attr('stroke-opacity', 0.5)
    .attr('stroke-width', 1.5)
    .attr('stroke-dasharray', '6,4')
    .attr('d', lineGen(gapLine.value))

  // Bottom baseline
  g.append('line')
    .attr('x1', 0)
    .attr('x2', innerWidth)
    .attr('y1', innerHeight)
    .attr('y2', innerHeight)
    .attr('stroke', getCSSVariableValue('--color-surface-warm'))
    .attr('stroke-width', 1)

  // Labels
  const labelFontSize = containerWidth < 500 ? '11px' : '13px'

  // Start label (baseline)
  g.append('text')
    .attr('x', xScale(props.基準年))
    .attr('y', yScale(props.基準年排放量) - 12)
    .attr('font-size', labelFontSize)
    .attr('fill', '#5C573D')
    .text('Start｜承諾當下現狀')

  // Current year label
  g.append('text')
    .attr('x', xScale(props.現狀年))
    .attr('y', yScale(props.現狀排放量) - 12)
    .attr('text-anchor', 'middle')
    .attr('font-size', labelFontSize)
    .attr('fill', '#5C573D')
    .text(`${props.現狀年} 現狀`)

  // Mid-term target label
  g.append('text')
    .attr('x', xScale(props.中期目標年))
    .attr('y', yScale(props.中期目標排放量) - 12)
    .attr('text-anchor', 'middle')
    .attr('font-size', labelFontSize)
    .attr('fill', '#5C573D')
    .text(`${props.中期目標年} 目標`)

  // Goal label
  g.append('text')
    .attr('x', xScale(props.淨零目標年))
    .attr('y', yScale(0) - 12)
    .attr('text-anchor', 'end')
    .attr('font-size', labelFontSize)
    .attr('fill', '#5C573D')
    .text(`Goal｜${props.淨零目標年} 承諾`)

}

// Redraw on window resize
onMounted(() => {
  const handleResize = () => {
    if (chartRef.value) drawChart()
  }
  window.addEventListener('resize', handleResize)
  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
  })
})

function getCSSVariableValue(variable: string) {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(variable)
    .trim()
}
</script>

<template>
  <div class="mt-8">
    <h3 class="text-lg font-bold text-earth-brown mb-4">
      淨零路徑模擬器
    </h3>
    <div ref="chartRef" class="w-full" />
  </div>
</template>
