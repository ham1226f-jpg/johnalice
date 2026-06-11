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
import type { StockTableData } from '@/types'
import { calculateTableTotals } from '@/lib/utils/report-transforms'

interface StockPreviewTableProps {
  data: StockTableData[]
  loading: boolean
  onExport: () => void
}

export function StockPreviewTable({ data, loading, onExport }: StockPreviewTableProps) {
  // Calculate totals
  const totals = useMemo(() => {
    if (data.length === 0) return null
    return calculateTableTotals(data, [
      'openingStock',
      'stockAdded',
      'stockAdjustments',
      'stockSold',
      'returns',
      'closingStock',
      'closingStockValue'
    ])
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
          <p className="text-muted-foreground">No stock data available for the selected period</p>
          <p className="text-sm text-muted-foreground mt-1">Try adjusting the date range</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Stock Movement Summary</h3>
        <Button onClick={onExport} size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export to CSV
        </Button>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-left">Product Name</TableHead>
              <TableHead className="text-left">SKU</TableHead>
              <TableHead className="text-center">Opening Stock</TableHead>
              <TableHead className="text-center">Stock Added</TableHead>
              <TableHead className="text-center">Stock Adjustments</TableHead>
              <TableHead className="text-center">Stock Sold</TableHead>
              <TableHead className="text-center">Returns</TableHead>
              <TableHead className="text-center">Closing Stock</TableHead>
              <TableHead className="text-right">Closing Stock Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, index) => (
              <TableRow key={index} className="hover:bg-muted/50">
                <TableCell className="font-medium">{row.productName}</TableCell>
                <TableCell className="text-muted-foreground">{row.productSku}</TableCell>
                <TableCell className="text-center">{row.openingStock}</TableCell>
                <TableCell className="text-center">{row.stockAdded}</TableCell>
                <TableCell className="text-center">{row.stockAdjustments}</TableCell>
                <TableCell className="text-center">{row.stockSold}</TableCell>
                <TableCell className="text-center">{row.returns}</TableCell>
                <TableCell className="text-center font-medium">{row.closingStock}</TableCell>
                <TableCell className="text-right font-medium">
                  KSH {row.closingStockValue.toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
            {totals && (
              <TableRow className="bg-muted font-semibold">
                <TableCell colSpan={2}>Total</TableCell>
                <TableCell className="text-center">{totals.openingStock}</TableCell>
                <TableCell className="text-center">{totals.stockAdded}</TableCell>
                <TableCell className="text-center">{totals.stockAdjustments}</TableCell>
                <TableCell className="text-center">{totals.stockSold}</TableCell>
                <TableCell className="text-center">{totals.returns}</TableCell>
                <TableCell className="text-center">{totals.closingStock}</TableCell>
                <TableCell className="text-right">
                  KSH {(totals.closingStockValue || 0).toFixed(2)}
                </TableCell>
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
