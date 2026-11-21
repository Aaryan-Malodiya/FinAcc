export type RiskLevel = 'clean' | 'watch' | 'high'

export type TransactionStatus = 'posted' | 'pending' | 'flagged'

export interface Transaction {
  id: string
  reference?: string
  date: string
  description: string
  account: string
  debitAccount: string
  creditAccount: string
  amount: number
  status: TransactionStatus
  risk: RiskLevel | null
  riskScore: number | null
}

export interface FlaggedTransaction {
  id: string
  date: string
  timestamp: string
  merchant: string
  account: string
  amount: number
  riskScore: number
  risk: RiskLevel
  channel: string
  reasons: string[]
  features: { label: string; value: string; weight: number }[]
}

export interface RiskDistributionBand {
  band: string
  count: number
  level: RiskLevel
}

export interface RiskBatchSummary {
  batchId: string
  fileName: string
  scanned: number
  flagged: number
  flaggedAmount: number
  modelVersion: string
  runtimeSeconds: number
  completedAt: string
  auc?: number
  precision?: number
  recall?: number
}

export interface ScoredBatchReport {
  summary: RiskBatchSummary
  flaggedTransactions: FlaggedTransaction[]
  riskDistribution: RiskDistributionBand[]
  warnings?: string[]
}

export interface ActivityEntry {
  id: string
  time: string
  actor: string
  action: string
  detail: string
  tone: 'neutral' | 'clean' | 'watch' | 'high'
}

export interface TrendPoint {
  day: string
  clean: number
  watch: number
  high: number
}
