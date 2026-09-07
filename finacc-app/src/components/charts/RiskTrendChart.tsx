import React from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { riskTrend } from '../../data/riskReport'

const series = [
  { key: 'clean', label: 'Clean', color: '#5C7A6E' },
  { key: 'watch', label: 'Watch', color: '#C8842A' },
  { key: 'high', label: 'High risk', color: '#B84C3E' }
]

function TrendTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-sm border border-paper-border bg-paper-light px-3 py-2 shadow-lg">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-paper-muted">{label}</p>
      <ul className="mt-1.5 space-y-1">
        {payload
          .slice()
          .reverse()
          .map((entry: any) => (
            <li key={entry.dataKey} className="flex items-center gap-2 text-[11px]">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: entry.color }}
                aria-hidden
              />
              <span className="text-paper-muted capitalize">{entry.dataKey}</span>
              <span className="tabular ml-auto font-mono text-paper-ink">
                {entry.value.toLocaleString()}
              </span>
            </li>
          ))}
      </ul>
    </div>
  )
}

export function RiskTrendChart() {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={riskTrend} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.55} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0.04} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid stroke="#E1D8C4" strokeDasharray="2 4" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fill: '#6E6656', fontSize: 10, fontFamily: 'IBM Plex Mono' }}
            tickLine={false}
            axisLine={{ stroke: '#E1D8C4' }}
            interval={5}
          />
          <YAxis
            tick={{ fill: '#6E6656', fontSize: 10, fontFamily: 'IBM Plex Mono' }}
            tickLine={false}
            axisLine={false}
            width={48}
          />
          <Tooltip content={<TrendTooltip />} cursor={{ stroke: '#C8842A', strokeWidth: 1 }} />
          {series.map((s) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              stackId="1"
              stroke={s.color}
              strokeWidth={1.5}
              fill={`url(#grad-${s.key})`}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
      <ul className="mt-3 flex flex-wrap items-center gap-4 border-t border-paper-border pt-3">
        {series.map((s) => (
          <li key={s.key} className="flex items-center gap-2 text-[11px] text-paper-muted">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: s.color }}
              aria-hidden
            />
            {s.label}
          </li>
        ))}
      </ul>
    </div>
  )
}
