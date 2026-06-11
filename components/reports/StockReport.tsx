'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { Download, Package, Loader2, Eye } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useStore } from '@/contexts/StoreContext'
import { toast } from 'sonner'
import { generateStockReport } from '@/lib/services/reports'
import { exportToCSV } from '@/lib/utils/export'
import { transformStockDataForTable } from '@/lib/utils/report-transforms'
import { StockPreviewTable } from './preview/StockPreviewTable'
import type { StockTableData } from '@/types'
import type { StockReport as StockReportType } from '@/lib/services/reports'

export function StockReport() {
  const { tenant } = useAuth()
  const { currentStore } = useStore()
  const [startDate, setStartDate] = useState<Date>(new Date(new Date().setDate(new Date().getDate() - 30)))
  const [endDate, setEndDate] = useState<Date>(new Date())
  const [loading, setLoading] = useState(false)
  const [previewData, setPreviewData] = useState<StockTableData[]>([])
  const [reportData, setReportData] = useState<StockReportType | null>(null)

  const handleGeneratePreview = async () => {
    if (!tenant?.id || !currentStore?.id) {
      toast.error('Store information not available')
      return
    }

    setLoading(true)
    try {
      const report = await generateStockReport(
        tenant.id,
        currentStore.id,
        startDate.toISOString(),
        endDate.toISOString()
      )

      setReportData(report)
      const transformed = transformStockDataForTable(report)
      setPreviewData(transformed)
      toast.success('Preview generated successfully')
    } catch (error: any) {
      console.error('Preview error:', error)
      toast.error(error.message || 'Failed to generate preview')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    if (!previewData || previewData.length === 0) {
      toast.error('No data to export. Generate preview first.')
      return
    }

    try {
      // Calculate totals
      const totals = {
        openingStock: previewData.reduce((sum, row) => sum + row.openingStock, 0),
        stockAdded: previewData.reduce((sum, row) => sum + row.stockAdded, 0),
        stockAdjustments: previewData.reduce((sum, row) => sum + row.stockAdjustments, 0),
        stockSold: previewData.reduce((sum, row) => sum + row.stockSold, 0),
        returns: previewData.reduce((sum, row) => sum + row.returns, 0),
        closingStock: previewData.reduce((sum, row) => sum + row.closingStock, 0),
        closingStockValue: previewData.reduce((sum, row) => sum + row.closingStockValue, 0)
      }

      const csvData = [
        ['Stock Movement Summary'],
        ['Period', `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`],
        ['Generated', new Date().toLocaleString()],
        [],
        ['Product Name', 'SKU', 'Opening Stock', 'Stock Added', 'Stock Adjustments', 'Stock Sold', 'Returns', 'Closing Stock', 'Closing Stock Value'],
        ...previewData.map(row => [
          row.productName,
          row.productSku,
          row.openingStock.toString(),
          row.stockAdded.toString(),
          row.stockAdjustments.toString(),
          row.stockSold.toString(),
          row.returns.toString(),
          row.closingStock.toString(),
          `KSH ${row.closingStockValue.toFixed(2)}`
        ]),
        // Add totals row
        [
          'Total',
          '',
          totals.openingStock.toString(),
          totals.stockAdded.toString(),
          totals.stockAdjustments.toString(),
          totals.stockSold.toString(),
          totals.returns.toString(),
          totals.closingStock.toString(),
          `KSH ${totals.closingStockValue.toFixed(2)}`
        ]
      ]

      exportToCSV(csvData, `stock-report-${startDate.toISOString().split('T')[0]}-to-${endDate.toISOString().split('T')[0]}`)
      toast.success('Stock report exported successfully')
    } catch (error: any) {
      console.error('Export error:', error)
      toast.error(error.message || 'Failed to export stock report')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Stock Status Report
        </CardTitle>
        <CardDescription>
          Detailed inventory analysis with opening stock, closing stock, movements, and stock value
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Start Date</label>
            <DatePicker
              value={startDate}
              onChange={setStartDate}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">End Date</label>
            <DatePicker
              value={endDate}
              onChange={setEndDate}
            />
          </div>
        </div>

        <div className="rounded-lg bg-muted p-4 space-y-2">
          <h4 className="font-medium text-sm">Report Includes:</h4>
          <ul className="text-sm text-muted-foreground space-y-1 ml-4">
            <li>• Opening and closing stock quantities</li>
            <li>• Stock added during period (restocks + returns)</li>
            <li>• Stock sold during period</li>
            <li>• Returns tracking</li>
            <li>• Closing stock value calculations</li>
          </ul>
        </div>

        <Button 
          onClick={handleGeneratePreview} 
          disabled={loading}
          className="w-full sm:w-auto"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Eye className="mr-2 h-4 w-4" />
              Generate Preview
            </>
          )}
        </Button>

        {previewData.length > 0 && (
          <StockPreviewTable
            data={previewData}
            loading={loading}
            onExport={handleExport}
          />
        )}
      </CardContent>
    </Card>
  )
}
