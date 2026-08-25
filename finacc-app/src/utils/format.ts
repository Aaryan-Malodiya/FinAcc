import type { RiskLevel } from '../types/finance'

export function formatCurrency(value: number, withSign = false): string {
  const sign = withSign && value > 0 ? '+' : value < 0 ? '−' : ''
  const abs = Math.abs(value)
  return `${sign}$${abs.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`
}

export function formatCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
  return `$${value.toFixed(0)}`
}

export function riskLevelFromScore(score: number): RiskLevel {
  if (score >= 70) return 'high'
  if (score >= 40) return 'watch'
  return 'clean'
}

export const riskLabel: Record<RiskLevel, string> = {
  clean: 'Clean',
  watch: 'Watch',
  high: 'High risk'
}

export const riskHex: Record<RiskLevel, { fg: string; bg: string }> = {
  clean: { fg: '#5C7A6E', bg: '#E4EAE4' },
  watch: { fg: '#C8842A', bg: '#F3E4C8' },
  high: { fg: '#B84C3E', bg: '#F5E1DD' }
}
