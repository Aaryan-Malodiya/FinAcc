import React, { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ChevronDown, Download } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { Panel } from '../components/ui/Panel'
import { MetricCard } from '../components/ui/MetricCard'
import { RiskPill } from '../components/ui/RiskPill'
import { Button } from '../components/ui/Button'
import { RiskDistributionChart } from '../components/charts/RiskDistributionChart'
import { batchSummary, flaggedTransactions, riskDistribution } from '../data/riskReport'
import { formatCurrency } from '../utils/format'
import { latestRiskReportKey } from '../api/fraud'
import type { RiskLevel, ScoredBatchReport } from '../types/finance'

type SortKey = 'riskScore' | 'amount' | 'date' | 'id'
type Dir = 'asc' | 'desc'

const levelFilters: (RiskLevel | 'all')[] = ['all', 'high', 'watch', 'clean']

const columns: { key: SortKey | null; label: string; align?: 'right' }[] = [
  { key: 'id', label: 'Entry' },
  { key: 'date', label: 'Timestamp' },
  { key: null, label: 'Counterparty / product' },
  { key: null, label: 'Channel / card type' },
  { key: 'amount', label: 'Amount', align: 'right' },
  { key: 'riskScore', label: 'Risk score', align: 'right' },
  { key: null, label: 'Verdict', align: 'right' }
]

