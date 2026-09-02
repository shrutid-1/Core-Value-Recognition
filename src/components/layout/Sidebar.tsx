import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Plus, Rss, Award, Star, Users, FolderKanban, Building2,
  BarChart3, FileText, Settings, ClipboardList, Gift, Shield,
  CheckSquare, TrendingUp, Zap, BookOpen, X, ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'
import { useAuth } from '@/context/AuthContext'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

interface NavGroup {
  label?: string
  items: NavItem[]
}

function buildNav(role: string | null): NavGroup[] {
  const employeeGroup: NavGroup = {
    items: [
      { label: 'Dashboard',             href: ROUTES.DASHBOARD,          icon: LayoutDashboard },
      { label: 'Give Recognition',      href: ROUTES.GIVE_RECOGNITION,   icon: Plus },
      { label: 'Recognition Feed',      href: ROUTES.RECOGNITION_FEED,   icon: Rss },
      { label: 'My Recognitions',       href: ROUTES.MY_RECOGNITIONS,    icon: Award },
      { label: 'My Core Value Journey', href: ROUTES.CORE_VALUE_JOURNEY, icon: Star },
    ],
  }

  const groups: NavGroup[] = [employeeGroup]

  if (role === 'manager' || role === 'hr_admin' || role === 'super_admin') {
    groups.push({
      label: 'Manager',
      items: [
        { label: 'Manager Dashboard', href: ROUTES.MANAGER_DASHBOARD, icon: TrendingUp },
        { label: 'Pending Approvals', href: ROUTES.PENDING_APPROVALS, icon: CheckSquare },
        { label: 'Team Recognition',  href: ROUTES.TEAM_RECOGNITION,  icon: Users },
        { label: 'Team Badges',       href: ROUTES.TEAM_BADGES,       icon: Zap },
      ],
    })
  }

  if (role === 'hr_admin' || role === 'super_admin') {
    groups.push(
      {
        label: 'HR Admin',
        items: [
          { label: 'HR Dashboard',    href: ROUTES.HR_DASHBOARD,    icon: LayoutDashboard },
          { label: 'Analytics',       href: ROUTES.ANALYTICS,       icon: BarChart3 },
          { label: 'Badge Analytics', href: ROUTES.BADGE_ANALYTICS, icon: Zap },
          { label: 'Reports',         href: ROUTES.REPORTS,         icon: FileText },
        ],
      },
      {
        label: 'Manage',
        items: [
          { label: 'Employees',   href: ROUTES.EMPLOYEES,   icon: Users },
          { label: 'Departments', href: ROUTES.DEPARTMENTS, icon: Building2 },
          { label: 'Projects',    href: ROUTES.PROJECTS,    icon: FolderKanban },
          { label: 'Core Values', href: ROUTES.CORE_VALUES, icon: Star },
          { label: 'Behaviours',  href: ROUTES.BEHAVIOURS,  icon: ClipboardList },
          { label: 'Scenarios',   href: ROUTES.SCENARIOS,   icon: BookOpen },
          { label: 'Rewards',     href: ROUTES.REWARDS,     icon: Gift },
        ],
      },
      {
        label: 'System',
        items: [
          { label: 'Audit Logs', href: ROUTES.AUDIT_LOGS, icon: Shield },
          { label: 'Settings',   href: ROUTES.SETTINGS,   icon: Settings },
        ],
      }
    )
  }

  return groups
}

interface NavItemLinkProps {
  item: NavItem
}

function NavItemLink({ item }: NavItemLinkProps) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.href}
      className={({ isActive }) =>
        cn(
          'vs-nav-item w-full',
          isActive && 'active'
        )
      }
    >
      <Icon size={15} aria-hidden="true" style={{ flexShrink: 0 }} />
      <span className="truncate">{item.label}</span>
    </NavLink>
  )
}

interface SidebarContentProps {
  groups: NavGroup[]
}

