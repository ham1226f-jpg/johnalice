'use client'

import { Card } from '@/components/ui/card'
import { useDailySummary } from '@/hooks/useDashboard'
import { 
  TrendingUp, 
  TrendingDown, 
  Receipt, 
  RotateCcw, 
  Wallet,
  Calculator
} from 'lucide-react'

function formatCurrency(amount: number | null | undefined) {
  const value = amount ?? 0
  return `KSH ${value.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

interface DailySummaryCardProps {
  startDate?: Date
  endDate?: Date
  showProfit?: boolean
}

export function DailySummaryCard({ startDate, endDate, showProfit = true }: DailySummaryCardProps) {
  const { data: summary, isLoading } = useDailySummary(startDate, endDate)

  const grossSales = summary?.grossSales ?? 0
  const returns = summary?.returns ?? 0
  const returnsProfitLoss = summary?.returnsProfitLoss ?? 0
  const expenses = summary?.expenses ?? 0
  const dayRevenue = grossSales - returns - expenses
  // For profit, subtract profit loss from returns (not full return amount) since we recover the cost
  // Expenses are NOT subtracted from profit, only from revenue
  const dayProfit = (summary?.grossProfit ?? 0) - returnsProfitLoss
  // Revenue after profit (essentially cost of goods sold)
  const revenueAfterProfit = dayRevenue - dayProfit

  // Determine the title based on date range
  const getTitle = () => {
    if (!startDate && !endDate) return "Today's Summary"
    if (startDate && endDate && startDate.getTime() === endDate.getTime()) {
      return `Summary for ${startDate.toLocaleDateString()}`
    }
    return "Period Summary"
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold flex items-center gap-2">
          <Calculator className="h-4 w-4" />
          {getTitle()}
        </h3>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 bg-muted animate-pulse rounded" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Gross Sales */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/40 rounded">
                <Receipt className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-sm font-medium text-foreground">Gross Sales</span>
            </div>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(grossSales)}
            </span>
          </div>

          {/* Returns */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-orange-100 dark:bg-orange-900/40 rounded">
                <RotateCcw className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <span className="text-sm font-medium text-foreground">Returns</span>
            </div>
            <span className="font-bold text-orange-600 dark:text-orange-400">
              - {formatCurrency(returns)}
            </span>
          </div>

          {/* Expenses */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-red-100 dark:bg-red-900/40 rounded">
                <Wallet className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <span className="text-sm font-medium text-foreground">Expenses</span>
            </div>
            <span className="font-bold text-red-600 dark:text-red-400">
              - {formatCurrency(expenses)}
            </span>
          </div>

          {/* Divider */}
          <div className="border-t border-dashed my-2" />

          {/* Day Revenue */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 dark:bg-blue-900/40 rounded">
                <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-sm font-medium text-foreground">Day Revenue</span>
            </div>
            <span className={`font-bold ${dayRevenue >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(dayRevenue)}
            </span>
          </div>

          {/* Day Profit */}
          {showProfit && (
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-purple-100 dark:bg-purple-900/40 rounded">
                {dayProfit >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                )}
              </div>
              <span className="text-sm font-medium text-foreground">Day Profit</span>
            </div>
            <span className={`font-bold ${dayProfit >= 0 ? 'text-purple-600 dark:text-purple-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(dayProfit)}
            </span>
          </div>
          )}

          {/* Revenue After Profit */}
          {showProfit && (
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-cyan-100 dark:bg-cyan-900/40 rounded">
                <Calculator className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
              </div>
              <span className="text-sm font-medium text-foreground">Revenue After Profit</span>
            </div>
            <span className="font-bold text-cyan-600 dark:text-cyan-400">
              {formatCurrency(revenueAfterProfit)}
            </span>
          </div>
          )}

          {/* Transaction count */}
          <p className="text-xs text-muted-foreground text-center mt-2">
            {summary?.transactionCount ?? 0} transaction{summary?.transactionCount !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </Card>
  )
}
