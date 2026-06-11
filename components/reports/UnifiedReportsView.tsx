'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { Download, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/contexts/AuthContext'
import { useStore } from '@/contexts/StoreContext'
import { toast } from 'sonner'
import { canViewSensitiveData } from '@/lib/utils/permissions'
import { generateSalesReport, generateStockReport, generateTransactionsReport, generateExpensesReport } from '@/lib/services/reports'
import { exportToCSV } from '@/lib/utils/export'
import { 
  transformSalesDataForTable, 
  transformStockDataForTable, 
  transformTransactionsDataForTable,
  transformExpensesDataForTable,
  filterTransactionsByPaymentMethod 
} from '@/lib/utils/report-transforms'
import { SalesPreviewTable } from './preview/SalesPreviewTable'
import { StockPreviewTable } from './preview/StockPreviewTable'
import { TransactionsPreviewTable } from './preview/TransactionsPreviewTable'
import { ExpensesPreviewTable } from './preview/ExpensesPreviewTable'
import { PaymentMethodFilter } from './preview/PaymentMethodFilter'
import type { SalesTableData, StockTableData, TransactionTableData, ExpenseTableData } from '@/types'

type ReportType = 'sales' | 'stock' | 'transactions' | 'expenses'

const ITEMS_PER_PAGE = 100

