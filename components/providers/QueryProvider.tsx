'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 0, // Always consider data stale - refetch on mount
            gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
            refetchOnMount: true, // Refetch on mount to ensure fresh data
            refetchOnWindowFocus: false, // Don't refetch on window focus (real-time handles this)
            refetchOnReconnect: true, // Refetch when reconnecting
            retry: 2, // Retry failed requests twice
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
