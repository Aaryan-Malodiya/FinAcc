import React from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  children: React.ReactNode
}

const variants: Record<Variant, string> = {
  primary:
    'bg-brass text-ink-base hover:bg-brass-dark border border-brass-dark disabled:bg-paper-border disabled:text-paper-muted disabled:border-paper-border',
  secondary:
    'bg-transparent text-paper-ink border border-paper-ink/30 hover:bg-paper-ink/5 disabled:text-paper-muted',
  ghost: 'bg-transparent text-paper-muted border border-transparent hover:text-paper-ink',
  danger: 'bg-risk-bg text-risk border border-risk/30 hover:bg-risk hover:text-paper-light'
}

export function Button({ variant = 'primary', className = '', children, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-2 rounded-sm px-4 py-2 text-[13px] font-medium tracking-tight transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  )
}
