import React from 'react'
import { useAuth } from '@/context/AuthContext'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmployeeAvatar } from '@/components/shared/EmployeeAvatar'
import { Skeleton } from '@/components/shared/SkeletonLoader'
import { formatIST } from '@/lib/date-utils'

const ROLE_LABELS: Record<string, string> = {
  employee:    'Employee',
  manager:     'Manager',
  hr_admin:    'HR Admin',
  super_admin: 'Super Admin',
}

function FieldRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div
      className="flex items-center justify-between"
      style={{
        padding: '10px 0',
        borderBottom: '1px solid var(--color-divider)',
      }}
    >
      <dt style={{ fontSize: 13, color: 'var(--color-neutral-600)' }}>{label}</dt>
      <dd
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: 'var(--color-text)',
          fontFamily: mono ? '"IBM Plex Mono", monospace' : undefined,
        }}
      >
        {value}
      </dd>
    </div>
  )
}

export default function ProfilePage() {
  const { employee, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        <Skeleton style={{ height: 34, width: 160, marginBottom: 24 }} />
        <div className="vs-card" style={{ padding: 20 }}>
          <div className="flex items-center gap-4" style={{ marginBottom: 20 }}>
            <Skeleton style={{ width: 56, height: 56 }} />
            <div>
              <Skeleton style={{ height: 18, width: 180, marginBottom: 8 }} />
              <Skeleton style={{ height: 13, width: 200, marginBottom: 8 }} />
              <Skeleton style={{ height: 20, width: 80 }} />
            </div>
          </div>
          <Skeleton style={{ height: 13, width: '100%', marginBottom: 10 }} />
          <Skeleton style={{ height: 13, width: '75%' }} />
        </div>
      </div>
    )
  }

  if (!employee) return null

  return (
    <div className="animate-fade-in" style={{ maxWidth: 480, margin: '0 auto' }}>
      <PageHeader kicker="Account" title="My Profile" />

      <div className="vs-card relative" style={{ overflow: 'visible' }}>
        <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />

        {/* Avatar + name block */}
        <div
          className="flex items-center gap-4"
          style={{
            padding: '20px 20px 16px',
            borderBottom: '1px solid var(--color-divider)',
          }}
        >
          <EmployeeAvatar
            name={employee.full_name}
            avatarUrl={employee.avatar_url}
            size="xl"
          />
          <div className="min-w-0">
            <h2
              className="font-condensed"
              style={{ fontSize: 22, fontWeight: 600, color: 'var(--color-text)', letterSpacing: '-0.01em' }}
            >
              {employee.full_name}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--color-neutral-600)', marginTop: 3 }}>
              {employee.email}
            </p>
            <span
              className="vs-tag vs-tag-accent"
              style={{ display: 'inline-flex', marginTop: 8, fontSize: 11 }}
            >
              {ROLE_LABELS[employee.role] ?? employee.role}
            </span>
          </div>
        </div>

        {/* Details */}
        <dl style={{ padding: '4px 20px 16px' }}>
          <FieldRow label="Employee ID" value={employee.employee_id} mono />
          {employee.joined_at && (
            <FieldRow label="Joined" value={formatIST(employee.joined_at, 'MMMM yyyy')} />
          )}
          <div
            className="flex items-center justify-between"
            style={{ padding: '10px 0' }}
          >
            <dt style={{ fontSize: 13, color: 'var(--color-neutral-600)' }}>Status</dt>
            <dd>
              <span className={`vs-tag ${employee.is_active ? 'vs-tag-accent' : 'vs-tag-neutral'}`}>
                {employee.is_active ? 'Active' : 'Inactive'}
              </span>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
