'use client'

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { ReportsContainer } from '@/components/reports/ReportsContainer'

export default function ReportsPage() {
  return (
    <ProtectedRoute requireAdmin={true}>
      <AppLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Reports & Analytics</h1>
            <p className="text-muted-foreground mt-1">
              Generate and export comprehensive business reports
            </p>
          </div>

          <ReportsContainer />
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
