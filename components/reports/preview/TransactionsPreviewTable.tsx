'use client'

import { useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import type { TransactionTableData } from '@/types'
import { calculateTableTotals } from '@/lib/utils/report-transforms'

interface TransactionsPreviewTableProps {
  data: TransactionTableData[]
  loading: boolean
  onExport: () => void
  selectedPaymentMethod?: string | null
}

export function TransactionsPreviewTable({
  data,
  loading,
  onExport,
  selectedPaymentMethod
}: TransactionsPreviewTableProps) {
  // Calculate totals
  const totals = useMemo(() => {
    if (data.length === 0) return null
    return calculateTableTotals(data, ['items', 'subtotal', 'tax', 'discount', 'total'])
  }, [data])

  // Format payment method for display
  const formatPaymentMethod = (method: string) => {
    const formatted: Record<string, string> = {
      cash: 'Cash',
      mpesa: 'M-Pesa',
      bank: 'Bank',
      debt: 'Debt'
    }
    return formatted[method] || method.toUpperCase()
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  if (loading) {
    return (
      <div className="rounded-md border">
        <div className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">Loading preview...</p>
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="rounded-md border">
        <div className="p-8 text-center">
          <p className="text-muted-foreground">
            {selectedPaymentMethod
              ? `No transactions found for ${formatPaymentMethod(selectedPaymentMethod)}`
              : 'No transactions available for the selected period'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {selectedPaymentMethod
              ? 'Try selecting a different payment method'
              : 'Try adjusting the date range'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          Transactions
          {selectedPaymentMethod && ` - ${formatPaymentMethod(selectedPaymentMethod)}`}
        </h3>
        <Button onClick={onExport} size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export to CSV
        </Button>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-left">Transaction #</TableHead>
              <TableHead className="text-left">Date</TableHead>
              <TableHead className="text-left">Customer</TableHead>
              <TableHead className="text-center">Items</TableHead>
              <TableHead className="text-right">Subtotal</TableHead>
              <TableHead className="text-right">Tax</TableHead>
              <TableHead className="text-right">Discount</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-center">Payment</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, index) => (
              <TableRow key={index} className="hover:bg-muted/50">
                <TableCell className="font-medium">{row.transactionNumber}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(row.date)}</TableCell>
                <TableCell>{row.customer}</TableCell>
                <TableCell className="text-center">{row.items}</TableCell>
                <TableCell className="text-right">KSH {row.subtotal.toFixed(2)}</TableCell>
                <TableCell className="text-right">KSH {row.tax.toFixed(2)}</TableCell>
                <TableCell className="text-right">KSH {row.discount.toFixed(2)}</TableCell>
                <TableCell className="text-right font-medium">KSH {row.total.toFixed(2)}</TableCell>
                <TableCell className="text-center">
                  <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-muted">
                    {formatPaymentMethod(row.paymentMethod)}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      row.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {row.status === 'completed' ? 'Completed' : 'Debt Pending'}
                  </span>
                </TableCell>
              </TableRow>
            ))}
            {totals && (
              <TableRow className="bg-muted font-semibold">
                <TableCell colSpan={3}>Total</TableCell>
                <TableCell className="text-center">{totals.items}</TableCell>
                <TableCell className="text-right">KSH {(totals.subtotal || 0).toFixed(2)}</TableCell>
                <TableCell className="text-right">KSH {(totals.tax || 0).toFixed(2)}</TableCell>
                <TableCell className="text-right">KSH {(totals.discount || 0).toFixed(2)}</TableCell>
                <TableCell className="text-right">KSH {(totals.total || 0).toFixed(2)}</TableCell>
                <TableCell colSpan={2}></TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground">
        Showing {data.length} transaction{data.length !== 1 ? 's' : ''}
        {selectedPaymentMethod && ` for ${formatPaymentMethod(selectedPaymentMethod)}`}
      </div>
    </div>
  )
}
