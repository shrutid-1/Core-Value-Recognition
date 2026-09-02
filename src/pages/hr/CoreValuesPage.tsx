import React, { useCallback, useEffect, useState } from 'react'
import { Plus, Archive, Edit2, RotateCcw, Star, Search, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { CoreValue } from '@/types'
import { toast } from '@/hooks/use-toast'
import { PageHeader } from '@/components/shared/PageHeader'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { TableSkeleton } from '@/components/shared/SkeletonLoader'
import { EmptyState } from '@/components/shared/EmptyState'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { SEARCH_DEBOUNCE_MS } from '@/lib/constants'
import { useDebounce } from '@/hooks/useDebounce'

interface CoreValueForm {
  name: string; slug: string; definition: string
  icon: string; accent_color: string; display_order: string
}
const EMPTY_FORM: CoreValueForm = { name: '', slug: '', definition: '', icon: 'star', accent_color: '#5980a6', display_order: '0' }

function toSlug(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')
}
function friendlyError(code: string | undefined, def: string) {
  if (code === '23505') return 'A Core Value with that name or slug already exists.'
  if (code === '42501') return "You don't have permission to manage Core Values."
  return def
}
interface FormErrors { name?: string; slug?: string; definition?: string; display_order?: string }
function validate(form: CoreValueForm, isNew: boolean): FormErrors {
  const errors: FormErrors = {}
  if (!form.name.trim()) errors.name = 'Name is required.'
  else if (form.name.trim().length > 100) errors.name = 'Name must be 100 characters or fewer.'
  if (isNew) {
    if (!form.slug.trim()) errors.slug = 'Slug is required.'
    else if (!/^[a-z0-9-]+$/.test(form.slug.trim())) errors.slug = 'Lowercase letters, numbers and hyphens only.'
    else if (form.slug.trim().length > 60) errors.slug = 'Slug must be 60 characters or fewer.'
  }
  if (!form.definition.trim()) errors.definition = 'Definition is required.'
  const order = Number(form.display_order)
  if (form.display_order !== '' && (!Number.isInteger(order) || order < 0)) errors.display_order = 'Must be a whole number (0 or above).'
  return errors
}

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

function FL({ label, required, children, hint, error }: { label: string; required?: boolean; children: React.ReactNode; hint?: string; error?: string }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--color-text)', marginBottom: 5 }}>
        {label}{required && <span aria-hidden="true" style={{ color: 'var(--color-accent-700)', marginLeft: 3 }}>*</span>}
      </label>
      {children}
      {error && <p role="alert" style={{ fontSize: 12, color: 'var(--color-accent-800)', marginTop: 4 }}>{error}</p>}
      {hint && !error && <p style={{ fontSize: 11, color: 'var(--color-neutral-600)', marginTop: 4 }}>{hint}</p>}
    </div>
  )
}

