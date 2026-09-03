import React from 'react'
import type { RiskLevel } from '../../types/finance'
import { riskLabel } from '../../utils/format'

const styles: Record<RiskLevel, string> = {
  clean: 'bg-clean-bg text-clean border-clean/25',
  watch: 'bg-watch-bg text-watch border-watch/30',
  high: 'bg-risk-bg text-risk border-risk/30'
}

export function RiskPill({ level, label }: { level: RiskLevel; label?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-[11px] font-medium leading-5 ${styles[level]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {label ?? riskLabel[level]}
    </span>
  )
}

const statusStyles: Record<string, string> = {
  posted: 'bg-clean-bg text-clean border-clean/25',
  pending: 'bg-watch-bg text-watch border-watch/30',
  flagged: 'bg-risk-bg text-risk border-risk/30'
}

export function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-sm border px-2 py-0.5 text-[11px] font-medium capitalize leading-5 ${
        statusStyles[status] ?? 'bg-paper-border text-paper-muted border-paper-border'
      }`}
    >
      {status}
    </span>
  )
}
