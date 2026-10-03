import React from 'react'
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { riskDistribution } from '../../data/riskReport'
import type { RiskDistributionBand } from '../../types/finance'
import { riskHex } from '../../utils/format'

function DistTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-sm border border-paper-border bg-paper-light px-3 py-2 shadow-lg">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-paper-muted">
        Score {label}
      </p>
      <p className="tabular mt-1 font-mono text-[13px] text-paper-ink">
        {payload[0].value.toLocaleString()} entries
      </p>
    </div>
  )
}

export function RiskDistributionChart({ data = riskDistribution }: { data?: RiskDistributionBand[] }) {
  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
          <XAxis
            dataKey="band"
            tick={{ fill: '#6E6656', fontSize: 10, fontFamily: 'IBM Plex Mono' }}
            tickLine={false}
            axisLine={{ stroke: '#E1D8C4' }}
          />
          <YAxis
            tick={{ fill: '#6E6656', fontSize: 10, fontFamily: 'IBM Plex Mono' }}
            tickLine={false}
            axisLine={false}
            width={52}
          />
          <Tooltip content={<DistTooltip />} cursor={{ fill: 'rgba(232,163,61,0.12)' }} />
          <Bar dataKey="count" radius={[2, 2, 0, 0]} maxBarSize={54}>
            {data.map((d) => (
              <Cell key={d.band} fill={riskHex[d.level].fg} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
