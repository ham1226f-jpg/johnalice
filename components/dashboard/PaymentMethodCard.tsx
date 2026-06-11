'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { usePaymentMethodBreakdown } from '@/hooks/useDashboard'
import { Banknote, Smartphone, Building2, CreditCard, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaymentMethodCardProps {
  startDate?: Date
  endDate?: Date
}

const paymentMethods = [
  { key: 'cash', label: 'Cash', icon: Banknote, color: 'text-green-600' },
  { key: 'mpesa', label: 'M-Pesa', icon: Smartphone, color: 'text-emerald-600' },
  { key: 'bank', label: 'Bank', icon: Building2, color: 'text-blue-600' },
  { key: 'debt', label: 'Debt', icon: CreditCard, color: 'text-amber-600' },
] as const

export function PaymentMethodCard({ startDate, endDate }: PaymentMethodCardProps) {
  const { data: breakdown, isLoading } = usePaymentMethodBreakdown(startDate, endDate)
  const [selectedMethods, setSelectedMethods] = useState<Set<string>>(
    new Set(['cash', 'mpesa', 'bank', 'debt'])
  )

  const formatCurrency = (amount: number) => {
    return `KSH ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const toggleMethod = (method: string) => {
    const newSelected = new Set(selectedMethods)
    if (newSelected.has(method)) {
      newSelected.delete(method)
    } else {
      newSelected.add(method)
    }
    setSelectedMethods(newSelected)
  }

  const selectedTotal = paymentMethods
    .filter(m => selectedMethods.has(m.key))
    .reduce((sum, m) => sum + (breakdown?.[m.key as keyof typeof breakdown] || 0), 0)

  const getPercentage = (amount: number) => {
    if (!breakdown?.total || breakdown.total === 0) return 0
    return (amount / breakdown.total) * 100
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Payment Methods
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Payment method toggles */}
            <div className="flex flex-wrap gap-2">
              {paymentMethods.map((method) => {
                const Icon = method.icon
                const amount = breakdown?.[method.key as keyof typeof breakdown] || 0
                const isSelected = selectedMethods.has(method.key)
                const percentage = getPercentage(amount)

                return (
                  <button
                    key={method.key}
                    onClick={() => toggleMethod(method.key)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all',
                      isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <Icon className={cn('h-4 w-4', method.color)} />
                    <div className="text-left">
                      <div className="text-xs font-medium">{method.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatCurrency(amount)}
                      </div>
                    </div>
                    {percentage > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {percentage.toFixed(1)}%
                      </Badge>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Selected total */}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Selected Total</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {selectedMethods.size} method{selectedMethods.size !== 1 ? 's' : ''} selected
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{formatCurrency(selectedTotal)}</div>
                  {breakdown?.total && breakdown.total > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {((selectedTotal / breakdown.total) * 100).toFixed(1)}% of total
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Visual breakdown */}
            <div className="space-y-2">
              {paymentMethods.map((method) => {
                const amount = breakdown?.[method.key as keyof typeof breakdown] || 0
                const percentage = getPercentage(amount)
                const isSelected = selectedMethods.has(method.key)

                if (amount === 0) return null

                return (
                  <div key={method.key} className={cn('space-y-1', !isSelected && 'opacity-40')}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{method.label}</span>
                      <span className="font-medium">{percentage.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn('h-full transition-all', {
                          'bg-green-500': method.key === 'cash',
                          'bg-emerald-500': method.key === 'mpesa',
                          'bg-blue-500': method.key === 'bank',
                          'bg-amber-500': method.key === 'debt',
                        })}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
