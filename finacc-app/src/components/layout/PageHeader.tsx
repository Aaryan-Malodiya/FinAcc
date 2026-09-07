import React from 'react'

interface PageHeaderProps {
  eyebrow: string
  title: string
  description?: string
  action?: React.ReactNode
}

export function PageHeader({ eyebrow, title, description, action }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-ink-border pb-5">
      <div className="max-w-2xl">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-brass">{eyebrow}</p>
        <h1 className="mt-1.5 font-display text-[30px] font-semibold leading-tight tracking-tight text-paper-light">
          {title}
        </h1>
        {description && (
          <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">{description}</p>
        )}
      </div>
      {action}
    </div>
  )
}
