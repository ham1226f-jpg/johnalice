'use client'

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { TransactionList } from '@/components/transactions/TransactionList'

export default function TransactionsPage() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="space-y-6" data-tour="transactions-container">
          <div>
            <h1 className="text-2xl font-bold">Transactions</h1>
            <p className="text-muted-foreground mt-1">
              View and manage all sales transactions
            </p>
          </div>

          <TransactionList />
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
