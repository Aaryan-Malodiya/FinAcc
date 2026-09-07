import React from 'react'
import { Link } from 'react-router-dom'
import { Bell, Search } from 'lucide-react'

export function TopBar() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-ink-border bg-ink-panel px-5">
      <div className="flex items-center gap-8">
        <Link to="/" className="flex items-baseline gap-2">
          <span className="font-display text-[22px] font-semibold tracking-tight text-paper-light">
            Fin<span className="text-brass">Acc</span>
          </span>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft sm:inline">
            Accounting Workbench
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft"
          />
          <input
            type="search"
            placeholder="Search entries, IDs, accounts"
            aria-label="Search entries"
            className="h-9 w-72 rounded-sm border border-ink-border bg-ink-base pl-9 pr-3 font-mono text-xs text-paper placeholder:text-ink-soft/70 focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass"
          />
        </div>

        <button
          type="button"
          aria-label="Notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-sm border border-ink-border text-ink-soft transition-colors hover:border-brass/50 hover:text-paper"
        >
          <Bell size={15} strokeWidth={1.75} />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-brass" />
        </button>

        <div className="flex items-center gap-3 border-l border-ink-border pl-3">
          <div className="hidden text-right sm:block">
            <p className="text-[13px] leading-tight text-paper">M. Okafor</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
              Controller · Entity 01
            </p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-brass font-display text-sm font-semibold text-ink-base">
            MO
          </div>
        </div>
      </div>
    </header>
  )
}
