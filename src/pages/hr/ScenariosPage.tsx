import React, { useEffect, useState } from 'react'
import { Plus, Edit2, MessageSquare, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Scenario, CoreValue, Behaviour } from '@/types'
import { PageHeader } from '@/components/shared/PageHeader'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { TableSkeleton } from '@/components/shared/SkeletonLoader'
import { EmptyState } from '@/components/shared/EmptyState'

interface ScenarioRow extends Scenario {
  behaviours: { name: string } | null
  core_values: { name: string } | null
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

function FL({ label, required, optional, children }: { label: string; required?: boolean; optional?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--color-text)', marginBottom: 5 }}>
        {label}
        {required && <span aria-hidden="true" style={{ color: 'var(--color-accent-700)', marginLeft: 3 }}>*</span>}
        {optional && <span style={{ fontSize: 11, color: 'var(--color-neutral-600)', marginLeft: 6 }}>(optional)</span>}
      </label>
      {children}
    </div>
  )
}

export default function ScenariosPage() {
  const [scenarios, setScenarios]               = useState<ScenarioRow[]>([])
  const [coreValues, setCoreValues]             = useState<CoreValue[]>([])
  const [behaviours, setBehaviours]             = useState<Behaviour[]>([])
  const [filteredBehaviours, setFilteredBehaviours] = useState<Behaviour[]>([])
  const [loading, setLoading]                   = useState(true)
  const [showForm, setShowForm]                 = useState(false)
  const [editing, setEditing]                   = useState<ScenarioRow | null>(null)
  const [form, setForm]                         = useState({ name: '', description: '', core_value_id: '', behaviour_id: '' })
  const [saving, setSaving]                     = useState(false)

  const fetchScenarios = async () => {
    setLoading(true)
    const { data } = await supabase.from('scenarios').select('*, behaviours:behaviour_id(name), core_values:core_value_id(name)').order('display_order')
    setScenarios((data as unknown as ScenarioRow[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    fetchScenarios()
    supabase.from('core_values').select('id, name').eq('is_active', true).order('display_order').then(({ data }) => setCoreValues(data ?? []))
    supabase.from('behaviours').select('id, name, core_value_id').eq('is_active', true).order('name').then(({ data }) => setBehaviours(data ?? []))
  }, [])

  useEffect(() => {
    setFilteredBehaviours(form.core_value_id ? behaviours.filter(b => b.core_value_id === form.core_value_id) : behaviours)
  }, [form.core_value_id, behaviours])

  const openAdd  = () => { setEditing(null); setForm({ name: '', description: '', core_value_id: coreValues[0]?.id ?? '', behaviour_id: '' }); setShowForm(true) }
  const openEdit = (s: ScenarioRow) => { setEditing(s); setForm({ name: s.name, description: s.description ?? '', core_value_id: s.core_value_id, behaviour_id: s.behaviour_id }); setShowForm(true) }

  const save = async () => {
    setSaving(true)
    if (editing) {
      await supabase.from('scenarios').update({ name: form.name, description: form.description || null }).eq('id', editing.id)
    } else {
      await supabase.from('scenarios').insert({ name: form.name, description: form.description || null, core_value_id: form.core_value_id, behaviour_id: form.behaviour_id, display_order: scenarios.length, is_active: true })
    }
    setShowForm(false); setSaving(false); fetchScenarios()
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        kicker="HR Manage"
        title="Scenarios"
        subtitle="Contextual scenarios that guide employees in the recognition wizard."
        actions={
          <button className="vs-btn vs-btn-primary relative" onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
            <Plus size={13} aria-hidden="true" /> Add Scenario
          </button>
        }
      />

      {loading ? <TableSkeleton /> : scenarios.length === 0 ? (
        <EmptyState icon={<MessageSquare size={36} />} title="No scenarios yet" description="Add scenarios to help employees select the right context for their recognition." action={{ label: 'Add Scenario', onClick: openAdd }} />
      ) : (
        <div className="vs-card" style={{ overflow: 'hidden' }}>
          <div className="overflow-x-auto">
            <table className="vs-table w-full" style={{ minWidth: 520 }}>
              <thead>
                <tr style={{ background: 'color-mix(in srgb, var(--color-neutral-300) 30%, transparent)' }}>
                  <th>Scenario</th>
                  <th className="hidden md:table-cell">Core Value</th>
                  <th className="hidden lg:table-cell">Behaviour</th>
                  <th>Status</th>
                  <th style={{ width: 48 }} aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {scenarios.map(s => (
                  <tr key={s.id}>
                    <td>
                      <p style={{ fontWeight: 500, color: 'var(--color-text)', fontSize: 13 }}>{s.name}</p>
                      {s.description && <p className="line-clamp-1" style={{ fontSize: 12, color: 'var(--color-neutral-600)', marginTop: 2 }}>{s.description}</p>}
                    </td>
                    <td className="hidden md:table-cell" style={{ color: 'var(--color-neutral-700)', fontSize: 13 }}>
                      {(s.core_values as { name: string } | null)?.name ?? <span style={{ color: 'var(--color-neutral-400)' }}>—</span>}
                    </td>
                    <td className="hidden lg:table-cell" style={{ color: 'var(--color-neutral-700)', fontSize: 13 }}>
                      {(s.behaviours as { name: string } | null)?.name ?? <span style={{ color: 'var(--color-neutral-400)' }}>—</span>}
                    </td>
                    <td><span className={`vs-tag ${s.is_active ? 'vs-tag-accent' : 'vs-tag-neutral'}`}>{s.is_active ? 'Active' : 'Archived'}</span></td>
                    <td><button className="vs-btn-icon" style={{ width: 28, height: 28 }} onClick={() => openEdit(s)} aria-label={`Edit ${s.name}`}><Edit2 size={12} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <FormDialog open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Scenario' : 'Add Scenario'} onSubmit={save} saving={saving} submitLabel={editing ? 'Save changes' : 'Add Scenario'}>
        {!editing && (
          <>
            <FL label="Core Value" required>
              <select className="vs-input w-full" value={form.core_value_id} onChange={e => setForm(f => ({ ...f, core_value_id: e.target.value, behaviour_id: '' }))}>
                {coreValues.map(cv => <option key={cv.id} value={cv.id}>{cv.name}</option>)}
              </select>
            </FL>
            <FL label="Behaviour" required>
              <select className="vs-input w-full" value={form.behaviour_id} onChange={e => setForm(f => ({ ...f, behaviour_id: e.target.value }))}>
                <option value="">Select behaviour</option>
                {filteredBehaviours.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </FL>
          </>
        )}
        <FL label="Scenario Name" required><Input placeholder="e.g. Resolved a cross-team technical blocker" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus /></FL>
        <FL label="Description" optional><Textarea placeholder="Additional context about when this scenario applies" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></FL>
      </FormDialog>
    </div>
  )
}
