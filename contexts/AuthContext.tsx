'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { User, Tenant } from '@/types'

interface AuthContextType {
  user: User | null
  tenant: Tenant | null
  supabaseUser: SupabaseUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  changePassword: (newPassword: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    let mounted = true
    let isSigningIn = false

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      
      if (session?.user) {
        setSupabaseUser(session.user)
        loadUserData(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return
      
      console.log('Auth state changed:', event, session?.user?.id)
      
      // Handle sign out
      if (event === 'SIGNED_OUT') {
        setSupabaseUser(null)
        setUser(null)
        setTenant(null)
        setLoading(false)
        return
      }
      
      // Skip SIGNED_IN event if we're already handling it in signIn function
      // This prevents double loading of user data
      if (event === 'SIGNED_IN') {
        console.log('SIGNED_IN event - skipping (handled by signIn function)')
        return
      }
      
      // For other events, just update the session if present
      if (session?.user) {
        setSupabaseUser(session.user)
      } else {
        setSupabaseUser(null)
        setUser(null)
        setTenant(null)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function loadUserData(userId: string, retryCount = 0) {
    const MAX_RETRIES = 3
    const RETRY_DELAY = 500 // ms

    try {
      console.log(`Loading user data for: ${userId} (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`)
      
      // Add a small delay to ensure session is fully established
      if (retryCount > 0) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * retryCount))
      }
      
      // Fetch user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      console.log('User query result:', { userData, userError })

      if (userError) {
        console.error('User error details:', userError)
        
        // Retry on certain errors
        if (retryCount < MAX_RETRIES && (
          userError.code === 'PGRST116' || 
          userError.code === '42501' ||
          userError.message?.includes('JWT')
        )) {
          console.log(`Retrying user data load (${retryCount + 1}/${MAX_RETRIES})...`)
          return loadUserData(userId, retryCount + 1)
        }
        
        // After retries exhausted, sign out
        if (userError.code === 'PGRST116' || userError.message?.includes('no rows')) {
          console.error('User record not found after retries - signing out')
          setLoading(false)
          await signOut()
          return
        }
        
        throw userError
      }

      if (!userData) {
        console.error('No user data returned')
        if (retryCount < MAX_RETRIES) {
          console.log(`Retrying user data load (${retryCount + 1}/${MAX_RETRIES})...`)
          return loadUserData(userId, retryCount + 1)
        }
        setLoading(false)
        await signOut()
        return
      }

      setUser(userData as User)

      // Fetch tenant data
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', userData.tenant_id)
        .single()

      console.log('Tenant query result:', { tenantData, tenantError })

      if (tenantError) {
        console.error('Tenant error details:', tenantError)
        
        // Retry on certain errors
        if (retryCount < MAX_RETRIES && (
          tenantError.code === 'PGRST116' || 
          tenantError.code === '42501'
        )) {
          console.log(`Retrying tenant data load (${retryCount + 1}/${MAX_RETRIES})...`)
          return loadUserData(userId, retryCount + 1)
        }
        
        throw tenantError
      }

      if (!tenantData) {
        console.error('No tenant data returned')
        if (retryCount < MAX_RETRIES) {
          console.log(`Retrying tenant data load (${retryCount + 1}/${MAX_RETRIES})...`)
          return loadUserData(userId, retryCount + 1)
        }
        setLoading(false)
        await signOut()
        return
      }

      setTenant(tenantData as Tenant)
      console.log('✅ User and tenant data loaded successfully')
    } catch (error: any) {
      console.error('❌ Error loading user data:', error)
      console.error('Error message:', error?.message)
      console.error('Error code:', error?.code)
      console.error('Error details:', error?.details)
      
      // Retry on unexpected errors
      if (retryCount < MAX_RETRIES) {
        console.log(`Retrying after error (${retryCount + 1}/${MAX_RETRIES})...`)
        return loadUserData(userId, retryCount + 1)
      }
      
      // After all retries, clear state but don't sign out (let user try again)
      setUser(null)
      setTenant(null)
    } finally {
      setLoading(false)
    }
  }

  async function signIn(email: string, password: string) {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
      
      // Wait for user data to be loaded before resolving
      if (data.user) {
        await loadUserData(data.user.id)
      }
    } catch (error) {
      setLoading(false)
      throw error
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    setTenant(null)
    setSupabaseUser(null)
  }

  async function changePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) throw error
  }

  const value = {
    user,
    tenant,
    supabaseUser,
    loading,
    signIn,
    signOut,
    changePassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
