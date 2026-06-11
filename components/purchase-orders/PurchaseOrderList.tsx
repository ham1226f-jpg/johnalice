'use client'

import { useState, useMemo } from 'react'
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { SemanticBadge } from '@/components/ui/semantic-badge'
import { MonetaryValue } from '@/components/ui/value-display'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { PurchaseOrderForm } from './PurchaseOrderForm'
import { PurchaseOrderDetails } from './PurchaseOrderDetails'
import { DateFilter, DateFilterOption, getDateRange } from '@/components/dashboard/DateFilter'
import { format } from 'date-fns'
import { Plus, Eye, ChevronLeft, ChevronRight } from 'lucide-react'

export function PurchaseOrderList() {
  const [status, setStatus] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('all')
  const [customDate, setCustomDate] = useState<Date>(new Date())
  const [page, setPage] = useState(1)
  const [selectedPO, setSelectedPO] = useState<any>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  const pageSize = 20
  const dateRange = useMemo(() => getDateRange(dateFilter, customDate), [dateFilter, customDate])
  
  const { data, isLoading } = usePurchaseOrders({ 
    status: status === 'all' ? undefined : status, 
    dateFrom: dateRange.startDate?.toISOString(),
    dateTo: dateRange.endDate?.toISOString(),
    page, 
    pageSize 
  })

  const formatCurrency = (value: number) => {
    return `KSH ${value.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const getStatusVariant = (status: string): 'success' | 'pending' | 'info' | 'inactive' => {
    switch (status) {
      case 'completed': return 'success'
      case 'received': return 'pending'
      case 'ordered': return 'info'
      default: return 'inactive' // draft
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Purchase Orders</h2>
          <p className="text-sm text-muted-foreground">{data?.total || 0} total orders</p>
        </div>
        <Button onClick={() => { setSelectedPO(null); setIsFormOpen(true) }}>
          <Plus className="h-4 w-4 mr-2" />
          New Purchase Order
        </Button>
      </div>

      <div className="flex gap-4 flex-wrap" data-tour="po-filters">
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
        <Select value={status} onValueChange={(value) => { setStatus(value); setPage(1) }}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="ordered">Ordered</SelectItem>
            <SelectItem value="received">Received</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      ) : !data?.purchaseOrders || data.purchaseOrders.length === 0 ? (
        <div className="text-center py-12 bg-card border rounded-lg">
          <p className="text-muted-foreground">No purchase orders found</p>
        </div>
      ) : (
        <>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO #</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Expected Delivery</TableHead>
                  <TableHead className="text-right">Total Cost</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.purchaseOrders.map((po: any) => (
                  <TableRow key={po.id}>
                    <TableCell className="font-mono text-sm">{po.po_number}</TableCell>
                    <TableCell>
                      <div className="font-medium">{po.supplier_name}</div>
                      {po.supplier_contact && (
                        <div className="text-sm text-muted-foreground">{po.supplier_contact}</div>
                      )}
                    </TableCell>
                    <TableCell>{format(new Date(po.expected_delivery_date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell className="text-right">
                      <MonetaryValue value={Number(po.total_cost)} type="cost" />
                    </TableCell>
                    <TableCell>
                      <SemanticBadge variant={getStatusVariant(po.status)}>{po.status}</SemanticBadge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedPO(po); setIsDetailsOpen(true) }}>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {data.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Page {page} of {data.totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages}>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <PurchaseOrderForm po={selectedPO} open={isFormOpen} onOpenChange={setIsFormOpen} />
      {selectedPO && <PurchaseOrderDetails po={selectedPO} open={isDetailsOpen} onOpenChange={setIsDetailsOpen} />}
    </div>
  )
}
