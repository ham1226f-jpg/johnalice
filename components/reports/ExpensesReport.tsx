'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { Download, Wallet, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useStore } from '@/contexts/StoreContext'
import { toast } from 'sonner'
import { generateExpensesReport } from '@/lib/services/reports'
import { exportToCSV } from '@/lib/utils/export'

export function ExpensesReport() {
  const { tenant } = useAuth()
  const { currentStore } = useStore()
  const [startDate, setStartDate] = useState<Date>(new Date(new Date().setDate(new Date().getDate() - 30)))
  const [endDate, setEndDate] = useState<Date>(new Date())
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    if (!tenant?.id || !currentStore?.id) {
      toast.error('Store information not available')
      return
    }

    setLoading(true)
    try {
      const report = await generateExpensesReport(
        tenant.id,
        currentStore.id,
        startDate.toISOString(),
        endDate.toISOString()
      )

      const csvData = [
        ['Expenses Report'],
        ['Period', `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`],
        ['Generated', new Date().toLocaleString()],
        [],
        ['Summary'],
        ['Total Expenses', `KSH ${report.summary.totalExpenses.toFixed(2)}`],
        ['Number of Expenses', report.summary.expenseCount.toString()],
        ['Average Expense', `KSH ${report.summary.averageExpense.toFixed(2)}`],
        ['Categories Used', report.summary.categoryCount.toString()],
        [],
        ['All Expenses'],
        ['Date', 'Category', 'Amount', 'Description', 'Receipt Reference', 'Recorded By'],
        ...report.expenses.map(e => [
          new Date(e.expense_date).toLocaleDateString(),
          e.category?.name || 'N/A',
          `KSH ${e.amount.toFixed(2)}`,
          e.description || '',
          e.receipt_reference || '',
          e.created_by_user?.full_name || 'N/A'
        ]),
        [],
        ['Expenses by Category'],
        ['Category', 'Count', 'Total Amount', 'Average', 'Percentage of Total'],
        ...report.byCategory.map(c => [
          c.category_name,
          c.count.toString(),
          `KSH ${c.total.toFixed(2)}`,
          `KSH ${c.average.toFixed(2)}`,
          `${c.percentage.toFixed(2)}%`
        ]),
        [],
        ['Daily Expenses Breakdown'],
        ['Date', 'Count', 'Total Amount'],
        ...report.dailyBreakdown.map(d => [
          new Date(d.date).toLocaleDateString(),
          d.count.toString(),
          `KSH ${d.total.toFixed(2)}`
        ]),
        [],
        ['Top Expense Categories'],
        ['Rank', 'Category', 'Total Amount', '% of Total'],
        ...report.topCategories.map((c, idx) => [
          (idx + 1).toString(),
          c.category_name,
          `KSH ${c.total.toFixed(2)}`,
          `${c.percentage.toFixed(2)}%`
        ])
      ]

      exportToCSV(csvData, `expenses-report-${startDate.toISOString().split('T')[0]}-to-${endDate.toISOString().split('T')[0]}`)
      toast.success('Expenses report exported successfully')
    } catch (error: any) {
      console.error('Export error:', error)
      toast.error(error.message || 'Failed to export expenses report')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Expenses Report
        </CardTitle>
        <CardDescription>
          Comprehensive expense tracking with category analysis and daily breakdown
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
            <li>• Complete expense listing with descriptions</li>
            <li>• Total and average expense calculations</li>
            <li>• Expenses breakdown by category</li>
            <li>• Daily expense trends</li>
            <li>• Top expense categories</li>
            <li>• Receipt references for tracking</li>
            <li>• Staff who recorded expenses</li>
          </ul>
        </div>

        <Button 
          onClick={handleExport} 
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
              <Download className="mr-2 h-4 w-4" />
              Export to CSV
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
