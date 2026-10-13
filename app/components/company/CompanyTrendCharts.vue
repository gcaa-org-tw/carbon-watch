<script setup lang="ts">
import * as d3 from 'd3'

interface DataPoint {
  year: number
  value: number
}

interface ChartSpec {
  key: 'ghg' | 'ghgIntensity' | 'energy' | 'energyIntensity'
  title: string
  unit: string
  color: string
  data: DataPoint[]
  formatValue: (v: number) => string
  formatAxis: (v: number, step: number, max: number) => string
}

interface Props {
  ghg?: DataPoint[]
  ghgIntensity?: DataPoint[]
  energy?: DataPoint[]
  energyIntensity?: DataPoint[]
}

const props = defineProps<Props>()

const tooltipState = ref<{
  visible: boolean
  x: number
  y: number
  label: string
  value: string
} | null>(null)

const integerFormat = d3.format(',.0f')
const intensityFormat = (v: number) => v >= 100 ? d3.format(',.1f')(v) : d3.format(',.2f')(v)
const axisInteger = (v: number, step: number, max: number) => {
  if (v === 0) return '0'
  const unit = max >= 1e8 ? 1e8 : max >= 1e4 ? 1e4 : 1
  const suffix = unit === 1e8 ? '億' : unit === 1e4 ? '萬' : ''
  const digits = unit === 1 ? 0 : Math.max(0, Math.ceil(Math.log10(unit / step) - 1e-9))
  return `${(v / unit).toLocaleString('zh-TW', { minimumFractionDigits: digits, maximumFractionDigits: digits })}${suffix}`
}
const axisIntensity = (v: number) => v >= 100 ? d3.format(',.0f')(v) : d3.format(',.2f')(v)

const isReported = (d: DataPoint) => d.value > 0
const reportedPoints = (spec: ChartSpec) => spec.data.filter(isReported)
const missingYears = (spec: ChartSpec) => spec.data.filter(d => !isReported(d)).map(d => d.year)

const charts = computed<ChartSpec[]>(() => {
  const list: ChartSpec[] = []
  if (props.ghg && props.ghg.length > 0) {
    list.push({
      key: 'ghg',
      title: '溫室氣體排放',
      unit: '公噸 CO₂e',
      color: '#FF4040',
      data: props.ghg,
      formatValue: integerFormat,
      formatAxis: axisInteger,
    })
  }
  if (props.ghgIntensity && props.ghgIntensity.length > 0) {
    list.push({
      key: 'ghgIntensity',
      title: '溫室氣體排放密集度',
      unit: 'tCO₂e／百萬元 營收',
      color: '#F5C71A',
      data: props.ghgIntensity,
      formatValue: intensityFormat,
      formatAxis: axisIntensity,
    })
  }
  if (props.energy && props.energy.length > 0) {
    list.push({
      key: 'energy',
      title: '能源使用總量',
      unit: 'MJ',
      color: '#7A9CFF',
      data: props.energy,
      formatValue: integerFormat,
      formatAxis: axisInteger,
    })
  }
  if (props.energyIntensity && props.energyIntensity.length > 0) {
    list.push({
      key: 'energyIntensity',
      title: '能源使用密集度',
      unit: 'MJ／元 營收',
      color: '#05D915',
      data: props.energyIntensity,
      formatValue: intensityFormat,
      formatAxis: axisIntensity,
    })
  }
  return list
})

const containerRef = ref<HTMLDivElement | null>(null)
const chartRefs = ref<Record<string, HTMLDivElement | null>>({})

function setChartRef(key: string, el: Element | unknown) {
  chartRefs.value[key] = (el as HTMLDivElement | null)
}

