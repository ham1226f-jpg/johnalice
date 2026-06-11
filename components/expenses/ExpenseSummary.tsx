'use client'

import { Card } from '@/components/ui/card'
import { useExpenseSummary } from '@/hooks/useExpenses'
import { Wallet, TrendingDown, FolderOpen } from 'lucide-react'

interface ExpenseSummaryProps {
  dateFrom?: string
  dateTo?: string
}

function formatCurrency(amount: number) {
  return `KSH ${amount.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

const categoryColors = [
  { bg: 'bg-blue-500', light: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
  { bg: 'bg-emerald-500', light: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400' },
  { bg: 'bg-amber-500', light: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400' },
  { bg: 'bg-purple-500', light: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400' },
  { bg: 'bg-pink-500', light: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-600 dark:text-pink-400' },
  { bg: 'bg-orange-500', light: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400' },
  { bg: 'bg-teal-500', light: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-600 dark:text-teal-400' },
  { bg: 'bg-red-500', light: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400' },
]

export function ExpenseSummary({ dateFrom, dateTo }: ExpenseSummaryProps) {
  const { data: summary, isLoading } = useExpenseSummary({ dateFrom, dateTo })

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold">Category Breakdown</h3>
      </div>
      
      {/* Total */}
      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 mb-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Expenses</p>
        {isLoading ? (
          <div className="h-8 w-28 bg-muted animate-pulse rounded" />
        ) : (
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {formatCurrency(summary?.total || 0)}
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : summary && summary.by_category.length > 0 ? (
        <div className="space-y-2">
          {summary.by_category.map((item, index) => {
            const percentage = summary.total > 0 
              ? (item.amount / summary.total) * 100 
              : 0
            const color = categoryColors[index % categoryColors.length]
            
            return (
              <div key={item.category.id} className={`${color.light} rounded-lg p-3`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-medium ${color.text}`}>
                    {item.category.name}
                  </span>
                  <span className="text-sm font-bold">
                    {formatCurrency(item.amount)}
                  </span>
                </div>
                <div className="h-1.5 bg-white/50 dark:bg-black/20 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${color.bg} transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {percentage.toFixed(1)}% of total
                </p>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <FolderOpen className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">
            No expenses recorded
          </p>
        </div>
      )}
    </Card>
  )
}

export function ExpenseKPICards() {
  // Get current month summary
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  const { data: monthSummary, isLoading } = useExpenseSummary({
    dateFrom: startOfMonth.toISOString().split('T')[0],
  })

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
      <Card className="p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 truncate">
              This Month
            </p>
            {isLoading ? (
              <div className="h-6 sm:h-7 w-16 sm:w-24 bg-muted animate-pulse rounded" />
            ) : (
              <p className="text-base sm:text-xl font-bold text-red-600 dark:text-red-400 truncate">
                {formatCurrency(monthSummary?.total || 0)}
              </p>
            )}
          </div>
          <div className="p-1.5 sm:p-2 rounded-lg bg-red-100 dark:bg-red-900/30 flex-shrink-0">
            <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 dark:text-red-400" />
          </div>
        </div>
      </Card>
      
      <Card className="p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 truncate">
              Categories
            </p>
            {isLoading ? (
              <div className="h-6 sm:h-7 w-8 sm:w-12 bg-muted animate-pulse rounded" />
            ) : (
              <p className="text-base sm:text-xl font-bold">
                {monthSummary?.by_category.length || 0}
              </p>
            )}
          </div>
          <div className="p-1.5 sm:p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex-shrink-0">
            <FolderOpen className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </Card>

      <Card className="p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 truncate">
              Avg/Category
            </p>
            {isLoading ? (
              <div className="h-6 sm:h-7 w-14 sm:w-20 bg-muted animate-pulse rounded" />
            ) : (
              <p className="text-base sm:text-xl font-bold truncate">
                {formatCurrency(
                  monthSummary?.by_category.length 
                    ? (monthSummary.total / monthSummary.by_category.length) 
                    : 0
                )}
              </p>
            )}
          </div>
          <div className="p-1.5 sm:p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex-shrink-0">
            <Wallet className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
      </Card>

      <Card className="p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 truncate">
              Top Category
            </p>
            {isLoading ? (
              <div className="h-6 sm:h-7 w-14 sm:w-20 bg-muted animate-pulse rounded" />
            ) : (
              <p className="text-sm sm:text-lg font-bold truncate">
                {monthSummary?.by_category[0]?.category.name || '-'}
              </p>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
