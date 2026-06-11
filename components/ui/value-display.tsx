import { cn } from '@/lib/utils'

interface MonetaryValueProps {
  value: number
  type: 'profit' | 'loss' | 'revenue' | 'cost' | 'neutral'
  showSign?: boolean
  className?: string
}

export function MonetaryValue({ value, type, showSign = false, className }: MonetaryValueProps) {
  const colorClasses = {
    profit: 'text-profit',
    loss: 'text-loss',
    revenue: 'text-revenue',
    cost: 'text-cost',
    neutral: 'text-neutral',
  }

  const formatValue = (val: number) => {
    const formatted = `KSH ${Math.abs(val).toLocaleString('en-KE', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`
    
    if (showSign && val !== 0) {
      return val > 0 ? `+${formatted}` : `-${formatted}`
    }
    
    return formatted
  }

  return (
    <span className={cn('font-semibold', colorClasses[type], className)}>
      {formatValue(value)}
    </span>
  )
}

interface StatusDisplayProps {
  status: string
  variant: 'success' | 'pending' | 'cancelled' | 'inactive'
  className?: string
}

export function StatusDisplay({ status, variant, className }: StatusDisplayProps) {
  const colorClasses = {
    success: 'text-status-success',
    pending: 'text-status-pending',
    cancelled: 'text-status-cancelled',
    inactive: 'text-status-inactive',
  }

  return (
    <span className={cn('font-medium', colorClasses[variant], className)}>
      {status}
    </span>
  )
}

interface StockDisplayProps {
  quantity: number
  threshold: number
  unit: string
  className?: string
}

export function StockDisplay({ quantity, threshold, unit, className }: StockDisplayProps) {
  const getStockColor = () => {
    if (quantity <= 0) return 'text-stock-out'
    if (quantity <= threshold) return 'text-stock-low'
    return 'text-stock-in'
  }

  const getStockLabel = () => {
    if (quantity <= 0) return 'Out of Stock'
    if (quantity <= threshold) return 'Low Stock'
    return 'In Stock'
  }

  return (
    <span className={cn('font-medium', getStockColor(), className)}>
      {quantity.toFixed(0)} {unit} • {getStockLabel()}
    </span>
  )
}
