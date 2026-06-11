'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useProducts } from '@/hooks/useProducts'
import { useCreatePurchaseOrder, useUpdatePurchaseOrder, useSuppliers } from '@/hooks/usePurchaseOrders'
import { useStore } from '@/contexts/StoreContext'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Plus, Trash2, UserPlus } from 'lucide-react'

interface PurchaseOrderFormProps {
  po?: any
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PurchaseOrderForm({ po, open, onOpenChange }: PurchaseOrderFormProps) {
  const { currentStore } = useStore()
  const [supplierName, setSupplierName] = useState('')
  const [supplierContact, setSupplierContact] = useState('')
  const [expectedDelivery, setExpectedDelivery] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<any[]>([])
  const [isNewSupplier, setIsNewSupplier] = useState(false)

  const { data: productsData } = useProducts({ pageSize: 100 })
  const { data: suppliers = [] } = useSuppliers()
  const products = productsData?.products || []
  const createPO = useCreatePurchaseOrder()
  const updatePO = useUpdatePurchaseOrder()

  const handleSupplierSelect = (supplierNameValue: string) => {
    if (supplierNameValue === '__new__') {
      setIsNewSupplier(true)
      setSupplierName('')
      setSupplierContact('')
    } else {
      setIsNewSupplier(false)
      setSupplierName(supplierNameValue)
      const supplier = suppliers.find(s => s.name === supplierNameValue)
      setSupplierContact(supplier?.contact || '')
    }
  }

  useEffect(() => {
    if (po) {
      setSupplierName(po.supplier_name)
      setSupplierContact(po.supplier_contact || '')
      setExpectedDelivery(po.expected_delivery_date.split('T')[0])
      setNotes(po.notes || '')
      setItems(po.items || [])
      setIsNewSupplier(false)
    } else {
      setSupplierName('')
      setSupplierContact('')
      setExpectedDelivery('')
      setNotes('')
      setItems([])
      setIsNewSupplier(suppliers.length === 0)
    }
  }, [po, open, suppliers.length])

  const addItem = () => {
    setItems([...items, { product_id: '', product_name: '', quantity: 1, cost_per_unit: 0 }])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items]
    newItems[index][field] = value
    if (field === 'product_id') {
      const product = products.find(p => p.id === value)
      if (product) {
        newItems[index].product_name = product.name
        newItems[index].cost_per_unit = Number(product.cost)
      }
    }
    setItems(newItems)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentStore) {
      toast.error('No store selected')
      return
    }

    if (!supplierName || !expectedDelivery || items.length === 0) {
      toast.error('Please fill all required fields and add at least one item')
      return
    }

    try {
      const input = {
        supplier_name: supplierName,
        supplier_contact: supplierContact || undefined,
        expected_delivery_date: expectedDelivery,
        notes: notes || undefined,
        store_id: currentStore.id,
        items: items.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: Number(item.quantity),
          cost_per_unit: Number(item.cost_per_unit),
        })),
      }

      if (po) {
        await updatePO.mutateAsync({ id: po.id, ...input })
        toast.success('Purchase order updated')
      } else {
        await createPO.mutateAsync(input)
        toast.success('Purchase order created')
      }
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.message || 'Failed to save purchase order')
    }
  }

  const totalCost = items.reduce((sum, item) => sum + (item.quantity * item.cost_per_unit), 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{po ? 'Edit' : 'Create'} Purchase Order</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Store Display */}
          {currentStore && (
            <div className="p-3 bg-muted/50 rounded-md border">
              <Label className="text-xs text-muted-foreground">Store</Label>
              <p className="font-medium">{currentStore.name}</p>
            </div>
          )}

          <div className="space-y-4">
            {suppliers.length > 0 && !po && (
              <div>
                <Label>Select Supplier</Label>
                <Select 
                  value={isNewSupplier ? '__new__' : supplierName} 
                  onValueChange={handleSupplierSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose existing or add new" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.name} value={supplier.name}>
                        {supplier.name} {supplier.contact && `(${supplier.contact})`}
                      </SelectItem>
                    ))}
                    <SelectItem value="__new__">
                      <span className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4" />
                        Add New Supplier
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {(isNewSupplier || suppliers.length === 0 || po) && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Supplier Name *</Label>
                  <Input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} required />
                </div>
                <div>
                  <Label>Supplier Contact</Label>
                  <Input value={supplierContact} onChange={(e) => setSupplierContact(e.target.value)} />
                </div>
              </div>
            )}
          </div>

          <div>
            <Label>Expected Delivery Date *</Label>
            <Input type="date" value={expectedDelivery} onChange={(e) => setExpectedDelivery(e.target.value)} required />
          </div>

          <div>
            <Label>Notes</Label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background"
              rows={2}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Items *</Label>
              <Button type="button" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>

            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Select value={item.product_id} onValueChange={(value) => updateItem(index, 'product_id', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} ({product.sku})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-24">
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                      min={1}
                    />
                  </div>
                  <div className="w-32">
                    <Input
                      type="number"
                      placeholder="Cost"
                      value={item.cost_per_unit}
                      onChange={(e) => updateItem(index, 'cost_per_unit', e.target.value)}
                      step="0.01"
                      min={0}
                    />
                  </div>
                  <div className="w-32 text-right font-medium">
                    KSH {(item.quantity * item.cost_per_unit).toFixed(2)}
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>

            {items.length > 0 && (
              <div className="flex justify-end pt-2 border-t mt-2">
                <div className="text-lg font-bold">
                  Total: KSH {totalCost.toFixed(2)}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createPO.isPending || updatePO.isPending}>
              {createPO.isPending || updatePO.isPending ? 'Saving...' : po ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
