'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useRecordPayment } from '@/hooks/useDebts'
import { useAuth } from '@/contexts/AuthContext'
import { DebtTransaction } from '@/types'

interface DebtPaymentDialogProps {
  debt: DebtTransaction | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

function formatCurrency(amount: number | null | undefined) {
  const value = amount ?? 0
  return `KSH ${value.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export function DebtPaymentDialog({
  debt,
  open,
  onOpenChange,
  onSuccess,
}: DebtPaymentDialogProps) {
  const { tenant } = useAuth()
  const currency = tenant?.settings?.currency || 'KES'
  const recordPayment = useRecordPayment()

  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mpesa' | 'bank'>('cash')

  const outstandingBalance = debt?.outstanding_balance || 0
  const parsedAmount = parseFloat(amount) || 0
  const isValidAmount = parsedAmount > 0 && parsedAmount <= outstandingBalance

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!debt || !isValidAmount) return

    try {
      await recordPayment.mutateAsync({
        transaction_id: debt.id,
        amount: parsedAmount,
        payment_method: paymentMethod,
      })

      toast.success('Payment recorded successfully')
      setAmount('')
      setPaymentMethod('cash')
      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      toast.error(error.message || 'Failed to record payment')
    }
  }

  const handlePayFull = () => {
    setAmount(outstandingBalance.toString())
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>

        {debt && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Transaction</span>
                <span className="font-mono">{debt.transaction_number}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Customer</span>
                <span>{debt.customer?.name || 'Walk-in'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Original Amount</span>
                <span>{formatCurrency(debt.total)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Outstanding Balance</span>
                <span className="text-orange-600">
                  {formatCurrency(outstandingBalance)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Payment Amount</Label>
              <div className="flex gap-2">
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  max={outstandingBalance}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                />
                <Button type="button" variant="outline" onClick={handlePayFull}>
                  Pay Full
                </Button>
              </div>
              {parsedAmount > outstandingBalance && (
                <p className="text-sm text-red-500">
                  Amount exceeds outstanding balance
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-method">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                <SelectTrigger id="payment-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="mpesa">M-Pesa</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isValidAmount && (
              <div className="bg-green-50 dark:bg-green-950 rounded-lg p-3 text-sm">
                <p className="text-green-700 dark:text-green-300">
                  After this payment, remaining balance will be:{' '}
                  <strong>{formatCurrency(outstandingBalance - parsedAmount)}</strong>
                </p>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!isValidAmount || recordPayment.isPending}
              >
                {recordPayment.isPending ? 'Recording...' : 'Record Payment'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
