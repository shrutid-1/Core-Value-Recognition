import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Star, ArrowLeft, CheckSquare, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { ROUTES } from '@/lib/constants'

const requestSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})
type RequestForm = z.infer<typeof requestSchema>

const passwordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})
type PasswordForm = z.infer<typeof passwordSchema>

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
  
  const [submitted, setSubmitted]         = useState(false)
  const [serverError, setServerError]     = useState<string | null>(null)
  const [recoveryMode, setRecoveryMode]   = useState(false)
  const [recoveryError, setRecoveryError] = useState<string | null>(null)
  const [passwordSet, setPasswordSet]     = useState(false)

  // Detect recovery session from URL hash
  useEffect(() => {
    const checkRecoverySession = async () => {
      try {
        // Check if there's an active recovery session
        const { data: { session } } = await supabase.auth.getSession()
        
        // If we have an active session, it means recovery link was processed
        if (session?.user) {
          // Verify this is a recovery flow (no password yet)
          // If auth is successful but user has no password set, we're in recovery mode
          setRecoveryMode(true)
          return
        }

        // Fallback: check URL hash for recovery token
        const hash = window.location.hash
        if (hash.includes('type=recovery')) {
          // Supabase has processed the token in the background
          setRecoveryMode(true)
          return
        }
      } catch (err) {
        console.error('Failed to check recovery session:', err)
      }
    }

    checkRecoverySession()
  }, [])

  const {
    register: registerRequest,
    handleSubmit: handleRequestSubmit,
    formState: { errors: requestErrors, isSubmitting: isRequestSubmitting },
  } = useForm<RequestForm>({ resolver: zodResolver(requestSchema) })

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting },
  } = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) })

  const onRequestSubmit = async (data: RequestForm) => {
    setServerError(null)
    const { error } = await resetPassword(data.email)
    if (error) { setServerError(error); return }
    setSubmitted(true)
  }

  const onPasswordSubmit = async (data: PasswordForm) => {
    setRecoveryError(null)
    try {
      const { error } = await supabase.auth.updateUser({ password: data.password })
      if (error) {
        if (error.message.includes('session_not_found') || error.message.includes('invalid_grant')) {
          setRecoveryError('Your recovery link has expired. Please request a new one.')
        } else {
          setRecoveryError('Failed to update password. Please try again.')
        }
        return
      }
      setPasswordSet(true)
    } catch (err) {
      setRecoveryError('An unexpected error occurred. Please try again.')
      console.error('Password update error:', err)
    }
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
            {passwordSet
              ? 'Password updated'
              : recoveryMode
                ? 'Set your password'
                : submitted
                  ? 'Check your inbox'
                  : 'Reset password'}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--color-neutral-600)', marginTop: 4 }}>
            {passwordSet
              ? 'Your password has been set. You can now log in.'
              : recoveryMode
                ? 'Enter and confirm your new password to activate your account.'
                : submitted
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

          {passwordSet ? (
            /* Password set success state */
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
                Password set successfully
              </p>
              <p style={{ fontSize: 13, color: 'var(--color-neutral-600)', lineHeight: 1.55, maxWidth: 280, marginBottom: 20 }}>
                You can now sign in with your email and the password you just created.
              </p>
              <Link
                to={ROUTES.LOGIN}
                className="vs-btn vs-btn-primary relative"
                style={{ height: 38, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', paddingLeft: 16, paddingRight: 16 }}
              >
                <i className="corner tl" />
                <i className="corner tr" />
                <i className="corner bl" />
                <i className="corner br" />
                Go to Login
              </Link>
            </div>
          ) : submitted ? (
            /* Email sent success state */
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
          ) : recoveryMode ? (
            /* Set password form */
            <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} noValidate>
              <div style={{ marginBottom: 16 }}>
                <label
                  htmlFor="password"
                  style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--color-text)', marginBottom: 5 }}
                >
                  New password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  className="vs-input w-full"
                  aria-invalid={passwordErrors.password ? 'true' : undefined}
                  aria-describedby={passwordErrors.password ? 'password-error' : undefined}
                  {...registerPassword('password')}
                />
                {passwordErrors.password && (
                  <p id="password-error" role="alert" style={{ marginTop: 4, fontSize: 12, color: 'var(--color-accent-800)' }}>
                    {passwordErrors.password.message}
                  </p>
                )}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label
                  htmlFor="confirmPassword"
                  style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--color-text)', marginBottom: 5 }}
                >
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  className="vs-input w-full"
                  aria-invalid={passwordErrors.confirmPassword ? 'true' : undefined}
                  aria-describedby={passwordErrors.confirmPassword ? 'confirm-error' : undefined}
                  {...registerPassword('confirmPassword')}
                />
                {passwordErrors.confirmPassword && (
                  <p id="confirm-error" role="alert" style={{ marginTop: 4, fontSize: 12, color: 'var(--color-accent-800)' }}>
                    {passwordErrors.confirmPassword.message}
                  </p>
                )}
              </div>

              {recoveryError && (
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
                  {recoveryError}
                </div>
              )}

              <button
                type="submit"
                className="vs-btn vs-btn-primary relative w-full"
                disabled={isPasswordSubmitting}
                aria-busy={isPasswordSubmitting}
                style={{ height: 38, justifyContent: 'center' }}
              >
                <i className="corner tl" />
                <i className="corner tr" />
                <i className="corner bl" />
                <i className="corner br" />
                {isPasswordSubmitting ? 'Setting password…' : 'Set password'}
              </button>
            </form>
          ) : (
            /* Request reset form */
            <form onSubmit={handleRequestSubmit(onRequestSubmit)} noValidate>
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
                  aria-invalid={requestErrors.email ? 'true' : undefined}
                  aria-describedby={requestErrors.email ? 'email-error' : undefined}
                  {...registerRequest('email')}
                />
                {requestErrors.email && (
                  <p id="email-error" role="alert" style={{ marginTop: 4, fontSize: 12, color: 'var(--color-accent-800)' }}>
                    {requestErrors.email.message}
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
                disabled={isRequestSubmitting}
                aria-busy={isRequestSubmitting}
                style={{ height: 38, justifyContent: 'center' }}
              >
                <i className="corner tl" />
                <i className="corner tr" />
                <i className="corner bl" />
                <i className="corner br" />
                {isRequestSubmitting ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
          )}
        </div>

        {/* Back link */}
        {!passwordSet && (
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
        )}
      </div>
    </div>
  )
}
