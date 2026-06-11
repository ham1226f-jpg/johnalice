'use client'

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { StoreList } from '@/components/stores/StoreList'

export default function StoresPage() {
  return (
    <ProtectedRoute requireAdmin={true}>
      <AppLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Store Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage your business locations and store settings
            </p>
          </div>

          <StoreList />
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
