import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/shared/SkeletonLoader'
import { supabase } from '@/lib/supabase'
import type { Project } from '@/types'

const schema = z.object({
  whatHappened: z.string()
    .min(20, 'Please describe what happened (at least 20 characters)')
    .max(1000, 'Please keep this under 1000 characters'),
  whatImpact: z.string()
    .min(20, 'Please describe the impact (at least 20 characters)')
    .max(1000, 'Please keep this under 1000 characters'),
  projectId: z.string().optional(),
})

type Form = z.infer<typeof schema>

interface Step5StoryProps {
  whatHappened: string
  whatImpact: string
  projectId: string | null
  onUpdate: (fields: {
    whatHappened?: string
    whatImpact?: string
    projectId?: string | null
    projectName?: string | null
  }) => void
  onNext: () => void
}

export function Step5Story({ whatHappened, whatImpact, projectId, onUpdate, onNext }: Step5StoryProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loadingProjects, setLoadingProjects] = useState(true)

  useEffect(() => {
    supabase
      .from('projects')
      .select('id, name')
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => {
        setProjects(data ?? [])
        setLoadingProjects(false)
      })
  }, [])

  const { register, handleSubmit, watch, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      whatHappened,
      whatImpact,
      projectId: projectId ?? '',
    },
  })

  const happenedLen = watch('whatHappened')?.length ?? 0
  const impactLen   = watch('whatImpact')?.length ?? 0

  const onSubmit = (data: Form) => {
    const project = projects.find(p => p.id === data.projectId)
    onUpdate({
      whatHappened: data.whatHappened,
      whatImpact:   data.whatImpact,
      projectId:    data.projectId || null,
      projectName:  project?.name ?? null,
    })
    onNext()
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-text-primary">Tell the recognition story</h2>
        <p className="text-sm text-text-muted mt-1">
          Specific examples make recognition meaningful. Describe what happened and why it mattered.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>

        {/* What happened */}
        <div className="space-y-1.5">
          <label htmlFor="whatHappened" className="text-sm font-medium text-text-primary">
            What happened?{' '}
            <span className="text-danger" aria-hidden="true">*</span>
          </label>
          <Textarea
            id="whatHappened"
            placeholder="Describe the specific action or behaviour you observed. For example: 'Amit stayed back on Thursday to help debug the API integration issue that was blocking the client launch…'"
            className="min-h-[120px]"
            error={errors.whatHappened?.message}
            {...register('whatHappened')}
          />
          <p className="text-xs text-text-disabled text-right tabular-nums" aria-live="polite">
            {happenedLen}/1000
          </p>
        </div>

        {/* Impact */}
        <div className="space-y-1.5">
          <label htmlFor="whatImpact" className="text-sm font-medium text-text-primary">
            What was the impact?{' '}
            <span className="text-danger" aria-hidden="true">*</span>
          </label>
          <Textarea
            id="whatImpact"
            placeholder="Describe the outcome or difference this made. For example: 'Because of this, we delivered on time and the client rated the integration experience as excellent…'"
            className="min-h-[100px]"
            error={errors.whatImpact?.message}
            {...register('whatImpact')}
          />
          <p className="text-xs text-text-disabled text-right tabular-nums" aria-live="polite">
            {impactLen}/1000
          </p>
        </div>

        {/* Project tag — only shown when projects exist */}
        {loadingProjects ? (
          /* Subtle skeleton so the form doesn't jump when projects load */
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ) : projects.length > 0 ? (
          <div className="space-y-1.5">
            <label htmlFor="projectId" className="text-sm font-medium text-text-primary">
              Related project{' '}
              <span className="text-text-muted text-xs font-normal">(optional)</span>
            </label>
            <select
              id="projectId"
              className="w-full h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              {...register('projectId')}
            >
              <option value="">No project</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        ) : null}

        <Button type="submit" className="w-full" size="lg">
          Preview Recognition
        </Button>
      </form>
    </div>
  )
}
