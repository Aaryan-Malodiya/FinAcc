import React, { useMemo, useState } from 'react'
import { AlertTriangle, Check, RotateCcw } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { Panel } from '../components/ui/Panel'
import { Button } from '../components/ui/Button'
import { accounts } from '../data/transactions'
import { formatCurrency } from '../utils/format'

interface FormState {
  date: string
  amount: string
  reference: string
  description: string
  debitAccount: string
  creditAccount: string
}

const emptyForm: FormState = {
  date: '2026-08-08',
  amount: '',
  reference: '',
  description: '',
  debitAccount: '',
  creditAccount: ''
}

type Errors = Partial<Record<keyof FormState, string>>

function validate(form: FormState): Errors {
  const errors: Errors = {}
  if (!form.date) errors.date = 'A posting date is required.'
  else if (form.date > '2026-08-08') errors.date = 'Posting date cannot be in the future.'

  const amount = Number(form.amount)
  if (!form.amount) errors.amount = 'Enter the entry amount.'
  else if (Number.isNaN(amount)) errors.amount = 'Amount must be numeric.'
  else if (amount <= 0) errors.amount = 'Amount must be greater than zero.'

  if (!form.reference.trim()) errors.reference = 'Reference is required for the audit trail.'
  else if (!/^[A-Z]{2,4}-\d{3,6}$/.test(form.reference.trim()))
    errors.reference = 'Use the format ABC-12345.'

  if (!form.description.trim()) errors.description = 'Describe the entry.'
  else if (form.description.trim().length < 8)
    errors.description = 'Description must be at least 8 characters.'

  if (!form.debitAccount) errors.debitAccount = 'Select a debit account.'
  if (!form.creditAccount) errors.creditAccount = 'Select a credit account.'
  if (form.debitAccount && form.debitAccount === form.creditAccount)
    errors.creditAccount = 'Debit and credit accounts must differ.'

  return errors
}

const fieldBase =
  'w-full rounded-sm border bg-paper-light px-3 py-2 font-mono text-[13px] text-paper-ink placeholder:text-paper-muted/60 focus:outline-none focus:ring-1'

function fieldClass(state: 'idle' | 'valid' | 'invalid') {
  if (state === 'invalid')
    return `${fieldBase} border-risk/60 bg-risk-bg/50 focus:border-risk focus:ring-risk`
  if (state === 'valid')
    return `${fieldBase} border-clean/50 focus:border-clean focus:ring-clean`
  return `${fieldBase} border-paper-border focus:border-brass focus:ring-brass`
}

interface FieldProps {
  label: string
  hint?: string
  error?: string
  touched: boolean
  filled: boolean
  children: (state: 'idle' | 'valid' | 'invalid', id: string) => React.ReactNode
  id: string
}

function Field({ label, hint, error, touched, filled, children, id }: FieldProps) {
  const state: 'idle' | 'valid' | 'invalid' = !touched
    ? 'idle'
    : error
      ? 'invalid'
      : filled
        ? 'valid'
        : 'idle'
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-paper-muted"
      >
        {label}
      </label>
      {children(state, id)}
      <div className="mt-1.5 min-h-[16px]">
        {state === 'invalid' ? (
          <p className="flex items-center gap-1.5 text-[11px] text-risk">
            <AlertTriangle size={11} /> {error}
          </p>
        ) : state === 'valid' ? (
          <p className="flex items-center gap-1.5 text-[11px] text-clean">
            <Check size={11} /> Accepted
          </p>
        ) : (
          hint && <p className="text-[11px] text-paper-muted">{hint}</p>
        )}
      </div>
    </div>
  )
}

