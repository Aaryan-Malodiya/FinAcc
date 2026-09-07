import type { Transaction } from '../types/finance'

export const accounts = [
  '1010 · Cash — Operating',
  '1200 · Accounts Receivable',
  '1400 · Prepaid Expenses',
  '1500 · Equipment',
  '2010 · Accounts Payable',
  '2200 · Accrued Liabilities',
  '3000 · Retained Earnings',
  '4000 · Revenue — Services',
  '5100 · Cost of Services',
  '6100 · Payroll Expense',
  '6300 · Software & Subscriptions',
  '6500 · Travel & Entertainment'
]

export const transactions: Transaction[] = [
  {
    id: 'TXN-100482',
    date: '2026-08-07',
    description: 'Wire transfer — Halberd Logistics',
    account: '1010 · Cash — Operating',
    debitAccount: '5100 · Cost of Services',
    creditAccount: '1010 · Cash — Operating',
    amount: 84200.0,
    status: 'flagged',
    risk: 'high',
    riskScore: 91
  },
  {
    id: 'TXN-100481',
    date: '2026-08-07',
    description: 'Client retainer — Meridian Group',
    account: '1200 · Accounts Receivable',
    debitAccount: '1200 · Accounts Receivable',
    creditAccount: '4000 · Revenue — Services',
    amount: 32500.0,
    status: 'posted',
    risk: 'clean',
    riskScore: 8
  },
  {
    id: 'TXN-100480',
    date: '2026-08-06',
    description: 'Vendor payment — Northbay Supply',
    account: '2010 · Accounts Payable',
    debitAccount: '2010 · Accounts Payable',
    creditAccount: '1010 · Cash — Operating',
    amount: 12780.45,
    status: 'posted',
    risk: 'clean',
    riskScore: 12
  },
  {
    id: 'TXN-100479',
    date: '2026-08-06',
    description: 'Corporate card settlement',
    account: '6500 · Travel & Entertainment',
    debitAccount: '6500 · Travel & Entertainment',
    creditAccount: '1010 · Cash — Operating',
    amount: 4390.12,
    status: 'pending',
    risk: 'watch',
    riskScore: 54
  },
  {
    id: 'TXN-100478',
    date: '2026-08-05',
    description: 'Payroll run — period 15',
    account: '6100 · Payroll Expense',
    debitAccount: '6100 · Payroll Expense',
    creditAccount: '1010 · Cash — Operating',
    amount: 218430.0,
    status: 'posted',
    risk: 'clean',
    riskScore: 5
  },
  {
    id: 'TXN-100477',
    date: '2026-08-05',
    description: 'Refund reversal — order 8841',
    account: '4000 · Revenue — Services',
    debitAccount: '4000 · Revenue — Services',
    creditAccount: '1200 · Accounts Receivable',
    amount: 9950.0,
    status: 'flagged',
    risk: 'high',
    riskScore: 78
  },
  {
    id: 'TXN-100476',
    date: '2026-08-04',
    description: 'SaaS renewal — Ledgerworks',
    account: '6300 · Software & Subscriptions',
    debitAccount: '6300 · Software & Subscriptions',
    creditAccount: '2010 · Accounts Payable',
    amount: 2400.0,
    status: 'posted',
    risk: 'clean',
    riskScore: 3
  },
  {
    id: 'TXN-100475',
    date: '2026-08-04',
    description: 'Equipment purchase — server rack',
    account: '1500 · Equipment',
    debitAccount: '1500 · Equipment',
    creditAccount: '1010 · Cash — Operating',
    amount: 46120.9,
    status: 'posted',
    risk: 'watch',
    riskScore: 44
  },
  {
    id: 'TXN-100474',
    date: '2026-08-03',
    description: 'Intercompany transfer — EU entity',
    account: '1010 · Cash — Operating',
    debitAccount: '1010 · Cash — Operating',
    creditAccount: '3000 · Retained Earnings',
    amount: 150000.0,
    status: 'pending',
    risk: 'watch',
    riskScore: 61
  },
  {
    id: 'TXN-100473',
    date: '2026-08-03',
    description: 'Insurance prepayment — Q4',
    account: '1400 · Prepaid Expenses',
    debitAccount: '1400 · Prepaid Expenses',
    creditAccount: '1010 · Cash — Operating',
    amount: 18600.0,
    status: 'posted',
    risk: 'clean',
    riskScore: 9
  },
  {
    id: 'TXN-100472',
    date: '2026-08-02',
    description: 'Consulting revenue — Arbor Trust',
    account: '4000 · Revenue — Services',
    debitAccount: '1200 · Accounts Receivable',
    creditAccount: '4000 · Revenue — Services',
    amount: 74250.0,
    status: 'posted',
    risk: 'clean',
    riskScore: 14
  },
  {
    id: 'TXN-100471',
    date: '2026-08-02',
    description: 'Cash withdrawal — branch 04',
    account: '1010 · Cash — Operating',
    debitAccount: '2200 · Accrued Liabilities',
    creditAccount: '1010 · Cash — Operating',
    amount: 29800.0,
    status: 'flagged',
    risk: 'high',
    riskScore: 84
  },
  {
    id: 'TXN-100470',
    date: '2026-08-01',
    description: 'Accrual adjustment — July close',
    account: '2200 · Accrued Liabilities',
    debitAccount: '5100 · Cost of Services',
    creditAccount: '2200 · Accrued Liabilities',
    amount: 11240.33,
    status: 'posted',
    risk: 'clean',
    riskScore: 6
  },
  {
    id: 'TXN-100469',
    date: '2026-08-01',
    description: 'Vendor onboarding deposit',
    account: '2010 · Accounts Payable',
    debitAccount: '2010 · Accounts Payable',
    creditAccount: '1010 · Cash — Operating',
    amount: 7500.0,
    status: 'pending',
    risk: 'watch',
    riskScore: 47
  },
  {
    id: 'TXN-100468',
    date: '2026-07-31',
    description: 'Client retainer — Solstice Co.',
    account: '1200 · Accounts Receivable',
    debitAccount: '1200 · Accounts Receivable',
    creditAccount: '4000 · Revenue — Services',
    amount: 41000.0,
    status: 'posted',
    risk: 'clean',
    riskScore: 11
  }
]
