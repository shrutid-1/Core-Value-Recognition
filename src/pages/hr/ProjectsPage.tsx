import React, { useEffect, useState } from 'react'
import { Plus, Archive, Edit2, FolderKanban, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Project } from '@/types'
import { PageHeader } from '@/components/shared/PageHeader'
import { Input } from '@/components/ui/input'
import { TableSkeleton } from '@/components/shared/SkeletonLoader'
import { EmptyState } from '@/components/shared/EmptyState'

interface ProjectRow extends Project {
  manager: { full_name: string } | null
}

function FormDialog({ open, onClose, title, children, onSubmit, saving, submitLabel }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; onSubmit: () => void; saving: boolean; submitLabel: string }) {
  if (!open) return null
  return (
    <div className="vs-dialog-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="vs-dialog animate-fade-in" style={{ minWidth: 420 }} onClick={e => e.stopPropagation()}>
        <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
        <div className="flex items-center justify-between" style={{ padding: '16px 18px 12px', borderBottom: '1px solid var(--color-divider)' }}>
          <h2 className="font-condensed" style={{ fontSize: 20, fontWeight: 600, color: 'var(--color-text)' }}>{title}</h2>
          <button className="vs-btn-icon" style={{ width: 28, height: 28 }} onClick={onClose}><X size={13} /></button>
        </div>
        <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>{children}</div>
        <div className="flex justify-end gap-2" style={{ padding: '12px 18px', borderTop: '1px solid var(--color-divider)' }}>
          <button className="vs-btn" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="vs-btn vs-btn-primary relative" onClick={onSubmit} disabled={saving} aria-busy={saving}>
            <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
            {saving ? 'Saving…' : submitLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function FL({ label, optional, children }: { label: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--color-text)', marginBottom: 5 }}>
        {label}{optional && <span style={{ fontSize: 11, color: 'var(--color-neutral-600)', marginLeft: 6 }}>(optional)</span>}
      </label>
      {children}
    </div>
  )
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectRow[]>([])
  const [managers, setManagers] = useState<Array<{ id: string; full_name: string }>>([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState<ProjectRow | null>(null)
  const [form, setForm]         = useState({ name: '', description: '', project_code: '', manager_id: '' })
  const [saving, setSaving]     = useState(false)

  const fetchProjects = async () => {
    setLoading(true)
    const { data } = await supabase.from('projects').select('*, manager:manager_id(full_name)').order('name')
    setProjects((data as unknown as ProjectRow[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    fetchProjects()
    supabase.from('employees').select('id, full_name').in('role', ['manager', 'hr_admin']).eq('is_active', true).order('full_name').then(({ data }) => setManagers(data ?? []))
  }, [])

  const openAdd  = () => { setEditing(null); setForm({ name: '', description: '', project_code: '', manager_id: '' }); setShowForm(true) }
  const openEdit = (p: ProjectRow) => { setEditing(p); setForm({ name: p.name, description: p.description ?? '', project_code: p.project_code ?? '', manager_id: p.manager_id ?? '' }); setShowForm(true) }

  const save = async () => {
    setSaving(true)
    if (editing) {
      await supabase.from('projects').update({ name: form.name, description: form.description || null, project_code: form.project_code || null, manager_id: form.manager_id || null }).eq('id', editing.id)
    } else {
      await supabase.from('projects').insert({ name: form.name, description: form.description || null, project_code: form.project_code || null, manager_id: form.manager_id || null, is_active: true })
    }
    setShowForm(false); setSaving(false); fetchProjects()
  }

  const archive = async (p: ProjectRow) => {
    await supabase.from('projects').update({ is_active: false, archived_at: new Date().toISOString() }).eq('id', p.id)
    fetchProjects()
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        kicker="HR Manage"
        title="Projects"
        subtitle="Manage client and internal projects for recognition tagging."
        actions={
          <button className="vs-btn vs-btn-primary relative" onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
            <Plus size={13} aria-hidden="true" /> Add Project
          </button>
        }
      />

      {loading ? <TableSkeleton /> : projects.length === 0 ? (
        <EmptyState icon={<FolderKanban size={36} />} title="No projects yet" description="Add projects so employees can tag their recognitions to client or internal work." action={{ label: 'Add Project', onClick: openAdd }} />
      ) : (
        <div className="vs-card" style={{ overflow: 'hidden' }}>
          <div className="overflow-x-auto">
            <table className="vs-table w-full" style={{ minWidth: 480 }}>
              <thead>
                <tr style={{ background: 'color-mix(in srgb, var(--color-neutral-300) 30%, transparent)' }}>
                  <th>Project</th>
                  <th className="hidden sm:table-cell">Code</th>
                  <th className="hidden md:table-cell">Manager</th>
                  <th>Status</th>
                  <th style={{ width: 72 }} aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {projects.map(p => (
                  <tr key={p.id}>
                    <td>
                      <p style={{ fontWeight: 500, color: 'var(--color-text)', fontSize: 13 }}>{p.name}</p>
                      {p.description && <p className="line-clamp-1" style={{ fontSize: 12, color: 'var(--color-neutral-600)', marginTop: 2 }}>{p.description}</p>}
                    </td>
                    <td className="hidden sm:table-cell">
                      {p.project_code ? <code style={{ fontSize: 11, fontFamily: 'IBM Plex Mono, monospace', color: 'var(--color-neutral-600)', background: 'color-mix(in srgb, var(--color-neutral-300) 30%, transparent)', padding: '2px 6px' }}>{p.project_code}</code> : <span style={{ color: 'var(--color-neutral-400)' }}>—</span>}
                    </td>
                    <td className="hidden md:table-cell" style={{ color: 'var(--color-neutral-700)', fontSize: 13 }}>
                      {(p.manager as { full_name: string } | null)?.full_name ?? <span style={{ color: 'var(--color-neutral-400)' }}>—</span>}
                    </td>
                    <td><span className={`vs-tag ${p.is_active ? 'vs-tag-accent' : 'vs-tag-neutral'}`}>{p.is_active ? 'Active' : 'Archived'}</span></td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <button className="vs-btn-icon" style={{ width: 28, height: 28 }} onClick={() => openEdit(p)} aria-label={`Edit ${p.name}`}><Edit2 size={12} /></button>
                        {p.is_active && <button className="vs-btn-icon" style={{ width: 28, height: 28 }} onClick={() => archive(p)} aria-label={`Archive ${p.name}`}><Archive size={12} /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <FormDialog open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Project' : 'Add Project'} onSubmit={save} saving={saving} submitLabel={editing ? 'Save changes' : 'Add Project'}>
        <FL label="Project Name"><Input placeholder="e.g. ABC Client Portal" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus /></FL>
        <FL label="Project Code" optional><Input placeholder="e.g. PROJ-001" value={form.project_code} onChange={e => setForm(f => ({ ...f, project_code: e.target.value }))} /></FL>
        <FL label="Description" optional><Input placeholder="Brief description of the project" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></FL>
        <FL label="Project Manager" optional>
          <select className="vs-input w-full" value={form.manager_id} onChange={e => setForm(f => ({ ...f, manager_id: e.target.value }))}>
            <option value="">No manager</option>
            {managers.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
          </select>
        </FL>
      </FormDialog>
    </div>
  )
}
