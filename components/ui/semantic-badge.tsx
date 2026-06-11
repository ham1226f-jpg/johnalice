import { cn } from '@/lib/utils'

type BadgeVariant = 
  | 'profit' | 'loss' | 'revenue' | 'cost' | 'neutral'
  | 'success' | 'pending' | 'cancelled' | 'inactive'
  | 'stock-in' | 'stock-low' | 'stock-out'
  | 'info' | 'warning' | 'error'

interface SemanticBadgeProps {
  variant: BadgeVariant
  children: React.ReactNode
  className?: string
}

export function SemanticBadge({ variant, children, className }: SemanticBadgeProps) {
  const variantStyles = {
    // Monetary
    profit: 'bg-profit text-profit-foreground',
    loss: 'bg-loss text-loss-foreground',
    revenue: 'bg-revenue text-revenue-foreground',
    cost: 'bg-cost text-cost-foreground',
    neutral: 'bg-neutral text-neutral-foreground',
    
    // Status
    success: 'bg-status-success text-status-success-foreground',
    pending: 'bg-status-pending text-status-pending-foreground',
    cancelled: 'bg-status-cancelled text-status-cancelled-foreground',
    inactive: 'bg-status-inactive text-status-inactive-foreground',
    
    // Stock
    'stock-in': 'bg-stock-in text-stock-in-foreground',
    'stock-low': 'bg-stock-low text-stock-low-foreground',
    'stock-out': 'bg-stock-out text-stock-out-foreground',
    
    // Alerts
    info: 'bg-alert-info text-alert-info-foreground',
    warning: 'bg-alert-warning text-alert-warning-foreground',
    error: 'bg-alert-error text-alert-error-foreground',
  }

  return (
    <span className={cn(
      'inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold',
      variantStyles[variant],
      className
    )}>
      {children}
    </span>
  )
}
