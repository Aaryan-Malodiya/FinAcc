import type { ScoredBatchReport } from '../types/finance'
import { API_BASE_URL } from './config'

export const latestRiskReportKey = 'finacc.latestRiskReport'

export async function scoreTransactions(file: File): Promise<ScoredBatchReport> {
  const body = new FormData()
  body.append('file', file)

  const response = await fetch(`${API_BASE_URL}/api/score`, { method: 'POST', body })
  const payload = await response.json()
  if (!response.ok) {
    const detail = typeof payload.detail === 'string' ? payload.detail : 'Could not score this CSV.'
    throw new Error(detail)
  }
  return payload as ScoredBatchReport
}

export function formatFileSize(bytes: number): string {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`
}