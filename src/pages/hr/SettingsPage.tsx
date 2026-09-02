import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/shared/SkeletonLoader'
import type { BadgeDefinition } from '@/types'

interface ConfigRow { key: string; value: unknown; description: string | null }

const CONFIG_KEYS = [
  { key: 'rate_limit_daily',        label: 'Daily recognition limit',            hint: 'Max recognitions an employee can submit per day' },
  { key: 'rate_limit_monthly',      label: 'Monthly recognition limit',          hint: 'Max recognitions an employee can submit per month' },
  { key: 'anti_gaming_window_days', label: 'Anti-gaming window (days)',           hint: 'Days before the same nominator can re-recognize the same person for the same value' },
  { key: 'financial_year_q1_start', label: 'Financial year Q1 start month (1–12)', hint: 'e.g. 4 = April' },
]

function SettingRowSkeleton() {
  return (
    <div className="flex items-center gap-4 py-3 px-4 border-b border-divider last:border-b-0">
      <div className="flex-1">
        <Skeleton className="h-4 w-40 mb-1" />
        <Skeleton className="h-3 w-56" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-16" />
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const [_config, setConfig] = useState<ConfigRow[]>([])
  const [badgeDefs, setBadgeDefs] = useState<BadgeDefinition[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [values, setValues] = useState<Record<string, string>>({})

  useEffect(() => {
    Promise.all([
      supabase.from('app_config').select('*'),
      supabase.from('badge_definitions').select('*').order('level'),
    ]).then(([configRes, badgeRes]) => {
      const cfg = configRes.data ?? []
      setConfig(cfg)
      const v: Record<string, string> = {}
      cfg.forEach(c => { v[c.key] = String(c.value).replace(/"/g, '') })
      setValues(v)
      setBadgeDefs(badgeRes.data ?? [])
      setLoading(false)
    })
  }, [])

  const saveConfig = async (key: string) => {
    setSaving(key)
    await supabase.from('app_config').update({ value: values[key] }).eq('key', key)
    setSaving(null)
  }

  const saveBadge = async (badge: BadgeDefinition, min: number, max: number | null) => {
    setSaving(`badge-${badge.id}`)
    await supabase.from('badge_definitions').update({ minimum_count: min, maximum_count: max }).eq('id', badge.id)
    const { data } = await supabase.from('badge_definitions').select('*').order('level')
    setBadgeDefs(data ?? [])
    setSaving(null)
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: 900, margin: '0 auto', paddingLeft: 24, paddingRight: 24 }}>
      <PageHeader
        title="Settings"
        subtitle="Configure recognition rules, rate limits and badge thresholds."
      />

      {/* Recognition Rules */}
      <Card style={{ marginTop: 32 }}>
        <CardHeader className="pb-3">
          <CardTitle>Recognition Rules</CardTitle>
          <p className="text-sm text-text-muted mt-0.5">
            These values are fetched by Edge Functions — changes take effect immediately.
          </p>
        </CardHeader>
        <CardContent style={{ padding: 0 }}>
          {loading ? (
            <div>
              {[...Array(4)].map((_, i) => <SettingRowSkeleton key={i} />)}
            </div>
          ) : (
            <div>
              {CONFIG_KEYS.map((cfg, idx) => (
                <div
                  key={cfg.key}
                  className="flex items-center gap-4 py-3 px-4"
                  style={{
                    borderBottom: idx < CONFIG_KEYS.length - 1 ? '1px solid var(--color-divider)' : 'none',
                  }}
                >
                  <div className="flex-1">
                    <label
                      htmlFor={`cfg-${cfg.key}`}
                      className="block text-sm font-medium"
                      style={{ color: 'var(--color-text)', marginBottom: 4 }}
                    >
                      {cfg.label}
                    </label>
                    <p style={{ fontSize: 12, color: 'var(--color-neutral-600)' }}>
                      {cfg.hint}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Input
                      id={`cfg-${cfg.key}`}
                      type="number"
                      style={{ width: 80 }}
                      value={values[cfg.key] ?? ''}
                      onChange={e => setValues(v => ({ ...v, [cfg.key]: e.target.value }))}
                      min={1}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      loading={saving === cfg.key}
                      onClick={() => saveConfig(cfg.key)}
                      style={{ minWidth: 60 }}
                    >
                      {saving === cfg.key ? '...' : 'Save'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Badge Thresholds */}
      <Card style={{ marginTop: 24 }}>
        <CardHeader className="pb-3">
          <CardTitle>Badge Thresholds</CardTitle>
          <p className="text-sm text-text-muted mt-0.5">
            Set the recognition count required to earn each badge level. Leave max empty for unlimited (B5).
          </p>
        </CardHeader>
        <CardContent style={{ padding: 0 }}>
          {loading ? (
            <div>
              {[...Array(5)].map((_, i) => <SettingRowSkeleton key={i} />)}
            </div>
          ) : (
            <div>
              {badgeDefs.map((badge, idx) => (
                <BadgeThresholdRow
                  key={badge.id}
                  badge={badge}
                  saving={saving === `badge-${badge.id}`}
                  onSave={saveBadge}
                  isLast={idx === badgeDefs.length - 1}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function BadgeThresholdRow({
  badge,
  saving,
  onSave,
  isLast,
}: {
  badge: BadgeDefinition
  saving: boolean
  onSave: (badge: BadgeDefinition, min: number, max: number | null) => void
  isLast: boolean
}) {
  const [min, setMin] = useState(badge.minimum_count)
  const [max, setMax] = useState<string>(badge.maximum_count != null ? String(badge.maximum_count) : '')

  return (
    <div
      className="flex items-center gap-4 py-3 px-4"
      style={{
        borderBottom: !isLast ? '1px solid var(--color-divider)' : 'none',
      }}
    >
      <div className="flex-1">
        <p
          className="block text-sm font-medium"
          style={{ color: 'var(--color-text)', marginBottom: 4 }}
        >
          B{badge.level} — {badge.name}
        </p>
        <p style={{ fontSize: 12, color: 'var(--color-neutral-600)' }}>
          {badge.description}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Input
          type="number"
          style={{ width: 60 }}
          value={min}
          onChange={e => setMin(Number(e.target.value))}
          min={1}
          aria-label={`B${badge.level} minimum count`}
        />
        <span style={{ color: 'var(--color-neutral-600)', fontSize: 13 }} aria-hidden="true">–</span>
        <Input
          type="number"
          style={{ width: 60 }}
          value={max}
          onChange={e => setMax(e.target.value)}
          placeholder="∞"
          aria-label={`B${badge.level} maximum count (empty = unlimited)`}
        />
        <Button
          size="sm"
          variant="outline"
          loading={saving}
          onClick={() => onSave(badge, min, max ? Number(max) : null)}
          style={{ minWidth: 60 }}
        >
          {saving ? '...' : 'Save'}
        </Button>
      </div>
    </div>
  )
}
