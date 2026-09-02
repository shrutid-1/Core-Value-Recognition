import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { generateUUID, classifyRecognitionSource } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared/PageHeader'
import { Step1Employee } from '@/components/recognition/steps/Step1Employee'
import { Step2CoreValue } from '@/components/recognition/steps/Step2CoreValue'
import { Step3Behaviour } from '@/components/recognition/steps/Step3Behaviour'
import { Step4Scenario } from '@/components/recognition/steps/Step4Scenario'
import { Step5Story } from '@/components/recognition/steps/Step5Story'
import { Step6Preview } from '@/components/recognition/steps/Step6Preview'
import type { Employee, CoreValue, Behaviour, Scenario } from '@/types'
import { cn } from '@/lib/utils'

export interface WizardData {
  nominee: Employee | null
  coreValue: CoreValue | null
  behaviour: Behaviour | null
  scenario: Scenario | null
  whatHappened: string
  whatImpact: string
  projectId: string | null
  projectName: string | null
}

const STEP_LABELS = [
  'Who',
  'Core Value',
  'Behaviour',
  'Scenario',
  'Story',
  'Preview',
]

const EMPTY_WIZARD: WizardData = {
  nominee: null,
  coreValue: null,
  behaviour: null,
  scenario: null,
  whatHappened: '',
  whatImpact: '',
  projectId: null,
  projectName: null,
}

