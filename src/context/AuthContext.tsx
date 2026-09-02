import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Employee, UserRole } from '@/types'

interface AuthContextValue {
  session: Session | null
  employee: Employee | null
  role: UserRole | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: string | null }>
  refreshEmployee: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchEmployee = useCallback(async (authUserId: string) => {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('auth_user_id', authUserId)
      .eq('is_active', true)
      .single()

    if (error || !data) {
      console.error('Failed to load employee profile:', error?.message)
      return null
    }
    return data
  }, [])

  const refreshEmployee = useCallback(async () => {
    if (!session?.user.id) return
    const emp = await fetchEmployee(session.user.id)
    setEmployee(emp)
  }, [session, fetchEmployee])

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      setSession(s)
      if (s?.user.id) {
        const emp = await fetchEmployee(s.user.id)
        setEmployee(emp)
      }
      setLoading(false)
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, s) => {
        setSession(s)
        if (s?.user.id && event !== 'SIGNED_OUT') {
          const emp = await fetchEmployee(s.user.id)
          setEmployee(emp)
        } else {
          setEmployee(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [fetchEmployee])

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        return { error: 'Incorrect email or password. Please try again.' }
      }
      if (error.message.includes('Email not confirmed')) {
        return { error: 'Please verify your email address before logging in.' }
      }
      return { error: 'Something went wrong. Please try again.' }
    }
    return { error: null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setEmployee(null)
  }

  const resetPassword = async (email: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) return { error: 'Unable to send reset email. Please try again.' }
    return { error: null }
  }

  return (
    <AuthContext.Provider value={{
      session,
      employee,
      role: employee?.role ?? null,
      loading,
      signIn,
      signOut,
      resetPassword,
      refreshEmployee,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
