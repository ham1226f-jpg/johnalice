'use client'

import { useState, useEffect } from 'react'
import { useCustomers, useCustomerTransactions } from '@/hooks/useCustomers'
import { Customer } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { User, Plus, X, History } from 'lucide-react'
import { useCreateCustomer } from '@/hooks/useCustomers'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface CustomerSelectorProps {
  selectedCustomer: Customer | null
  onSelectCustomer: (customer: Customer | null) => void
}

export function CustomerSelector({ selectedCustomer, onSelectCustomer }: CustomerSelectorProps) {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const { data: customersData } = useCustomers({ search: debouncedSearch })
  const customers = customersData?.customers || []

  return (
    <div className="space-y-2">
      <Label>Customer (Optional)</Label>
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Select
            value={selectedCustomer?.id || 'none'}
            onValueChange={(value) => {
              if (value === 'none') {
                onSelectCustomer(null)
              } else {
                const customer = customers.find(c => c.id === value)
                if (customer) onSelectCustomer(customer)
              }
            }}
          >
            <SelectTrigger className="pl-9">
              <SelectValue placeholder="Walk-in customer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Walk-in customer</SelectItem>
              {customers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.name} {customer.phone && `(${customer.phone})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsAddModalOpen(true)}
          title="Add new customer"
        >
          <Plus className="h-4 w-4" />
        </Button>

        {selectedCustomer && (
          <>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsHistoryOpen(true)}
              title="View purchase history"
            >
              <History className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onSelectCustomer(null)}
              title="Clear customer"
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {selectedCustomer && (
        <div className="text-sm text-muted-foreground">
          {selectedCustomer.email && <div>Email: {selectedCustomer.email}</div>}
          <div>Total purchases: KSH {Number(selectedCustomer.total_purchases).toLocaleString()}</div>
        </div>
      )}

      <AddCustomerModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onCustomerAdded={onSelectCustomer}
      />

      {selectedCustomer && (
        <CustomerHistoryModal
          customer={selectedCustomer}
          open={isHistoryOpen}
          onOpenChange={setIsHistoryOpen}
        />
      )}
    </div>
  )
}

interface AddCustomerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCustomerAdded: (customer: Customer) => void
}

function AddCustomerModal({ open, onOpenChange, onCustomerAdded }: AddCustomerModalProps) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const createCustomer = useCreateCustomer()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      toast.error('Customer name is required')
      return
    }

    try {
      const customer = await createCustomer.mutateAsync({
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
      })
      toast.success('Customer added successfully')
      onCustomerAdded(customer)
      onOpenChange(false)
      setName('')
      setPhone('')
      setEmail('')
    } catch (error: any) {
      toast.error(error.message || 'Failed to add customer')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Customer</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+254 700 000 000"
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createCustomer.isPending}>
              {createCustomer.isPending ? 'Adding...' : 'Add Customer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface CustomerHistoryModalProps {
  customer: Customer
  open: boolean
  onOpenChange: (open: boolean) => void
}

function CustomerHistoryModal({ customer, open, onOpenChange }: CustomerHistoryModalProps) {
  const { data: transactions = [], isLoading } = useCustomerTransactions(customer.id)

  const formatCurrency = (value: number) => {
    return `KSH ${value.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Purchase History - {customer.name}</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Loading...</div>
        ) : transactions.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">No purchase history</div>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction: any) => (
              <div key={transaction.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-medium">{transaction.transaction_number}</div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(transaction.created_at), 'MMM dd, yyyy HH:mm')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(transaction.total)}</div>
                    <div className="text-sm text-muted-foreground capitalize">
                      {transaction.payment_method}
                    </div>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {transaction.items?.length || 0} items
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
