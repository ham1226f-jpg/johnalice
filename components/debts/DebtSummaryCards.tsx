'use client'

import { CreditCard, Users, Clock, Banknote } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { useDebtSummary } from '@/hooks/useDebts'
import { useAuth } from '@/contexts/AuthContext'

function formatCurrency(amount: number | null | undefined) {
  const value = amount ?? 0
  return `KSH ${value.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export function DebtSummaryCards() {
  const { tenant } = useAuth()
  const { data: summary, isLoading } = useDebtSummary()
  const currency = tenant?.settings?.currency || 'KES'

  const cards = [
    {
      title: 'Total Outstanding',
      value: formatCurrency(summary?.total_outstanding || 0),
      icon: CreditCard,
      color: 'text-orange-500',
    },
    {
      title: 'Customers with Debt',
      value: String(summary?.customer_count || 0),
      icon: Users,
      color: 'text-blue-500',
    },
    {
      title: 'Overdue (90+ days)',
      value: formatCurrency(summary?.aging?.overdue_90 || 0),
      icon: Clock,
      color: 'text-red-500',
    },
    {
      title: 'Collected This Month',
      value: formatCurrency(summary?.collected_this_month || 0),
      icon: Banknote,
      color: 'text-green-500',
    },
  ]

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title} className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2 sm:mb-4">
            <h3 className="text-xs sm:text-sm font-medium text-muted-foreground truncate pr-2">{card.title}</h3>
            <card.icon className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${card.color}`} />
          </div>
          
          {isLoading ? (
            <div className="h-6 sm:h-8 w-20 sm:w-24 bg-muted animate-pulse rounded" />
          ) : (
            <p className="text-lg sm:text-2xl font-bold truncate">{card.value}</p>
          )}
        </Card>
      ))}
    </div>
  )
}

export function DebtAgingBreakdown() {
  const { tenant } = useAuth()
  const { data: summary, isLoading } = useDebtSummary()
  const currency = tenant?.settings?.currency || 'KES'

  const agingCategories = [
    { label: '0-30 days', value: summary?.aging?.current || 0, color: 'bg-green-500' },
    { label: '31-60 days', value: summary?.aging?.overdue_30 || 0, color: 'bg-yellow-500' },
    { label: '61-90 days', value: summary?.aging?.overdue_60 || 0, color: 'bg-orange-500' },
    { label: '90+ days', value: summary?.aging?.overdue_90 || 0, color: 'bg-red-500' },
  ]

  const total = agingCategories.reduce((sum, cat) => sum + cat.value, 0)

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Debt Aging</h3>
      
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-6 bg-muted animate-pulse rounded" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {agingCategories.map((cat) => {
            const percentage = total > 0 ? (cat.value / total) * 100 : 0
            return (
              <div key={cat.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">{cat.label}</span>
                  <span className="font-medium">{formatCurrency(cat.value)}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${cat.color} transition-all`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
