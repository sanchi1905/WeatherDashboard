import { useMemo, useState } from 'react'
import {
  Bar,
  Brush,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

function DefaultTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null
  }

  return (
    <div className="chart-tooltip">
      <p>{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} style={{ color: entry.color }}>
          {entry.name}: {Number(entry.value).toFixed(2)}
        </p>
      ))}
    </div>
  )
}

export function WeatherChartCard({
  title,
  data,
  lines = [],
  bars = [],
  yAxisLabel = '',
}) {
  const [range, setRange] = useState({ startIndex: 0, endIndex: Math.max(0, data.length - 1) })

  const minWidth = Math.max(860, data.length * 34)

  const safeRange = useMemo(() => {
    const maxIndex = Math.max(0, data.length - 1)
    const safeStart = Math.min(Math.max(0, range.startIndex), maxIndex)
    const safeEnd = Math.min(Math.max(safeStart, range.endIndex), maxIndex)
    return { startIndex: safeStart, endIndex: safeEnd }
  }, [data.length, range.endIndex, range.startIndex])

  const span = useMemo(
    () => Math.max(1, safeRange.endIndex - safeRange.startIndex + 1),
    [safeRange.endIndex, safeRange.startIndex],
  )

  const zoomIn = () => {
    if (data.length <= 2 || span <= 6) return

    const nextSpan = Math.max(6, Math.floor(span * 0.7))
    const center = Math.floor((safeRange.startIndex + safeRange.endIndex) / 2)
    const half = Math.floor(nextSpan / 2)

    let startIndex = Math.max(0, center - half)
    let endIndex = Math.min(data.length - 1, startIndex + nextSpan - 1)
    if (endIndex === data.length - 1) {
      startIndex = Math.max(0, endIndex - nextSpan + 1)
    }

    setRange({ startIndex, endIndex })
  }

  const zoomOut = () => {
    if (span >= data.length) return

    const nextSpan = Math.min(data.length, Math.ceil(span * 1.35))
    const center = Math.floor((safeRange.startIndex + safeRange.endIndex) / 2)
    const half = Math.floor(nextSpan / 2)

    let startIndex = Math.max(0, center - half)
    let endIndex = Math.min(data.length - 1, startIndex + nextSpan - 1)
    if (endIndex === data.length - 1) {
      startIndex = Math.max(0, endIndex - nextSpan + 1)
    }

    setRange({ startIndex, endIndex })
  }

  const resetZoom = () => {
    setRange({ startIndex: 0, endIndex: Math.max(0, data.length - 1) })
  }

  return (
    <section className="chart-card">
      <header className="chart-header-row">
        <h3>{title}</h3>
        <div className="chart-actions" role="group" aria-label={`Zoom controls for ${title}`}>
          <button type="button" onClick={zoomOut}>Zoom Out</button>
          <button type="button" onClick={zoomIn}>Zoom In</button>
          <button type="button" onClick={resetZoom}>Reset</button>
        </div>
      </header>
      <div className="chart-scroll-wrap">
        <div style={{ minWidth }}>
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} minTickGap={14} />
              <YAxis tick={{ fontSize: 12 }} label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }} />
              <Tooltip content={<DefaultTooltip />} />
              <Legend />
              {lines.map((series) => (
                <Line
                  key={series.key}
                  type="monotone"
                  dataKey={series.key}
                  name={series.name}
                  stroke={series.color}
                  dot={false}
                  strokeWidth={2}
                />
              ))}
              {bars.map((series) => (
                <Bar
                  key={series.key}
                  dataKey={series.key}
                  name={series.name}
                  fill={series.color}
                  radius={[4, 4, 0, 0]}
                />
              ))}
              <Brush
                dataKey="label"
                height={22}
                travellerWidth={12}
                startIndex={safeRange.startIndex}
                endIndex={safeRange.endIndex}
                onChange={(next) => {
                  if (typeof next?.startIndex !== 'number' || typeof next?.endIndex !== 'number') return
                  setRange({ startIndex: next.startIndex, endIndex: next.endIndex })
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  )
}
