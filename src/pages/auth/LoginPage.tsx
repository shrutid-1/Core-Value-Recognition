import React, { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Star, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { ROUTES, CORE_VALUE_SLUGS } from '@/lib/constants'

const loginSchema = z.object({
  email:    z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})
type LoginForm = z.infer<typeof loginSchema>

/** Blueprint corner marks on a container */
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

/** Core value strip shown on the left panel */
const VALUE_TONES: Record<string, string> = {
  adaptable:     '#749dc4',
  transparent:   '#627d98',
  collaborative: '#2c455d',
  innovative:    '#94bce3',
  accountable:   '#416180',
}

const VALUE_LABELS: Record<string, string> = {
  adaptable:     'Adaptable',
  transparent:   'Transparent',
  collaborative: 'Collaborative',
  innovative:    'Innovative',
  accountable:   'Accountable',
}

export default function LoginPage() {
  const { signIn }   = useAuth()
  const navigate     = useNavigate()
  const location     = useLocation()
  const [showPw, setShowPw]         = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data: LoginForm) => {
    setServerError(null)
    const { error } = await signIn(data.email, data.password)
    if (error) { setServerError(error); return }
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname
    navigate(from ?? '/', { replace: true })
  }

  return (
    <div
      className="min-h-screen"
      style={{
        display: 'grid',
        gridTemplateColumns: '1.05fr 1fr',
        background: 'var(--color-bg)',
      }}
    >
      {/* ── LEFT PANEL ── brand + value strip */}
      <div
        className="hidden lg:flex flex-col justify-between"
        style={{
          padding: '48px 56px',
          background: 'var(--color-accent-900)',
          borderRight: '1px solid var(--color-divider)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle grid overlay */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(var(--color-accent-800) 1px, transparent 1px), linear-gradient(90deg, var(--color-accent-800) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            opacity: 0.25,
            pointerEvents: 'none',
          }}
        />

        {/* Brand */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div
              className="vs-card relative"
              style={{
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'color-mix(in srgb, var(--color-accent-400) 20%, transparent)',
                borderColor: 'color-mix(in srgb, var(--color-accent-400) 40%, transparent)',
              }}
            >
              <Corners />
              <Star size={16} style={{ color: 'var(--color-accent-300)' }} />
            </div>
            <div>
              <p
                className="font-condensed"
                style={{ fontSize: 20, fontWeight: 600, color: '#f5f5f8', letterSpacing: '-0.01em', lineHeight: 1 }}
              >
                ValueSpot
              </p>
              <p
                className="vs-kicker"
                style={{ fontSize: 9, color: 'var(--color-accent-400)', marginTop: 2 }}
              >
                Touchcore Systems
              </p>
            </div>
          </div>

          <h1
            className="font-condensed"
            style={{
              fontSize: 40,
              fontWeight: 600,
              color: '#f5f5f8',
              letterSpacing: '-0.02em',
              lineHeight: 1.08,
              maxWidth: 380,
            }}
          >
            Recognize the behaviour.
            <br />Reinforce the value.
            <br />Strengthen the culture.
          </h1>

          <p
            style={{
              fontSize: 15,
              color: 'var(--color-accent-300)',
              marginTop: 16,
              lineHeight: 1.55,
              maxWidth: 340,
            }}
          >
            Celebrate your colleagues for living Touchcore's Core Values every day.
          </p>
        </div>

        {/* Core Value strip */}
        <div className="relative z-10">
          <p
            className="vs-kicker"
            style={{ color: 'var(--color-accent-400)', marginBottom: 12 }}
          >
            Core Values
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {CORE_VALUE_SLUGS.map(slug => (
              <div
                key={slug}
                className="vs-card relative"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 12px',
                  background: 'color-mix(in srgb, var(--color-accent-800) 60%, transparent)',
                  borderColor: 'color-mix(in srgb, var(--color-accent-700) 60%, transparent)',
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    background: VALUE_TONES[slug],
                    flexShrink: 0,
                  }}
                />
                <span
                  className="font-condensed"
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: 'color-mix(in srgb, var(--color-accent-300) 90%, white)',
                    letterSpacing: '0.01em',
                  }}
                >
                  {VALUE_LABELS[slug]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── sign-in form */}
      <div
        className="flex flex-col items-center justify-center"
        style={{ padding: '48px 40px', minHeight: '100vh' }}
      >
        {/* Mobile brand (only shows when left panel hidden) */}
        <div className="lg:hidden flex items-center gap-2 mb-8">
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
            style={{ fontSize: 20, fontWeight: 600, color: 'var(--color-text)' }}
          >
            ValueSpot
          </span>
        </div>

        <div style={{ width: '100%', maxWidth: 360 }}>
          {/* Heading */}
          <div style={{ marginBottom: 28 }}>
            <p className="vs-kicker" style={{ marginBottom: 6 }}>Employee Portal</p>
            <h2
              className="font-condensed"
              style={{ fontSize: 32, fontWeight: 600, color: 'var(--color-text)', letterSpacing: '-0.015em' }}
            >
              Sign in
            </h2>
            <p style={{ fontSize: 14, color: 'var(--color-neutral-600)', marginTop: 4 }}>
              Use your Touchcore credentials to continue.
            </p>
          </div>

          {/* Form card */}
          <div
            className="vs-card relative"
            style={{ padding: '24px', background: 'var(--color-surface)' }}
          >
            <Corners />
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              {/* Email */}
              <div style={{ marginBottom: 16 }}>
                <label
                  htmlFor="email"
                  style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--color-text)', marginBottom: 5 }}
                >
                  Email address
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

              {/* Password */}
              <div style={{ marginBottom: 16 }}>
                <div className="flex items-center justify-between" style={{ marginBottom: 5 }}>
                  <label
                    htmlFor="password"
                    style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)' }}
                  >
                    Password
                  </label>
                  <Link
                    to={ROUTES.RESET_PASSWORD}
                    style={{ fontSize: 12, color: 'var(--color-accent-700)', textDecoration: 'none' }}
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPw ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="vs-input w-full"
                    style={{ paddingRight: 36 }}
                    aria-invalid={errors.password ? 'true' : undefined}
                    aria-describedby={errors.password ? 'pw-error' : undefined}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    className="absolute"
                    style={{
                      right: 9,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-neutral-500)',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                    onClick={() => setShowPw(v => !v)}
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {errors.password && (
                  <p id="pw-error" role="alert" style={{ marginTop: 4, fontSize: 12, color: 'var(--color-accent-800)' }}>
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Server error */}
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

              {/* Submit */}
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
                {isSubmitting ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          </div>

          {/* Footer */}
          <p
            style={{
              marginTop: 24,
              textAlign: 'center',
              fontSize: 12,
              color: 'var(--color-neutral-500)',
              letterSpacing: '0.02em',
            }}
          >
            Touchcore ValueSpot &middot; Employee Recognition Platform
          </p>
        </div>
      </div>
    </div>
  )
}
