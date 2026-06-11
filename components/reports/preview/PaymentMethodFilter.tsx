'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface PaymentMethodFilterProps {
  paymentMethods: string[]
  selectedMethod: string | null
  onMethodChange: (method: string | null) => void
  transactionCounts?: Record<string, number>
}

export function PaymentMethodFilter({
  paymentMethods,
  selectedMethod,
  onMethodChange,
  transactionCounts
}: PaymentMethodFilterProps) {
  const formatPaymentMethod = (method: string) => {
    const formatted: Record<string, string> = {
      cash: 'Cash',
      mpesa: 'M-Pesa',
      bank: 'Bank Transfer',
      debt: 'Debt/Credit'
    }
    return formatted[method] || method.toUpperCase()
  }

  return (
    <div className="flex items-center gap-4">
      <label className="text-sm font-medium">Filter by Payment Method:</label>
      <Select
        value={selectedMethod || 'all'}
        onValueChange={(value) => onMethodChange(value === 'all' ? null : value)}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="All Methods" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            All Methods
            {transactionCounts && (
              <span className="ml-2 text-muted-foreground">
                ({Object.values(transactionCounts).reduce((a, b) => a + b, 0)})
              </span>
            )}
          </SelectItem>
          {paymentMethods.map((method) => (
            <SelectItem key={method} value={method}>
              {formatPaymentMethod(method)}
              {transactionCounts && transactionCounts[method] && (
                <span className="ml-2 text-muted-foreground">
                  ({transactionCounts[method]})
                </span>
              )}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
