'use client'

import { useEffect, useState } from 'react'
import { useTransaction } from '@/hooks/useTransactions'
import { useAuth } from '@/contexts/AuthContext'
import { useStore } from '@/contexts/StoreContext'
import { format } from 'date-fns'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { getReceiptSettings, ReceiptSettings } from '@/lib/services/receipt-settings'

interface ReceiptPrintProps {
  transactionId: string
  autoPrint?: boolean
}

export function ReceiptPrint({ transactionId, autoPrint = false }: ReceiptPrintProps) {
  const { data: transaction, isLoading } = useTransaction(transactionId)
  const { tenant } = useAuth()
  const { currentStore } = useStore()
  const [receiptSettings, setReceiptSettings] = useState<ReceiptSettings | null>(null)

  useEffect(() => {
    if (tenant?.id && currentStore?.id) {
      getReceiptSettings(tenant.id, currentStore.id)
        .then(setReceiptSettings)
        .catch(console.error)
    }
  }, [tenant?.id, currentStore?.id])

  useEffect(() => {
    if (autoPrint && transaction && !isLoading) {
      setTimeout(() => {
        window.print()
      }, 500)
    }
  }, [autoPrint, transaction, isLoading])

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    )
  }

  if (!transaction) {
    return <div className="text-center py-12 text-muted-foreground">Transaction not found</div>
  }

  const formatCurrency = (value: number) => {
    return `KSH ${value.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  // Calculate total tax from items
  const totalTax = transaction.items?.reduce((sum: number, item: any) => {
    return sum + (item.tax_amount || 0)
  }, 0) || 0

  const hasTax = totalTax > 0

  return (
    <div className="max-w-sm mx-auto p-6 font-mono text-sm">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold mb-2">
          {receiptSettings?.business_name || tenant?.name || 'Smart POS'}
        </h1>
        {receiptSettings?.address && (
          <div className="text-xs mt-1">{receiptSettings.address}</div>
        )}
        {receiptSettings?.phone && (
          <div className="text-xs mt-1">{receiptSettings.phone}</div>
        )}
        {receiptSettings?.email && (
          <div className="text-xs">{receiptSettings.email}</div>
        )}
        {receiptSettings?.additional_info && (
          <div className="text-xs mt-1 whitespace-pre-line">{receiptSettings.additional_info}</div>
        )}
      </div>

      <div className="border-t border-b border-dashed py-2 mb-4 text-xs">
        <div>Receipt #: {transaction.transaction_number}</div>
        <div>Date: {format(new Date(transaction.created_at), 'dd/MM/yyyy, HH:mm:ss')}</div>
        <div>Served by: {transaction.served_by_user?.full_name || 'Staff'}</div>
        <div>Payment: {transaction.payment_method.toUpperCase()}</div>
        {transaction.customer && (
          <div>Customer: {transaction.customer.name}</div>
        )}
      </div>

      {/* Items */}
      <div className="mb-4">
        <div className="flex justify-between text-xs font-bold mb-2">
          <span>ITEM DETAILS</span>
          <span>QTY</span>
          <span>TOTAL</span>
        </div>
        
        <div className="space-y-2 text-xs">
          {transaction.items?.map((item: any) => (
            <div key={item.id}>
              <div className="flex justify-between">
                <span className="flex-1">{item.product_name}</span>
                <span className="w-8 text-center">{item.quantity}</span>
                <span className="w-20 text-right">{formatCurrency(item.subtotal)}</span>
              </div>
              <div className="text-gray-600 text-xs">
                Unit: {formatCurrency(item.unit_price)}
                {item.tax_rate && ` | Tax: ${item.tax_rate}%`}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="border-t pt-2 space-y-1 text-xs mb-4">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{formatCurrency(transaction.subtotal)}</span>
        </div>
        {hasTax && (
          <div className="flex justify-between">
            <span>Tax:</span>
            <span>{formatCurrency(totalTax)}</span>
          </div>
        )}
        {transaction.discount_amount > 0 && (
          <div className="flex justify-between">
            <span>
              Discount ({transaction.discount_type === 'percentage' ? `${transaction.discount_value}%` : 'Fixed'}):
            </span>
            <span>-{formatCurrency(transaction.discount_amount)}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-bold">
          <span>TOTAL:</span>
          <span>{formatCurrency(transaction.total)}</span>
        </div>
      </div>

      {/* Payment Info */}
      {transaction.status === 'debt_pending' && (
        <div className="border-t border-dashed pt-2 mb-4 text-xs">
          <div className="flex justify-between">
            <span>Outstanding Balance:</span>
            <span className="font-medium">{formatCurrency(transaction.outstanding_balance)}</span>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-xs text-muted-foreground border-t border-dashed pt-4">
        <div className="whitespace-pre-line">{receiptSettings?.footer_text || 'Thank you for your business!'}</div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .max-w-sm,
          .max-w-sm * {
            visibility: visible;
          }
          .max-w-sm {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
          }
          @page {
            size: 80mm auto;
            margin: 0;
          }
        }
      `}</style>
    </div>
  )
}
