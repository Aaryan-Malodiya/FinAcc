import type { ActivityEntry, FlaggedTransaction, TrendPoint } from '../types/finance'

export const batchSummary = {
  batchId: 'BATCH-2026-08-07-A',
  fileName: 'transactions_aug_w1.csv',
  scanned: 18432,
  flagged: 264,
  flaggedAmount: 1284730.55,
  modelVersion: 'xgboost-v4.2.1',
  auc: 0.973,
  precision: 0.914,
  recall: 0.881,
  runtimeSeconds: 12.8,
  completedAt: '2026-08-07 09:41:22 UTC'
}

export const riskDistribution = [
  { band: '0–19', count: 12840, level: 'clean' as const },
  { band: '20–39', count: 4106, level: 'clean' as const },
  { band: '40–54', count: 892, level: 'watch' as const },
  { band: '55–69', count: 330, level: 'watch' as const },
  { band: '70–84', count: 186, level: 'high' as const },
  { band: '85–100', count: 78, level: 'high' as const }
]

export const flaggedTransactions: FlaggedTransaction[] = [
  {
    id: 'TXN-100482',
    date: '2026-08-07',
    timestamp: '03:14:07',
    merchant: 'Halberd Logistics Ltd',
    account: '1010 · Cash — Operating',
    amount: 84200.0,
    riskScore: 91,
    risk: 'high',
    channel: 'Wire',
    reasons: [
      'Amount 6.2σ above account 90-day mean',
      'Beneficiary added 41 minutes before transfer',
      'Initiated outside business hours (03:14 local)'
    ],
    features: [
      { label: 'amount_zscore', value: '6.21', weight: 0.34 },
      { label: 'beneficiary_age_hours', value: '0.68', weight: 0.27 },
      { label: 'hour_of_day', value: '3', weight: 0.18 },
      { label: 'velocity_24h', value: '4', weight: 0.11 }
    ]
  },
  {
    id: 'TXN-100471',
    date: '2026-08-02',
    timestamp: '18:52:40',
    merchant: 'Branch 04 — Cash Desk',
    account: '1010 · Cash — Operating',
    amount: 29800.0,
    riskScore: 84,
    risk: 'high',
    channel: 'Cash',
    reasons: [
      'Structuring pattern: 3 withdrawals just under reporting threshold',
      'Debit account mismatch with historical pairing'
    ],
    features: [
      { label: 'structuring_score', value: '0.88', weight: 0.31 },
      { label: 'account_pair_novelty', value: '0.74', weight: 0.24 },
      { label: 'amount_zscore', value: '3.05', weight: 0.16 }
    ]
  },
  {
    id: 'TXN-100477',
    date: '2026-08-05',
    timestamp: '11:07:19',
    merchant: 'Order 8841 — Refund Reversal',
    account: '4000 · Revenue — Services',
    amount: 9950.0,
    riskScore: 78,
    risk: 'high',
    channel: 'Internal',
    reasons: [
      'Reversal issued by the same user who created the original entry',
      'No supporting document attached'
    ],
    features: [
      { label: 'maker_checker_violation', value: '1', weight: 0.41 },
      { label: 'doc_attached', value: '0', weight: 0.19 },
      { label: 'reversal_lag_days', value: '0.2', weight: 0.12 }
    ]
  },
  {
    id: 'TXN-100474',
    date: '2026-08-03',
    timestamp: '14:22:03',
    merchant: 'FinAcc EU Holdings',
    account: '1010 · Cash — Operating',
    amount: 150000.0,
    riskScore: 61,
    risk: 'watch',
    channel: 'Intercompany',
    reasons: [
      'Round-number transfer above intercompany threshold',
      'Approval chain incomplete at time of scoring'
    ],
    features: [
      { label: 'round_amount_flag', value: '1', weight: 0.22 },
      { label: 'approval_depth', value: '1', weight: 0.2 },
      { label: 'amount_zscore', value: '2.41', weight: 0.15 }
    ]
  },
  {
    id: 'TXN-100479',
    date: '2026-08-06',
    timestamp: '21:38:55',
    merchant: 'Corporate Card Settlement',
    account: '6500 · Travel & Entertainment',
    amount: 4390.12,
    riskScore: 54,
    risk: 'watch',
    channel: 'Card',
    reasons: ['Merchant category unusual for cost centre', 'Weekend posting'],
    features: [
      { label: 'mcc_novelty', value: '0.66', weight: 0.19 },
      { label: 'is_weekend', value: '1', weight: 0.14 },
      { label: 'amount_zscore', value: '1.32', weight: 0.09 }
    ]
  },
  {
    id: 'TXN-100469',
    date: '2026-08-01',
    timestamp: '09:12:44',
    merchant: 'Vendor Onboarding Deposit',
    account: '2010 · Accounts Payable',
    amount: 7500.0,
    riskScore: 47,
    risk: 'watch',
    channel: 'ACH',
    reasons: ['New vendor, no payment history', 'Tax ID pending verification'],
    features: [
      { label: 'vendor_age_days', value: '2', weight: 0.21 },
      { label: 'tax_id_verified', value: '0', weight: 0.17 }
    ]
  },
  {
    id: 'TXN-100475',
    date: '2026-08-04',
    timestamp: '15:44:12',
    merchant: 'Ridgeline Hardware',
    account: '1500 · Equipment',
    amount: 46120.9,
    riskScore: 44,
    risk: 'watch',
    channel: 'ACH',
    reasons: ['Capital purchase without matching purchase order'],
    features: [
      { label: 'po_match', value: '0', weight: 0.23 },
      { label: 'amount_zscore', value: '1.87', weight: 0.12 }
    ]
  },
  {
    id: 'TXN-100463',
    date: '2026-07-30',
    timestamp: '07:02:31',
    merchant: 'Cobalt Freight Services',
    account: '5100 · Cost of Services',
    amount: 21400.0,
    riskScore: 33,
    risk: 'clean',
    channel: 'ACH',
    reasons: ['Slight deviation from vendor payment cadence'],
    features: [
      { label: 'cadence_deviation', value: '0.41', weight: 0.11 },
      { label: 'amount_zscore', value: '0.92', weight: 0.07 }
    ]
  }
]

