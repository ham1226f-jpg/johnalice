'use client'

import { Return } from '@/lib/services/returns'
import { useApproveReturn, useRejectReturn, useRevertReturnToPending } from '@/hooks/useReturns'
import { useAuth } from '@/contexts/AuthContext'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { CheckCircle, XCircle, Clock, Package, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'

interface ReturnDetailsModalProps {
  returnItem: Return | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const statusConfig = {
  pending: {
    label: 'Pending',
    icon: Clock,
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  },
  approved: {
    label: 'Approved',
    icon: CheckCircle,
    className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  },
}

export function ReturnDetailsModal({ returnItem, open, onOpenChange }: ReturnDetailsModalProps) {
  const { user } = useAuth()
  const [isProcessing, setIsProcessing] = useState(false)
  const approveReturn = useApproveReturn()
  const rejectReturn = useRejectReturn()
  const revertReturn = useRevertReturnToPending()

  if (!returnItem) return null

  const statusInfo = statusConfig[returnItem.status as keyof typeof statusConfig]
  const StatusIcon = statusInfo.icon
  const isAdmin = user?.role === 'admin'
  const isPending = returnItem.status === 'pending'

  const handleApprove = async () => {
    if (!confirm('Are you sure you want to approve this return? Stock will be restored.')) {
      return
    }

    setIsProcessing(true)
    try {
      await approveReturn.mutateAsync(returnItem.id)
      toast.success('Return approved successfully')
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve return')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!confirm('Are you sure you want to reject this return?')) {
      return
    }

    setIsProcessing(true)
    try {
      await rejectReturn.mutateAsync(returnItem.id)
      toast.success('Return rejected')
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject return')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRevert = async () => {
    const statusText = returnItem.status === 'approved' ? 'approved' : 'rejected'
    const warningText = returnItem.status === 'approved' 
      ? 'This will reverse the stock restoration.' 
      : ''
    
    if (!confirm(`Are you sure you want to revert this ${statusText} return back to pending? ${warningText}`)) {
      return
    }

    setIsProcessing(true)
    try {
      await revertReturn.mutateAsync(returnItem.id)
      toast.success('Return reverted to pending')
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.message || 'Failed to revert return')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Return Details</DialogTitle>
            <Badge className={statusInfo.className}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusInfo.label}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Return Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Return Number</p>
              <p className="font-semibold">{returnItem.return_number}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Transaction</p>
              <p className="font-semibold">
                {returnItem.transaction?.transaction_number}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Customer</p>
              <p className="font-semibold">
                {returnItem.transaction?.customer?.name || 'Walk-in'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created Date</p>
              <p className="font-semibold">
                {format(new Date(returnItem.created_at), 'MMM dd, yyyy HH:mm')}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created By</p>
              <p className="font-semibold">
                {returnItem.created_by_user?.full_name || 'Unknown'}
              </p>
            </div>
            {returnItem.approved_by_user && (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {returnItem.status === 'approved' ? 'Approved' : 'Rejected'} By
                  </p>
                  <p className="font-semibold">{returnItem.approved_by_user.full_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {returnItem.status === 'approved' ? 'Approved' : 'Rejected'} At
                  </p>
                  <p className="font-semibold">
                    {format(new Date(returnItem.approved_at!), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Reason */}
          <div>
            <p className="text-sm text-muted-foreground mb-1">Reason for Return</p>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm">{returnItem.reason}</p>
            </div>
          </div>

          {/* Return Items */}
          <div>
            <p className="text-sm font-medium mb-3">Returned Items</p>
            <div className="space-y-2">
              {returnItem.return_items?.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 border border-border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <Package className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{item.product?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        SKU: {item.product?.sku} • KSH {item.unit_price.toFixed(2)} each
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {item.quantity} × KSH {item.unit_price.toFixed(2)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      KSH {item.subtotal.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <span className="font-semibold">Total Return Amount</span>
            <span className="text-xl font-bold">KSH {returnItem.total_amount.toFixed(2)}</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {isAdmin && isPending && (
            <>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={isProcessing}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button onClick={handleApprove} disabled={isProcessing}>
                <CheckCircle className="h-4 w-4 mr-2" />
                {isProcessing ? 'Processing...' : 'Approve & Restore Stock'}
              </Button>
            </>
          )}
          {isAdmin && !isPending && (
            <Button
              variant="outline"
              onClick={handleRevert}
              disabled={isProcessing}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              {isProcessing ? 'Reverting...' : 'Revert to Pending'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
