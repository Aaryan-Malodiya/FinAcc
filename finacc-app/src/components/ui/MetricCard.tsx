import React from 'react'

interface MetricCardProps {
  label: string
  value: string
  hint?: string
  emphasis?: 'default' | 'brass' | 'risk'
  footer?: React.ReactNode
}

export function MetricCard({ label, value, hint, emphasis = 'default', footer }: MetricCardProps) {
  const valueColor =
    emphasis === 'brass' ? 'text-brass-dark' : emphasis === 'risk' ? 'text-risk' : 'text-paper-ink'
  return (
    <div className="flex flex-col justify-between rounded-sm border border-paper-border bg-paper px-5 py-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-paper-muted">{label}</p>
      <p
        className={`tabular mt-3 font-display text-[32px] font-semibold leading-none tracking-tight ${valueColor}`}
      >
        {value}
      </p>
      {hint && <p className="mt-2 font-mono text-[11px] text-paper-muted">{hint}</p>}
      {footer && <div className="mt-3">{footer}</div>}
    </div>
  )
}
