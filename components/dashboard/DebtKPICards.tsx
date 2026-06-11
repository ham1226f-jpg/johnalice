'use client'

import Link from 'next/link'
import { CreditCard, AlertTriangle, Banknote, Users, ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { useDebtSummary } from '@/hooks/useDebts'

function formatCurrency(amount: number) {
  return `KSH ${amount.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export function DebtKPICards() {
  const { data: summary, isLoading } = useDebtSummary()

  // Count overdue customers (debts older than 30 days)
  const overdueAmount = (summary?.aging?.overdue_30 || 0) + 
                        (summary?.aging?.overdue_60 || 0) + 
                        (summary?.aging?.overdue_90 || 0)
  
  const totalOutstanding = summary?.total_outstanding || 0
  const overduePercent = totalOutstanding > 0 ? (overdueAmount / totalOutstanding) * 100 : 0

  const cards = [
    {
      title: 'Total Outstanding',
      value: formatCurrency(totalOutstanding),
      subtitle: `${summary?.customer_count || 0} customers`,
      icon: CreditCard,
      iconBg: 'bg-orange-100 dark:bg-orange-900/30',
      iconColor: 'text-orange-600 dark:text-orange-400',
      href: '/debts',
      trend: null,
    },
    {
      title: 'Overdue (30+ days)',
      value: formatCurrency(overdueAmount),
      subtitle: `${overduePercent.toFixed(0)}% of total`,
      icon: AlertTriangle,
      iconBg: 'bg-red-100 dark:bg-red-900/30',
      iconColor: 'text-red-600 dark:text-red-400',
      href: '/debts?filter=overdue',
      trend: overduePercent > 50 ? 'danger' : overduePercent > 25 ? 'warning' : 'good',
    },
    {
      title: 'Collected Today',
      value: formatCurrency(summary?.collected_today || 0),
      subtitle: 'Payments received',
      icon: Banknote,
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      href: '/debts',
      trend: (summary?.collected_today || 0) > 0 ? 'good' : null,
    },
    {
      title: 'This Month',
      value: formatCurrency(summary?.collected_this_month || 0),
      subtitle: 'Total collected',
      icon: TrendingUp,
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
      href: '/debts',
      trend: null,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Link key={card.title} href={card.href}>
          <Card className="p-4 hover:shadow-md transition-all duration-200 cursor-pointer border-l-4 border-l-transparent hover:border-l-primary group">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                  {card.title}
                </p>
                
                {isLoading ? (
                  <div className="space-y-1">
                    <div className="h-6 w-24 bg-muted animate-pulse rounded" />
                    <div className="h-3 w-16 bg-muted animate-pulse rounded" />
                  </div>
                ) : (
                  <>
                    <p className="text-xl font-bold tracking-tight">{card.value}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {card.trend === 'good' && (
                        <span className="flex items-center text-xs text-emerald-600 dark:text-emerald-400">
                          <ArrowUpRight className="h-3 w-3" />
                        </span>
                      )}
                      {card.trend === 'danger' && (
                        <span className="flex items-center text-xs text-red-600 dark:text-red-400">
                          <ArrowDownRight className="h-3 w-3" />
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">{card.subtitle}</span>
                    </div>
                  </>
                )}
              </div>
              
              <div className={`p-2 rounded-lg ${card.iconBg} group-hover:scale-110 transition-transform`}>
                <card.icon className={`h-4 w-4 ${card.iconColor}`} />
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  )
}
