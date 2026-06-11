'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { AppLoadingSkeleton } from '@/components/ui/app-loading-skeleton'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [hasRedirected, setHasRedirected] = useState(false)

  useEffect(() => {
    if (!loading && !hasRedirected) {
      if (!user) {
        console.log('ProtectedRoute: No user found, redirecting to login')
        setHasRedirected(true)
        router.push('/login')
      } else if (requireAdmin && user.role !== 'admin') {
        console.log('ProtectedRoute: User is not admin, redirecting to POS')
        setHasRedirected(true)
        router.push('/pos')
      }
    }
  }, [user, loading, requireAdmin, router, hasRedirected])

  if (loading) {
    return <AppLoadingSkeleton />
  }

  if (!user) {
    return null
  }

  if (requireAdmin && user.role !== 'admin') {
    return null
  }

  return <>{children}</>
}
