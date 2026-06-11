'use client'

import { X, User, Phone, Mail, CreditCard, Receipt } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useCustomerCreditStatus } from '@/hooks/useCustomers'
import { useAuth } from '@/contexts/AuthContext'
import { Customer } from '@/types'

interface CustomerDetailProps {
  customer: Customer | null
  onClose: () => void
  onEdit?: (customer: Customer) => void
}

function formatCurrency(amount: number) {
  return `KSH ${amount.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function CustomerDetail({ customer, onClose, onEdit }: CustomerDetailProps) {
  const { tenant } = useAuth()
  
  const { data: creditStatus, isLoading } = useCustomerCreditStatus(customer?.id || '')

  if (!customer) return null

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-background border-l shadow-lg z-50 overflow-y-auto">
      <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Customer Details</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onEdit?.(customer)}>
            Edit
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Basic Info */}
        <Card className="p-4">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <User className="h-4 w-4" />
            Basic Information
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{customer.name}</span>
            </div>
            {customer.phone && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone</span>
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {customer.phone}
                </span>
              </div>
            )}
            {customer.email && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {customer.email}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Member Since</span>
              <span>{formatDate(customer.created_at)}</span>
            </div>
          </div>
        </Card>

        {/* Credit Information */}
        <Card className="p-4">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Credit Information
          </h3>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-4 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Credit Status</span>
                <span className={creditStatus?.customer?.is_credit_approved ? 'text-green-600' : 'text-gray-600'}>
                  {creditStatus?.customer?.is_credit_approved ? 'Approved' : 'Not Approved'}
                </span>
              </div>
              {creditStatus?.customer?.is_credit_approved && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Credit Limit</span>
                    <span className="font-medium">
                      {formatCurrency(creditStatus?.customer?.credit_limit || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Outstanding Debt</span>
                    <span className="text-orange-600">
                      {formatCurrency(creditStatus?.outstanding_debt || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Available Credit</span>
                    <span className="text-green-600">
                      {formatCurrency(creditStatus?.available_credit || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pending Transactions</span>
                    <span>{creditStatus?.pending_transactions || 0}</span>
                  </div>
                </>
              )}
            </div>
          )}
        </Card>

        {/* Purchase History */}
        <Card className="p-4">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Purchase Summary
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Purchases</span>
              <span className="font-medium">
                {formatCurrency(customer.total_purchases)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Updated</span>
              <span>{formatDate(customer.updated_at)}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
