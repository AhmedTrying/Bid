'use client'

import { useEffect, useState } from 'react'
import { Sidebar } from '@/components/app/sidebar'
import { Topbar } from '@/components/app/topbar'
import { Toast } from '@/components/app/toast'
import { CommandPalette } from '@/components/app/command-palette'
import { QuickAddModal } from '@/components/app/quick-add-modal'
import { CloseReasonModal } from '@/components/app/closed-reason-modal'
import { ThemeProvider } from '@/components/app/providers'
import { useStore } from '@/lib/store'

function AppShell({ children }: { children: React.ReactNode }) {
  const density  = useStore(s => s.density)
  const [paletteOpen,  setPaletteOpen]  = useState(false)
  const [quickAddOpen, setQuickAddOpen] = useState(false)

  // Global keyboard shortcuts
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault(); setPaletteOpen(p => !p)
      }
      if (e.key === 'Escape') { setPaletteOpen(false); setQuickAddOpen(false) }
      if (e.key === 'n' && !e.metaKey && !e.ctrlKey && document.activeElement === document.body) {
        setQuickAddOpen(true)
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  // Sidebar palette event from sidebar search button
  useEffect(() => {
    const h = () => setPaletteOpen(true)
    document.addEventListener('bf:palette', h)
    return () => document.removeEventListener('bf:palette', h)
  }, [])

  // Quick-add event from any page
  useEffect(() => {
    const h = () => setQuickAddOpen(true)
    document.addEventListener('bf:quickadd', h)
    return () => document.removeEventListener('bf:quickadd', h)
  }, [])

  // Hydrate opportunities from the API (real DB when configured, else seed data)
  useEffect(() => { useStore.getState().hydrate() }, [])

  return (
    <div
      data-density={density}
      style={{
        display: 'grid', gridTemplateColumns: 'auto 1fr',
        height: '100vh', overflow: 'hidden',
      }}
    >
      <Sidebar />
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%', overflow: 'hidden' }}>
        <Topbar onOpenQuickAdd={() => setQuickAddOpen(true)} />
        <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          {children}
        </main>
      </div>

      {paletteOpen  && <CommandPalette onClose={() => setPaletteOpen(false)} />}
      {quickAddOpen && <QuickAddModal  onClose={() => setQuickAddOpen(false)} />}
      <CloseReasonModal />
      <Toast />
    </div>
  )
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AppShell>{children}</AppShell>
    </ThemeProvider>
  )
}
