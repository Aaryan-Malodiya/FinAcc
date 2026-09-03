import React from 'react'

interface PanelProps {
  title?: string
  eyebrow?: string
  action?: React.ReactNode
  children: React.ReactNode
  tone?: 'paper' | 'light'
  className?: string
  bodyClassName?: string
}

export function Panel({
  title,
  eyebrow,
  action,
  children,
  tone = 'paper',
  className = '',
  bodyClassName = ''
}: PanelProps) {
  const surface = tone === 'paper' ? 'bg-paper' : 'bg-paper-light'
  return (
    <section
      className={`${surface} border border-paper-border rounded-sm shadow-[0_1px_0_0_rgba(18,24,31,0.35)] ${className}`}
    >
      {(title || action) && (
        <header className="flex items-start justify-between gap-4 border-b border-paper-border px-5 py-4">
          <div>
            {eyebrow && (
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-paper-muted">
                {eyebrow}
              </p>
            )}
            {title && (
              <h2 className="font-display text-lg leading-tight text-paper-ink">{title}</h2>
            )}
          </div>
          {action}
        </header>
      )}
      <div className={`px-5 py-4 ${bodyClassName}`}>{children}</div>
    </section>
  )
}
