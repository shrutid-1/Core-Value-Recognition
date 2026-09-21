import React, { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'

interface JWTClaims {
  user_role: string | null
  employee_id: string | null
  user_id: string | null
  email: string | null
  iat: number | null
  exp: number | null
}

interface DiagnosticInfo {
  session_active: boolean
  user_email: string | null
  user_id: string | null
  employee_record: {
    id: string | null
    full_name: string | null
    role: string | null
  } | null
  jwt_claims: JWTClaims
  errors: string[]
}

export default function DiagnosticPage() {
  const { session, employee } = useAuth()
  const [diagnostic, setDiagnostic] = useState<DiagnosticInfo | null>(null)

  useEffect(() => {
    const collectDiagnostics = async () => {
      const errors: string[] = []
      const info: DiagnosticInfo = {
        session_active: !!session,
        user_email: session?.user?.email || null,
        user_id: session?.user?.id || null,
        employee_record: employee ? {
          id: employee.id,
          full_name: employee.full_name,
          role: employee.role,
        } : null,
        jwt_claims: {
          user_role: null,
          employee_id: null,
          user_id: null,
          email: null,
          iat: null,
          exp: null,
        },
        errors,
      }

      // Decode JWT to extract claims (safely, without exposing the token)
      if (session?.access_token) {
        try {
          const parts = session.access_token.split('.')
          if (parts.length === 3) {
            const decoded = JSON.parse(atob(parts[1]))
            info.jwt_claims = {
              user_role: decoded.user_role || null,
              employee_id: decoded.employee_id || null,
              user_id: decoded.sub || null,
              email: decoded.email || null,
              iat: decoded.iat || null,
              exp: decoded.exp || null,
            }
          } else {
            errors.push('JWT format invalid (not 3 parts)')
          }
        } catch (e) {
          errors.push(`JWT decode error: ${e instanceof Error ? e.message : String(e)}`)
        }
      } else {
        errors.push('No access token found')
      }

      setDiagnostic(info)
    }

    collectDiagnostics()
  }, [session, employee])

  if (!diagnostic) {
    return <div style={{ padding: '20px' }}>Loading diagnostic info...</div>
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', maxWidth: '800px', margin: '0 auto' }}>
      <h1>JWT & Session Diagnostic</h1>
      
      <div style={{ marginTop: '20px', border: '1px solid #ccc', padding: '15px', backgroundColor: '#f9f9f9' }}>
        <h2>Session Status</h2>
        <p><strong>Session Active:</strong> {diagnostic.session_active ? '✅ YES' : '❌ NO'}</p>
        <p><strong>User Email:</strong> {diagnostic.user_email || '(not found)'}</p>
        <p><strong>User ID (auth.users):</strong> {diagnostic.user_id || '(not found)'}</p>
      </div>

      <div style={{ marginTop: '20px', border: '1px solid #ccc', padding: '15px', backgroundColor: '#f9f9f9' }}>
        <h2>Employee Record (from AuthContext)</h2>
        {diagnostic.employee_record ? (
          <>
            <p><strong>Employee ID (DB):</strong> {diagnostic.employee_record.id}</p>
            <p><strong>Full Name:</strong> {diagnostic.employee_record.full_name}</p>
            <p><strong>Role:</strong> {diagnostic.employee_record.role}</p>
          </>
        ) : (
          <p>❌ No employee record found in AuthContext</p>
        )}
      </div>

      <div style={{ marginTop: '20px', border: '1px solid #0066cc', padding: '15px', backgroundColor: '#e6f2ff' }}>
        <h2>JWT Claims (What RLS policies will see)</h2>
        <p><strong>user_role:</strong> {diagnostic.jwt_claims.user_role || '(missing!)'}</p>
        <p><strong>employee_id:</strong> {diagnostic.jwt_claims.employee_id || '(missing!)'}</p>
        <p><strong>user_id (sub):</strong> {diagnostic.jwt_claims.user_id || '(missing!)'}</p>
        <p><strong>email:</strong> {diagnostic.jwt_claims.email || '(missing!)'}</p>
        <p><strong>Token issued at (iat):</strong> {diagnostic.jwt_claims.iat ? new Date(diagnostic.jwt_claims.iat * 1000).toLocaleString() : '(unknown)'}</p>
        <p><strong>Token expires at (exp):</strong> {diagnostic.jwt_claims.exp ? new Date(diagnostic.jwt_claims.exp * 1000).toLocaleString() : '(unknown)'}</p>
      </div>

      {diagnostic.errors.length > 0 && (
        <div style={{ marginTop: '20px', border: '2px solid #cc0000', padding: '15px', backgroundColor: '#ffe6e6' }}>
          <h2>Errors Detected</h2>
          {diagnostic.errors.map((error, idx) => (
            <p key={idx} style={{ color: '#cc0000' }}>❌ {error}</p>
          ))}
        </div>
      )}

      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fffbcc', border: '1px solid #ffcc00' }}>
        <h2>Expected Values for RLS Access</h2>
        <p><strong>To see ALL employees:</strong> user_role must be 'hr_admin' or 'super_admin'</p>
        <p><strong>Current user_role:</strong> {diagnostic.jwt_claims.user_role}</p>
        <p><strong>Result:</strong> {
          diagnostic.jwt_claims.user_role === 'hr_admin' || diagnostic.jwt_claims.user_role === 'super_admin'
            ? '✅ RLS policy should ALLOW access to all employees'
            : '❌ RLS policy will RESTRICT to active employees only'
        }</p>
      </div>

      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        <p><strong>Note:</strong> Access token itself is never displayed. Only decoded claims are shown.</p>
        <p><strong>How to use:</strong> Copy the values above and report them to diagnose the issue.</p>
      </div>
    </div>
  )
}
