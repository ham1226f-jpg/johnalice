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
import { calculateTableTotals } from '@/lib/utils/report-transforms'

interface ExpenseTableData {
  date: string
  category: string
  description: string
  amount: number
  receiptReference: string
  recordedBy: string
}

interface ExpensesPreviewTableProps {
  data: ExpenseTableData[]
  loading: boolean
  onExport: () => void
}

export function ExpensesPreviewTable({ data, loading, onExport }: ExpensesPreviewTableProps) {
  // Calculate totals
  const totals = useMemo(() => {
    if (data.length === 0) return null
    return calculateTableTotals(data, ['amount'])
  }, [data])

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
          <p className="text-muted-foreground">No expense data available for the selected period</p>
          <p className="text-sm text-muted-foreground mt-1">Try adjusting the date range</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Expenses Summary</h3>
        <Button onClick={onExport} size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export to CSV
        </Button>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-left">Date</TableHead>
              <TableHead className="text-left">Category</TableHead>
              <TableHead className="text-left">Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-left">Receipt Ref</TableHead>
              <TableHead className="text-left">Recorded By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, index) => (
              <TableRow key={index} className="hover:bg-muted/50">
                <TableCell>{new Date(row.date).toLocaleDateString()}</TableCell>
                <TableCell className="font-medium">{row.category}</TableCell>
                <TableCell className="text-muted-foreground">{row.description || '-'}</TableCell>
                <TableCell className="text-right font-medium">
                  KSH {row.amount.toFixed(2)}
                </TableCell>
                <TableCell className="text-muted-foreground">{row.receiptReference || '-'}</TableCell>
                <TableCell className="text-muted-foreground">{row.recordedBy}</TableCell>
              </TableRow>
            ))}
            {totals && (
              <TableRow className="bg-muted font-semibold">
                <TableCell colSpan={3}>Total</TableCell>
                <TableCell className="text-right">
                  KSH {(totals.amount || 0).toFixed(2)}
                </TableCell>
                <TableCell colSpan={2}></TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground">
        Showing {data.length} expense{data.length !== 1 ? 's' : ''}
      </div>
    </div>
  )
}
