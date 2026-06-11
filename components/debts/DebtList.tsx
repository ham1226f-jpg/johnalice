'use client'

import { useState } from 'react'
import { Search, ChevronLeft, ChevronRight, Eye } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useDebts } from '@/hooks/useDebts'
import { useAuth } from '@/contexts/AuthContext'
import { DebtTransaction } from '@/types'
import { DebtFilters } from '@/lib/services/debts'

interface DebtListProps {
  onSelectDebt?: (debt: DebtTransaction) => void
}

function formatCurrency(amount: number | null | undefined) {
  const value = amount ?? 0
  return `KSH ${value.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function getDaysOverdueColor(days: number) {
  if (days <= 30) return 'text-green-600'
  if (days <= 60) return 'text-yellow-600'
  if (days <= 90) return 'text-orange-600'
  return 'text-red-600'
}

export function DebtList({ onSelectDebt }: DebtListProps) {
  const { tenant } = useAuth()
  const currency = tenant?.settings?.currency || 'KES'
  
  const [filters, setFilters] = useState<DebtFilters>({
    page: 1,
    pageSize: 10,
    sortBy: 'date',
    sortOrder: 'desc',
  })
  const [searchInput, setSearchInput] = useState('')

  const { data, isLoading } = useDebts(filters)

  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, search: searchInput, page: 1 }))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }))
  }

  const handleSort = (sortBy: DebtFilters['sortBy']) => {
    setFilters((prev) => ({
      ...prev,
      sortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'asc' ? 'desc' : 'asc',
    }))
  }

  return (
    <Card>
      <div className="p-4 border-b">
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by customer or transaction..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-9"
            />
          </div>
          <Button onClick={handleSearch}>Search</Button>
          <Button
            variant={filters.showCleared ? 'default' : 'outline'}
            onClick={() => setFilters((prev) => ({ ...prev, showCleared: !prev.showCleared, page: 1 }))}
          >
            {filters.showCleared ? 'Showing All' : 'Show Cleared'}
          </Button>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="block md:hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : data?.debts.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No outstanding debts found
          </div>
        ) : (
          <div className="divide-y">
            {data?.debts.map((debt) => (
              <button
                key={debt.id}
                className="w-full p-4 text-left hover:bg-muted/50 transition-colors"
                onClick={() => onSelectDebt?.(debt)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium truncate">{debt.customer?.name || 'Walk-in'}</span>
                      {debt.status === 'completed' ? (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Cleared</span>
                      ) : (
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${getDaysOverdueColor(debt.days_overdue)} bg-current/10`}>
                          {debt.days_overdue}d
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">
                      {debt.transaction_number}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(debt.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-orange-600 dark:text-orange-400">
                      {formatCurrency(debt.outstanding_balance)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      of {formatCurrency(debt.total)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50 whitespace-nowrap"
                onClick={() => handleSort('date')}
              >
                Date {filters.sortBy === 'date' && (filters.sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead className="whitespace-nowrap">Transaction #</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50 whitespace-nowrap"
                onClick={() => handleSort('customer')}
              >
                Customer {filters.sortBy === 'customer' && (filters.sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead 
                className="text-right cursor-pointer hover:bg-muted/50 whitespace-nowrap"
                onClick={() => handleSort('amount')}
              >
                Original {filters.sortBy === 'amount' && (filters.sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead className="text-right whitespace-nowrap">Outstanding</TableHead>
              <TableHead 
                className="text-center cursor-pointer hover:bg-muted/50 whitespace-nowrap"
                onClick={() => handleSort('daysOverdue')}
              >
                Days {filters.sortBy === 'daysOverdue' && (filters.sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead className="text-center whitespace-nowrap">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}>
                      <div className="h-4 bg-muted animate-pulse rounded" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data?.debts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No outstanding debts found
                </TableCell>
              </TableRow>
            ) : (
              data?.debts.map((debt) => (
                <TableRow key={debt.id}>
                  <TableCell className="whitespace-nowrap">{formatDate(debt.created_at)}</TableCell>
                  <TableCell className="font-mono text-sm whitespace-nowrap">{debt.transaction_number}</TableCell>
                  <TableCell>{debt.customer?.name || 'Walk-in'}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">{formatCurrency(debt.total)}</TableCell>
                  <TableCell className="text-right font-semibold whitespace-nowrap">
                    {formatCurrency(debt.outstanding_balance)}
                  </TableCell>
                  <TableCell className={`text-center font-medium whitespace-nowrap ${debt.status === 'completed' ? 'text-emerald-600 dark:text-emerald-400' : getDaysOverdueColor(debt.days_overdue)}`}>
                    {debt.status === 'completed' ? 'Cleared' : debt.days_overdue}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="sm" onClick={() => onSelectDebt?.(debt)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between p-4 border-t">
          <p className="text-sm text-muted-foreground">
            Showing {((data.page - 1) * data.pageSize) + 1} to{' '}
            {Math.min(data.page * data.pageSize, data.total)} of {data.total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(data.page - 1)}
              disabled={data.page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(data.page + 1)}
              disabled={data.page >= data.totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
