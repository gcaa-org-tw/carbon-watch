<script setup lang="ts">
import * as d3 from 'd3'

interface RadarDataPoint {
  axis: string
  value: number
}

interface ScoreLegendItem {
  score: string
  label: string
  color: string
}

interface Props {
  companyData: RadarDataPoint[]
  industryData: RadarDataPoint[]
  scoreLegend: ScoreLegendItem[]
}

const props = defineProps<Props>()

const chartRef = ref<HTMLDivElement | null>(null)
const viewportWidth = ref(768)

onMounted(() => {
  viewportWidth.value = window.innerWidth
  drawRadarChart()

  const onResize = () => {
    viewportWidth.value = window.innerWidth
    drawRadarChart()
  }
  window.addEventListener('resize', onResize)
  onUnmounted(() => window.removeEventListener('resize', onResize))
})

watch(() => [props.companyData, props.industryData], () => {
  if (chartRef.value) {
    drawRadarChart()
  }
}, { deep: true })

function getCSSVariableValue(variable: string) {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(variable)
    .trim()
}

function drawRadarChart() {
  if (!chartRef.value) return

  d3.select(chartRef.value).selectAll('*').remove()

  const isPhone = viewportWidth.value < 768
  const isDesktop = viewportWidth.value >= 1024
  const chartArea = isPhone ? 200 : 280
  const labelMargin = isPhone ? 90 : 100
  const totalSize = chartArea + labelMargin * 2

  const visualPadding = 20
  const radius = chartArea / 2 - visualPadding

  const levels = 3 // 0, 1, 2, 3 scores
  const axes = props.companyData.length

  const svg = d3.select(chartRef.value)
    .append('svg')
    .attr('width', '100%')
    .attr('viewBox', `0 0 ${totalSize} ${totalSize}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')
  
  const center = totalSize / 2
  const g = svg.append('g')
    .attr('transform', `translate(${center}, ${center})`)

  const angleSlice = (Math.PI * 2) / axes

  const rScale = d3.scaleLinear()
    .domain([0, 3])
    .range([0, radius])

  // -------- GRID --------
  for (let level = 0; level <= levels; level++) {
    const r = rScale(level)
    const points: string[] = []

    for (let i = 0; i < axes; i++) {
      const angle = angleSlice * i - Math.PI / 2
      points.push(`${r * Math.cos(angle)},${r * Math.sin(angle)}`)
    }

    g.append('polygon')
      .attr('points', points.join(' '))
      .attr('fill', 'none')
      .attr('stroke', getCSSVariableValue(props.scoreLegend[level]?.color || '--color-gray-400'))
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,4')
  }

  // -------- AXIS LINES --------
  for (let i = 0; i < axes; i++) {
    const angle = angleSlice * i - Math.PI / 2

    g.append('line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', radius * Math.cos(angle))
      .attr('y2', radius * Math.sin(angle))
      .attr('stroke', '#D9D7CA')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,4')
  }

  // -------- PATH GENERATOR --------
  const generateRadarPath = (data: RadarDataPoint[]): string => {
    const points = data.map((d, i) => {
      const angle = angleSlice * i - Math.PI / 2
      const x = rScale(d.value) * Math.cos(angle)
      const y = rScale(d.value) * Math.sin(angle)
      return `${x},${y}`
    })
    return `M${points.join('L')}Z`
  }

  // -------- INDUSTRY --------
  g.append('path')
    .attr('d', generateRadarPath(props.industryData))
    .attr('fill', '#C5C9D1')
    .attr('fill-opacity', 0.4)
    .attr('stroke', '#9CA3AF')
    .attr('stroke-width', 2)

  // -------- COMPANY --------
  g.append('path')
    .attr('d', generateRadarPath(props.companyData))
    .attr('fill', '#FCA5A5')
    .attr('fill-opacity', 0.5)
    .attr('stroke', '#DC2626')
    .attr('stroke-width', 2)

  // -------- LABELS --------
  const labelOffset = radius + 25
  const maxCharsPerLine = isDesktop ? 9 : 8
  const fontSize = isDesktop ? '14px' : '12px'

  props.companyData.forEach((d, i) => {
    const angle = angleSlice * i - Math.PI / 2
    const cosA = Math.cos(angle)
    const sinA = Math.sin(angle)

    let x = labelOffset * cosA
    let y = labelOffset * sinA

    let textAnchor: string = 'middle'
    if (cosA > 0.3) {
      textAnchor = 'start'
      x += 6
    } else if (cosA < -0.3) {
      textAnchor = 'end'
      x -= 6
    }

    const label = d.axis
    const lines: string[] = []

    for (let j = 0; j < label.length; j += maxCharsPerLine) {
      lines.push(label.slice(j, j + maxCharsPerLine))
    }

    const textEl = g.append('text')
      .attr('x', x)
      .attr('y', y)
      .attr('text-anchor', textAnchor)
      .attr('dominant-baseline', 'middle')
      .attr('fill', '#5C573D')
      .attr('font-size', fontSize)

    lines.forEach((line, li) => {
      textEl.append('tspan')
        .attr('x', x)
        .attr('dy', li === 0
          ? `-${(lines.length - 1) * 0.6}em`
          : '1.2em')
        .text(line)
    })
  })
}

</script>

<template>
  <div ref="chartRef" class="w-full max-w-md mx-auto" />
</template>
