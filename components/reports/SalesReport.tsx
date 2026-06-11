'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { Download, FileSpreadsheet, Loader2, Eye } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useStore } from '@/contexts/StoreContext'
import { toast } from 'sonner'
import { generateSalesReport } from '@/lib/services/reports'
import { exportToCSV } from '@/lib/utils/export'
import { transformSalesDataForTable } from '@/lib/utils/report-transforms'
import { SalesPreviewTable } from './preview/SalesPreviewTable'
import type { SalesTableData } from '@/types'
import type { SalesReport as SalesReportType } from '@/lib/services/reports'

export function SalesReport() {
  const { tenant } = useAuth()
  const { currentStore } = useStore()
  const [startDate, setStartDate] = useState<Date>(new Date(new Date().setDate(new Date().getDate() - 30)))
  const [endDate, setEndDate] = useState<Date>(new Date())
  const [loading, setLoading] = useState(false)
  const [previewData, setPreviewData] = useState<SalesTableData[]>([])
  const [reportData, setReportData] = useState<SalesReportType | null>(null)

  const handleGeneratePreview = async () => {
    if (!tenant?.id || !currentStore?.id) {
      toast.error('Store information not available')
      return
    }

    setLoading(true)
    try {
      const report = await generateSalesReport(
        tenant.id,
        currentStore.id,
        startDate.toISOString(),
        endDate.toISOString()
      )

      setReportData(report)
      const transformed = transformSalesDataForTable(report)
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
        qtySold: previewData.reduce((sum, row) => sum + row.qtySold, 0),
        discount: previewData.reduce((sum, row) => sum + row.discount, 0),
        amount: previewData.reduce((sum, row) => sum + row.amount, 0)
      }

      const csvData = [
        ['Sales by Item'],
        ['Period', `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`],
        ['Generated', new Date().toLocaleString()],
        [],
        ['Item Name', 'SKU', 'Qty Sold', 'Avg. Price', 'Discount', 'Amount'],
        ...previewData.map(row => [
          row.itemName,
          row.itemSku,
          row.qtySold.toString(),
          `KSH ${row.avgPrice.toFixed(2)}`,
          `KSH ${row.discount.toFixed(2)}`,
          `KSH ${row.amount.toFixed(2)}`
        ]),
        // Add totals row
        [
          'Total',
          '',
          totals.qtySold.toString(),
          '',
          `KSH ${totals.discount.toFixed(2)}`,
          `KSH ${totals.amount.toFixed(2)}`
        ]
      ]

      exportToCSV(csvData, `sales-report-${startDate.toISOString().split('T')[0]}-to-${endDate.toISOString().split('T')[0]}`)
      toast.success('Sales report exported successfully')
    } catch (error: any) {
      console.error('Export error:', error)
      toast.error(error.message || 'Failed to export sales report')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Sales Report
        </CardTitle>
        <CardDescription>
          Comprehensive sales analysis including revenue, profit, top products, and payment methods
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
            <li>• Sales by item with quantity and revenue</li>
            <li>• Average selling price per product</li>
            <li>• Discount tracking</li>
            <li>• Total amount calculations</li>
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
          <SalesPreviewTable
            data={previewData}
            loading={loading}
            onExport={handleExport}
          />
        )}
      </CardContent>
    </Card>
  )
}