function drawChart(spec: ChartSpec) {
  const host = chartRefs.value[spec.key]
  if (!host) return

  d3.select(host).selectAll('*').remove()

  const reported = reportedPoints(spec)
  if (reported.length === 0) return

  const containerWidth = host.clientWidth || 400
  const width = containerWidth
  const height = 230
  const margin = { top: 16, right: 22, bottom: 36, left: 76 }
  const innerWidth = width - margin.left - margin.right
  const innerHeight = height - margin.top - margin.bottom

  const svg = d3.select(host)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')

  const defs = svg.append('defs')
  const gradId = `trend-grad-${spec.key}`
  const grad = defs.append('linearGradient')
    .attr('id', gradId)
    .attr('x1', '0%')
    .attr('y1', '0%')
    .attr('x2', '0%')
    .attr('y2', '100%')
  grad.append('stop').attr('offset', '0%').attr('stop-color', spec.color).attr('stop-opacity', 0.35)
  grad.append('stop').attr('offset', '100%').attr('stop-color', spec.color).attr('stop-opacity', 0.02)

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`)

  const years = spec.data.map(d => d.year)
  const minYear = Math.min(...years)
  const maxYear = Math.max(...years)
  const xDomain: [number, number] = minYear === maxYear
    ? [minYear - 0.5, maxYear + 0.5]
    : [minYear, maxYear]

  const xScale = d3.scaleLinear()
    .domain(xDomain)
    .range([0, innerWidth])

  const maxVal = Math.max(...reported.map(d => d.value))

  const yScale = d3.scaleLinear()
    .domain([0, maxVal * 1.1])
    .nice()
    .range([innerHeight, 0])

  // Gridlines
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
    .attr('stroke-opacity', 0.18)
    .attr('stroke-dasharray', '3,3')

  // Area
  const area = d3.area<DataPoint>()
    .x(d => xScale(d.year))
    .y0(innerHeight)
    .y1(d => yScale(d.value))
    .defined(isReported)
    .curve(d3.curveMonotoneX)

  g.append('path')
    .datum(spec.data)
    .attr('fill', `url(#${gradId})`)
    .attr('d', area)

  // Line
  const line = d3.line<DataPoint>()
    .x(d => xScale(d.year))
    .y(d => yScale(d.value))
    .defined(isReported)
    .curve(d3.curveMonotoneX)

  g.append('path')
    .datum(spec.data)
    .attr('fill', 'none')
    .attr('stroke', spec.color)
    .attr('stroke-width', 2.5)
    .attr('d', line)

  // Points (with hit area)
  const point = g.selectAll('.trend-point')
    .data(reported)
    .enter()
    .append('g')
    .attr('class', 'trend-point')
    .attr('transform', d => `translate(${xScale(d.year)}, ${yScale(d.value)})`)

  point.append('circle')
    .attr('r', 12)
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
        value: `${spec.formatValue(d.value)} ${spec.unit}`,
      }
    })
    .on('mouseleave', () => {
      tooltipState.value = null
    })

  point.append('circle')
    .attr('r', 4)
    .attr('fill', spec.color)
    .attr('stroke', '#1A2C1A')
    .attr('stroke-width', 2)
    .attr('pointer-events', 'none')

  // X axis
  const xAxis = d3.axisBottom(xScale)
    .tickValues(years)
    .tickFormat(d => String(d))
    .tickSize(0)
    .tickPadding(10)

  g.append('g')
    .attr('transform', `translate(0, ${innerHeight})`)
    .call(xAxis)
    .call(s => s.select('.domain').attr('stroke', '#D9D7CA').attr('stroke-opacity', 0.4))
    .selectAll('text')
    .attr('fill', '#C4BE9A')
    .attr('font-size', '12px')

  // Y axis
  const yTicks = yScale.ticks(5)
  const yStep = yTicks.length > 1 ? yTicks[1]! - yTicks[0]! : 1
  const yMax = yTicks[yTicks.length - 1] ?? 0
  const yAxis = d3.axisLeft(yScale)
    .ticks(5)
    .tickFormat(d => spec.formatAxis(d as number, yStep, yMax))
    .tickSize(0)
    .tickPadding(8)

  g.append('g')
    .call(yAxis)
    .call(s => s.select('.domain').attr('stroke', 'none'))
    .selectAll('text')
    .attr('fill', '#C4BE9A')
    .attr('font-size', '11px')
}

function drawAll() {
  for (const spec of charts.value) {
    drawChart(spec)
  }
}

onMounted(() => {
  nextTick(() => drawAll())
  const onResize = () => drawAll()
  window.addEventListener('resize', onResize)
  onUnmounted(() => window.removeEventListener('resize', onResize))
})

watch(charts, () => {
  nextTick(() => drawAll())
}, { deep: true })
</script>

<template>
  <div
    v-if="charts.length > 0"
    ref="containerRef"
    class="mt-8 relative"
  >
    <h3 class="text-lg font-bold text-earth-brown mb-4">
      歷年趨勢
    </h3>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div
        v-for="spec in charts"
        :key="spec.key"
        class="rounded-lg border border-earth-brown/15 bg-surface-warm/40 p-4"
      >
        <div class="mb-2">
          <div class="text-sm font-semibold text-earth-brown">
            {{ spec.title }}
          </div>
          <div class="text-xs text-earth-brown/60">
            單位：{{ spec.unit }}
          </div>
        </div>
        <div
          :ref="(el) => setChartRef(spec.key, el)"
          class="w-full"
        />
        <p
          v-if="missingYears(spec).length > 0"
          class="mt-1 text-xs text-earth-brown/60"
        >
          {{ missingYears(spec).join('、') }} 年未申報
        </p>
        <div class="mt-1 text-xs text-earth-brown/70 flex flex-wrap gap-x-3 gap-y-1">
          <span
            v-for="point in reportedPoints(spec)"
            :key="point.year"
          >
            {{ point.year }}：{{ spec.formatValue(point.value) }}
          </span>
        </div>
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
