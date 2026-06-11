'use client'

import { useState, useMemo } from 'react'
import { useTransactions } from '@/hooks/useTransactions'
import { Transaction } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { SemanticBadge } from '@/components/ui/semantic-badge'
import { MonetaryValue } from '@/components/ui/value-display'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { TransactionDetails } from './TransactionDetails'
import { DateFilter, DateFilterOption, getDateRange } from '@/components/dashboard/DateFilter'
import { exportToCSV, formatDateTimeForCSV } from '@/lib/utils/csv'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { 
  Search, 
  Download, 
  Eye,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

export function TransactionList() {
  const [search, setSearch] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('all')
  const [customDate, setCustomDate] = useState<Date>(new Date())
  const [page, setPage] = useState(1)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  const pageSize = 15

  const dateRange = useMemo(() => getDateRange(dateFilter, customDate), [dateFilter, customDate])

  const { data, isLoading } = useTransactions({ 
    search, 
    paymentMethod: paymentMethod === 'all' ? undefined : paymentMethod,
    dateFrom: dateRange.startDate?.toISOString(),
    dateTo: dateRange.endDate?.toISOString(),
    page,
    pageSize
  })

  const handleViewDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setIsDetailsOpen(true)
  }

  const handleExportCSV = () => {
    if (!data?.transactions || data.transactions.length === 0) {
      toast.error('No transactions to export')
      return
    }

    try {
      const exportData = data.transactions.flatMap((transaction: any) => {
        // Create a row for each item in the transaction
        return (transaction.items || []).map((item: any) => ({
          'Transaction #': transaction.transaction_number,
          'Date': formatDateTimeForCSV(transaction.created_at),
          'Customer': transaction.customer?.name || 'Walk-in',
          'Product': item.product_name,
          'SKU': item.product_sku,
          'Quantity': item.quantity,
          'Unit Price': Number(item.unit_price).toFixed(2),
          'Item Total': Number(item.subtotal).toFixed(2),
          'Transaction Subtotal': Number(transaction.subtotal).toFixed(2),
          'Discount': Number(transaction.discount_amount).toFixed(2),
          'Transaction Total': Number(transaction.total).toFixed(2),
          'Payment Method': transaction.payment_method.toUpperCase(),
          'Status': transaction.status.replace('_', ' ').toUpperCase(),
          'Created By': transaction.created_by_user?.full_name || 'N/A',
        }))
      })

      const timestamp = new Date().toISOString().split('T')[0]
      exportToCSV(exportData, `transactions-${timestamp}.csv`)
      toast.success('Transactions exported successfully')
    } catch (error: any) {
      toast.error(error.message || 'Failed to export transactions')
    }
  }

  const formatCurrency = (value: number | string) => {
    return `KSH ${Number(value).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Transactions</h2>
          <p className="text-sm text-muted-foreground">
            {data?.total || 0} total transactions
          </p>
        </div>
        <Button variant="outline" onClick={handleExportCSV} disabled={!data?.transactions?.length}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap" data-tour="transactions-filters">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by transaction # or customer..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-9"
          />
        </div>
        
        <DateFilter 
          value={dateFilter} 
          onChange={(value) => {
            setDateFilter(value)
            setPage(1)
          }}
          customDate={customDate}
          onCustomDateChange={(date) => {
            setCustomDate(date)
            setPage(1)
          }}
        />

        <Select value={paymentMethod} onValueChange={(value) => {
          setPaymentMethod(value)
          setPage(1)
        }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Payment Method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Methods</SelectItem>
            <SelectItem value="cash">Cash</SelectItem>
            <SelectItem value="mpesa">M-Pesa</SelectItem>
            <SelectItem value="bank">Bank</SelectItem>
            <SelectItem value="debt">Debt</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : !data?.transactions || data.transactions.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-lg">
          <p className="text-muted-foreground">
            {search || paymentMethod !== 'all'
              ? 'No transactions found matching your filters' 
              : 'No transactions yet'}
          </p>
        </div>
      ) : (
        <>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.transactions.map((transaction: any) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-mono text-sm">
                      {transaction.transaction_number}
                    </TableCell>
                    <TableCell>
                      {format(new Date(transaction.created_at), 'MMM dd, yyyy HH:mm')}
                    </TableCell>
                    <TableCell>
                      {transaction.customer?.name || 'Walk-in'}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{transaction.created_by_user?.full_name || 'N/A'}</div>
                      <div className="text-xs text-muted-foreground capitalize">{transaction.created_by_user?.role}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <MonetaryValue 
                        value={Number(transaction.total)} 
                        type="revenue"
                      />
                    </TableCell>
                    <TableCell>
                      <span className="capitalize">{transaction.payment_method}</span>
                    </TableCell>
                    <TableCell>
                      <SemanticBadge 
                        variant={transaction.status === 'completed' ? 'success' : 'pending'}
                      >
                        {transaction.status.replace('_', ' ')}
                      </SemanticBadge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(transaction)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page} of {data.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                  disabled={page === data.totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <TransactionDetails
          transaction={selectedTransaction}
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
        />
      )}
    </div>
  )
}
