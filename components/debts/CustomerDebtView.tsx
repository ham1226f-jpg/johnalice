'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Phone, Mail, User } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useDebtsByCustomer } from '@/hooks/useDebts'
import { useAuth } from '@/contexts/AuthContext'
import { CustomerDebtSummary, DebtTransaction } from '@/types'

interface CustomerDebtViewProps {
  onSelectDebt?: (debt: DebtTransaction) => void
}

function formatCurrency(amount: number | null | undefined) {
  const value = amount ?? 0
  return `KSH ${value.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-KE', {
    month: 'short',
    day: 'numeric',
  })
}

function CustomerCard({
  customerDebt,
  currency,
  onSelectDebt,
}: {
  customerDebt: CustomerDebtSummary
  currency: string
  onSelectDebt?: (debt: DebtTransaction) => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <Card className="overflow-hidden">
      <button
        className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div className="text-left">
            <p className="font-medium">{customerDebt.customer.name}</p>
            <p className="text-sm text-muted-foreground">
              {customerDebt.transaction_count} transaction{customerDebt.transaction_count !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="font-semibold text-orange-600">
              {formatCurrency(customerDebt.total_outstanding)}
            </p>
            <p className="text-xs text-muted-foreground">outstanding</p>
          </div>
          {expanded ? (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t">
          {/* Contact Info */}
          <div className="px-4 py-3 bg-muted/30 flex gap-4 text-sm">
            {customerDebt.customer.phone && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <Phone className="h-3 w-3" />
                {customerDebt.customer.phone}
              </span>
            )}
            {customerDebt.customer.email && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <Mail className="h-3 w-3" />
                {customerDebt.customer.email}
              </span>
            )}
          </div>

          {/* Debt List */}
          <div className="divide-y">
            {customerDebt.debts.map((debt) => (
              <div
                key={debt.id}
                className="px-4 py-3 flex items-center justify-between hover:bg-muted/30 cursor-pointer"
                onClick={() => onSelectDebt?.(debt)}
              >
                <div>
                  <p className="font-mono text-sm">{debt.transaction_number}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(debt.created_at)} • {debt.days_overdue} days overdue
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(debt.outstanding_balance)}</p>
                  <p className="text-xs text-muted-foreground">
                    of {formatCurrency(debt.total)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}

export function CustomerDebtView({ onSelectDebt }: CustomerDebtViewProps) {
  const { tenant } = useAuth()
  const currency = tenant?.settings?.currency || 'KES'
  
  const [search, setSearch] = useState('')
  const { data: customerDebts, isLoading } = useDebtsByCustomer({ search })

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Search customers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : customerDebts && customerDebts.length > 0 ? (
        <div className="space-y-3">
          {customerDebts.map((customerDebt) => (
            <CustomerCard
              key={customerDebt.customer.id}
              customerDebt={customerDebt}
              currency={currency}
              onSelectDebt={onSelectDebt}
            />
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center text-muted-foreground">
          No customers with outstanding debts found
        </Card>
      )}
    </div>
  )
}
