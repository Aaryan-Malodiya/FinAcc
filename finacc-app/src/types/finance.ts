export type RiskLevel = 'clean' | 'watch' | 'high'

export type TransactionStatus = 'posted' | 'pending' | 'flagged'

export interface Transaction {
  id: string
  date: string
  description: string
  account: string
  debitAccount: string
  creditAccount: string
  amount: number
  status: TransactionStatus
  risk: RiskLevel
  riskScore: number
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