export default function GiveRecognitionPage() {
  const { employee } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [data, setData] = useState<WizardData>(EMPTY_WIZARD)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [assignedApproverName, setAssignedApproverName] = useState<string | null>(null)

  const goNext = () => setStep(s => Math.min(s + 1, 6))
  const goBack = () => setStep(s => Math.max(s - 1, 1))

  const update = (partial: Partial<WizardData>) => {
    setData(prev => ({ ...prev, ...partial }))
  }

  const handleSubmit = async () => {
    if (!employee || !data.nominee || !data.coreValue) return
    setSubmitting(true)
    setSubmitError(null)

    try {
      const idempotencyKey = generateUUID()

      // Check rate limits via Edge Function (gracefully skip if unavailable in local dev)
      try {
        const rateRes = await supabase.functions.invoke('check-rate-limits', {
          body: { nominator_id: employee.id },
        })
        if (!rateRes.error && rateRes.data?.allowed === false) {
          setSubmitError(
            rateRes.data?.message ??
            "You've reached your recognition limit. Please try again later."
          )
          setSubmitting(false)
          return
        }
      } catch (_rateLimitErr) {
        console.warn('Rate limit check unavailable — proceeding without check')
      }

      // Determine approver (with escalation)
      const nominee = data.nominee
      let approverId = nominee.manager_id

      // Escalate if nominee is their own manager or no manager exists
      if (!approverId || approverId === employee.id) {
        const { data: config } = await supabase
          .from('app_config')
          .select('value')
          .eq('key', 'hr_fallback_employee_id')
          .single()
        const fallbackId = config?.value ? String(config.value).replace(/"/g, '') : null
        approverId = fallbackId || null
      }

      // If still no approver, find first active HR admin as final fallback
      if (!approverId) {
        const { data: hrAdmins } = await supabase
          .from('employees')
          .select('id')
          .eq('role', 'hr_admin')
          .eq('is_active', true)
          .limit(1)
        approverId = hrAdmins?.[0]?.id ?? null

        if (!approverId) {
          setSubmitError(
            'Unable to route this recognition — no approver is configured. Please contact HR.'
          )
          setSubmitting(false)
          return
        }
      }

      // Fetch approver name for success message
      const { data: approverData } = await supabase
        .from('employees')
        .select('full_name')
        .eq('id', approverId)
        .single()
      setAssignedApproverName(approverData?.full_name ?? null)

      // Fetch department names for historical snapshots
      let nominatorDeptName: string | null = null
      let nomineeDeptName: string | null = null

      if (employee.department_id) {
        const { data: dept } = await supabase
          .from('departments')
          .select('name')
          .eq('id', employee.department_id)
          .single()
        nominatorDeptName = dept?.name ?? null
      }

      if (nominee.department_id) {
        const { data: dept } = await supabase
          .from('departments')
          .select('name')
          .eq('id', nominee.department_id)
          .single()
        nomineeDeptName = dept?.name ?? null
      }

      // Classify recognition source
      const source = classifyRecognitionSource(
        employee.role,
        nominee.role,
        employee.id,
        nominee.manager_id
      )

      // Create nomination with full historical snapshots
      const { error } = await supabase.from('nominations').insert({
        nominator_id:                employee.id,
        nominee_id:                  nominee.id,
        core_value_id:               data.coreValue.id,
        behaviour_id:                data.behaviour?.id ?? null,
        scenario_id:                 data.scenario?.id ?? null,
        what_happened:               data.whatHappened,
        what_impact:                 data.whatImpact,
        project_id:                  data.projectId,
        // Historical snapshots — populated now, never updated
        snapshot_core_value_name:    data.coreValue.name,
        snapshot_behaviour_name:     data.behaviour?.name ?? null,
        snapshot_scenario_name:      data.scenario?.name ?? null,
        snapshot_project_name:       data.projectName,
        snapshot_nominator_dept:     nominatorDeptName,
        snapshot_nominee_dept:       nomineeDeptName,
        snapshot_nominee_manager_id: nominee.manager_id,
        recognition_source:          source,
        status:                      'pending',
        assigned_approver_id:        approverId,
        submitted_at:                new Date().toISOString(),
        idempotency_key:             idempotencyKey,
      })

      if (error) {
        if (error.code === '23505') {
          // Duplicate idempotency key — already submitted
          setSubmitted(true)
          return
        }
        throw error
      }

      setSubmitted(true)
    } catch (_err) {
      setSubmitError(
        'Something went wrong while submitting the recognition. Your recognition has not been submitted. Please try again.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto pt-10 animate-fade-in">
        <div className="bg-surface border border-border rounded-2xl p-8 shadow-sm text-center space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-green-50 flex items-center justify-center mx-auto">
            <CheckCircle size={40} className="text-success" aria-hidden="true" />
          </div>
          <h2 className="text-xl font-bold text-text-primary">Recognition submitted!</h2>
          <p className="text-sm text-text-muted max-w-xs mx-auto">
            {assignedApproverName
              ? `Your recognition has been sent to ${assignedApproverName} for validation.`
              : 'Your recognition has been submitted for validation.'}
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <Button variant="outline" onClick={() => navigate(ROUTES.RECOGNITION_FEED)}>
              View Feed
            </Button>
            <Button onClick={() => {
              setSubmitted(false)
              setStep(1)
              setData(EMPTY_WIZARD)
              setAssignedApproverName(null)
            }}>
              Recognize Someone Else
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* Back + title */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-label="Go back"
        >
          <ArrowLeft size={17} />
        </button>
        <PageHeader title="Give Recognition" className="mb-0 flex-1" />
      </div>

      {/* Step progress */}
      <div className="flex items-center gap-1 mb-6" role="list" aria-label="Recognition wizard steps">
        {STEP_LABELS.map((label, i) => {
          const num = i + 1
          const isActive = step === num
          const isDone = step > num
          return (
            <React.Fragment key={num}>
              <div
                className="flex flex-col items-center gap-1"
                role="listitem"
                aria-current={isActive ? 'step' : undefined}
              >
                <div className={cn(
                  'h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-200',
                  isDone && 'bg-blue-600 text-white shadow-sm',
                  isActive && 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-sm',
                  !isDone && !isActive && 'bg-surface-secondary text-text-muted border border-border',
                )}>
                  {isDone ? <CheckCircle size={13} aria-hidden="true" /> : num}
                </div>
                <span className={cn(
                  'text-[10px] hidden sm:block font-medium tracking-wide',
                  isActive ? 'text-blue-600' : 'text-text-disabled'
                )}>
                  {label}
                </span>
              </div>
              {i < STEP_LABELS.length - 1 && (
                <div
                  className={cn('flex-1 h-px mt-[-14px] transition-colors duration-300', step > i + 1 ? 'bg-blue-600' : 'bg-border')}
                  aria-hidden="true"
                />
              )}
            </React.Fragment>
          )
        })}
      </div>

      {/* Step content */}
      <div className="bg-surface border border-border rounded-xl shadow-sm">
        {step === 1 && (
          <Step1Employee
            selected={data.nominee}
            onSelect={(emp) => { update({ nominee: emp }); goNext() }}
            currentUserId={employee?.id}
          />
        )}
        {step === 2 && (
          <Step2CoreValue
            selected={data.coreValue}
            onSelect={(cv) => {
              update({ coreValue: cv, behaviour: null, scenario: null })
              goNext()
            }}
          />
        )}
        {step === 3 && (
          <Step3Behaviour
            coreValueId={data.coreValue?.id ?? ''}
            selected={data.behaviour}
            onSelect={(b) => { update({ behaviour: b, scenario: null }); goNext() }}
          />
        )}
        {step === 4 && (
          <Step4Scenario
            behaviourId={data.behaviour?.id ?? ''}
            coreValueId={data.coreValue?.id ?? ''}
            selected={data.scenario}
            onSelect={(s) => { update({ scenario: s }); goNext() }}
          />
        )}
        {step === 5 && (
          <Step5Story
            whatHappened={data.whatHappened}
            whatImpact={data.whatImpact}
            projectId={data.projectId}
            onUpdate={(fields) => update(fields)}
            onNext={goNext}
          />
        )}
        {step === 6 && (
          <Step6Preview
            data={data}
            submitting={submitting}
            error={submitError}
            onSubmit={handleSubmit}
          />
        )}

        {/* Navigation */}
        {step > 1 && step < 6 && (
          <div className="px-6 pb-6">
            <button
              onClick={goBack}
              className="text-sm text-text-muted hover:text-text-primary underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
            >
              ← Back
            </button>
          </div>
        )}
        {step === 6 && (
          <div className="px-6 pb-6">
            <button onClick={goBack} className="text-sm text-text-muted hover:text-text-primary underline underline-offset-2">
              ← Back to story
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
