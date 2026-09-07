import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, FileSpreadsheet, Trash2, UploadCloud, X } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { Panel } from '../components/ui/Panel'
import { Button } from '../components/ui/Button'

type Phase = 'idle' | 'ready' | 'preprocessing' | 'scoring' | 'complete'

const steps = [
  { key: 'parse', label: 'Parsing CSV rows' },
  { key: 'schema', label: 'Validating schema against ledger contract' },
  { key: 'features', label: 'Engineering features (velocity, z-score, novelty)' },
  { key: 'score', label: 'Scoring with xgboost-v4.2.1' }
]

interface UploadedFile {
  name: string
  size: string
  rows: number
}

export function FraudDetection() {
  const navigate = useNavigate()
  const [phase, setPhase] = useState<Phase>('idle')
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState<UploadedFile | null>(null)
  const [progress, setProgress] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (phase !== 'preprocessing' && phase !== 'scoring') return
    const timer = window.setInterval(() => {
      setProgress((p) => {
        const next = p + 2.5
        if (next >= 60 && phase === 'preprocessing') setPhase('scoring')
        if (next >= 100) {
          window.clearInterval(timer)
          setPhase('complete')
          return 100
        }
        return next
      })
    }, 60)
    return () => window.clearInterval(timer)
  }, [phase])

  const accept = (name: string) => {
    setFile({
      name: name.endsWith('.csv') ? name : `${name.replace(/\.[^.]+$/, '')}.csv`,
      size: '4.2 MB',
      rows: 18432
    })
    setPhase('ready')
    setProgress(0)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files?.[0]
    accept(dropped ? dropped.name : 'transactions_aug_w1.csv')
  }

  const activeStep =
    progress >= 85 ? 3 : progress >= 60 ? 2 : progress >= 30 ? 1 : progress > 0 ? 0 : -1

  return (
    <>
      <PageHeader
        eyebrow="Fraud detection"
        title="Batch upload & scoring"
        description="Submit a transaction batch for preprocessing and scoring. Files are validated against the ledger schema before the model runs."
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <Panel eyebrow="Step 1" title="Transaction batch">
            {!file ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragging(true)
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                className={`flex flex-col items-center justify-center rounded-sm border-2 border-dashed px-6 py-14 text-center transition-colors ${
                  dragging
                    ? 'border-brass bg-brass-tint'
                    : 'border-paper-border bg-paper-light hover:border-brass/50'
                }`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-ink-base">
                  <UploadCloud size={20} className="text-brass" strokeWidth={1.75} />
                </div>
                <p className="mt-4 font-display text-lg text-paper-ink">
                  Drop a transaction file here
                </p>
                <p className="mt-1 text-[12px] text-paper-muted">
                  CSV or XLSX up to 50 MB · schema: id, date, amount, account, channel, counterparty
                </p>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv,.xlsx"
                  className="sr-only"
                  onChange={(e) => accept(e.target.files?.[0]?.name ?? 'transactions_aug_w1.csv')}
                />
                <Button className="mt-5" onClick={() => inputRef.current?.click()} type="button">
                  Select file
                </Button>
              </div>
            ) : (
              <div className="rounded-sm border border-paper-border bg-paper-light px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-ink-base">
                    <FileSpreadsheet size={17} className="text-brass" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-[13px] text-paper-ink">{file.name}</p>
                    <p className="tabular font-mono text-[11px] text-paper-muted">
                      {file.rows.toLocaleString()} rows · {file.size} · uploaded 09:28 UTC
                    </p>
                  </div>
                  {phase === 'ready' && (
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null)
                        setPhase('idle')
                        setProgress(0)
                      }}
                      aria-label="Remove file"
                      className="flex h-8 w-8 items-center justify-center rounded-sm text-paper-muted transition-colors hover:bg-risk-bg hover:text-risk"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                  {phase === 'complete' && (
                    <span className="inline-flex items-center gap-1.5 rounded-sm border border-clean/25 bg-clean-bg px-2 py-0.5 text-[11px] text-clean">
                      <Check size={11} /> Scored
                    </span>
                  )}
                </div>
              </div>
            )}
          </Panel>

          <Panel eyebrow="Step 2" title="Preprocessing & model run">
            <ol className="space-y-3">
              {steps.map((step, i) => {
                const done = phase === 'complete' || (activeStep > i && activeStep >= 0)
                const running = activeStep === i && phase !== 'complete'
                return (
                  <li key={step.key} className="flex items-center gap-3">
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border font-mono text-[10px] ${
                        done
                          ? 'border-clean/30 bg-clean-bg text-clean'
                          : running
                            ? 'border-brass bg-brass-tint text-brass-dark'
                            : 'border-paper-border bg-paper-light text-paper-muted'
                      }`}
                    >
                      {done ? <Check size={11} /> : i + 1}
                    </span>
                    <span
                      className={`text-[13px] ${
                        done || running ? 'text-paper-ink' : 'text-paper-muted'
                      }`}
                    >
                      {step.label}
                    </span>
                    {running && (
                      <span className="ml-auto font-mono text-[11px] text-brass-dark">
                        running…
                      </span>
                    )}
                  </li>
                )
              })}
            </ol>

            <div className="mt-5 border-t border-paper-border pt-4">
              <div className="mb-2 flex items-baseline justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-paper-muted">
                  {phase === 'complete'
                    ? 'Run complete'
                    : phase === 'scoring'
                      ? 'Scoring'
                      : phase === 'preprocessing'
                        ? 'Preprocessing'
                        : 'Awaiting run'}
                </span>
                <span className="tabular font-mono text-[13px] text-paper-ink">
                  {Math.round(progress)}%
                </span>
              </div>
              <div
                role="progressbar"
                aria-valuenow={Math.round(progress)}
                aria-valuemin={0}
                aria-valuemax={100}
                className="h-1.5 w-full overflow-hidden rounded-full bg-paper-border"
              >
                <div
                  className="h-full rounded-full bg-brass transition-[width] duration-100"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <p className="text-[11px] text-paper-muted">
                  Model xgboost-v4.2.1 · 214 features · threshold 0.40
                </p>
                {phase === 'complete' ? (
                  <div className="flex items-center gap-3">
                    <Button
                      variant="secondary"
                      type="button"
                      onClick={() => {
                        setFile(null)
                        setPhase('idle')
                        setProgress(0)
                      }}
                    >
                      <X size={13} /> Start over
                    </Button>
                    <Button type="button" onClick={() => navigate('/risk-report')}>
                      View risk report
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    disabled={phase !== 'ready'}
                    onClick={() => {
                      setProgress(0)
                      setPhase('preprocessing')
                    }}
                  >
                    Run detection
                  </Button>
                )}
              </div>
            </div>
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel tone="light" eyebrow="Contract" title="Expected columns">
            <ul className="divide-y divide-paper-border">
              {[
                ['transaction_id', 'string'],
                ['posted_at', 'ISO 8601'],
                ['amount', 'decimal(14,2)'],
                ['account_code', 'string'],
                ['counterparty', 'string'],
                ['channel', 'enum'],
                ['country', 'ISO 3166']
              ].map(([col, type]) => (
                <li key={col} className="flex items-center justify-between py-2">
                  <span className="font-mono text-[12px] text-paper-ink">{col}</span>
                  <span className="font-mono text-[11px] text-paper-muted">{type}</span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel eyebrow="History" title="Recent batches" bodyClassName="px-0 py-0">
            <ul className="divide-y divide-paper-border">
              {[
                ['BATCH-2026-08-07-A', '18,432', '264'],
                ['BATCH-2026-08-04-B', '15,109', '198'],
                ['BATCH-2026-07-31-A', '21,660', '311']
              ].map(([id, rows, flagged]) => (
                <li key={id} className="px-5 py-3">
                  <p className="font-mono text-[12px] text-paper-ink">{id}</p>
                  <p className="tabular mt-0.5 font-mono text-[11px] text-paper-muted">
                    {rows} scanned · <span className="text-risk">{flagged} flagged</span>
                  </p>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </>
  )
}
