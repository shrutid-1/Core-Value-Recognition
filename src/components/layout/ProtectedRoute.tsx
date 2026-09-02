import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import type { UserRole } from '@/types'
import { ROUTES } from '@/lib/constants'
import { Skeleton } from '@/components/shared/SkeletonLoader'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: UserRole | UserRole[]
}

const ROLE_HIERARCHY: Record<UserRole, number> = {
  employee:    1,
  manager:     2,
  hr_admin:    3,
  super_admin: 4,
}

function hasRequiredRole(userRole: UserRole | null, required: UserRole | UserRole[]): boolean {
  if (!userRole) return false
  const roles = Array.isArray(required) ? required : [required]
  const userLevel = ROLE_HIERARCHY[userRole] ?? 0
  return roles.some(r => ROLE_HIERARCHY[r] <= userLevel)
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { session, employee, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ minHeight: '100vh', background: 'var(--color-bg)' }}
      >
        <div style={{ width: 220, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Skeleton style={{ height: 3, width: '100%', background: 'var(--color-neutral-300)' }} />
          <Skeleton style={{ height: 3, width: '75%', background: 'var(--color-neutral-300)' }} />
          <Skeleton style={{ height: 3, width: '55%', background: 'var(--color-neutral-300)' }} />
        </div>
      </div>
    )
  }

  if (!session || !employee) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />
  }

  if (requiredRole && !hasRequiredRole(employee.role, requiredRole)) {
    // Redirect to their appropriate dashboard rather than a blank error
    const dashboardByRole: Record<UserRole, string> = {
      employee:    ROUTES.DASHBOARD,
      manager:     ROUTES.MANAGER_DASHBOARD,
      hr_admin:    ROUTES.HR_DASHBOARD,
      super_admin: ROUTES.HR_DASHBOARD,
    }
    return <Navigate to={dashboardByRole[employee.role]} replace />
  }

  return <>{children}</>
}