export function UnifiedReportsView() {
  const { user, tenant } = useAuth()
  const { currentStore } = useStore()
  
  // Report controls - Admins see all time by default, others see last 30 days
  const [reportType, setReportType] = useState<ReportType>('sales')
  const isAdmin = canViewSensitiveData(user)
  const [startDate, setStartDate] = useState<Date>(() => {
    // For admins, default to the beginning of time (use a very old date)
    // For others, default to 30 days ago
    return isAdmin ? new Date('2020-01-01') : new Date(new Date().setDate(new Date().getDate() - 30))
  })
  const [endDate, setEndDate] = useState<Date>(new Date())
  const [loading, setLoading] = useState(false)
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  
  // Report data (full datasets)
  const [salesData, setSalesData] = useState<SalesTableData[]>([])
  const [stockData, setStockData] = useState<StockTableData[]>([])
  const [allTransactions, setAllTransactions] = useState<TransactionTableData[]>([])
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null)
  const [expensesData, setExpensesData] = useState<ExpenseTableData[]>([])

  // Reset to page 1 when report type or dates change
  useEffect(() => {
    setCurrentPage(1)
    loadReportData()
  }, [reportType, startDate, endDate, tenant?.id, currentStore?.id])

  // Reset to page 1 when payment method filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedPaymentMethod])

  const loadReportData = async () => {
    if (!tenant?.id || !currentStore?.id) {
      return
    }

    setLoading(true)
    try {
      if (reportType === 'sales') {
        const report = await generateSalesReport(
          tenant.id,
          currentStore.id,
          startDate.toISOString(),
          endDate.toISOString()
        )
        const transformed = transformSalesDataForTable(report)
        setSalesData(transformed)
      } else if (reportType === 'stock') {
        const report = await generateStockReport(
          tenant.id,
          currentStore.id,
          startDate.toISOString(),
          endDate.toISOString()
        )
        const transformed = transformStockDataForTable(report)
        setStockData(transformed)
      } else if (reportType === 'transactions') {
        const report = await generateTransactionsReport(
          tenant.id,
          currentStore.id,
          startDate.toISOString(),
          endDate.toISOString()
        )
        const transformed = transformTransactionsDataForTable(report)
        setAllTransactions(transformed)
        setSelectedPaymentMethod(null)
      } else if (reportType === 'expenses') {
        const report = await generateExpensesReport(
          tenant.id,
          currentStore.id,
          startDate.toISOString(),
          endDate.toISOString()
        )
        const transformed = transformExpensesDataForTable(report)
        setExpensesData(transformed)
      }
    } catch (error: any) {
      console.error('Report error:', error)
      toast.error(error.message || 'Failed to load report')
    } finally {
      setLoading(false)
    }
  }

  const handleExportSales = () => {
    if (salesData.length === 0) {
      toast.error('No data to export')
      return
    }

    const totals = {
      qtySold: salesData.reduce((sum, row) => sum + row.qtySold, 0),
      discount: salesData.reduce((sum, row) => sum + row.discount, 0),
      amount: salesData.reduce((sum, row) => sum + row.amount, 0)
    }

    const csvData = [
      ['Sales by Item'],
      ['Period', `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`],
      ['Generated', new Date().toLocaleString()],
      [],
      ['Item Name', 'SKU', 'Qty Sold', 'Avg. Price', 'Discount', 'Amount'],
      ...salesData.map(row => [
        row.itemName,
        row.itemSku,
        row.qtySold.toString(),
        `KSH ${row.avgPrice.toFixed(2)}`,
        `KSH ${row.discount.toFixed(2)}`,
        `KSH ${row.amount.toFixed(2)}`
      ]),
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
  }

  const handleExportStock = () => {
    if (stockData.length === 0) {
      toast.error('No data to export')
      return
    }

    const totals = {
      openingStock: stockData.reduce((sum, row) => sum + row.openingStock, 0),
      stockAdded: stockData.reduce((sum, row) => sum + row.stockAdded, 0),
      stockAdjustments: stockData.reduce((sum, row) => sum + row.stockAdjustments, 0),
      stockSold: stockData.reduce((sum, row) => sum + row.stockSold, 0),
      returns: stockData.reduce((sum, row) => sum + row.returns, 0),
      closingStock: stockData.reduce((sum, row) => sum + row.closingStock, 0),
      closingStockValue: stockData.reduce((sum, row) => sum + row.closingStockValue, 0)
    }

    const csvData = [
      ['Stock Movement Summary'],
      ['Period', `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`],
      ['Generated', new Date().toLocaleString()],
      [],
      ['Product Name', 'SKU', 'Opening Stock', 'Stock Added', 'Stock Adjustments', 'Stock Sold', 'Returns', 'Closing Stock', 'Closing Stock Value'],
      ...stockData.map(row => [
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
  }

  const handleExportTransactions = () => {
    const filteredTransactions = filterTransactionsByPaymentMethod(allTransactions, selectedPaymentMethod)
    
    if (filteredTransactions.length === 0) {
      toast.error('No data to export')
      return
    }

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
  }

  const handleExportExpenses = () => {
    if (expensesData.length === 0) {
      toast.error('No data to export')
      return
    }

    // Calculate totals
    const totals = {
      amount: expensesData.reduce((sum, row) => sum + row.amount, 0)
    }

    const csvData = [
      ['Expenses Report'],
      ['Period', `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`],
      ['Generated', new Date().toLocaleString()],
      [],
      ['Date', 'Category', 'Description', 'Amount', 'Receipt Reference', 'Recorded By'],
      ...expensesData.map(row => [
        new Date(row.date).toLocaleDateString(),
        row.category,
        row.description || '',
        `KSH ${row.amount.toFixed(2)}`,
        row.receiptReference || '',
        row.recordedBy
      ]),
      // Add totals row
      [
        'Total',
        '',
        '',
        `KSH ${totals.amount.toFixed(2)}`,
        '',
        ''
      ]
    ]

    exportToCSV(csvData, `expenses-report-${startDate.toISOString().split('T')[0]}-to-${endDate.toISOString().split('T')[0]}`)
    toast.success('Expenses report exported successfully')
  }

  const handleExport = () => {
    if (reportType === 'sales') {
      handleExportSales()
    } else if (reportType === 'stock') {
      handleExportStock()
    } else if (reportType === 'transactions') {
      handleExportTransactions()
    } else if (reportType === 'expenses') {
      handleExportExpenses()
    }
  }

  // Get payment methods for transactions filter
  const paymentMethodCounts: Record<string, number> = {}
  allTransactions.forEach(t => {
    paymentMethodCounts[t.paymentMethod] = (paymentMethodCounts[t.paymentMethod] || 0) + 1
  })
  const paymentMethods = Object.keys(paymentMethodCounts).sort()
  const filteredTransactions = filterTransactionsByPaymentMethod(allTransactions, selectedPaymentMethod)

  // Paginate data
  const paginatedSalesData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return salesData.slice(startIndex, endIndex)
  }, [salesData, currentPage])

  const paginatedStockData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return stockData.slice(startIndex, endIndex)
  }, [stockData, currentPage])

  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return filteredTransactions.slice(startIndex, endIndex)
  }, [filteredTransactions, currentPage])

  const paginatedExpenses = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return expensesData.slice(startIndex, endIndex)
  }, [expensesData, currentPage])

  // Calculate total pages
  const totalPages = useMemo(() => {
    if (reportType === 'sales') {
      return Math.ceil(salesData.length / ITEMS_PER_PAGE)
    } else if (reportType === 'stock') {
      return Math.ceil(stockData.length / ITEMS_PER_PAGE)
    } else if (reportType === 'transactions') {
      return Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE)
    } else if (reportType === 'expenses') {
      return Math.ceil(expensesData.length / ITEMS_PER_PAGE)
    }
    return 1
  }, [reportType, salesData.length, stockData.length, filteredTransactions.length, expensesData.length])

  // Get current data count
  const currentDataCount = useMemo(() => {
    if (reportType === 'sales') return salesData.length
    if (reportType === 'stock') return stockData.length
    if (reportType === 'transactions') return filteredTransactions.length
    if (reportType === 'expenses') return expensesData.length
    return 0
  }, [reportType, salesData.length, stockData.length, filteredTransactions.length, expensesData.length])

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1))
  }

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1))
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* Controls */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Report Type</label>
              <Select value={reportType} onValueChange={(value) => setReportType(value as ReportType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">Sales Report</SelectItem>
                  <SelectItem value="stock">Stock Report</SelectItem>
                  <SelectItem value="transactions">Transactions Report</SelectItem>
                  <SelectItem value="expenses">Expenses Report</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <DatePicker value={startDate} onChange={setStartDate} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <DatePicker value={endDate} onChange={setEndDate} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">&nbsp;</label>
              <Button onClick={handleExport} className="w-full" disabled={loading}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Payment method filter for transactions */}
          {reportType === 'transactions' && allTransactions.length > 0 && (
            <PaymentMethodFilter
              paymentMethods={paymentMethods}
              selectedMethod={selectedPaymentMethod}
              onMethodChange={setSelectedPaymentMethod}
              transactionCounts={paymentMethodCounts}
            />
          )}

          {/* Loading state */}
          {loading && (
            <div className="rounded-md border">
              <div className="p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">Loading report...</p>
              </div>
            </div>
          )}

          {/* Report tables */}
          {!loading && reportType === 'sales' && (
            <SalesPreviewTable
              data={paginatedSalesData}
              loading={false}
              onExport={handleExportSales}
            />
          )}

          {!loading && reportType === 'stock' && (
            <StockPreviewTable
              data={paginatedStockData}
              loading={false}
              onExport={handleExportStock}
            />
          )}

          {!loading && reportType === 'transactions' && (
            <TransactionsPreviewTable
              data={paginatedTransactions}
              loading={false}
              onExport={handleExportTransactions}
              selectedPaymentMethod={selectedPaymentMethod}
            />
          )}

          {!loading && reportType === 'expenses' && (
            <ExpensesPreviewTable
              data={paginatedExpenses}
              loading={false}
              onExport={handleExportExpenses}
            />
          )}

          {/* Pagination controls */}
          {!loading && currentDataCount > 0 && (
            <div className="flex items-center justify-between border-t pt-4">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, currentDataCount)} of {currentDataCount} items
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <div className="text-sm font-medium">
                  Page {currentPage} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
