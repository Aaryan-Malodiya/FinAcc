import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  BookOpenText,
  FilePlus2,
  LayoutDashboard,
  ShieldAlert,
  UploadCloud
} from 'lucide-react'

const sections = [
  {
    label: 'Overview',
    items: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true }]
  },
  {
    label: 'Recording & Maintenance',
    items: [
      { to: '/record', label: 'Record Transaction', icon: FilePlus2, end: false },
      { to: '/ledger', label: 'General Ledger', icon: BookOpenText, end: false }
    ]
  },
  {
    label: 'Fraud Detection',
    items: [
      { to: '/detection', label: 'Batch Upload', icon: UploadCloud, end: false },
      { to: '/risk-report', label: 'Risk Report', icon: ShieldAlert, end: false }
    ]
  }
]

export function Sidebar() {
  return (
    <nav
      aria-label="Primary"
      className="hidden w-60 shrink-0 flex-col border-r border-ink-border bg-ink-panel lg:flex"
    >
      <div className="flex-1 overflow-y-auto px-3 py-6">
        {sections.map((section) => (
          <div key={section.label} className="mb-7">
            <p className="mb-2 px-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-soft/70">
              {section.label}
            </p>
            <ul className="space-y-0.5">
              {section.items.map(({ to, label, icon: Icon, end }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      `group relative flex items-center gap-3 rounded-sm px-3 py-2 text-[13px] transition-colors ${
                        isActive
                          ? 'bg-ink-border/60 text-paper-light'
                          : 'text-ink-soft hover:bg-ink-border/40 hover:text-paper'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          aria-hidden
                          className={`absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-full ${
                            isActive ? 'bg-brass' : 'bg-transparent'
                          }`}
                        />
                        <Icon
                          size={15}
                          strokeWidth={1.75}
                          className={isActive ? 'text-brass' : 'text-ink-soft'}
                        />
                        {label}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-ink-border px-5 py-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft/70">
          Model
        </p>
        <p className="mt-1 font-mono text-xs text-paper">xgboost-v4.2.1</p>
        <p className="mt-1 font-mono text-[11px] text-ink-soft">
          AUC <span className="text-brass">0.973</span> · trained 2026-08-01
        </p>
      </div>
    </nav>
  )
}