export default function CoreValuesPage() {
  const [coreValues, setCoreValues]   = useState<CoreValue[]>([])
  const [loading, setLoading]         = useState(true)
  const [query, setQuery]             = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [showForm, setShowForm]       = useState(false)
  const [editing, setEditing]         = useState<CoreValue | null>(null)
  const [form, setForm]               = useState<CoreValueForm>(EMPTY_FORM)
  const [formErrors, setFormErrors]   = useState<FormErrors>({})
  const [saving, setSaving]           = useState(false)
  const [saveError, setSaveError]     = useState<string | null>(null)
  const [confirmTarget, setConfirmTarget] = useState<CoreValue | null>(null)
  const debouncedQuery = useDebounce(query, SEARCH_DEBOUNCE_MS)

  const fetchCoreValues = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.from('core_values').select('*').order('display_order', { ascending: true })
    if (error) toast({ title: 'Failed to load Core Values', description: 'Please refresh the page.', variant: 'destructive' })
    setCoreValues(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchCoreValues() }, [fetchCoreValues])

  const displayed = coreValues.filter(cv => {
    const q = debouncedQuery.toLowerCase()
    const matchesQ = debouncedQuery.length < 2 || cv.name.toLowerCase().includes(q) || cv.definition.toLowerCase().includes(q) || cv.slug.toLowerCase().includes(q)
    const matchesS = statusFilter === 'all' || (statusFilter === 'active' && cv.is_active) || (statusFilter === 'inactive' && !cv.is_active)
    return matchesQ && matchesS
  })

  const openAdd = () => { setEditing(null); setForm({ ...EMPTY_FORM, display_order: String(coreValues.length) }); setFormErrors({}); setSaveError(null); setShowForm(true) }
  const openEdit = (cv: CoreValue) => { setEditing(cv); setForm({ name: cv.name, slug: cv.slug, definition: cv.definition, icon: cv.icon, accent_color: cv.accent_color, display_order: String(cv.display_order) }); setFormErrors({}); setSaveError(null); setShowForm(true) }
  const closeForm = () => { setShowForm(false); setTimeout(() => { setEditing(null); setForm(EMPTY_FORM); setFormErrors({}); setSaveError(null) }, 200) }

  const handleNameChange = (value: string) => setForm(f => ({ ...f, name: value, slug: editing ? f.slug : toSlug(value) }))

  const save = async () => {
    const isNew = editing === null
    const errors = validate(form, isNew)
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return }
    setFormErrors({}); setSaveError(null); setSaving(true)
    if (editing) {
      const { error } = await supabase.from('core_values').update({ name: form.name.trim(), definition: form.definition.trim(), icon: form.icon.trim() || 'star', accent_color: form.accent_color, display_order: Number(form.display_order) || 0 }).eq('id', editing.id)
      if (error) { setSaveError(friendlyError(error.code, "Couldn't update this Core Value. Please try again.")); setSaving(false); return }
      toast({ title: `"${form.name.trim()}" updated`, variant: 'success' })
    } else {
      const { error } = await supabase.from('core_values').insert({ name: form.name.trim(), slug: form.slug.trim(), definition: form.definition.trim(), icon: form.icon.trim() || 'star', accent_color: form.accent_color, display_order: Number(form.display_order) || coreValues.length, is_active: true })
      if (error) { setSaveError(friendlyError(error.code, "Couldn't save the Core Value. Please try again.")); setSaving(false); return }
      toast({ title: `"${form.name.trim()}" added`, variant: 'success' })
    }
    setSaving(false); closeForm(); fetchCoreValues()
  }

  const toggleActive = async () => {
    if (!confirmTarget) return
    const nowActive = !confirmTarget.is_active
    const { error } = await supabase.from('core_values').update({ is_active: nowActive, archived_at: nowActive ? null : new Date().toISOString() }).eq('id', confirmTarget.id)
    if (error) toast({ title: 'Action failed', description: friendlyError(error.code, 'Could not update status.'), variant: 'destructive' })
    else { toast({ title: nowActive ? `"${confirmTarget.name}" reactivated` : `"${confirmTarget.name}" deactivated`, variant: 'success' }); fetchCoreValues() }
    setConfirmTarget(null)
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        kicker="HR Manage"
        title="Core Values"
        subtitle="Manage the values that define how we work and recognize great behaviour at Touchcore."
        actions={
          <button className="vs-btn vs-btn-primary relative" onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
            <Plus size={13} aria-hidden="true" /> Add Core Value
          </button>
        }
      />

      {/* Search + filter */}
      {!loading && coreValues.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative" style={{ maxWidth: 280 }}>
            <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-neutral-500)', pointerEvents: 'none' }} aria-hidden="true" />
            <input type="search" className="vs-input w-full" style={{ paddingLeft: 28, height: 32, fontSize: 13 }} placeholder="Search core values…" value={query} onChange={e => setQuery(e.target.value)} aria-label="Search core values" />
          </div>
          <div className="vs-seg" style={{ width: 'fit-content' }}>
            {(['all', 'active', 'inactive'] as const).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: '4px 12px', fontSize: 12, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, border: 'none', borderRight: '1px solid var(--color-divider)', background: statusFilter === s ? 'var(--color-accent)' : 'transparent', color: statusFilter === s ? 'var(--color-bg)' : 'var(--color-neutral-600)', cursor: 'pointer', transition: 'background 120ms, color 120ms', textTransform: 'capitalize' }} aria-pressed={statusFilter === s}>{s}</button>
            ))}
          </div>
        </div>
      )}

      {loading ? <TableSkeleton rows={5} /> : coreValues.length === 0 ? (
        <EmptyState icon={<Star size={36} />} title="No core values configured yet." description="Add your first Core Value to start building the recognition framework." action={{ label: 'Add Core Value', onClick: openAdd }} />
      ) : displayed.length === 0 ? (
        <EmptyState icon={<Search size={36} />} title="No results" description={`No core values match "${query || statusFilter}".`} className="py-10" />
      ) : (
        <div className="vs-card" style={{ overflow: 'hidden' }}>
          <table className="vs-table w-full">
            <thead>
              <tr style={{ background: 'color-mix(in srgb, var(--color-neutral-300) 30%, transparent)' }}>
                <th>Core Value</th>
                <th className="hidden md:table-cell">Slug</th>
                <th className="hidden lg:table-cell">Icon</th>
                <th className="hidden lg:table-cell">Order</th>
                <th>Status</th>
                <th style={{ width: 72 }} />
              </tr>
            </thead>
            <tbody>
              {displayed.map(cv => (
                <tr key={cv.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: cv.accent_color, flexShrink: 0, border: '1px solid var(--color-divider)' }} aria-hidden="true" />
                      <div>
                        <p style={{ fontWeight: 500, color: 'var(--color-text)', fontSize: 13 }}>{cv.name}</p>
                        <p className="hidden sm:block line-clamp-1" style={{ fontSize: 12, color: 'var(--color-neutral-600)', maxWidth: 280 }}>{cv.definition}</p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden md:table-cell"><code style={{ fontSize: 11, fontFamily: 'IBM Plex Mono, monospace', color: 'var(--color-neutral-600)', background: 'color-mix(in srgb, var(--color-neutral-300) 30%, transparent)', padding: '2px 6px' }}>{cv.slug}</code></td>
                  <td className="hidden lg:table-cell"><code style={{ fontSize: 11, fontFamily: 'IBM Plex Mono, monospace', color: 'var(--color-neutral-600)' }}>{cv.icon}</code></td>
                  <td className="hidden lg:table-cell" style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--color-neutral-700)', fontSize: 13 }}>{cv.display_order}</td>
                  <td><span className={`vs-tag ${cv.is_active ? 'vs-tag-accent' : 'vs-tag-neutral'}`}>{cv.is_active ? 'Active' : 'Inactive'}</span></td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <button className="vs-btn-icon" style={{ width: 28, height: 28 }} onClick={() => openEdit(cv)} aria-label={`Edit ${cv.name}`}><Edit2 size={12} /></button>
                      {cv.is_active
                        ? <button className="vs-btn-icon" style={{ width: 28, height: 28 }} onClick={() => setConfirmTarget(cv)} aria-label={`Deactivate ${cv.name}`}><Archive size={12} /></button>
                        : <button className="vs-btn-icon" style={{ width: 28, height: 28 }} onClick={() => setConfirmTarget(cv)} aria-label={`Reactivate ${cv.name}`}><RotateCcw size={12} /></button>
                      }
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <FormDialog open={showForm} onClose={closeForm} title={editing ? `Edit "${editing.name}"` : 'Add Core Value'} onSubmit={save} saving={saving} submitLabel={editing ? 'Save changes' : 'Add Core Value'}>
        <FL label="Name" required error={formErrors.name}><Input id="cv-name" placeholder="e.g. Collaborative" value={form.name} onChange={e => handleNameChange(e.target.value)} autoFocus /></FL>
        {!editing && <FL label="Slug" required error={formErrors.slug} hint="Lowercase letters, numbers and hyphens only. Cannot be changed after saving."><Input id="cv-slug" placeholder="e.g. collaborative" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))} /></FL>}
        <FL label="Definition" required error={formErrors.definition}><Textarea id="cv-definition" placeholder="Describe what this Core Value means…" value={form.definition} onChange={e => setForm(f => ({ ...f, definition: e.target.value }))} /></FL>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FL label="Icon name" hint="Lucide icon name"><Input id="cv-icon" placeholder="e.g. users" value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} /></FL>
          <FL label="Accent colour">
            <div className="flex items-center gap-2">
              <input type="color" value={form.accent_color} onChange={e => setForm(f => ({ ...f, accent_color: e.target.value }))} style={{ height: 36, width: 42, border: '1px solid var(--color-divider)', cursor: 'pointer', background: 'var(--color-surface)', padding: 2 }} aria-label="Accent colour picker" />
              <Input value={form.accent_color} onChange={e => setForm(f => ({ ...f, accent_color: e.target.value }))} placeholder="#5980a6" style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12 }} aria-label="Accent colour hex" />
            </div>
          </FL>
        </div>
        <FL label="Display order" error={formErrors.display_order} hint="Lower numbers appear first."><Input id="cv-order" type="number" min={0} placeholder="0" value={form.display_order} onChange={e => setForm(f => ({ ...f, display_order: e.target.value }))} style={{ width: 100 }} /></FL>
        {saveError && <div role="alert" style={{ padding: '10px 12px', border: '1px solid var(--color-accent-400)', background: 'color-mix(in srgb, var(--color-accent) 6%, var(--color-bg))', fontSize: 13, color: 'var(--color-accent-800)' }}>{saveError}</div>}
      </FormDialog>

      <ConfirmModal
        open={confirmTarget !== null}
        onOpenChange={open => { if (!open) setConfirmTarget(null) }}
        title={confirmTarget?.is_active ? `Deactivate "${confirmTarget.name}"?` : `Reactivate "${confirmTarget?.name}"?`}
        description={confirmTarget?.is_active ? 'This Core Value will no longer appear in the recognition wizard. Existing records are preserved.' : 'This Core Value will be available again for new nominations.'}
        confirmLabel={confirmTarget?.is_active ? 'Deactivate' : 'Reactivate'}
        variant={confirmTarget?.is_active ? 'destructive' : 'default'}
        onConfirm={toggleActive}
      />
    </div>
  )
}
