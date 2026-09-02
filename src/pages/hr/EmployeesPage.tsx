import React, { useEffect, useState, useCallback } from 'react'
import { Plus, Search, UserCheck, UserX, Edit2, Users, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Employee, Department } from '@/types'
import { PageHeader } from '@/components/shared/PageHeader'
import { TableSkeleton } from '@/components/shared/SkeletonLoader'
import { EmptyState } from '@/components/shared/EmptyState'
import { EmployeeAvatar } from '@/components/shared/EmployeeAvatar'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { SEARCH_DEBOUNCE_MS } from '@/lib/constants'
import type { UserRole } from '@/types'

const employeeSchema = z.object({
  full_name:     z.string().min(2, 'Name is required'),
  email:         z.string().email('Valid email required'),
  employee_id:   z.string().min(1, 'Employee ID required'),
  role:          z.enum(['employee', 'manager', 'hr_admin', 'super_admin']),
  department_id: z.string().optional(),
  manager_id:    z.string().optional(),
})
type EmployeeForm = z.infer<typeof employeeSchema>

interface EmployeeRow extends Employee {
  department: { name: string } | null
  manager: { full_name: string } | null
}

const SEL = 'vs-input w-full'

function FormDialog({
  open, onClose, title, description, children, onSubmit, saving, submitLabel,
}: {
  open: boolean; onClose: () => void; title: string; description?: string
  children: React.ReactNode; onSubmit: () => void; saving: boolean; submitLabel: string
}) {
  if (!open) return null
  return (
    <div
      className="vs-dialog-backdrop"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="vs-dialog animate-fade-in"
        style={{ minWidth: 420 }}
        onClick={e => e.stopPropagation()}
      >
        <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
        <div className="flex items-start justify-between" style={{ padding: '16px 18px 12px', borderBottom: '1px solid var(--color-divider)' }}>
          <div>
            <h2 className="font-condensed" style={{ fontSize: 20, fontWeight: 600, color: 'var(--color-text)' }}>{title}</h2>
            {description && <p style={{ fontSize: 13, color: 'var(--color-neutral-600)', marginTop: 3 }}>{description}</p>}
          </div>
          <button className="vs-btn-icon" style={{ width: 28, height: 28 }} onClick={onClose}><X size={13} /></button>
        </div>
        <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>{children}</div>
        <div className="flex justify-end gap-2" style={{ padding: '12px 18px', borderTop: '1px solid var(--color-divider)' }}>
          <button className="vs-btn" onClick={onClose} disabled={saving}>Cancel</button>
          <button
            className="vs-btn vs-btn-primary relative"
            onClick={onSubmit}
            disabled={saving}
            aria-busy={saving}
          >
            <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
            {saving ? 'Saving…' : submitLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function FormField({ label, required, children, hint }: { label: string; required?: boolean; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--color-text)', marginBottom: 5 }}>
        {label}{required && <span aria-hidden="true" style={{ color: 'var(--color-accent-700)', marginLeft: 3 }}>*</span>}
      </label>
      {children}
      {hint && <p style={{ fontSize: 11, color: 'var(--color-neutral-600)', marginTop: 4 }}>{hint}</p>}
    </div>
  )
}

export default function EmployeesPage() {
  const [employees, setEmployees]     = useState<EmployeeRow[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [managers, setManagers]       = useState<Employee[]>([])
  const [loading, setLoading]         = useState(true)
  const [query, setQuery]             = useState('')
  const [editTarget, setEditTarget]   = useState<Employee | null>(null)
  const [showForm, setShowForm]       = useState(false)
  const [confirmToggle, setConfirmToggle] = useState<Employee | null>(null)
  const [saving, setSaving]           = useState(false)

  const fetchEmployees = useCallback(async (q = '') => {
    setLoading(true)
    let builder = supabase
      .from('employees')
      .select('*, department:department_id(name), manager:manager_id(full_name)')
      .order('full_name')
      .limit(50)
    if (q.length >= 2) builder = builder.or(`full_name.ilike.%${q}%,email.ilike.%${q}%,employee_id.ilike.%${q}%`)
    const { data } = await builder
    setEmployees((data as unknown as EmployeeRow[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => fetchEmployees(query), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [query, fetchEmployees])

  useEffect(() => {
    supabase.from('departments').select('*').eq('is_active', true).order('name').then(({ data }) => setDepartments(data ?? []))
    supabase.from('employees').select('id, full_name').in('role', ['manager', 'hr_admin']).eq('is_active', true).order('full_name').then(({ data }) => setManagers(data ?? []))
  }, [])

  const { register, handleSubmit, reset, formState: { errors } } = useForm<EmployeeForm>({
    resolver: zodResolver(employeeSchema),
    defaultValues: { role: 'employee' },
  })

  const openAdd = () => { setEditTarget(null); reset({ role: 'employee' }); setShowForm(true) }
  const openEdit = (e: Employee) => {
    setEditTarget(e)
    reset({ full_name: e.full_name, email: e.email, employee_id: e.employee_id, role: e.role, department_id: e.department_id ?? undefined, manager_id: e.manager_id ?? undefined })
    setShowForm(true)
  }

  const onSave = async (data: EmployeeForm) => {
    setSaving(true)
    if (editTarget) {
      await supabase.from('employees').update({ full_name: data.full_name, role: data.role as UserRole, department_id: data.department_id || null, manager_id: data.manager_id || null }).eq('id', editTarget.id)
    } else {
      await supabase.from('employees').insert({ full_name: data.full_name, email: data.email, employee_id: data.employee_id, role: data.role as UserRole, department_id: data.department_id || null, manager_id: data.manager_id || null, is_active: true })
    }
    setShowForm(false)
    setSaving(false)
    fetchEmployees(query)
  }

  const toggleActive = async () => {
    if (!confirmToggle) return
    await supabase.from('employees').update({ is_active: !confirmToggle.is_active }).eq('id', confirmToggle.id)
    setConfirmToggle(null)
    fetchEmployees(query)
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        kicker="HR Manage"
        title="Employees"
        subtitle="Manage team members, roles, departments and managers."
        actions={
          <button className="vs-btn vs-btn-primary relative" onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
            <Plus size={13} aria-hidden="true" /> Add Employee
          </button>
        }
      />

      {/* Search */}
      <div className="relative" style={{ maxWidth: 320 }}>
        <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-neutral-500)', pointerEvents: 'none' }} aria-hidden="true" />
        <input
          type="search"
          className="vs-input w-full"
          style={{ paddingLeft: 28, height: 32, fontSize: 13 }}
          placeholder="Search by name, email or ID…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          aria-label="Search employees"
        />
      </div>

      {loading ? <TableSkeleton /> : employees.length === 0 ? (
        <EmptyState
          icon={<Users size={36} />}
          title={query.length >= 2 ? 'No employees found' : 'No employees yet'}
          description={query.length >= 2 ? `No results for "${query}".` : 'Add your first team member to get started.'}
          action={query.length < 2 ? { label: 'Add Employee', onClick: openAdd } : undefined}
        />
      ) : (
        <div className="vs-card" style={{ overflow: 'hidden' }}>
          <div className="overflow-x-auto">
            <table className="vs-table w-full" style={{ minWidth: 600 }}>
              <thead>
                <tr style={{ background: 'color-mix(in srgb, var(--color-neutral-300) 30%, transparent)' }}>
                  <th>Employee</th>
                  <th className="hidden md:table-cell">ID</th>
                  <th className="hidden lg:table-cell">Department</th>
                  <th className="hidden lg:table-cell">Manager</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th style={{ width: 60 }} aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => (
                  <tr key={emp.id}>
                    <td><EmployeeAvatar name={emp.full_name} avatarUrl={emp.avatar_url} size="sm" showName /></td>
                    <td className="hidden md:table-cell"><code style={{ fontSize: 11, color: 'var(--color-neutral-600)', fontFamily: 'IBM Plex Mono, monospace' }}>{emp.employee_id}</code></td>
                    <td className="hidden lg:table-cell" style={{ color: 'var(--color-neutral-700)' }}>
                      {(emp.department as { name: string } | null)?.name ?? <span style={{ color: 'var(--color-neutral-400)' }}>—</span>}
                    </td>
                    <td className="hidden lg:table-cell" style={{ color: 'var(--color-neutral-700)' }}>
                      {(emp.manager as { full_name: string } | null)?.full_name ?? <span style={{ color: 'var(--color-neutral-400)' }}>—</span>}
                    </td>
                    <td><span className="vs-tag vs-tag-neutral" style={{ textTransform: 'capitalize' }}>{emp.role.replace('_', ' ')}</span></td>
                    <td><span className={`vs-tag ${emp.is_active ? 'vs-tag-accent' : 'vs-tag-neutral'}`}>{emp.is_active ? 'Active' : 'Inactive'}</span></td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <button className="vs-btn-icon" style={{ width: 28, height: 28 }} onClick={() => openEdit(emp)} aria-label={`Edit ${emp.full_name}`}><Edit2 size={12} /></button>
                        <button className="vs-btn-icon" style={{ width: 28, height: 28 }} onClick={() => setConfirmToggle(emp)} aria-label={emp.is_active ? `Deactivate ${emp.full_name}` : `Activate ${emp.full_name}`}>
                          {emp.is_active ? <UserX size={12} /> : <UserCheck size={12} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <FormDialog
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editTarget ? 'Edit Employee' : 'Add Employee'}
        description={editTarget ? "Update this employee's profile details." : 'Add a new team member to the platform.'}
        onSubmit={handleSubmit(onSave)}
        saving={saving}
        submitLabel={editTarget ? 'Save changes' : 'Add Employee'}
      >
        <FormField label="Full Name" required>
          <input id="emp-name" className="vs-input w-full" placeholder="e.g. Priya Patel" {...register('full_name')} />
          {errors.full_name && <p style={{ fontSize: 12, color: 'var(--color-accent-800)', marginTop: 4 }}>{errors.full_name.message}</p>}
        </FormField>
        {!editTarget && (
          <>
            <FormField label="Email" required>
              <input id="emp-email" type="email" className="vs-input w-full" placeholder="priya@touchcore.in" {...register('email')} />
              {errors.email && <p style={{ fontSize: 12, color: 'var(--color-accent-800)', marginTop: 4 }}>{errors.email.message}</p>}
            </FormField>
            <FormField label="Employee ID" required>
              <input id="emp-id" className="vs-input w-full" placeholder="TC001" {...register('employee_id')} />
              {errors.employee_id && <p style={{ fontSize: 12, color: 'var(--color-accent-800)', marginTop: 4 }}>{errors.employee_id.message}</p>}
            </FormField>
          </>
        )}
        <FormField label="Role" required>
          <select id="emp-role" className={SEL} {...register('role')}>
            <option value="employee">Employee</option>
            <option value="manager">Manager</option>
            <option value="hr_admin">HR Admin</option>
          </select>
        </FormField>
        <FormField label="Department">
          <select id="emp-dept" className={SEL} {...register('department_id')}>
            <option value="">No department</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </FormField>
        <FormField label="Manager">
          <select id="emp-mgr" className={SEL} {...register('manager_id')}>
            <option value="">No manager</option>
            {managers.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
          </select>
        </FormField>
      </FormDialog>

      <ConfirmModal
        open={!!confirmToggle}
        onOpenChange={() => setConfirmToggle(null)}
        title={confirmToggle?.is_active ? `Deactivate ${confirmToggle?.full_name}?` : `Activate ${confirmToggle?.full_name}?`}
        description={confirmToggle?.is_active ? 'This employee will no longer be able to log in or receive nominations.' : 'This employee will be able to log in and receive nominations again.'}
        confirmLabel={confirmToggle?.is_active ? 'Deactivate' : 'Activate'}
        variant={confirmToggle?.is_active ? 'destructive' : 'default'}
        onConfirm={toggleActive}
      />
    </div>
  )
}
