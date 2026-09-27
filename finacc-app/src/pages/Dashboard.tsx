import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { Panel } from '../components/ui/Panel'
import { MetricCard } from '../components/ui/MetricCard'
import { RiskPill } from '../components/ui/RiskPill'
import { TimeRangeFilter } from '../components/ui/TimeRangeFilter'
import { RiskTrendChart } from '../components/charts/RiskTrendChart'
import { activityFeed, batchSummary, riskTrend } from '../data/riskReport'
import { transactions } from '../data/transactions'
import { formatCurrency } from '../utils/format'

const toneMap: Record<string, string> = {
  neutral: 'bg-ink-border',
  clean: 'bg-clean',
  watch: 'bg-watch',
  high: 'bg-risk'
}

export function Dashboard() {
  const [range, setRange] = useState('30d')
  const rangeDays = { '30d': 30, '60d': 60, '90d': 90 }[range] ?? 30
  const trendData = useMemo(() => riskTrend.slice(-rangeDays), [rangeDays])
  const flaggedAmount = batchSummary.flaggedAmount
  return (
    <>
      <PageHeader
        eyebrow="Period 08 · Entity 01"
        title="Control overview"
        description="Position of the ledger and the most recent fraud detection run, as of 07 Aug 2026 09:41 UTC."
        action={
          <Link
            to="/risk-report"
            className="inline-flex items-center gap-2 rounded-sm border border-brass/40 px-3.5 py-2 text-[13px] text-brass transition-colors hover:bg-brass hover:text-ink-base"
          >
            Open latest risk report
            <ArrowUpRight size={14} />
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Transactions scanned"
          value={batchSummary.scanned.toLocaleString()}
          hint="last 30 days · 12 batches"
        />
        <MetricCard
          label="Flagged entries"
          value={batchSummary.flagged.toLocaleString()}
          hint="1.43% of scanned volume"
          emphasis="risk"
        />
        <MetricCard
          label="Flagged exposure"
          value={formatCurrency(flaggedAmount).replace('.55', '')}
          hint="value held pending review"
          emphasis="brass"
        />
        <MetricCard
          label="Model AUC"
          value={batchSummary.auc.toFixed(3)}
          hint={`precision ${batchSummary.precision} · recall ${batchSummary.recall}`}
          emphasis="brass"
        />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Panel
          className="xl:col-span-2"
          eyebrow={`Last ${rangeDays} days`}
          title="Risk distribution over time"
          action={<TimeRangeFilter value={range} onChange={setRange} />}
        >
          <RiskTrendChart data={trendData} />
        </Panel>

        <Panel eyebrow="Audit trail" title="Recent activity" bodyClassName="px-0 py-0">
          <ul className="divide-y divide-paper-border">
            {activityFeed.map((entry) => (
              <li key={entry.id} className="flex gap-3 px-5 py-3">
                <span
                  className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${toneMap[entry.tone]}`}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate text-[13px] font-medium text-paper-ink">
                      {entry.action}
                    </p>
                    <span className="tabular shrink-0 font-mono text-[11px] text-paper-muted">
                      {entry.time}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate font-mono text-[11px] text-paper-muted">
                    {entry.detail}
                  </p>
                  <p className="mt-0.5 text-[11px] text-paper-muted/80">{entry.actor}</p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel
        className="mt-5"
        eyebrow="Recording & maintenance"
        title="Latest ledger entries"
        bodyClassName="px-0 py-0"
        action={
          <Link
            to="/ledger"
            className="text-[13px] text-brass-dark underline-offset-4 hover:underline"
          >
            View full ledger
          </Link>
        }
      >
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-paper-border">
              {['Entry', 'Date', 'Description', 'Amount', 'Risk'].map((h, i) => (
                <th
                  key={h}
                  className={`px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-paper-muted ${
                    i >= 3 ? 'text-right' : ''
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-paper-border">
            {transactions.slice(0, 6).map((t) => (
              <tr key={t.id} className="transition-colors hover:bg-paper-light">
                <td className="tabular px-5 py-3 font-mono text-xs text-paper-ink">{t.id}</td>
                <td className="tabular px-5 py-3 font-mono text-xs text-paper-muted">{t.date}</td>
                <td className="px-5 py-3 text-[13px] text-paper-ink">{t.description}</td>
                <td className="tabular px-5 py-3 text-right font-mono text-xs text-paper-ink">
                  {formatCurrency(t.amount)}
                </td>
                <td className="px-5 py-3 text-right">
                  <RiskPill level={t.risk} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </>
  )
}