/** View-switcher role segment — lets HR/manager switch persona view */
function ViewSwitcher() {
  const { role } = useAuth()
  const navigate = useNavigate()

  if (role !== 'hr_admin' && role !== 'super_admin' && role !== 'manager') return null

  const options =
    role === 'hr_admin' || role === 'super_admin'
      ? [
          { label: 'Employee', href: ROUTES.DASHBOARD },
          { label: 'Manager',  href: ROUTES.MANAGER_DASHBOARD },
          { label: 'HR',       href: ROUTES.HR_DASHBOARD },
        ]
      : [
          { label: 'Employee', href: ROUTES.DASHBOARD },
          { label: 'Manager',  href: ROUTES.MANAGER_DASHBOARD },
        ]

  return (
    <div
      className="px-4 pb-4"
      style={{ borderTop: '1px solid var(--color-divider)', paddingTop: 12 }}
    >
      <p
        className="vs-kicker mb-2"
        style={{ fontSize: 9, letterSpacing: '0.12em' }}
      >
        View as
      </p>
      <div className="vs-seg w-full" style={{ display: 'flex' }}>
        {options.map(opt => (
          <button
            key={opt.href}
            className="flex-1 text-center"
            style={{
              padding: '5px 4px',
              fontSize: 12,
              fontFamily: 'Barlow, sans-serif',
              fontWeight: 500,
              border: 'none',
              borderRight: '1px solid var(--color-divider)',
              background: 'transparent',
              color: 'var(--color-neutral-600)',
              cursor: 'pointer',
              transition: 'background 120ms, color 120ms',
            }}
            onClick={() => navigate(opt.href)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function SidebarContent({ groups }: SidebarContentProps) {
  const { employee } = useAuth()

  // Get initials for brand / user display
  const initials = employee?.full_name
    ? employee.full_name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : 'VS'

  return (
    <div
      className="flex flex-col h-full"
      style={{ height: '100vh', overflowY: 'auto' }}
    >
      {/* Brand */}
      <div
        className="flex items-center gap-3 shrink-0"
        style={{
          padding: '18px 16px 14px',
          borderBottom: '1px solid var(--color-divider)',
        }}
      >
        {/* Blueprint brand mark */}
        <div
          className="relative vs-card shrink-0"
          style={{
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'color-mix(in srgb, var(--color-accent) 14%, transparent)',
          }}
        >
          <i className="corner tl" />
          <i className="corner tr" />
          <i className="corner bl" />
          <i className="corner br" />
          <Star size={13} style={{ color: 'var(--color-accent)' }} aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p
            className="font-condensed leading-none"
            style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-text)', letterSpacing: '-0.01em' }}
          >
            ValueSpot
          </p>
          <p
            className="vs-kicker mt-0.5 leading-none"
            style={{ fontSize: 9 }}
          >
            Touchcore Systems
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav
        className="flex-1 overflow-y-auto"
        style={{ padding: '10px 6px', overflowX: 'hidden' }}
        aria-label="Main navigation"
      >
        {groups.map((group, gi) => (
          <div key={gi} style={{ marginBottom: gi < groups.length - 1 ? 16 : 0 }}>
            {group.label && (
              <p
                className="vs-kicker"
                style={{
                  padding: '0 10px',
                  marginBottom: 4,
                  fontSize: 9,
                  letterSpacing: '0.12em',
                }}
              >
                {group.label}
              </p>
            )}
            <div>
              {group.items.map(item => (
                <NavItemLink key={item.href} item={item} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer: View Switcher */}
      <ViewSwitcher />
    </div>
  )
}

interface SidebarProps {
  mobileOpen: boolean
  onMobileClose: () => void
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const { role } = useAuth()
  const groups = buildNav(role)

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex flex-col shrink-0"
        style={{
          width: 232,
          borderRight: '1px solid var(--color-divider)',
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflowY: 'auto',
        }}
        aria-label="Sidebar"
      >
        <SidebarContent groups={groups} />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0"
            style={{ background: 'color-mix(in srgb, var(--color-neutral-900) 50%, transparent)' }}
            onClick={onMobileClose}
            aria-hidden="true"
          />
          {/* Drawer */}
          <aside
            className="fixed left-0 top-0 h-full z-10 overflow-y-auto animate-slide-in-right"
            style={{
              width: 260,
              background: 'var(--color-bg)',
              borderRight: '1px solid var(--color-divider)',
            }}
          >
            {/* Mobile close button */}
            <div
              className="flex items-center justify-between"
              style={{
                padding: '14px 16px',
                borderBottom: '1px solid var(--color-divider)',
              }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="vs-card relative"
                  style={{
                    width: 28,
                    height: 28,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'color-mix(in srgb, var(--color-accent) 14%, transparent)',
                  }}
                >
                  <i className="corner tl" />
                  <i className="corner tr" />
                  <i className="corner bl" />
                  <i className="corner br" />
                  <Star size={11} style={{ color: 'var(--color-accent)' }} aria-hidden="true" />
                </div>
                <span
                  className="font-condensed"
                  style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)' }}
                >
                  ValueSpot
                </span>
              </div>
              <button
                onClick={onMobileClose}
                className="vs-btn-icon"
                aria-label="Close navigation"
              >
                <X size={15} />
              </button>
            </div>
            <SidebarContent groups={groups} />
          </aside>
        </div>
      )}
    </>
  )
}
