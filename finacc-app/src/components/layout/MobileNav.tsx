import React from 'react'
import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Overview', end: true },
  { to: '/record', label: 'Record', end: false },
  { to: '/ledger', label: 'Ledger', end: false },
  { to: '/detection', label: 'Upload', end: false },
  { to: '/risk-report', label: 'Risk report', end: false }
]

export function MobileNav() {
  return (
    <nav
      aria-label="Primary mobile"
      className="flex gap-1 overflow-x-auto border-b border-ink-border bg-ink-panel px-3 py-2 lg:hidden"
    >
      {links.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          end={l.end}
          className={({ isActive }) =>
            `shrink-0 rounded-sm border-b-2 px-3 py-1.5 text-[13px] transition-colors ${
              isActive
                ? 'border-brass text-paper-light'
                : 'border-transparent text-ink-soft hover:text-paper'
            }`
          }
        >
          {l.label}
        </NavLink>
      ))}
    </nav>
  )
}
