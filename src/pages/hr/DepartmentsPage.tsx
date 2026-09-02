import React, { useCallback, useEffect, useState } from 'react'
import { Plus, Archive, Edit2, Building2, X, RotateCcw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Department } from '@/types'
import { PageHeader } from '@/components/shared/PageHeader'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { TableSkeleton } from '@/components/shared/SkeletonLoader'
import { EmptyState } from '@/components/shared/EmptyState'
import { ConfirmModal } from '@/components/shared/ConfirmModal'

function FormDialog({
  open,
  onClose,
  title,
  children,
  onSubmit,
  saving,
  submitLabel,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  onSubmit: () => void
  saving: boolean
  submitLabel: string
}) {
  if (!open) return null

  return (
    <div
      className="vs-dialog-backdrop"
      onClick={e => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="vs-dialog animate-fade-in"
        style={{ minWidth: 420 }}
        onClick={e => e.stopPropagation()}
      >
        <i className="corner tl" />
        <i className="corner tr" />
        <i className="corner bl" />
        <i className="corner br" />
        <div
          className="flex items-center justify-between"
          style={{ padding: '16px 18px 12px', borderBottom: '1px solid var(--color-divider)' }}
        >
          <h2
            className="font-condensed"
            style={{ fontSize: 20, fontWeight: 600, color: 'var(--color-text)' }}
          >
            {title}
          </h2>
          <button
            className="vs-btn-icon"
            style={{ width: 28, height: 28 }}
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={13} />
          </button>
        </div>
        <div
          style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          {children}
        </div>
        <div
          className="flex justify-end gap-2"
          style={{ padding: '12px 18px', borderTop: '1px solid var(--color-divider)' }}
        >
          <button className="vs-btn" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            className="vs-btn vs-btn-primary relative"
            onClick={onSubmit}
            disabled={saving}
            aria-busy={saving}
          >
            <i className="corner tl" />
            <i className="corner tr" />
            <i className="corner bl" />
            <i className="corner br" />
            {saving ? 'Saving…' : submitLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function FL({
  label,
  required,
  optional,
  children,
}: {
  label: string
  required?: boolean
  optional?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label
        style={{
          display: 'block',
          fontSize: 13,
          fontWeight: 500,
          color: 'var(--color-text)',
          marginBottom: 5,
        }}
      >
        {label}
        {required && (
          <span aria-hidden="true" style={{ color: 'var(--color-accent-700)', marginLeft: 3 }}>
            *
          </span>
        )}
        {optional && (
          <span style={{ fontSize: 11, color: 'var(--color-neutral-600)', marginLeft: 6 }}>
            (optional)
          </span>
        )}
      </label>
      {children}
    </div>
  )
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Department | null>(null)
  const [form, setForm] = useState({ name: '', description: '' })
  const [saving, setSaving] = useState(false)
  const [confirmTarget, setConfirmTarget] = useState<Department | null>(null)

  const fetchDepartments = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('departments')
      .select('*')
      .order('name')
    setDepartments((data as Department[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchDepartments()
  }, [fetchDepartments])

  const openAdd = () => {
    setEditing(null)
    setForm({ name: '', description: '' })
    setShowForm(true)
  }

  const openEdit = (d: Department) => {
    setEditing(d)
    setForm({ name: d.name, description: d.description ?? '' })
    setShowForm(true)
  }

  const save = async () => {
    if (!form.name.trim()) return

    setSaving(true)
    if (editing) {
      await supabase
        .from('departments')
        .update({ name: form.name, description: form.description || null })
        .eq('id', editing.id)
    } else {
      await supabase.from('departments').insert({
        name: form.name,
        description: form.description || null,
        is_active: true,
      })
    }
    setShowForm(false)
    setSaving(false)
    fetchDepartments()
  }

  const toggleActive = async () => {
    if (!confirmTarget) return

    await supabase
      .from('departments')
      .update({
        is_active: !confirmTarget.is_active,
        archived_at: !confirmTarget.is_active ? null : new Date().toISOString(),
      })
      .eq('id', confirmTarget.id)

    setConfirmTarget(null)
    fetchDepartments()
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        kicker="HR Manage"
        title="Departments"
        subtitle="Manage company departments and organizational units."
        actions={
          <button
            className="vs-btn vs-btn-primary relative"
            onClick={openAdd}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <i className="corner tl" />
            <i className="corner tr" />
            <i className="corner bl" />
            <i className="corner br" />
            <Plus size={13} aria-hidden="true" /> Add Department
          </button>
        }
      />

      {loading ? (
        <TableSkeleton />
      ) : departments.length === 0 ? (
        <EmptyState
          icon={<Building2 size={36} />}
          title="No departments yet"
          description="Add your first department to organize your team."
          action={{ label: 'Add Department', onClick: openAdd }}
        />
      ) : (
        <div className="vs-card" style={{ overflow: 'hidden' }}>
          <div className="overflow-x-auto">
            <table className="vs-table w-full" style={{ minWidth: 480 }}>
              <thead>
                <tr style={{ background: 'color-mix(in srgb, var(--color-neutral-300) 30%, transparent)' }}>
                  <th>Department</th>
                  <th className="hidden md:table-cell">Description</th>
                  <th>Status</th>
                  <th style={{ width: 72 }} aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {departments.map(d => (
                  <tr key={d.id}>
                    <td>
                      <p style={{ fontWeight: 500, color: 'var(--color-text)', fontSize: 13 }}>
                        {d.name}
                      </p>
                    </td>
                    <td className="hidden md:table-cell">
                      {d.description ? (
                        <p className="line-clamp-1" style={{ fontSize: 12, color: 'var(--color-neutral-600)' }}>
                          {d.description}
                        </p>
                      ) : (
                        <span style={{ color: 'var(--color-neutral-400)' }}>—</span>
                      )}
                    </td>
                    <td>
                      <span className={`vs-tag ${d.is_active ? 'vs-tag-accent' : 'vs-tag-neutral'}`}>
                        {d.is_active ? 'Active' : 'Archived'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          className="vs-btn-icon"
                          style={{ width: 28, height: 28 }}
                          onClick={() => openEdit(d)}
                          aria-label={`Edit ${d.name}`}
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          className="vs-btn-icon"
                          style={{ width: 28, height: 28 }}
                          onClick={() => setConfirmTarget(d)}
                          aria-label={d.is_active ? `Archive ${d.name}` : `Restore ${d.name}`}
                        >
                          {d.is_active ? <Archive size={12} /> : <RotateCcw size={12} />}
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
        title={editing ? 'Edit Department' : 'Add Department'}
        onSubmit={save}
        saving={saving}
        submitLabel={editing ? 'Save changes' : 'Add Department'}
      >
        <FL label="Department Name" required>
          <Input
            placeholder="e.g. Engineering, Sales, Marketing"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            autoFocus
          />
        </FL>
        <FL label="Description" optional>
          <Textarea
            placeholder="Brief description of the department's role or focus"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            style={{ minHeight: 80 }}
          />
        </FL>
      </FormDialog>

      <ConfirmModal
        open={!!confirmTarget}
        onOpenChange={() => setConfirmTarget(null)}
        title={
          confirmTarget?.is_active
            ? `Archive ${confirmTarget?.name}?`
            : `Restore ${confirmTarget?.name}?`
        }
        description={
          confirmTarget?.is_active
            ? 'This department will be archived and no longer available for new recognitions.'
            : 'This department will be available again for recognitions.'
        }
        confirmLabel={confirmTarget?.is_active ? 'Archive' : 'Restore'}
        variant={confirmTarget?.is_active ? 'destructive' : 'default'}
        onConfirm={toggleActive}
      />
    </div>
  )
}
