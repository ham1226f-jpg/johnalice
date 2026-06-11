import { LucideIcon, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface KPICardProps {
  title: string
  value: string
  change?: number
  icon: LucideIcon
  loading?: boolean
  valueType?: 'revenue' | 'profit' | 'cost' | 'neutral'
  subtitle?: string
}

export function KPICard({ title, value, change, icon: Icon, loading, valueType = 'neutral', subtitle }: KPICardProps) {
  const isPositive = change !== undefined && change > 0
  const isNegative = change !== undefined && change < 0
  const isNeutral = change === undefined || change === 0

  const valueColorClasses = {
    revenue: 'text-emerald-600 dark:text-emerald-400',
    profit: 'text-blue-600 dark:text-blue-400',
    cost: 'text-orange-600 dark:text-orange-400',
    neutral: 'text-foreground',
  }

  const iconBgClasses = {
    revenue: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    profit: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    cost: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
    neutral: 'bg-muted text-muted-foreground',
  }

  return (
    <Card className="p-5 hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-transparent hover:border-l-primary">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{title}</p>
          
          {loading ? (
            <div className="space-y-2">
              <div className="h-8 w-28 bg-muted animate-pulse rounded" />
              <div className="h-4 w-20 bg-muted animate-pulse rounded" />
            </div>
          ) : (
            <>
              <p className={cn('text-2xl font-bold tracking-tight', valueColorClasses[valueType])}>
                {value}
              </p>
              
              {change !== undefined && (
                <div className="flex items-center gap-1.5 mt-2">
                  <div className={cn(
                    'flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium',
                    isPositive && 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
                    isNegative && 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
                    isNeutral && 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  )}>
                    {isPositive && <ArrowUpRight className="h-3 w-3" />}
                    {isNegative && <ArrowDownRight className="h-3 w-3" />}
                    {isNeutral && <Minus className="h-3 w-3" />}
                    <span>{Math.abs(change).toFixed(1)}%</span>
                  </div>
                  <span className="text-xs text-muted-foreground">vs last period</span>
                </div>
              )}
              
              {subtitle && (
                <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
              )}
            </>
          )}
        </div>
        
        <div className={cn('p-2.5 rounded-xl', iconBgClasses[valueType])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  )
}
