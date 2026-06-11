'use client'

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { ReturnsList } from '@/components/returns/ReturnsList'

export default function ReturnsPage() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <div data-tour="returns-container">
          <ReturnsList />
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
