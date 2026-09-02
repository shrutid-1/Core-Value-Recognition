import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, LogOut, Settings, Menu, ChevronDown, Search } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useNotifications } from '@/context/NotificationContext'
import { NotificationCenter } from '@/components/notifications/NotificationCenter'
import { ROUTES } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface TopBarProps {
  onMobileMenuOpen: () => void
}

/** Get initials from a full name */
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

/** Role label for display */
function formatRole(role: string | null): string {
  if (!role) return ''
  return role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
}

export function TopBar({ onMobileMenuOpen }: TopBarProps) {
  const { employee, role, signOut } = useAuth()
  const { unreadCount } = useNotifications()
  const navigate = useNavigate()

  const [notifOpen, setNotifOpen]     = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [searchVal, setSearchVal]     = useState('')

  const notifRef   = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSignOut = async () => {
    setProfileOpen(false)
    await signOut()
    navigate(ROUTES.LOGIN)
  }

  const initials  = employee ? getInitials(employee.full_name) : '??'
  const roleLabel = formatRole(role)

  return (
    <header
      className="flex items-center gap-4 shrink-0"
      style={{
        height: 52,
        padding: '0 32px',
        borderBottom: '1px solid var(--color-divider)',
        background: 'var(--color-bg)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      {/* Mobile hamburger */}
      <button
        className="lg:hidden vs-btn-icon"
        onClick={onMobileMenuOpen}
        aria-label="Open navigation menu"
        style={{ flexShrink: 0 }}
      >
        <Menu size={16} />
      </button>

      {/* Search — desktop */}
      <div
        className="hidden sm:flex items-center gap-2 flex-1"
        style={{ maxWidth: 360 }}
      >
        <div
          className="relative flex items-center w-full"
        >
          <Search
            size={13}
            style={{
              position: 'absolute',
              left: 9,
              color: 'var(--color-neutral-500)',
              pointerEvents: 'none',
            }}
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchVal}
            onChange={e => setSearchVal(e.target.value)}
            placeholder="Search…"
            className="vs-input w-full"
            style={{ paddingLeft: 28, paddingRight: 10, height: 32, fontSize: 13 }}
            aria-label="Search"
          />
        </div>
      </div>

      {/* Right cluster */}
      <div className="flex items-center gap-3 ml-auto">

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            className="vs-btn-icon relative"
            onClick={() => { setNotifOpen(v => !v); setProfileOpen(false) }}
            aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
            aria-expanded={notifOpen}
            style={{ position: 'relative' }}
          >
            <Bell size={15} />
            {unreadCount > 0 && (
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: 5,
                  right: 5,
                  width: 6,
                  height: 6,
                  background: 'var(--color-accent)',
                  borderRadius: '50%',
                }}
              />
            )}
          </button>
          {notifOpen && (
            <NotificationCenter onClose={() => setNotifOpen(false)} />
          )}
        </div>

        {/* Profile cluster */}
        <div ref={profileRef} className="relative">
          <button
            className="flex items-center gap-2.5"
            style={{
              border: '1px solid var(--color-divider)',
              padding: '4px 10px 4px 6px',
              background: 'transparent',
              cursor: 'pointer',
              transition: 'background 120ms',
            }}
            onClick={() => { setProfileOpen(v => !v); setNotifOpen(false) }}
            aria-expanded={profileOpen}
            aria-label="Profile menu"
          >
            {/* Square avatar tile */}
            <div
              className="vs-avatar"
              style={{
                width: 30,
                height: 30,
                fontSize: 11,
              }}
            >
              {initials}
            </div>
            <div className="hidden sm:block text-left leading-tight">
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'var(--color-text)',
                  lineHeight: 1.2,
                }}
              >
                {employee?.full_name ?? '…'}
              </p>
              <p
                style={{
                  fontSize: 10,
                  color: 'var(--color-neutral-600)',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  lineHeight: 1.2,
                }}
              >
                {roleLabel}
              </p>
            </div>
            <ChevronDown
              size={11}
              className="hidden sm:block"
              style={{ color: 'var(--color-neutral-500)' }}
            />
          </button>

          {profileOpen && (
            <div
              className="absolute right-0 top-full z-50"
              style={{
                marginTop: 4,
                width: 192,
                background: 'var(--color-bg)',
                border: '1px solid var(--color-divider)',
                boxShadow: 'var(--shadow-lg)',
              }}
            >
              {/* Profile info header */}
              <div
                style={{
                  padding: '10px 14px',
                  borderBottom: '1px solid var(--color-divider)',
                }}
              >
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--color-text)',
                    fontFamily: "'Barlow Condensed', sans-serif",
                  }}
                >
                  {employee?.full_name ?? '…'}
                </p>
                <p
                  style={{
                    fontSize: 11,
                    color: 'var(--color-neutral-600)',
                    marginTop: 2,
                  }}
                >
                  {employee?.email ?? ''}
                </p>
              </div>

              {/* Menu items */}
              <div style={{ padding: '4px 0' }}>
                <button
                  className="w-full flex items-center gap-2.5 text-left"
                  style={{
                    padding: '7px 14px',
                    fontSize: 13,
                    color: 'var(--color-neutral-700)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'Barlow, sans-serif',
                    transition: 'background 120ms, color 120ms',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'color-mix(in srgb, var(--color-accent) 8%, transparent)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  onClick={() => { navigate(ROUTES.SETTINGS); setProfileOpen(false) }}
                >
                  <Settings size={13} style={{ flexShrink: 0 }} />
                  Settings
                </button>
              </div>

              <div style={{ borderTop: '1px solid var(--color-divider)', padding: '4px 0' }}>
                <button
                  className="w-full flex items-center gap-2.5 text-left"
                  style={{
                    padding: '7px 14px',
                    fontSize: 13,
                    color: 'var(--color-accent-800)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'Barlow, sans-serif',
                    transition: 'background 120ms',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'color-mix(in srgb, var(--color-accent) 10%, transparent)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  onClick={handleSignOut}
                >
                  <LogOut size={13} style={{ flexShrink: 0 }} />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
