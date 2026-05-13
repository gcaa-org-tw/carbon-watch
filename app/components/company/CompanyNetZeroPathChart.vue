<script setup lang="ts">
import * as d3 from 'd3'

interface HistoryPoint {
  year: number
  value: number
}

interface Props {
  hasCommitmentData: boolean
  基準年: number | null
  基準年排放量: number | null
  現狀年: number
  現狀排放量: number
  中期目標年: number | null
  中期目標排放量: number | null
  淨零目標年: number | null
  預估路徑: { 中期: number; 淨零: number } | null
  歷年排放: HistoryPoint[]
}

const props = defineProps<Props>()

const chartRef = ref<HTMLDivElement | null>(null)

function getCSSVariableValue(variable: string) {
  if (typeof document === 'undefined') return ''
  return getComputedStyle(document.documentElement).getPropertyValue(variable).trim()
}

function drawChart() {
  if (!chartRef.value || !props.hasCommitmentData) return
  if (props.基準年 === null || props.基準年排放量 === null) return
  if (props.中期目標年 === null || props.中期目標排放量 === null) return
  if (props.淨零目標年 === null) return

  d3.select(chartRef.value).selectAll('*').remove()

  const containerWidth = chartRef.value.clientWidth || 600
  const width = containerWidth
  const height = 360
  const margin = { top: 50, right: 40, bottom: 40, left: 70 }
  const innerWidth = width - margin.left - margin.right
  const innerHeight = height - margin.top - margin.bottom

  const svg = d3.select(chartRef.value)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')

  const g = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`)

  const 基準年 = props.基準年!
  const 基準年排放量 = props.基準年排放量!
  const 中期目標年 = props.中期目標年!
  const 中期目標排放量 = props.中期目標排放量!
  const 淨零目標年 = props.淨零目標年!

  const minYear = Math.min(基準年, ...props.歷年排放.map(p => p.year))
  const maxYear = 淨零目標年
  const maxValue = Math.max(
    基準年排放量,
    props.現狀排放量,
    ...props.歷年排放.map(p => p.value),
    props.預估路徑?.中期 ?? 0,
    props.預估路徑?.淨零 ?? 0,
  ) * 1.1

  const xScale = d3.scaleLinear().domain([minYear, maxYear]).range([0, innerWidth])
  const yScale = d3.scaleLinear().domain([0, maxValue]).range([innerHeight, 0])

  const formatEmission = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
    return n.toFixed(0)
  }

  const axisColor = '#D9D7CA'
  const labelColor = '#C4BE9A'
  const commitmentColor = '#5BAF8A'
  const projectionColor = getCSSVariableValue('--color-accent-red') || '#FF4040'
  const historyColor = '#C4BE9A'

  g.append('g')
    .attr('transform', `translate(0, ${innerHeight})`)
    .call(d3.axisBottom(xScale).tickFormat(d3.format('d')).ticks(6))
    .attr('color', labelColor)
    .selectAll('text').attr('font-size', '11px')

  g.append('g')
    .call(d3.axisLeft(yScale).ticks(5).tickFormat(d => formatEmission(d as number)))
    .attr('color', labelColor)
    .selectAll('text').attr('font-size', '11px')

  g.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', -50).attr('x', -innerHeight / 2)
    .attr('text-anchor', 'middle')
    .attr('font-size', '11px').attr('fill', labelColor)
    .text('排放量（公噸 CO2e）')

  const line = d3.line<{ year: number; value: number }>()
    .x(d => xScale(d.year))
    .y(d => yScale(d.value))

  const commitmentPath = [
    { year: 基準年, value: 基準年排放量 },
    { year: 中期目標年, value: 中期目標排放量 },
    { year: 淨零目標年, value: 0 },
  ]
  g.append('path')
    .datum(commitmentPath)
    .attr('fill', 'none')
    .attr('stroke', commitmentColor)
    .attr('stroke-width', 2.5)
    .attr('d', line)
  commitmentPath.forEach(p => {
    g.append('circle')
      .attr('cx', xScale(p.year)).attr('cy', yScale(p.value))
      .attr('r', 5).attr('fill', commitmentColor)
  })

  if (props.預估路徑) {
    const projectionPath = [
      { year: props.現狀年, value: props.現狀排放量 },
      { year: 中期目標年, value: props.預估路徑.中期 },
      { year: 淨零目標年, value: props.預估路徑.淨零 },
    ]
    g.append('path')
      .datum(projectionPath)
      .attr('fill', 'none')
      .attr('stroke', projectionColor)
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '6,4')
      .attr('d', line)
    projectionPath.forEach(p => {
      g.append('circle')
        .attr('cx', xScale(p.year)).attr('cy', yScale(p.value))
        .attr('r', 4).attr('fill', 'white')
        .attr('stroke', projectionColor).attr('stroke-width', 2)
    })
  }

  props.歷年排放.forEach(p => {
    g.append('circle')
      .attr('cx', xScale(p.year)).attr('cy', yScale(p.value))
      .attr('r', 3.5).attr('fill', historyColor).attr('fill-opacity', 0.7)
  })

  const refLine = (year: number, label: string) => {
    g.append('line')
      .attr('x1', xScale(year)).attr('x2', xScale(year))
      .attr('y1', 0).attr('y2', innerHeight)
      .attr('stroke', axisColor).attr('stroke-width', 1)
      .attr('stroke-dasharray', '2,3')
    g.append('text')
      .attr('x', xScale(year)).attr('y', -8)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px').attr('fill', labelColor)
      .text(label)
  }
  refLine(基準年, `${基準年} 基準年`)
  refLine(props.現狀年, `${props.現狀年} 現狀`)
  refLine(中期目標年, `${中期目標年} 中期目標`)
  refLine(淨零目標年, `${淨零目標年} 淨零年`)
}

onMounted(() => {
  if (chartRef.value) drawChart()
  const handleResize = () => { if (chartRef.value) drawChart() }
  window.addEventListener('resize', handleResize)
  onUnmounted(() => window.removeEventListener('resize', handleResize))
})

watch(() => props, () => {
  if (chartRef.value) drawChart()
}, { deep: true })
</script>

<template>
  <div class="mt-8">
    <div class="flex flex-wrap items-baseline justify-between gap-2 mb-3">
      <h3 class="text-lg font-bold text-earth-brown">
        淨零路徑模擬器
      </h3>
      <div v-if="hasCommitmentData" class="flex flex-wrap gap-x-5 gap-y-1 text-xs text-stone-600">
        <span class="flex items-center gap-1.5">
          <span class="inline-block w-4 h-0.5 bg-[#5BAF8A]" />
          承諾路徑
        </span>
        <span class="flex items-center gap-1.5">
          <span class="inline-block w-4 border-t-2 border-dashed border-[#FF4040]" />
          依現有趨勢預估
        </span>
        <span v-if="歷年排放.length > 0" class="flex items-center gap-1.5">
          <span class="inline-block w-2 h-2 rounded-full bg-[#C4BE9A] opacity-70" />
          歷年實際排放
        </span>
      </div>
    </div>
    <div v-if="hasCommitmentData" ref="chartRef" class="w-full" />
    <div v-else class="w-full h-40 flex flex-col items-center justify-center text-stone-500 bg-stone-50 rounded">
      <p class="text-sm">尚無中期減量目標與基準年資料</p>
      <p class="text-xs mt-1 text-stone-400">資料來源：永續報告書揭露之中期減量承諾</p>
    </div>
  </div>
</template>
