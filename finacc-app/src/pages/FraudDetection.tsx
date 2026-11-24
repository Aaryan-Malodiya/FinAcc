import React, { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, FileSpreadsheet, Trash2, UploadCloud, X } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { Panel } from '../components/ui/Panel'
import { Button } from '../components/ui/Button'
import { formatFileSize, latestRiskReportKey, scoreTransactions } from '../api/fraud'
import type { ScoredBatchReport } from '../types/finance'

type Phase = 'idle' | 'ready' | 'processing' | 'complete'

const steps = [
  { key: 'parse', label: 'Parsing CSV rows' },
  { key: 'schema', label: 'Validating the 438 IEEE-CIS model features' },
  { key: 'features', label: 'Preparing categorical and numeric values' },
  { key: 'score', label: 'Scoring with the trained XGBoost model' }
]

export function FraudDetection() {
  const navigate = useNavigate()
  const [latestReport, setLatestReport] = useState<ScoredBatchReport | null>(() => {
    const saved = sessionStorage.getItem(latestRiskReportKey)
    if (!saved) return null
    try {
      return JSON.parse(saved) as ScoredBatchReport
    } catch {
      return null
    }
  })
  const [phase, setPhase] = useState<Phase>('idle')
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const accept = (selectedFile?: File) => {
    if (!selectedFile) return
    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      setFile(null)
      setPhase('idle')
      setError('The XGBoost model accepts CSV files only.')
      return
    }
    if (selectedFile.size > 15 * 1024 * 1024) {
      setFile(null)
      setPhase('idle')
      setError('Choose a CSV file that is 15 MB or smaller.')
      return
    }
    setError(null)
    setFile(selectedFile)
    setPhase('ready')
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    accept(e.dataTransfer.files?.[0])
  }

  const runDetection = async () => {
    if (!file || phase !== 'ready') return
    setError(null)
    setPhase('processing')
    try {
      const report = await scoreTransactions(file)
      sessionStorage.setItem(latestRiskReportKey, JSON.stringify(report))
      setLatestReport(report)
      setPhase('complete')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not score this CSV.')
      setPhase('ready')
    }
  }

  const activeStep = phase === 'processing' ? 2 : phase === 'complete' ? 4 : -1

  return (
    <>
      <PageHeader
        eyebrow="Fraud detection"
        title="Batch upload & scoring"
        description="Upload IEEE-CIS transaction data to validate its model features and score it with the trained XGBoost model. The bundled synthetic sample is supported with an approximate-score warning."
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
                  IEEE-CIS transaction CSV up to 15 MB · 438 model features · optional isFraud label is ignored
                </p>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="sr-only"
                  onChange={(e) => accept(e.target.files?.[0])}
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
                      {formatFileSize(file.size)} · ready to upload
                    </p>
                  </div>
                  {phase === 'ready' && (
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null)
                        setPhase('idle')
                        setError(null)
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
            {error && (
              <p role="alert" className="mt-3 text-[12px] text-risk">
                {error}
              </p>
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
                    : phase === 'processing'
                      ? 'Uploading and scoring'
                      : 'Awaiting run'}
                </span>
                <span className="font-mono text-[11px] text-paper-ink">
                  {phase === 'processing' ? 'FastAPI · XGBoost' : phase === 'complete' ? '100%' : 'Ready'}
                </span>
              </div>
              <div
                role="progressbar"
                aria-label="Model scoring progress"
                aria-valuetext={phase === 'processing' ? 'Uploading and scoring' : phase}
                aria-busy={phase === 'processing'}
                className="h-1.5 w-full overflow-hidden rounded-full bg-paper-border"
              >
                <div
                  className={`h-full rounded-full bg-brass transition-[width] duration-300 ${
                    phase === 'processing' ? 'w-2/3 animate-pulse' : phase === 'complete' ? 'w-full' : 'w-0'
                  }`}
                />
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <p className="text-[11px] text-paper-muted">
                  XGBoost · IEEE-CIS transaction model · review threshold 40/100
                </p>
                {phase === 'complete' ? (
                  <div className="flex items-center gap-3">
                    <Button
                      variant="secondary"
                      type="button"
                      onClick={() => {
                        setFile(null)
                        setPhase('idle')
                        setError(null)
                      }}
                    >
                      <X size={13} /> Start over
                    </Button>
                    <Button type="button" onClick={() => navigate('/risk-report')}>
                      View risk report
                    </Button>
                  </div>
                ) : (
                  <Button type="button" disabled={phase !== 'ready'} onClick={runDetection}>
                    {phase === 'processing' ? 'Scoring…' : 'Run detection'}
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
                ['TransactionID', 'identifier'],
                ['TransactionDT', 'dataset time offset'],
                ['TransactionAmt', 'numeric'],
                ['ProductCD', 'categorical'],
                ['card1–card6', 'categorical / numeric'],
                ['C1–C14, D1–D15', 'numeric features'],
                ['V1–V339', 'numeric features']
              ].map(([col, type]) => (
                <li key={col} className="flex items-center justify-between py-2">
                  <span className="font-mono text-[12px] text-paper-ink">{col}</span>
                  <span className="font-mono text-[11px] text-paper-muted">{type}</span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel eyebrow="Latest result" title="Scored batch" bodyClassName="px-0 py-0">
            {latestReport ? (
              <div className="px-5 py-3">
                <p className="font-mono text-[12px] text-paper-ink">{latestReport.summary.batchId}</p>
                <p className="tabular mt-0.5 font-mono text-[11px] text-paper-muted">
                  {latestReport.summary.scanned.toLocaleString()} scanned ·{' '}
                  <span className="text-risk">{latestReport.summary.flagged.toLocaleString()} flagged</span>
                </p>
              </div>
            ) : (
              <p className="px-5 py-3 text-[12px] text-paper-muted">No batch scored in this session.</p>
            )}
          </Panel>
        </div>
      </div>
    </>
  )
}
