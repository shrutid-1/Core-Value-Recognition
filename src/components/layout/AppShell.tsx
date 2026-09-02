import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { NotificationProvider } from '@/context/NotificationContext'

export function AppShell() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <NotificationProvider>
      <div className="flex min-h-screen" style={{ background: 'var(--color-bg)' }}>
        <Sidebar
          mobileOpen={mobileMenuOpen}
          onMobileClose={() => setMobileMenuOpen(false)}
        />
        <div className="flex flex-col flex-1 min-w-0">
          <TopBar onMobileMenuOpen={() => setMobileMenuOpen(true)} />
          <main
            className="flex-1 overflow-y-auto"
            id="main-content"
            style={{ padding: '28px 32px 64px' }}
          >
            <div style={{ maxWidth: 1220, width: '100%', margin: '0 auto' }}>
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </NotificationProvider>
  )
}