export function RecordTransaction() {
  const [form, setForm] = useState<FormState>(emptyForm)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [submitted, setSubmitted] = useState(false)
  const [posted, setPosted] = useState<string | null>(null)

  const errors = useMemo(() => validate(form), [form])
  const isValid = Object.keys(errors).length === 0

  const set = (key: keyof FormState) => (value: string) => {
    setForm((f) => ({ ...f, [key]: value }))
    setPosted(null)
  }
  const blur = (key: keyof FormState) => () => setTouched((t) => ({ ...t, [key]: true }))
  const shown = (key: keyof FormState) => submitted || Boolean(touched[key])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    if (!isValid) return
    setPosted(`JE-${Math.floor(20000 + Math.random() * 9000)}`)
    setForm(emptyForm)
    setTouched({})
    setSubmitted(false)
  }

  const amountValue = Number(form.amount)

  return (
    <>
      <PageHeader
        eyebrow="Recording & maintenance"
        title="Record a transaction"
        description="Double-entry journal posting. Every entry is validated against the chart of accounts and scored by the detection model before it reaches the ledger."
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Panel className="xl:col-span-2" eyebrow="Journal entry" title="New entry">
          <form onSubmit={handleSubmit} noValidate>
            <div className="grid grid-cols-1 gap-x-5 sm:grid-cols-2">
              <Field
                id="date"
                label="Posting date"
                hint="Must fall within the open period."
                error={errors.date}
                touched={shown('date')}
                filled={Boolean(form.date)}
              >
                {(state, id) => (
                  <input
                    id={id}
                    type="date"
                    value={form.date}
                    onChange={(e) => set('date')(e.target.value)}
                    onBlur={blur('date')}
                    className={fieldClass(state)}
                  />
                )}
              </Field>

              <Field
                id="amount"
                label="Amount (USD)"
                hint="Positive value, two decimals."
                error={errors.amount}
                touched={shown('amount')}
                filled={Boolean(form.amount)}
              >
                {(state, id) => (
                  <input
                    id={id}
                    inputMode="decimal"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={(e) => set('amount')(e.target.value)}
                    onBlur={blur('amount')}
                    className={`${fieldClass(state)} tabular`}
                  />
                )}
              </Field>

              <Field
                id="reference"
                label="Reference"
                hint="Format ABC-12345."
                error={errors.reference}
                touched={shown('reference')}
                filled={Boolean(form.reference)}
              >
                {(state, id) => (
                  <input
                    id={id}
                    placeholder="INV-40218"
                    value={form.reference}
                    onChange={(e) => set('reference')(e.target.value.toUpperCase())}
                    onBlur={blur('reference')}
                    className={fieldClass(state)}
                  />
                )}
              </Field>

              <Field
                id="description"
                label="Description"
                hint="Shown on the ledger line."
                error={errors.description}
                touched={shown('description')}
                filled={Boolean(form.description)}
              >
                {(state, id) => (
                  <input
                    id={id}
                    placeholder="Vendor payment — Northbay Supply"
                    value={form.description}
                    onChange={(e) => set('description')(e.target.value)}
                    onBlur={blur('description')}
                    className={`${fieldClass(state)} font-sans`}
                  />
                )}
              </Field>

              <Field
                id="debit"
                label="Debit account"
                error={errors.debitAccount}
                touched={shown('debitAccount')}
                filled={Boolean(form.debitAccount)}
              >
                {(state, id) => (
                  <select
                    id={id}
                    value={form.debitAccount}
                    onChange={(e) => set('debitAccount')(e.target.value)}
                    onBlur={blur('debitAccount')}
                    className={fieldClass(state)}
                  >
                    <option value="">Select account…</option>
                    {accounts.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                )}
              </Field>

              <Field
                id="credit"
                label="Credit account"
                error={errors.creditAccount}
                touched={shown('creditAccount')}
                filled={Boolean(form.creditAccount)}
              >
                {(state, id) => (
                  <select
                    id={id}
                    value={form.creditAccount}
                    onChange={(e) => set('creditAccount')(e.target.value)}
                    onBlur={blur('creditAccount')}
                    className={fieldClass(state)}
                  >
                    <option value="">Select account…</option>
                    {accounts.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
            </div>

            {submitted && !isValid && (
              <div className="mt-2 flex items-start gap-2 rounded-sm border border-risk/30 bg-risk-bg px-3 py-2.5">
                <AlertTriangle size={14} className="mt-0.5 shrink-0 text-risk" />
                <p className="text-[12px] text-risk">
                  {Object.keys(errors).length} field
                  {Object.keys(errors).length > 1 ? 's' : ''} must be corrected before this entry
                  can be posted.
                </p>
              </div>
            )}

            {posted && (
              <div className="mt-2 flex items-start gap-2 rounded-sm border border-clean/30 bg-clean-bg px-3 py-2.5">
                <Check size={14} className="mt-0.5 shrink-0 text-clean" />
                <p className="text-[12px] text-clean">
                  Entry <span className="font-mono">{posted}</span> posted to the general ledger and
                  queued for scoring.
                </p>
              </div>
            )}

            <div className="mt-5 flex items-center justify-between border-t border-paper-border pt-4">
              <button
                type="button"
                onClick={() => {
                  setForm(emptyForm)
                  setTouched({})
                  setSubmitted(false)
                  setPosted(null)
                }}
                className="inline-flex items-center gap-1.5 text-[12px] text-paper-muted transition-colors hover:text-paper-ink"
              >
                <RotateCcw size={12} /> Clear form
              </button>
              <Button type="submit">Post entry</Button>
            </div>
          </form>
        </Panel>

        <div className="space-y-5">
          <Panel tone="light" eyebrow="Preview" title="Entry balance">
            <dl className="space-y-3">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-[12px] text-paper-muted">Debit</dt>
                <dd className="tabular truncate font-mono text-[12px] text-paper-ink">
                  {form.debitAccount || '—'}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-[12px] text-paper-muted">Credit</dt>
                <dd className="tabular truncate font-mono text-[12px] text-paper-ink">
                  {form.creditAccount || '—'}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3 border-t border-paper-border pt-3">
                <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-paper-muted">
                  Amount
                </dt>
                <dd className="tabular font-display text-2xl font-semibold text-brass-dark">
                  {form.amount && !Number.isNaN(amountValue) && amountValue > 0
                    ? formatCurrency(amountValue)
                    : '$0.00'}
                </dd>
              </div>
            </dl>
            <p className="mt-4 border-t border-paper-border pt-3 text-[11px] leading-relaxed text-paper-muted">
              Balanced double entry: the debit and credit legs post the same amount to two distinct
              accounts.
            </p>
          </Panel>

          <Panel eyebrow="Controls" title="Validation rules">
            <ul className="space-y-2.5 text-[12px] leading-relaxed text-paper-ink">
              {[
                'Posting date must sit inside the open period.',
                'Reference must match the ABC-12345 pattern.',
                'Debit and credit accounts must be distinct.',
                'Entries above $50,000 route to secondary approval.',
                'All entries are scored by xgboost-v4.2.1 on post.'
              ].map((rule) => (
                <li key={rule} className="flex gap-2.5">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brass" aria-hidden />
                  {rule}
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </>
  )
}
