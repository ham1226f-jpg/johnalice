'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { Download, Receipt, Loader2, Eye } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useStore } from '@/contexts/StoreContext'
import { toast } from 'sonner'
import { generateTransactionsReport } from '@/lib/services/reports'
import { exportToCSV } from '@/lib/utils/export'
import { transformTransactionsDataForTable, filterTransactionsByPaymentMethod } from '@/lib/utils/report-transforms'
import { TransactionsPreviewTable } from './preview/TransactionsPreviewTable'
import { PaymentMethodFilter } from './preview/PaymentMethodFilter'
import type { TransactionTableData } from '@/types'
import type { TransactionsReport as TransactionsReportType } from '@/lib/services/reports'

export function TransactionsReport() {
  const { tenant } = useAuth()
  const { currentStore } = useStore()
  const [startDate, setStartDate] = useState<Date>(new Date(new Date().setDate(new Date().getDate() - 30)))
  const [endDate, setEndDate] = useState<Date>(new Date())
  const [loading, setLoading] = useState(false)
  const [allTransactions, setAllTransactions] = useState<TransactionTableData[]>([])
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null)
  const [reportData, setReportData] = useState<TransactionsReportType | null>(null)

  // Filter transactions based on selected payment method
  const filteredTransactions = useMemo(() => {
    return filterTransactionsByPaymentMethod(allTransactions, selectedPaymentMethod)
  }, [allTransactions, selectedPaymentMethod])

  // Get unique payment methods and their counts
  const paymentMethodCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    allTransactions.forEach(t => {
      counts[t.paymentMethod] = (counts[t.paymentMethod] || 0) + 1
    })
    return counts
  }, [allTransactions])

  const paymentMethods = useMemo(() => {
    return Object.keys(paymentMethodCounts).sort()
  }, [paymentMethodCounts])

  const handleGeneratePreview = async () => {
    if (!tenant?.id || !currentStore?.id) {
      toast.error('Store information not available')
      return
    }

    setLoading(true)
    try {
      const report = await generateTransactionsReport(
        tenant.id,
        currentStore.id,
        startDate.toISOString(),
        endDate.toISOString()
      )

      setReportData(report)
      const transformed = transformTransactionsDataForTable(report)
      setAllTransactions(transformed)
      setSelectedPaymentMethod(null) // Reset filter
      toast.success('Preview generated successfully')
    } catch (error: any) {
      console.error('Preview error:', error)
      toast.error(error.message || 'Failed to generate preview')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    if (!filteredTransactions || filteredTransactions.length === 0) {
      toast.error('No data to export. Generate preview first.')
      return
    }

    try {
      // Calculate totals
      const totals = {
        items: filteredTransactions.reduce((sum, row) => sum + row.items, 0),
        subtotal: filteredTransactions.reduce((sum, row) => sum + row.subtotal, 0),
        tax: filteredTransactions.reduce((sum, row) => sum + row.tax, 0),
        discount: filteredTransactions.reduce((sum, row) => sum + row.discount, 0),
        total: filteredTransactions.reduce((sum, row) => sum + row.total, 0)
      }

      const methodLabel = selectedPaymentMethod || 'all'
      const csvData = [
        [`Transactions Report - ${methodLabel.toUpperCase()}`],
        ['Period', `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`],
        ['Generated', new Date().toLocaleString()],
        [],
        ['Transaction #', 'Date', 'Customer', 'Items', 'Subtotal', 'Tax', 'Discount', 'Total', 'Payment Method', 'Status'],
        ...filteredTransactions.map(row => [
          row.transactionNumber,
          new Date(row.date).toLocaleString(),
          row.customer,
          row.items.toString(),
          `KSH ${row.subtotal.toFixed(2)}`,
          `KSH ${row.tax.toFixed(2)}`,
          `KSH ${row.discount.toFixed(2)}`,
          `KSH ${row.total.toFixed(2)}`,
          row.paymentMethod.toUpperCase(),
          row.status === 'completed' ? 'Completed' : 'Debt Pending'
        ]),
        // Add totals row
        [
          'Total',
          '',
          '',
          totals.items.toString(),
          `KSH ${totals.subtotal.toFixed(2)}`,
          `KSH ${totals.tax.toFixed(2)}`,
          `KSH ${totals.discount.toFixed(2)}`,
          `KSH ${totals.total.toFixed(2)}`,
          '',
          ''
        ]
      ]

      exportToCSV(csvData, `transactions-${methodLabel}-${startDate.toISOString().split('T')[0]}-to-${endDate.toISOString().split('T')[0]}`)
      toast.success('Transactions report exported successfully')
    } catch (error: any) {
      console.error('Export error:', error)
      toast.error(error.message || 'Failed to export transactions report')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Transactions Report
        </CardTitle>
        <CardDescription>
          Complete transaction history with profit/loss analysis and detailed item breakdown
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
            <li>• Complete transaction listing with all details</li>
            <li>• Filter by payment method (Cash, M-Pesa, Bank, Debt)</li>
            <li>• Export filtered data separately</li>
            <li>• Transaction totals and summaries</li>
            <li>• Payment status tracking</li>
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

        {allTransactions.length > 0 && (
          <div className="space-y-4">
            <PaymentMethodFilter
              paymentMethods={paymentMethods}
              selectedMethod={selectedPaymentMethod}
              onMethodChange={setSelectedPaymentMethod}
              transactionCounts={paymentMethodCounts}
            />

            <TransactionsPreviewTable
              data={filteredTransactions}
              loading={loading}
              onExport={handleExport}
              selectedPaymentMethod={selectedPaymentMethod}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
