import type { ScoredBatchReport } from '../types/finance'
import { apiUrl } from './config'

export const latestRiskReportKey = 'finacc.latestRiskReport'

export async function scoreTransactions(file: File): Promise<ScoredBatchReport> {
  const body = new FormData()
  body.append('file', file)

  const requestUrl = apiUrl('/api/score')
  const response = await fetch(requestUrl, { method: 'POST', body })
  let payload: { detail?: string } | null = null
  try {
    payload = await response.json() as { detail?: string }
  } catch {
    if (response.ok) {
      throw new Error('The scoring API returned an invalid response.')
    }
  }
  if (!response.ok) {
    const detail = typeof payload?.detail === 'string'
      ? payload.detail
      : response.status === 404
        ? `API endpoint not found at ${requestUrl}. Check that VITE_API_BASE_URL is the Railway service origin.`
        : 'Could not score this CSV.'
    throw new Error(detail)
  }
  return payload as ScoredBatchReport
}

export function formatFileSize(bytes: number): string {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`
}