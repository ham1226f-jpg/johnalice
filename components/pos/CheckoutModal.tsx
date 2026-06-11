'use client'

import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CartItem } from './Cart'
import { Customer } from '@/types'
import { useCreateTransaction } from '@/hooks/useTransactions'
import { useCustomerCreditStatus, useCustomers, useCreateCustomerWithCredit } from '@/hooks/useCustomers'
import { useAuth } from '@/contexts/AuthContext'
import { useStore } from '@/contexts/StoreContext'
import { toast } from 'sonner'
import { Loader2, Search, X, User, Plus, ChevronDown, ChevronUp } from 'lucide-react'

interface CheckoutModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: CartItem[]
  subtotal: number
  discount: number
  total: number
  customer: Customer | null
  onCustomerChange?: (customer: Customer | null) => void
  onSuccess: (transactionId: string) => void
}

export function CheckoutModal({
  open,
  onOpenChange,
  items,
  subtotal,
  discount,
  total,
  customer,
  onCustomerChange,
  onSuccess,
}: CheckoutModalProps) {
  const { user } = useAuth()
  const { currentStore } = useStore()
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mpesa' | 'bank' | 'debt'>('cash')
  const [amountReceived, setAmountReceived] = useState<number>(total)
  const createTransaction = useCreateTransaction()
  const createCustomerWithCredit = useCreateCustomerWithCredit()
  
  // Inline customer creation state
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false)
  const [newCustomerName, setNewCustomerName] = useState('')
  const [newCustomerPhone, setNewCustomerPhone] = useState('')
  const [newCustomerEmail, setNewCustomerEmail] = useState('')
  const [newCustomerCreditLimit, setNewCustomerCreditLimit] = useState('')
  
  // Deposit/partial payment state for debt
  const [depositAmount, setDepositAmount] = useState('')
  
  // Customer search state
  const [customerSearch, setCustomerSearch] = useState('')
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  // Fetch customers for search (filtered by current store)
  const { data: customersData, isLoading: customersLoading } = useCustomers({ 
    search: customerSearch, 
    pageSize: 10 
  })

  // Fetch real-time credit status when customer is selected
  const { data: creditStatus, isLoading: creditLoading } = useCustomerCreditStatus(customer?.id || '')
  
  // Reset new customer form when payment method changes or customer is selected
  useEffect(() => {
    if (paymentMethod !== 'debt' || customer) {
      setShowNewCustomerForm(false)
      setNewCustomerName('')
      setNewCustomerPhone('')
      setNewCustomerEmail('')
      setNewCustomerCreditLimit('')
    }
    if (paymentMethod !== 'debt') {
      setDepositAmount('')
    }
  }, [paymentMethod, customer])
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchInputRef.current && !searchInputRef.current.contains(e.target as Node)) {
        setShowCustomerDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  const handleSelectCustomer = (selectedCustomer: Customer) => {
    onCustomerChange?.(selectedCustomer)
    setCustomerSearch('')
    setShowCustomerDropdown(false)
  }
  
  const handleClearCustomer = () => {
    onCustomerChange?.(null)
    setCustomerSearch('')
  }
  
  const change = paymentMethod === 'cash' ? Math.max(0, amountReceived - total) : 0
  const isValidPayment = paymentMethod !== 'cash' || amountReceived >= total
  const requiresCustomer = paymentMethod === 'debt'
  
  // Validate new customer form
  const deposit = depositAmount ? parseFloat(depositAmount) : 0
  const remainingDebt = total - deposit
  const isNewCustomerFormValid = 
    newCustomerName.trim() !== '' &&
    newCustomerCreditLimit !== '' &&
    parseFloat(newCustomerCreditLimit) >= remainingDebt
  
  const hasRequiredCustomer = !requiresCustomer || customer !== null || (showNewCustomerForm && isNewCustomerFormValid)
  
  // Credit validation for debt payments
  const isCustomerCreditApproved = creditStatus?.customer?.is_credit_approved || false
  const availableCredit = creditStatus?.available_credit || 0
  const outstandingDebt = creditStatus?.outstanding_debt || 0
  const creditLimit = creditStatus?.customer?.credit_limit || 0
  
  // For new customers, use the entered credit limit
  const effectiveCreditLimit = showNewCustomerForm && newCustomerCreditLimit 
    ? parseFloat(newCustomerCreditLimit) 
    : creditLimit
  const effectiveAvailableCredit = showNewCustomerForm && newCustomerCreditLimit
    ? parseFloat(newCustomerCreditLimit)
    : availableCredit
  
  const canAffordDebt = paymentMethod !== 'debt' || (
    (customer || showNewCustomerForm) && 
    (isCustomerCreditApproved || showNewCustomerForm) && 
    effectiveAvailableCredit >= remainingDebt
  )

  const formatCurrency = (value: number) => {
    return `KSH ${value.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const handleCheckout = async () => {
    if (!isValidPayment) {
      toast.error('Amount received must be greater than or equal to total')
      return
    }

    if (!user?.id) {
      toast.error('User not authenticated')
      return
    }

    if (!currentStore) {
      toast.error('No store selected')
      return
    }

    if (paymentMethod === 'debt' && !customer && !showNewCustomerForm) {
      toast.error('Please select a customer or create a new one for debt payments')
      return
    }

    try {
      let finalCustomer = customer
      
      // Validate deposit if provided
      if (deposit < 0) {
        toast.error('Deposit amount cannot be negative')
        return
      }
      if (deposit > total) {
        toast.error('Deposit cannot exceed sale total')
        return
      }
      
      // Create customer with credit if using new customer form
      if (paymentMethod === 'debt' && showNewCustomerForm && !customer) {
        if (!newCustomerName.trim()) {
          toast.error('Customer name is required')
          return
        }
        
        const creditLimit = parseFloat(newCustomerCreditLimit)
        if (!creditLimit || creditLimit <= 0) {
          toast.error('Credit limit must be greater than zero')
          return
        }
        
        if (creditLimit < remainingDebt) {
          toast.error(`Credit limit must be at least ${formatCurrency(remainingDebt)} (remaining after deposit)`)
          return
        }
        
        finalCustomer = await createCustomerWithCredit.mutateAsync({
          name: newCustomerName.trim(),
          phone: newCustomerPhone.trim() || undefined,
          email: newCustomerEmail.trim() || undefined,
          credit_limit: creditLimit,
          store_id: currentStore.id,
        })
        
        toast.success('Customer created with credit approval')
      }

      if (paymentMethod === 'debt' && !finalCustomer) {
        toast.error('A customer must be selected for debt payments')
        return
      }

      if (paymentMethod === 'debt' && finalCustomer && !finalCustomer.is_credit_approved) {
        toast.error('Customer is not approved for credit purchases')
        return
      }

      if (paymentMethod === 'debt' && finalCustomer && creditStatus) {
        if (creditStatus.available_credit < remainingDebt) {
          toast.error(`Insufficient credit limit. Available: ${formatCurrency(creditStatus.available_credit)}, Needed: ${formatCurrency(remainingDebt)}`)
          return
        }
      }

      const discountAmount = discount > 0 ? discount : 0
      
      const transaction = await createTransaction.mutateAsync({
        customer_id: finalCustomer?.id,
        served_by: user.id,
        store_id: currentStore.id,
        items: items.map((item) => ({
          product_id: item.product.id,
          product_name: item.product.name,
          product_sku: item.product.sku,
          quantity: item.quantity,
          unit_price: item.customPrice !== undefined ? item.customPrice : Number(item.product.price),
        })),
        subtotal,
        discount_type: 'fixed',
        discount_value: discount,
        discount_amount: discountAmount,
        total,
        payment_method: paymentMethod,
        amount_tendered: paymentMethod === 'cash' ? amountReceived : undefined,
        deposit_amount: paymentMethod === 'debt' && deposit > 0 ? deposit : undefined,
      })

      toast.success('Transaction completed successfully')
      onSuccess(transaction.id)
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.message || 'Failed to complete transaction')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Checkout</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto flex-1 pr-2">
          {/* Order Summary */}
          <div className="border rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Items</span>
              <span>{items.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-green-600 dark:text-green-500">
                <span>Discount</span>
                <span>-{formatCurrency(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Customer Info */}
          {customer && (
            <div className="border rounded-lg p-4">
              <div className="text-sm font-medium mb-1">Customer</div>
              <div className="text-sm text-muted-foreground">{customer.name}</div>
              {customer.phone && <div className="text-sm text-muted-foreground">{customer.phone}</div>}
            </div>
          )}

          {/* Served By */}
          <div>
            <Label htmlFor="served-by">Served By</Label>
            <Input
              id="served-by"
              value={user?.full_name || ''}
              disabled
              className="bg-muted"
            />
          </div>

          {/* Payment Method */}
          <div>
            <Label htmlFor="payment-method">Payment Method *</Label>
            <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
              <SelectTrigger id="payment-method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="mpesa">M-Pesa</SelectItem>
                <SelectItem value="bank">Bank Transfer</SelectItem>
                <SelectItem value="debt">Debt (Pay Later)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Debt Payment Info */}
          {paymentMethod === 'debt' && (
            <>
              {/* Customer Selection or New Customer Form */}
              <div className="space-y-2">
                <Label>Customer for Debt *</Label>
                {customer ? (
                  <div className="flex items-center justify-between border rounded-lg p-3 bg-muted/30">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{customer.name}</p>
                        {customer.phone && <p className="text-xs text-muted-foreground">{customer.phone}</p>}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleClearCustomer}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="relative" ref={searchInputRef}>
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search existing customers..."
                        value={customerSearch}
                        onChange={(e) => {
                          setCustomerSearch(e.target.value)
                          setShowCustomerDropdown(true)
                        }}
                        onFocus={() => setShowCustomerDropdown(true)}
                        className="pl-9"
                      />
                      {showCustomerDropdown && (
                        <div className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {customersLoading ? (
                            <div className="p-3 text-center text-sm text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                              Searching...
                            </div>
                          ) : customersData?.customers && customersData.customers.length > 0 ? (
                            customersData.customers.map((c) => (
                              <button
                                key={c.id}
                                className="w-full px-3 py-2 text-left hover:bg-muted flex items-center gap-2 border-b last:border-0"
                                onClick={() => handleSelectCustomer(c)}
                              >
                                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                  <User className="h-3 w-3 text-primary" />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium text-sm truncate">{c.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {c.phone || c.email || 'No contact'}
                                    {c.is_credit_approved && (
                                      <span className="ml-2 text-green-600">• Credit Approved</span>
                                    )}
                                  </p>
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="p-3 text-center text-sm text-muted-foreground">
                              {customerSearch ? 'No customers found' : 'Type to search customers'}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* New Customer Button */}
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowNewCustomerForm(!showNewCustomerForm)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {showNewCustomerForm ? 'Cancel' : 'Create New Customer with Credit'}
                      {showNewCustomerForm ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
                    </Button>
                    
                    {/* Inline New Customer Form */}
                    {showNewCustomerForm && (
                      <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                        <p className="text-sm font-medium text-muted-foreground">New Customer Details</p>
                        
                        <div className="space-y-2">
                          <Label htmlFor="new-customer-name" className="text-xs">Name *</Label>
                          <Input
                            id="new-customer-name"
                            placeholder="Customer name"
                            value={newCustomerName}
                            onChange={(e) => setNewCustomerName(e.target.value)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="new-customer-phone" className="text-xs">Phone</Label>
                          <Input
                            id="new-customer-phone"
                            placeholder="+254 700 000 000"
                            value={newCustomerPhone}
                            onChange={(e) => setNewCustomerPhone(e.target.value)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="new-customer-email" className="text-xs">Email</Label>
                          <Input
                            id="new-customer-email"
                            type="email"
                            placeholder="customer@example.com"
                            value={newCustomerEmail}
                            onChange={(e) => setNewCustomerEmail(e.target.value)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="new-customer-credit" className="text-xs">Credit Limit *</Label>
                          <Input
                            id="new-customer-credit"
                            type="number"
                            step="0.01"
                            min={total}
                            placeholder={total.toFixed(2)}
                            value={newCustomerCreditLimit}
                            onChange={(e) => setNewCustomerCreditLimit(e.target.value)}
                          />
                          <p className="text-xs text-muted-foreground">
                            Minimum: {formatCurrency(total)} (sale total)
                          </p>
                        </div>
                        
                        {/* Credit Preview */}
                        {newCustomerCreditLimit && parseFloat(newCustomerCreditLimit) >= (total - (depositAmount ? parseFloat(depositAmount) : 0)) && (
                          <div className="border border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800 rounded-lg p-3 space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Credit Limit</span>
                              <span className="font-medium">{formatCurrency(parseFloat(newCustomerCreditLimit))}</span>
                            </div>
                            {depositAmount && parseFloat(depositAmount) > 0 && (
                              <>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Sale Total</span>
                                  <span>{formatCurrency(total)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Deposit</span>
                                  <span className="text-green-600">-{formatCurrency(parseFloat(depositAmount))}</span>
                                </div>
                              </>
                            )}
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Credit Used</span>
                              <span className="text-orange-600">{formatCurrency(total - (depositAmount ? parseFloat(depositAmount) : 0))}</span>
                            </div>
                            <div className="flex justify-between font-medium pt-1 border-t">
                              <span>Remaining Credit</span>
                              <span className="text-green-600">{formatCurrency(parseFloat(newCustomerCreditLimit) - (total - (depositAmount ? parseFloat(depositAmount) : 0)))}</span>
                            </div>
                          </div>
                        )}
                        
                        {newCustomerCreditLimit && parseFloat(newCustomerCreditLimit) < (total - (depositAmount ? parseFloat(depositAmount) : 0)) && (
                          <p className="text-xs text-red-500">
                            Credit limit must be at least {formatCurrency(total - (depositAmount ? parseFloat(depositAmount) : 0))} {depositAmount && parseFloat(depositAmount) > 0 ? '(after deposit)' : '(sale total)'}
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Credit Information */}
              {customer && (
                creditLoading ? (
                  <div className="border rounded-lg p-4 bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Loading credit information...</span>
                    </div>
                  </div>
                ) : (
                  <div className="border border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800 rounded-lg p-4 space-y-2">
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Credit Information</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Credit Approved</span>
                        <span className={isCustomerCreditApproved ? 'text-green-600' : 'text-red-600'}>
                          {isCustomerCreditApproved ? 'Yes' : 'No'}
                        </span>
                      </div>
                      {isCustomerCreditApproved && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Credit Limit</span>
                            <span>{formatCurrency(creditLimit)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Outstanding Debt</span>
                            <span className="text-orange-600">{formatCurrency(outstandingDebt)}</span>
                          </div>
                          <div className="flex justify-between font-medium pt-1 border-t">
                            <span>Available Credit</span>
                            <span className={availableCredit >= remainingDebt ? 'text-green-600' : 'text-red-600'}>
                              {formatCurrency(availableCredit)}
                            </span>
                          </div>
                          {deposit > 0 && (
                            <>
                              <div className="flex justify-between text-xs pt-1 border-t">
                                <span className="text-muted-foreground">Deposit Payment</span>
                                <span className="text-green-600">{formatCurrency(deposit)}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Credit Needed</span>
                                <span className="font-medium">{formatCurrency(remainingDebt)}</span>
                              </div>
                            </>
                          )}
                          {availableCredit >= remainingDebt && (
                            <div className="flex justify-between text-xs pt-1">
                              <span className="text-muted-foreground">After this sale</span>
                              <span className="text-muted-foreground">{formatCurrency(availableCredit - remainingDebt)}</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    {!isCustomerCreditApproved && (
                      <p className="text-xs text-red-500 mt-2">
                        This customer is not approved for credit. Please approve them in the Customers page first.
                      </p>
                    )}
                    {isCustomerCreditApproved && availableCredit < remainingDebt && (
                      <p className="text-xs text-red-500 mt-2">
                        {deposit > 0 
                          ? `Remaining amount after deposit (${formatCurrency(remainingDebt)}) exceeds available credit.`
                          : 'This sale exceeds the customer\'s available credit limit.'}
                      </p>
                    )}
                  </div>
                )
              )}
              
              {/* Deposit/Partial Payment */}
              {(customer || showNewCustomerForm) && (
                <div className="space-y-2">
                  <Label htmlFor="deposit-amount">Deposit / Partial Payment (Optional)</Label>
                  <Input
                    id="deposit-amount"
                    type="number"
                    step="0.01"
                    min="0"
                    max={total}
                    placeholder="0.00"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Customer can pay a deposit now. Remaining balance will be recorded as debt.
                  </p>
                  {deposit > 0 && (
                    <div className="text-xs space-y-1 p-2 bg-muted/50 rounded border">
                      <div className="flex justify-between">
                        <span>Sale Total:</span>
                        <span className="font-medium">{formatCurrency(total)}</span>
                      </div>
                      <div className="flex justify-between text-green-600">
                        <span>Deposit:</span>
                        <span className="font-medium">-{formatCurrency(deposit)}</span>
                      </div>
                      <div className="flex justify-between font-medium pt-1 border-t">
                        <span>Debt Balance:</span>
                        <span className="text-orange-600">{formatCurrency(remainingDebt)}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Cash Payment Fields */}
          {paymentMethod === 'cash' && (
            <>
              <div>
                <Label htmlFor="amount-received">Amount Received *</Label>
                <Input
                  id="amount-received"
                  type="number"
                  step="0.01"
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(Number(e.target.value) || 0)}
                  min={0}
                />
              </div>

              <div className="border rounded-lg p-4 bg-muted/50">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Change</span>
                  <span className={`text-lg font-bold ${change < 0 ? 'text-destructive' : ''}`}>
                    {formatCurrency(change)}
                  </span>
                </div>
                {change < 0 && (
                  <p className="text-xs text-destructive mt-1">
                    Insufficient amount received
                  </p>
                )}
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 flex-shrink-0 border-t bg-background sticky bottom-0">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={createTransaction.isPending || createCustomerWithCredit.isPending}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleCheckout}
              disabled={!isValidPayment || !hasRequiredCustomer || !canAffordDebt || createTransaction.isPending || createCustomerWithCredit.isPending}
            >
              {createTransaction.isPending || createCustomerWithCredit.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Complete Sale'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
