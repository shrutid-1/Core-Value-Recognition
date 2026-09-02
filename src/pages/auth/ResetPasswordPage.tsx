import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Star, ArrowLeft, CheckSquare, AlertCircle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { ROUTES } from '@/lib/constants'

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
})
type Form = z.infer<typeof schema>

function Corners() {
  return (
    <>
      <i className="corner tl" />
      <i className="corner tr" />
      <i className="corner bl" />
      <i className="corner br" />
    </>
  )
}

export default function ResetPasswordPage() {
  const { resetPassword } = useAuth()
  const [submitted, setSubmitted]     = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<Form>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: Form) => {
    setServerError(null)
    const { error } = await resetPassword(data.email)
    if (error) { setServerError(error); return }
    setSubmitted(true)
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ background: 'var(--color-bg)', padding: '48px 24px' }}
    >
      <div style={{ width: '100%', maxWidth: 380 }}>

        {/* Brand mark */}
        <div className="flex items-center gap-3" style={{ marginBottom: 32 }}>
          <div
            className="vs-card relative"
            style={{
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'color-mix(in srgb, var(--color-accent) 14%, transparent)',
            }}
          >
            <Corners />
            <Star size={13} style={{ color: 'var(--color-accent)' }} />
          </div>
          <span
            className="font-condensed"
            style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-text)' }}
          >
            ValueSpot
          </span>
        </div>

        {/* Heading */}
        <div style={{ marginBottom: 24 }}>
          <p className="vs-kicker" style={{ marginBottom: 6 }}>Account Security</p>
          <h1
            className="font-condensed"
            style={{ fontSize: 30, fontWeight: 600, color: 'var(--color-text)', letterSpacing: '-0.015em' }}
          >
            {submitted ? 'Check your inbox' : 'Reset password'}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--color-neutral-600)', marginTop: 4 }}>
            {submitted
              ? 'A reset link has been sent if an account exists for that email.'
              : "Enter your work email and we'll send you a reset link."}
          </p>
        </div>

        {/* Form / Success card */}
        <div
          className="vs-card relative"
          style={{ padding: 24, background: 'var(--color-surface)' }}
        >
          <Corners />

          {submitted ? (
            /* Success state */
            <div className="flex flex-col items-center text-center" style={{ padding: '8px 0' }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--color-divider)',
                  color: 'var(--color-accent-700)',
                  marginBottom: 14,
                }}
              >
                <CheckSquare size={24} aria-hidden="true" />
              </div>
              <p
                className="font-condensed"
                style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)', marginBottom: 6 }}
              >
                Reset email sent
              </p>
              <p style={{ fontSize: 13, color: 'var(--color-neutral-600)', lineHeight: 1.55, maxWidth: 280 }}>
                If an account exists for that email address, you'll receive a password reset link shortly.
              </p>
            </div>
          ) : (
            /* Reset form */
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <div style={{ marginBottom: 16 }}>
                <label
                  htmlFor="email"
                  style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--color-text)', marginBottom: 5 }}
                >
                  Work email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@touchcore.in"
                  className="vs-input w-full"
                  aria-invalid={errors.email ? 'true' : undefined}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  {...register('email')}
                />
                {errors.email && (
                  <p id="email-error" role="alert" style={{ marginTop: 4, fontSize: 12, color: 'var(--color-accent-800)' }}>
                    {errors.email.message}
                  </p>
                )}
              </div>

              {serverError && (
                <div
                  className="flex items-start gap-2"
                  role="alert"
                  style={{
                    marginBottom: 16,
                    padding: '10px 12px',
                    border: '1px solid color-mix(in srgb, var(--color-accent-700) 40%, transparent)',
                    background: 'color-mix(in srgb, var(--color-accent-800) 8%, var(--color-bg))',
                    fontSize: 13,
                    color: 'var(--color-accent-800)',
                  }}
                >
                  <AlertCircle size={14} style={{ marginTop: 1, flexShrink: 0 }} />
                  {serverError}
                </div>
              )}

              <button
                type="submit"
                className="vs-btn vs-btn-primary relative w-full"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
                style={{ height: 38, justifyContent: 'center' }}
              >
                <i className="corner tl" />
                <i className="corner tr" />
                <i className="corner bl" />
                <i className="corner br" />
                {isSubmitting ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
          )}
        </div>

        {/* Back link */}
        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <Link
            to={ROUTES.LOGIN}
            className="flex items-center justify-center gap-1.5"
            style={{ fontSize: 13, color: 'var(--color-neutral-600)', textDecoration: 'none' }}
          >
            <ArrowLeft size={13} />
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
