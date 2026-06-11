'use client'

import { Product } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Minus, Plus, Trash2, ShoppingCart } from 'lucide-react'

export interface CartItem {
  product: Product
  quantity: number
  customPrice?: number
}

interface CartProps {
  items: CartItem[]
  discount: number
  onUpdateQuantity: (productId: string, quantity: number) => void
  onRemoveItem: (productId: string) => void
  onUpdateDiscount: (discount: number) => void
  onClearCart: () => void
  onCheckout: () => void
}

export function Cart({
  items,
  discount,
  onUpdateQuantity,
  onRemoveItem,
  onUpdateDiscount,
  onClearCart,
  onCheckout,
}: CartProps) {
  const formatCurrency = (value: number) => {
    return `KSH ${value.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const subtotal = items.reduce((sum, item) => {
    return sum + Number(item.product.price) * item.quantity
  }, 0)

  const discountAmount = discount > 0 ? (discount <= 100 ? subtotal * (discount / 100) : discount) : 0
  const total = Math.max(0, subtotal - discountAmount)

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return
    const item = items.find(i => i.product.id === productId)
    if (item && newQuantity > Number(item.product.stock_quantity)) {
      return
    }
    onUpdateQuantity(productId, newQuantity)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Cart</h2>
            <span className="text-sm text-muted-foreground">({items.length} items)</span>
          </div>
          {items.length > 0 && (
            <Button variant="ghost" size="sm" onClick={onClearCart}>
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {items.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Cart is empty</p>
            <p className="text-sm mt-1">Search and add products to get started</p>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.product.id} className="border rounded-lg p-3">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-medium">{item.product.name}</h3>
                  <p className="text-sm text-muted-foreground">{item.product.sku}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveItem(item.product.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuantityChange(item.product.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1
                      handleQuantityChange(item.product.id, val)
                    }}
                    className="w-16 text-center"
                    min={1}
                    max={Number(item.product.stock_quantity)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuantityChange(item.product.id, item.quantity + 1)}
                    disabled={item.quantity >= Number(item.product.stock_quantity)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">
                    {formatCurrency(Number(item.product.price))} × {item.quantity}
                  </div>
                  <div className="font-semibold">
                    {formatCurrency(Number(item.product.price) * item.quantity)}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary */}
      {items.length > 0 && (
        <div className="border-t p-4 space-y-4">
          <div>
            <Label htmlFor="discount">Discount</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="discount"
                type="number"
                value={discount || ''}
                onChange={(e) => onUpdateDiscount(Number(e.target.value) || 0)}
                placeholder="0"
                min={0}
              />
              <Button
                variant="outline"
                onClick={() => onUpdateDiscount(0)}
                disabled={discount === 0}
              >
                Clear
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Enter percentage (1-100) or fixed amount
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-green-600 dark:text-green-500">
                <span>Discount</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          <Button
            className="w-full h-12 text-lg"
            onClick={onCheckout}
            disabled={items.length === 0}
          >
            Checkout
          </Button>
        </div>
      )}
    </div>
  )
}
