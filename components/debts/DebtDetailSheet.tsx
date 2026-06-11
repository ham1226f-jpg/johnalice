'use client'

import { useState } from 'react'
import { X, CreditCard, Calendar, User, Receipt } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useDebtTransaction, usePaymentHistory } from '@/hooks/useDebts'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { DebtTransaction } from '@/types'
import { DebtPaymentDialog } from './DebtPaymentDialog'

interface DebtDetailSheetProps {
  debtId: string | null
  onClose: () => void
}

function formatCurrency(amount: number | null | undefined) {
  const value = amount ?? 0
  return `KSH ${value.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function DebtDetailSheet({ debtId, onClose }: DebtDetailSheetProps) {
  const { tenant } = useAuth()
  const currency = tenant?.settings?.currency || 'KES'
  const queryClient = useQueryClient()
  
  const { data: debt, isLoading: debtLoading, refetch: refetchDebt } = useDebtTransaction(debtId || '')
  const { data: payments, isLoading: paymentsLoading, refetch: refetchPayments } = usePaymentHistory(debtId || '')
  
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)

  const handlePaymentSuccess = () => {
    // Refetch the debt and payment data
    refetchDebt()
    refetchPayments()
    // Also invalidate related queries
    queryClient.invalidateQueries({ queryKey: ['debts'] })
    queryClient.invalidateQueries({ queryKey: ['debt-summary'] })
    queryClient.invalidateQueries({ queryKey: ['debts-by-customer'] })
  }

  if (!debtId) return null

  const isLoading = debtLoading || paymentsLoading
  const totalPaid = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
  // Use outstanding_balance from the debt record for accuracy
  const remainingBalance = debt?.outstanding_balance ?? ((debt?.total || 0) - totalPaid)

  return (
    <>
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-background border-l shadow-lg z-50 overflow-y-auto">
        <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Debt Details</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {isLoading ? (
          <div className="p-4 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : debt ? (
          <div className="p-4 space-y-6">
            {/* Transaction Info */}
            <Card className="p-4">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Transaction Info
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transaction #</span>
                  <span className="font-mono">{debt.transaction_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span>{formatDate(debt.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Days Overdue</span>
                  <span className={debt.days_overdue > 30 ? 'text-red-500 font-medium' : ''}>
                    {debt.days_overdue} days
                  </span>
                </div>
              </div>
            </Card>

            {/* Customer Info */}
            {debt.customer && (
              <Card className="p-4">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Customer
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name</span>
                    <span>{debt.customer.name}</span>
                  </div>
                  {debt.customer.phone && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Phone</span>
                      <span>{debt.customer.phone}</span>
                    </div>
                  )}
                  {debt.customer.email && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email</span>
                      <span>{debt.customer.email}</span>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Balance Summary */}
            <Card className="p-4">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Balance
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Original Amount</span>
                  <span>{formatCurrency(debt.total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Paid</span>
                  <span className="text-green-600">{formatCurrency(totalPaid)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Remaining</span>
                  <span className="text-orange-600">{formatCurrency(remainingBalance)}</span>
                </div>
              </div>
              
              {remainingBalance > 0 && (
                <Button 
                  className="w-full mt-4" 
                  onClick={() => setPaymentDialogOpen(true)}
                >
                  Record Payment
                </Button>
              )}
            </Card>

            {/* Payment History */}
            <Card className="p-4">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Payment History
              </h3>
              {payments && payments.length > 0 ? (
                <div className="space-y-3">
                  {payments.map((payment) => (
                    <div key={payment.id} className="flex justify-between items-start text-sm border-b pb-2 last:border-0">
                      <div>
                        <p className="font-medium">{formatCurrency(payment.amount)}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(payment.payment_date)} • {payment.payment_method.toUpperCase()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          by {payment.recorded_by_user?.full_name || 'Unknown'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No payments recorded yet</p>
              )}
            </Card>
          </div>
        ) : (
          <div className="p-4 text-center text-muted-foreground">
            Debt not found
          </div>
        )}
      </div>

      <DebtPaymentDialog
        debt={debt as DebtTransaction | null}
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        onSuccess={handlePaymentSuccess}
      />
    </>
  )
}
