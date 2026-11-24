import type { Transaction } from '../types/finance'
import { apiUrl } from './config'

export interface AccountOption {
  code: string
  name: string
  account_type: string
}

export interface LedgerEntryInput {
  posting_date: string
  amount: number
  reference: string
  description: string
  debit_account_code: string
  credit_account_code: string
}

interface LedgerEntryResponse {
  id: string
  reference: string
  date: string
  description: string
  debit_account: string
  credit_account: string
  amount: number
  status: Transaction['status']
  risk: Transaction['risk']
  risk_score: Transaction['riskScore']
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const requestUrl = apiUrl(url)
  const response = await fetch(requestUrl, init)
  if (!response.ok) {
    let message = response.status === 404
      ? `API endpoint not found at ${requestUrl}. Check that VITE_API_BASE_URL is the Railway service origin.`
      : `Request failed (${response.status}).`
    try {
      const body = (await response.json()) as { detail?: string }
      if (body.detail) message = body.detail
    } catch {
      // Keep the HTTP status message when the server response is not JSON.
    }
    throw new Error(message)
  }
  return (await response.json()) as T
}

export function fetchAccounts(): Promise<AccountOption[]> {
  return request<AccountOption[]>('/api/accounts')
}

function toTransaction(entry: LedgerEntryResponse): Transaction {
  return {
    id: entry.id,
    reference: entry.reference,
    date: entry.date,
    description: entry.description,
    account: entry.debit_account,
    debitAccount: entry.debit_account,
    creditAccount: entry.credit_account,
    amount: entry.amount,
    status: entry.status,
    risk: entry.risk,
    riskScore: entry.risk_score
  }
}

export async function fetchLedgerEntries(): Promise<Transaction[]> {
  const entries = await request<LedgerEntryResponse[]>('/api/ledger')
  return entries.map(toTransaction)
}

export async function createLedgerEntry(input: LedgerEntryInput): Promise<Transaction> {
  const entry = await request<LedgerEntryResponse>('/api/ledger/entries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  })
  return toTransaction(entry)
}
