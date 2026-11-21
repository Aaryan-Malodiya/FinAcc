import React, { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Check, RotateCcw } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { Panel } from '../components/ui/Panel'
import { Button } from '../components/ui/Button'
import { createLedgerEntry, fetchAccounts, type AccountOption } from '../api/accounting'
import type { Transaction } from '../types/finance'
import { formatCurrency } from '../utils/format'

interface FormState {
  date: string
  amount: string
  reference: string
  description: string
  debitAccount: string
  creditAccount: string
}

function todayString() {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10)
}

const emptyForm: FormState = {
  date: todayString(),
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
  else if (form.date > todayString()) errors.date = 'Posting date cannot be in the future.'

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
  const [posted, setPosted] = useState<Transaction | null>(null)
  const [accounts, setAccounts] = useState<AccountOption[]>([])
  const [accountsError, setAccountsError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    fetchAccounts()
      .then(setAccounts)
      .catch((error: unknown) => {
        setAccountsError(error instanceof Error ? error.message : 'Could not load the chart of accounts.')
      })
  }, [])

  const errors = useMemo(() => validate(form), [form])
  const isValid = Object.keys(errors).length === 0

  const set = (key: keyof FormState) => (value: string) => {
    setForm((f) => ({ ...f, [key]: value }))
    setPosted(null)
    setSubmitError(null)
  }
  const blur = (key: keyof FormState) => () => setTouched((t) => ({ ...t, [key]: true }))
  const shown = (key: keyof FormState) => submitted || Boolean(touched[key])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    if (!isValid || posting || accountsError) return

    setPosting(true)
    setSubmitError(null)
    try {
      const entry = await createLedgerEntry({
        posting_date: form.date,
        amount: Number(form.amount),
        reference: form.reference.trim(),
        description: form.description.trim(),
        debit_account_code: form.debitAccount,
        credit_account_code: form.creditAccount
      })
      setPosted(entry)
      setForm({ ...emptyForm, date: todayString() })
      setTouched({})
      setSubmitted(false)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'The entry could not be saved.')
    } finally {
      setPosting(false)
    }
  }

  const amountValue = Number(form.amount)

  return (
    <>
      <PageHeader
        eyebrow="Recording & maintenance"
        title="Record a transaction"
        description="Double-entry journal posting. Entries are validated against the chart of accounts and saved to the general ledger."
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Panel className="xl:col-span-2" eyebrow="Journal entry" title="New entry">
          <form onSubmit={handleSubmit} noValidate>
            {accountsError && (
              <div role="alert" className="mb-4 rounded-sm border border-risk/30 bg-risk-bg px-3 py-2.5 text-[12px] text-risk">
                Could not load the chart of accounts: {accountsError}
              </div>
            )}
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
                    {accounts.map((account) => (
                      <option key={account.code} value={account.code}>
                        {account.code} · {account.name}
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
                    {accounts.map((account) => (
                      <option key={account.code} value={account.code}>
                        {account.code} · {account.name}
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
                  Entry <span className="font-mono">{posted.id}</span> (reference{' '}
                  <span className="font-mono">{posted.reference}</span>) saved to the general ledger
                  {posted.status === 'pending' ? ' and queued for approval.' : '.'}
                </p>
              </div>
            )}

            {submitError && (
              <div role="alert" className="mt-2 rounded-sm border border-risk/30 bg-risk-bg px-3 py-2.5 text-[12px] text-risk">
                Entry was not saved: {submitError}
              </div>
            )}

            <div className="mt-5 flex items-center justify-between border-t border-paper-border pt-4">
              <button
                type="button"
                onClick={() => {
                  setForm({ ...emptyForm, date: todayString() })
                  setTouched({})
                  setSubmitted(false)
                  setPosted(null)
                  setSubmitError(null)
                }}
                className="inline-flex items-center gap-1.5 text-[12px] text-paper-muted transition-colors hover:text-paper-ink"
              >
                <RotateCcw size={12} /> Clear form
              </button>
              <Button type="submit" disabled={posting || Boolean(accountsError)}>
                {posting ? 'Saving…' : 'Post entry'}
              </Button>
            </div>
          </form>
        </Panel>

        <div className="space-y-5">
          <Panel tone="light" eyebrow="Preview" title="Entry balance">
            <dl className="space-y-3">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-[12px] text-paper-muted">Debit</dt>
                <dd className="tabular truncate font-mono text-[12px] text-paper-ink">
                  {accounts.find((account) => account.code === form.debitAccount)
                    ? `${form.debitAccount} · ${accounts.find((account) => account.code === form.debitAccount)?.name}`
                    : '—'}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-[12px] text-paper-muted">Credit</dt>
                <dd className="tabular truncate font-mono text-[12px] text-paper-ink">
                  {accounts.find((account) => account.code === form.creditAccount)
                    ? `${form.creditAccount} · ${accounts.find((account) => account.code === form.creditAccount)?.name}`
                    : '—'}
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
                'Risk scoring is not currently available for journal entries.'
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
