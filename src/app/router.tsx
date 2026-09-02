import React, { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { ROUTES } from '@/lib/constants'
import { Skeleton } from '@/components/shared/SkeletonLoader'
import { useAuth } from '@/context/AuthContext'

// Auth pages (not lazy — needed immediately)
import LoginPage from '@/pages/auth/LoginPage'
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage'

// Role-aware default redirect
function RoleRedirect() {
  const { employee, loading } = useAuth()
  if (loading) return null
  if (!employee) return <Navigate to={ROUTES.LOGIN} replace />
  if (employee.role === 'hr_admin' || employee.role === 'super_admin') {
    return <Navigate to={ROUTES.HR_DASHBOARD} replace />
  }
  if (employee.role === 'manager') {
    return <Navigate to={ROUTES.MANAGER_DASHBOARD} replace />
  }
  return <Navigate to={ROUTES.DASHBOARD} replace />
}

// Lazy-loaded page components
const DashboardPage       = lazy(() => import('@/pages/employee/DashboardPage'))
const GiveRecognitionPage = lazy(() => import('@/pages/employee/GiveRecognitionPage'))
const RecognitionFeedPage = lazy(() => import('@/pages/employee/RecognitionFeedPage'))
const MyRecognitionsPage  = lazy(() => import('@/pages/employee/MyRecognitionsPage'))
const CoreValueJourneyPage = lazy(() => import('@/pages/employee/CoreValueJourneyPage'))
const ProfilePage         = lazy(() => import('@/pages/employee/ProfilePage'))

const ManagerDashboardPage  = lazy(() => import('@/pages/manager/ManagerDashboardPage'))
const PendingApprovalsPage   = lazy(() => import('@/pages/manager/PendingApprovalsPage'))
const TeamRecognitionPage    = lazy(() => import('@/pages/manager/TeamRecognitionPage'))
const TeamBadgesPage         = lazy(() => import('@/pages/manager/TeamBadgesPage'))

const HRDashboardPage    = lazy(() => import('@/pages/hr/HRDashboardPage'))
const AnalyticsPage      = lazy(() => import('@/pages/hr/AnalyticsPage'))
const BadgeAnalyticsPage = lazy(() => import('@/pages/hr/BadgeAnalyticsPage'))
const ReportsPage        = lazy(() => import('@/pages/hr/ReportsPage'))
const EmployeesPage      = lazy(() => import('@/pages/hr/EmployeesPage'))
const DepartmentsPage    = lazy(() => import('@/pages/hr/DepartmentsPage'))
const ProjectsPage       = lazy(() => import('@/pages/hr/ProjectsPage'))
const CoreValuesPage     = lazy(() => import('@/pages/hr/CoreValuesPage'))
const BehavioursPage     = lazy(() => import('@/pages/hr/BehavioursPage'))
const ScenariosPage      = lazy(() => import('@/pages/hr/ScenariosPage'))
const RewardsPage        = lazy(() => import('@/pages/hr/RewardsPage'))
const AuditLogsPage      = lazy(() => import('@/pages/hr/AuditLogsPage'))
const SettingsPage       = lazy(() => import('@/pages/hr/SettingsPage'))

function PageLoader() {
  return (
    <div className="space-y-4 p-6 max-w-4xl">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72" />
      <div className="grid grid-cols-4 gap-4 mt-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
    </div>
  )
}

function Lazy({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>
}

export const router = createBrowserRouter([
  // Auth routes
  { path: ROUTES.LOGIN, element: <LoginPage /> },
  { path: ROUTES.RESET_PASSWORD, element: <ResetPasswordPage /> },

  // App shell wrapping all protected routes
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      // Role-aware default redirect
      { index: true, element: <RoleRedirect /> },

      // Employee routes
      { path: ROUTES.DASHBOARD,         element: <Lazy><DashboardPage /></Lazy> },
      { path: ROUTES.GIVE_RECOGNITION,  element: <Lazy><GiveRecognitionPage /></Lazy> },
      { path: ROUTES.RECOGNITION_FEED,  element: <Lazy><RecognitionFeedPage /></Lazy> },
      { path: ROUTES.MY_RECOGNITIONS,   element: <Lazy><MyRecognitionsPage /></Lazy> },
      { path: ROUTES.CORE_VALUE_JOURNEY, element: <Lazy><CoreValueJourneyPage /></Lazy> },
      { path: ROUTES.PROFILE,           element: <Lazy><ProfilePage /></Lazy> },

      // Manager routes
      {
        path: ROUTES.MANAGER_DASHBOARD,
        element: (
          <ProtectedRoute requiredRole={['manager', 'hr_admin', 'super_admin']}>
            <Lazy><ManagerDashboardPage /></Lazy>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.PENDING_APPROVALS,
        element: (
          <ProtectedRoute requiredRole={['manager', 'hr_admin', 'super_admin']}>
            <Lazy><PendingApprovalsPage /></Lazy>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.TEAM_RECOGNITION,
        element: (
          <ProtectedRoute requiredRole={['manager', 'hr_admin', 'super_admin']}>
            <Lazy><TeamRecognitionPage /></Lazy>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.TEAM_BADGES,
        element: (
          <ProtectedRoute requiredRole={['manager', 'hr_admin', 'super_admin']}>
            <Lazy><TeamBadgesPage /></Lazy>
          </ProtectedRoute>
        ),
      },

      // HR routes
      {
        path: ROUTES.HR_DASHBOARD,
        element: (
          <ProtectedRoute requiredRole={['hr_admin', 'super_admin']}>
            <Lazy><HRDashboardPage /></Lazy>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.ANALYTICS,
        element: (
          <ProtectedRoute requiredRole={['hr_admin', 'super_admin']}>
            <Lazy><AnalyticsPage /></Lazy>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.BADGE_ANALYTICS,
        element: (
          <ProtectedRoute requiredRole={['hr_admin', 'super_admin']}>
            <Lazy><BadgeAnalyticsPage /></Lazy>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.REPORTS,
        element: (
          <ProtectedRoute requiredRole={['hr_admin', 'super_admin']}>
            <Lazy><ReportsPage /></Lazy>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.EMPLOYEES,
        element: (
          <ProtectedRoute requiredRole={['hr_admin', 'super_admin']}>
            <Lazy><EmployeesPage /></Lazy>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.DEPARTMENTS,
        element: (
          <ProtectedRoute requiredRole={['hr_admin', 'super_admin']}>
            <Lazy><DepartmentsPage /></Lazy>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.PROJECTS,
        element: (
          <ProtectedRoute requiredRole={['hr_admin', 'super_admin']}>
            <Lazy><ProjectsPage /></Lazy>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.CORE_VALUES,
        element: (
          <ProtectedRoute requiredRole={['hr_admin', 'super_admin']}>
            <Lazy><CoreValuesPage /></Lazy>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.BEHAVIOURS,
        element: (
          <ProtectedRoute requiredRole={['hr_admin', 'super_admin']}>
            <Lazy><BehavioursPage /></Lazy>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.SCENARIOS,
        element: (
          <ProtectedRoute requiredRole={['hr_admin', 'super_admin']}>
            <Lazy><ScenariosPage /></Lazy>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.REWARDS,
        element: (
          <ProtectedRoute requiredRole={['hr_admin', 'super_admin']}>
            <Lazy><RewardsPage /></Lazy>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.AUDIT_LOGS,
        element: (
          <ProtectedRoute requiredRole={['hr_admin', 'super_admin']}>
            <Lazy><AuditLogsPage /></Lazy>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.SETTINGS,
        element: (
          <ProtectedRoute requiredRole={['hr_admin', 'super_admin']}>
            <Lazy><SettingsPage /></Lazy>
          </ProtectedRoute>
        ),
      },
    ],
  },

  // Catch-all
  { path: '*', element: <Navigate to={ROUTES.DASHBOARD} replace /> },
])
