import React from 'react'

export interface TimeRangeOption {
  key: string
  label: string
  days: number
}

export const DEFAULT_RANGES: TimeRangeOption[] = [
  { key: '30d', label: '30 Days', days: 30 },
  { key: '60d', label: '2 Months', days: 60 },
  { key: '90d', label: '90 Days', days: 90 }
]

interface TimeRangeFilterProps {
  value: string
  onChange: (key: string) => void
  options?: TimeRangeOption[]
}

export function TimeRangeFilter({ value, onChange, options = DEFAULT_RANGES }: TimeRangeFilterProps) {
  return (
    <div className="flex items-center gap-1 rounded-sm border border-paper-border bg-paper-light p-1">
      {options.map((opt) => (
        <button
          key={opt.key}
          type="button"
          onClick={() => onChange(opt.key)}
          className={`rounded-sm px-2.5 py-1 text-[11px] font-mono transition-colors ${
            value === opt.key
              ? 'bg-ink-base text-paper-light'
              : 'text-paper-muted hover:bg-paper hover:text-paper-ink'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}