export const activityFeed: ActivityEntry[] = [
  {
    id: 'a1',
    time: '09:41',
    actor: 'Detection engine',
    action: 'Batch scored',
    detail: 'BATCH-2026-08-07-A · 18,432 rows · 264 flagged',
    tone: 'high'
  },
  {
    id: 'a2',
    time: '09:28',
    actor: 'M. Okafor',
    action: 'Batch uploaded',
    detail: 'transactions_aug_w1.csv · 4.2 MB',
    tone: 'neutral'
  },
  {
    id: 'a3',
    time: '08:55',
    actor: 'System',
    action: 'Entry flagged',
    detail: 'TXN-100482 · score 91 · wire, off-hours',
    tone: 'high'
  },
  {
    id: 'a4',
    time: '08:12',
    actor: 'R. Vasquez',
    action: 'Entry posted',
    detail: 'TXN-100481 · $32,500.00 · retainer',
    tone: 'clean'
  },
  {
    id: 'a5',
    time: '07:46',
    actor: 'R. Vasquez',
    action: 'Entry held for review',
    detail: 'TXN-100479 · score 54 · card settlement',
    tone: 'watch'
  },
  {
    id: 'a6',
    time: '07:03',
    actor: 'System',
    action: 'Model refreshed',
    detail: 'xgboost-v4.2.1 · AUC 0.973',
    tone: 'neutral'
  },
  {
    id: 'a7',
    time: '06:30',
    actor: 'A. Lindqvist',
    action: 'Ledger reconciled',
    detail: 'Period 07 · 1,204 entries balanced',
    tone: 'clean'
  }
]

function buildTrend(): TrendPoint[] {
  const base = [
    [412, 38, 6], [398, 41, 4], [430, 36, 9], [455, 52, 12], [441, 47, 7],
    [389, 33, 5], [356, 29, 3], [472, 58, 14], [488, 61, 18], [463, 55, 11],
    [421, 44, 8], [409, 39, 6], [377, 31, 4], [498, 66, 21], [512, 71, 24],
    [486, 62, 16], [451, 49, 10], [438, 45, 9], [396, 35, 5], [521, 74, 27],
    [534, 79, 31], [509, 68, 22], [477, 57, 15], [462, 51, 12], [418, 42, 8],
    [545, 83, 34], [561, 88, 39], [538, 76, 29], [502, 64, 19], [576, 94, 42]
  ]
  return base.map(([clean, watch, high], i) => {
    const d = new Date(2026, 6, 9 + i)
    return {
      day: `${d.toLocaleString('en-US', { month: 'short' })} ${d.getDate()}`,
      clean,
      watch,
      high
    }
  })
}

export const riskTrend: TrendPoint[] = buildTrend()
