import React, { useEffect, useState } from 'react'
import { Plus, Edit2, Gift, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Reward } from '@/types'
import { PageHeader } from '@/components/shared/PageHeader'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { TableSkeleton } from '@/components/shared/SkeletonLoader'
import { EmptyState } from '@/components/shared/EmptyState'

function FormDialog({ open, onClose, title, children, onSubmit, saving, submitLabel }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; onSubmit: () => void; saving: boolean; submitLabel: string }) {
  if (!open) return null
  return (
    <div className="vs-dialog-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="vs-dialog animate-fade-in" style={{ minWidth: 440 }} onClick={e => e.stopPropagation()}>
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

export default function RewardsPage() {
  const [rewards, setRewards]     = useState<Reward[]>([])
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [editing, setEditing]     = useState<Reward | null>(null)
  const [form, setForm]           = useState({ name: '', description: '', frequency: '', eligibility_criteria: '', value_description: '', requires_approval: true })
  const [saving, setSaving]       = useState(false)

  const fetchRewards = async () => {
    setLoading(true)
    const { data } = await supabase.from('rewards').select('*').order('name')
    setRewards(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchRewards() }, [])

  const openAdd  = () => { setEditing(null); setForm({ name: '', description: '', frequency: '', eligibility_criteria: '', value_description: '', requires_approval: true }); setShowForm(true) }
  const openEdit = (r: Reward) => { setEditing(r); setForm({ name: r.name, description: r.description ?? '', frequency: r.frequency ?? '', eligibility_criteria: r.eligibility_criteria ?? '', value_description: r.value_description ?? '', requires_approval: r.requires_approval }); setShowForm(true) }

  const save = async () => {
    setSaving(true)
    if (editing) {
      await supabase.from('rewards').update({ name: form.name, description: form.description || null, frequency: form.frequency || null, eligibility_criteria: form.eligibility_criteria || null, value_description: form.value_description || null, requires_approval: form.requires_approval }).eq('id', editing.id)
    } else {
      await supabase.from('rewards').insert({ name: form.name, description: form.description || null, frequency: form.frequency || null, eligibility_criteria: form.eligibility_criteria || null, value_description: form.value_description || null, requires_approval: form.requires_approval, is_active: true })
    }
    setShowForm(false); setSaving(false); fetchRewards()
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        kicker="HR Manage"
        title="Rewards"
        subtitle="Define recognition rewards and awards that can be assigned to employees."
        actions={
          <button className="vs-btn vs-btn-primary relative" onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
            <Plus size={13} aria-hidden="true" /> Add Reward
          </button>
        }
      />

      {loading ? <TableSkeleton /> : rewards.length === 0 ? (
        <EmptyState icon={<Gift size={36} />} title="No rewards defined yet" description="Add reward types that HR can assign when recognising outstanding contributions." action={{ label: 'Add Reward', onClick: openAdd }} />
      ) : (
        <div className="space-y-2">
          {rewards.map(r => (
            <div
              key={r.id}
              className="vs-card"
              style={{ padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 14 }}
            >
              <div
                style={{
                  width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
                  color: 'var(--color-accent-700)', flexShrink: 0,
                }}
                aria-hidden="true"
              >
                <Gift size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap" style={{ marginBottom: 4 }}>
                  <p className="font-condensed" style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)' }}>{r.name}</p>
                  <span className={`vs-tag ${r.is_active ? 'vs-tag-accent' : 'vs-tag-neutral'}`}>{r.is_active ? 'Active' : 'Inactive'}</span>
                  {r.frequency && <span className="vs-tag vs-tag-neutral" style={{ textTransform: 'capitalize' }}>{r.frequency}</span>}
                  {r.requires_approval && <span className="vs-tag vs-tag-outline">Requires approval</span>}
                </div>
                {r.description && <p style={{ fontSize: 13, color: 'var(--color-neutral-600)', lineHeight: 1.5 }}>{r.description}</p>}
                {r.eligibility_criteria && <p style={{ fontSize: 12, color: 'var(--color-neutral-600)', marginTop: 4 }}><strong>Eligibility:</strong> {r.eligibility_criteria}</p>}
              </div>
              <button className="vs-btn-icon" style={{ width: 28, height: 28, flexShrink: 0 }} onClick={() => openEdit(r)} aria-label={`Edit ${r.name}`}><Edit2 size={12} /></button>
            </div>
          ))}
        </div>
      )}

      <FormDialog open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Reward' : 'Add Reward'} onSubmit={save} saving={saving} submitLabel={editing ? 'Save changes' : 'Add Reward'}>
        <FL label="Reward Name" required><Input placeholder="e.g. LinkedIn Spotlight" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus /></FL>
        <FL label="Description" optional><Textarea placeholder="Describe what this reward entails" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></FL>
        <FL label="Frequency">
          <select className="vs-input w-full" value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))}>
            <option value="">Ad-hoc</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="annual">Annual</option>
          </select>
        </FL>
        <FL label="Eligibility" optional><Input placeholder="e.g. Employees with B4 or above" value={form.eligibility_criteria} onChange={e => setForm(f => ({ ...f, eligibility_criteria: e.target.value }))} /></FL>
        <div className="flex items-center gap-2.5">
          <input
            type="checkbox"
            id="req-approval"
            checked={form.requires_approval}
            onChange={e => setForm(f => ({ ...f, requires_approval: e.target.checked }))}
            style={{ width: 14, height: 14, border: '1px solid var(--color-divider)', accentColor: 'var(--color-accent)' }}
          />
          <label htmlFor="req-approval" style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)', cursor: 'pointer' }}>Requires approval before assigning</label>
        </div>
      </FormDialog>
    </div>
  )
}
