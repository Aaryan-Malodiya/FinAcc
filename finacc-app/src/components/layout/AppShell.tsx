import React from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { MobileNav } from './MobileNav'

export function AppShell() {
  return (
    <div className="flex h-full min-h-screen w-full flex-col bg-ink-base">
      <TopBar />
      <MobileNav />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className="min-w-0 flex-1 overflow-y-auto bg-ink-base">
          <div className="mx-auto w-full max-w-[1400px] px-5 py-7 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