export function RiskReport() {
  const [liveReport] = useState<ScoredBatchReport | null>(() => {
    const saved = sessionStorage.getItem(latestRiskReportKey)
    if (!saved) return null
    try {
      return JSON.parse(saved) as ScoredBatchReport
    } catch {
      return null
    }
  })
  const summary = liveReport?.summary ?? batchSummary
  const transactions = liveReport?.flaggedTransactions ?? flaggedTransactions
  const distribution = liveReport?.riskDistribution ?? riskDistribution
  const [sortKey, setSortKey] = useState<SortKey>('riskScore')
  const [dir, setDir] = useState<Dir>('desc')
  const [level, setLevel] = useState<RiskLevel | 'all'>('all')
  const [expanded, setExpanded] = useState<string | null>(transactions[0]?.id ?? null)

  const rows = useMemo(() => {
    return transactions
      .filter((t) => level === 'all' || t.risk === level)
      .slice()
      .sort((a, b) => {
        const av = a[sortKey]
        const bv = b[sortKey]
        const cmp =
          typeof av === 'number' && typeof bv === 'number'
            ? av - bv
            : String(av).localeCompare(String(bv))
        return dir === 'asc' ? cmp : -cmp
      })
  }, [sortKey, dir, level, transactions])

  const disposition = (['high', 'watch', 'clean'] as const).map((risk) => ({
    label: risk === 'high' ? 'High risk — escalate' : risk === 'watch' ? 'Watch — secondary review' : 'Clean — auto-cleared',
    count: distribution.filter((band) => band.level === risk).reduce((sum, band) => sum + band.count, 0),
    level: risk
  }))

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
        eyebrow={`${summary.batchId} · ${summary.modelVersion}`}
        title="Risk report"
        description={`Scored ${summary.scanned.toLocaleString()} rows from ${summary.fileName} in ${summary.runtimeSeconds}s. Completed ${summary.completedAt}.`}
        action={
          <Button variant="primary" type="button">
            <Download size={13} /> Export report
          </Button>
        }
      />

      {liveReport?.warnings?.map((warning) => (
        <p
          key={warning}
          role="alert"
          className="mb-4 rounded-sm border border-watch/30 bg-watch-bg px-4 py-3 text-[12px] text-watch"
        >
          {warning}
        </p>
      ))}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total scanned"
          value={summary.scanned.toLocaleString()}
          hint={`${summary.fileName}`}
        />
        <MetricCard
          label="Flagged"
          value={summary.flagged.toLocaleString()}
          hint="score ≥ 40 threshold"
          emphasis="risk"
        />
        <MetricCard
          label="Flagged exposure"
          value={formatCurrency(summary.flaggedAmount)}
          hint="held pending review"
          emphasis="brass"
        />
        <MetricCard
          label={liveReport ? 'Fraud risk rate' : 'Model performance'}
          value={liveReport
            ? `${summary.scanned ? ((summary.flagged / summary.scanned) * 100).toFixed(1) : '0.0'}%`
            : (summary.auc ?? 0).toFixed(3)}
          hint={liveReport
            ? `${summary.flagged.toLocaleString()} transactions scored 40 or higher`
            : `AUC · precision ${summary.precision} · recall ${summary.recall}`}
          emphasis="brass"
        />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Panel className="xl:col-span-2" eyebrow="Batch output" title="Risk score distribution">
          <RiskDistributionChart data={distribution} />
        </Panel>
        <Panel tone="light" eyebrow="Disposition" title="Review queue">
          <ul className="space-y-4">
            {disposition.map((item) => {
              const pct = (item.count / Math.max(summary.scanned, 1)) * 100
              return (
                <li key={item.label}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[12px] text-paper-ink">{item.label}</span>
                    <span className="tabular font-mono text-[12px] text-paper-ink">
                      {item.count.toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-paper-border">
                    <div
                      className={`h-full rounded-full ${
                        item.level === 'high'
                          ? 'bg-risk'
                          : item.level === 'watch'
                            ? 'bg-watch'
                            : 'bg-clean'
                      }`}
                      style={{ width: `${Math.max(pct, 1.5)}%` }}
                    />
                  </div>
                  <p className="tabular mt-1 font-mono text-[10px] text-paper-muted">
                    {pct.toFixed(2)}% of batch
                  </p>
                </li>
              )
            })}
          </ul>
        </Panel>
      </div>

      <Panel className="mt-5" bodyClassName="px-0 py-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-paper-border px-5 py-3.5">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-paper-muted">
              {liveReport ? 'Top model scores' : 'Flagged transactions'}
            </p>
            <h2 className="font-display text-lg leading-tight text-paper-ink">
              Top scored entries
            </h2>
          </div>
          <div className="flex items-center gap-1">
            {levelFilters.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLevel(l)}
                className={`rounded-sm px-3 py-1.5 text-[12px] capitalize transition-colors ${
                  level === l
                    ? 'bg-ink-base text-paper-light'
                    : 'text-paper-muted hover:bg-paper-light hover:text-paper-ink'
                }`}
              >
                {l === 'all' ? 'All' : l === 'high' ? 'High risk' : l}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="border-b border-paper-border">
                <th className="w-8 px-3 py-2.5" />
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
              {rows.map((t) => {
                const open = expanded === t.id
                return (
                  <React.Fragment key={t.id}>
                    <tr
                      className={`cursor-pointer transition-colors ${
                        open ? 'bg-paper-light' : 'hover:bg-paper-light'
                      }`}
                      onClick={() => setExpanded(open ? null : t.id)}
                    >
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          aria-expanded={open}
                          aria-label={`Toggle detail for ${t.id}`}
                          className="flex h-6 w-6 items-center justify-center rounded-sm text-paper-muted"
                        >
                          <ChevronDown
                            size={14}
                            className={`transition-transform ${open ? 'rotate-180' : ''}`}
                          />
                        </button>
                      </td>
                      <td className="tabular px-5 py-3 font-mono text-xs text-paper-ink">{t.id}</td>
                      <td className="tabular px-5 py-3 font-mono text-xs text-paper-muted">
                        {t.date} {t.timestamp}
                      </td>
                      <td className="px-5 py-3 text-[13px] text-paper-ink">{t.merchant}</td>
                      <td className="px-5 py-3 font-mono text-[11px] text-paper-muted">
                        {t.channel}
                      </td>
                      <td className="tabular px-5 py-3 text-right font-mono text-xs text-paper-ink">
                        {formatCurrency(t.amount)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="h-1 w-16 overflow-hidden rounded-full bg-paper-border">
                            <div
                              className={`h-full rounded-full ${
                                t.risk === 'high'
                                  ? 'bg-risk'
                                  : t.risk === 'watch'
                                    ? 'bg-watch'
                                    : 'bg-clean'
                              }`}
                              style={{ width: `${t.riskScore}%` }}
                            />
                          </div>
                          <span
                            className={`tabular font-mono text-[13px] font-medium ${
                              t.risk === 'high'
                                ? 'text-risk'
                                : t.risk === 'watch'
                                  ? 'text-watch'
                                  : 'text-clean'
                            }`}
                          >
                            {t.riskScore}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <RiskPill level={t.risk} />
                      </td>
                    </tr>
                    {open && (
                      <tr className="bg-paper-light">
                        <td colSpan={columns.length + 1} className="px-5 pb-5 pt-1">
                          <div className="grid grid-cols-1 gap-5 rounded-sm border border-paper-border bg-paper px-5 py-4 lg:grid-cols-2">
                            <div>
                              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-paper-muted">
                                {liveReport ? 'Model evidence' : 'Why it was flagged'}
                              </p>
                              <ul className="mt-2.5 space-y-2">
                                {t.reasons.map((reason) => (
                                  <li
                                    key={reason}
                                    className="flex gap-2.5 text-[12px] leading-relaxed text-paper-ink"
                                  >
                                    <span
                                      className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-risk"
                                      aria-hidden
                                    />
                                    {reason}
                                  </li>
                                ))}
                              </ul>
                              <p className="mt-4 font-mono text-[11px] text-paper-muted">
                                Account {t.account}
                              </p>
                            </div>
                            <div>
                              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-paper-muted">
                                Feature contributions
                              </p>
                              <ul className="mt-2.5 space-y-2.5">
                                {t.features.map((f) => (
                                  <li key={f.label}>
                                    <div className="flex items-baseline justify-between gap-3">
                                      <span className="font-mono text-[11px] text-paper-ink">
                                        {f.label}
                                      </span>
                                      <span className="tabular font-mono text-[11px] text-paper-muted">
                                        {f.value} · {(f.weight * 100).toFixed(0)}%
                                      </span>
                                    </div>
                                    <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-paper-border">
                                      <div
                                        className="h-full rounded-full bg-brass"
                                        style={{ width: `${f.weight * 100 * 2}%` }}
                                      />
                                    </div>
                                  </li>
                                ))}
                              </ul>
                              <div className="mt-4 flex items-center gap-2">
                                <Button variant="secondary" type="button">
                                  Clear entry
                                </Button>
                                <Button variant="danger" type="button">
                                  Escalate to case
                                </Button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="border-t border-paper-border bg-paper-light px-5 py-3">
          <p className="font-mono text-[11px] text-paper-muted">
            Showing {rows.length} of {transactions.length} scored entries ·{' '}
            {summary.flagged.toLocaleString()} flagged in {summary.scanned.toLocaleString()} total
          </p>
        </div>
      </Panel>
    </>
  )
}
