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
import type { SalesTableData } from '@/types'
import { calculateTableTotals } from '@/lib/utils/report-transforms'

interface SalesPreviewTableProps {
  data: SalesTableData[]
  loading: boolean
  onExport: () => void
}

export function SalesPreviewTable({ data, loading, onExport }: SalesPreviewTableProps) {
  // Calculate totals
  const totals = useMemo(() => {
    if (data.length === 0) return null
    return calculateTableTotals(data, ['qtySold', 'avgPrice', 'discount', 'amount'])
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
          <p className="text-muted-foreground">No sales data available for the selected period</p>
          <p className="text-sm text-muted-foreground mt-1">Try adjusting the date range</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Sales by Item</h3>
        <Button onClick={onExport} size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export to CSV
        </Button>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-left">Item Name</TableHead>
              <TableHead className="text-left">SKU</TableHead>
              <TableHead className="text-center">Qty Sold</TableHead>
              <TableHead className="text-right">Avg. Price</TableHead>
              <TableHead className="text-right">Discount</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, index) => (
              <TableRow key={index} className="hover:bg-muted/50">
                <TableCell className="font-medium">{row.itemName}</TableCell>
                <TableCell className="text-muted-foreground">{row.itemSku}</TableCell>
                <TableCell className="text-center">{row.qtySold}</TableCell>
                <TableCell className="text-right">KSH {row.avgPrice.toFixed(2)}</TableCell>
                <TableCell className="text-right">KSH {row.discount.toFixed(2)}</TableCell>
                <TableCell className="text-right font-medium">KSH {row.amount.toFixed(2)}</TableCell>
              </TableRow>
            ))}
            {totals && (
              <TableRow className="bg-muted font-semibold">
                <TableCell colSpan={2}>Total</TableCell>
                <TableCell className="text-center">{totals.qtySold}</TableCell>
                <TableCell className="text-right">
                  KSH {((totals.avgPrice || 0) / data.length).toFixed(2)}
                </TableCell>
                <TableCell className="text-right">KSH {(totals.discount || 0).toFixed(2)}</TableCell>
                <TableCell className="text-right">KSH {(totals.amount || 0).toFixed(2)}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground">
        Showing {data.length} product{data.length !== 1 ? 's' : ''}
      </div>
    </div>
  )
}
