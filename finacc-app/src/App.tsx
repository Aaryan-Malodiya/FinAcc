import React from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { Dashboard } from './pages/Dashboard'
import { RecordTransaction } from './pages/RecordTransaction'
import { Ledger } from './pages/Ledger'
import { FraudDetection } from './pages/FraudDetection'
import { RiskReport } from './pages/RiskReport'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/record" element={<RecordTransaction />} />
          <Route path="/ledger" element={<Ledger />} />
          <Route path="/detection" element={<FraudDetection />} />
          <Route path="/risk-report" element={<RiskReport />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
