import React, { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, Search } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { Panel } from '../components/ui/Panel'
import { RiskPill, StatusPill } from '../components/ui/RiskPill'
import { TimeRangeFilter } from '../components/ui/TimeRangeFilter'
import { transactions } from '../data/transactions'
import { formatCurrency } from '../utils/format'
import type { Transaction } from '../types/finance'

type SortKey = 'id' | 'date' | 'amount' | 'riskScore'
type Dir = 'asc' | 'desc'

const statusFilters = ['all', 'posted', 'pending', 'flagged'] as const
const referenceDate = new Date(Math.max(...transactions.map((t) => new Date(t.date).getTime())))

const columns: { key: SortKey | null; label: string; align?: 'right' }[] = [
  { key: 'id', label: 'Entry' },
  { key: 'date', label: 'Date' },
  { key: null, label: 'Description' },
  { key: null, label: 'Debit / Credit' },
  { key: 'amount', label: 'Amount', align: 'right' },
  { key: 'riskScore', label: 'Score', align: 'right' },
  { key: null, label: 'Status', align: 'right' }
]

export function Ledger() {
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [dir, setDir] = useState<Dir>('desc')
  const [status, setStatus] = useState<(typeof statusFilters)[number]>('all')
  const [query, setQuery] = useState('')
  const [range, setRange] = useState('30d')
  const rangeDays = { '30d': 30, '60d': 60, '90d': 90 }[range] ?? 30

  const rows = useMemo(() => {
    const cutoff = new Date(referenceDate)
    cutoff.setDate(cutoff.getDate() - rangeDays)
    const filtered = transactions.filter((t) => {
      const matchesStatus = status === 'all' || t.status === status
      const matchesRange = new Date(t.date) >= cutoff
      const q = query.trim().toLowerCase()
      const matchesQuery =
        !q ||
        t.id.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.account.toLowerCase().includes(q)
      return matchesStatus && matchesRange && matchesQuery
    })
    return filtered.sort((a: Transaction, b: Transaction) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      const cmp = typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : String(av).localeCompare(String(bv))
      return dir === 'asc' ? cmp : -cmp
    })
  }, [sortKey, dir, status, query, rangeDays])

  const total = rows.reduce((sum, t) => sum + t.amount, 0)

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setDir('desc')
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Recording & maintenance"
        title="General ledger"
        description="All recorded entries for the open period, with the detection score attached to each line."
      />

      <Panel bodyClassName="px-0 py-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-paper-border px-5 py-3.5">
          <div className="flex flex-wrap items-center gap-1">
            {statusFilters.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`rounded-sm px-3 py-1.5 text-[12px] capitalize transition-colors ${
                  status === s
                    ? 'bg-ink-base text-paper-light'
                    : 'text-paper-muted hover:bg-paper-light hover:text-paper-ink'
                }`}
              >
                {s === 'all' ? 'All entries' : s}
              </button>
            ))}
            <TimeRangeFilter value={range} onChange={setRange} />
          </div>
          <div className="relative">
            <Search
              size={13}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-paper-muted"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter by ID, description, account"
              aria-label="Filter ledger"
              className="h-9 w-72 rounded-sm border border-paper-border bg-paper-light pl-8 pr-3 font-mono text-[12px] text-paper-ink placeholder:text-paper-muted/70 focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[940px] text-left">
            <thead>
              <tr className="border-b border-paper-border">
                {columns.map((col) => (
                  <th
                    key={col.label}
                    scope="col"
                    className={`px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-paper-muted ${
                      col.align === 'right' ? 'text-right' : ''
                    }`}
                  >
                    {col.key ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(col.key as SortKey)}
                        className={`inline-flex items-center gap-1 transition-colors hover:text-paper-ink ${
                          sortKey === col.key ? 'text-brass-dark' : ''
                        }`}
                      >
                        {col.label}
                        {sortKey === col.key &&
                          (dir === 'asc' ? <ArrowUp size={10} /> : <ArrowDown size={10} />)}
                      </button>
                    ) : (
                      col.label
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-border">
              {rows.map((t) => (
                <tr key={t.id} className="transition-colors hover:bg-paper-light">
                  <td className="tabular px-5 py-3 font-mono text-xs text-paper-ink">{t.id}</td>
                  <td className="tabular px-5 py-3 font-mono text-xs text-paper-muted">{t.date}</td>
                  <td className="px-5 py-3 text-[13px] text-paper-ink">{t.description}</td>
                  <td className="px-5 py-3">
                    <p className="font-mono text-[11px] text-paper-ink">{t.debitAccount}</p>
                    <p className="font-mono text-[11px] text-paper-muted">{t.creditAccount}</p>
                  </td>
                  <td className="tabular px-5 py-3 text-right font-mono text-xs text-paper-ink">
                    {formatCurrency(t.amount)}
                  </td>
                  <td className="tabular px-5 py-3 text-right font-mono text-xs">
                    <span
                      className={
                        t.risk === 'high'
                          ? 'text-risk'
                          : t.risk === 'watch'
                            ? 'text-watch'
                            : 'text-paper-muted'
                      }
                    >
                      {String(t.riskScore).padStart(2, '0')}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <StatusPill status={t.status} />
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={columns.length} className="px-5 py-12 text-center">
                    <p className="font-display text-lg text-paper-ink">No entries match</p>
                    <p className="mt-1 text-[12px] text-paper-muted">
                      Adjust the filter or clear the search term.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-paper-border bg-paper-light px-5 py-3">
          <p className="font-mono text-[11px] text-paper-muted">
            {rows.length} of {transactions.length} entries
          </p>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-paper-muted">
              Total
            </span>
            <span className="tabular font-mono text-[13px] font-medium text-paper-ink">
              {formatCurrency(total)}
            </span>
            <RiskPill
              level={rows.some((r) => r.risk === 'high') ? 'high' : 'clean'}
              label={`${rows.filter((r) => r.risk === 'high').length} high risk`}
            />
          </div>
        </div>
      </Panel>
    </>
  )
}
