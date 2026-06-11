'use client'

import { useState, useEffect } from 'react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProductCardGrid } from '@/components/pos/ProductCardGrid'
import { FloatingCart, CartItem } from '@/components/pos/FloatingCart'
import { CustomerSelector } from '@/components/pos/CustomerSelector'
import { CheckoutModal } from '@/components/pos/CheckoutModal'
import { ReceiptPrint } from '@/components/pos/ReceiptPrint'
import { BarcodeScanner } from '@/components/pos/BarcodeScanner'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Product, Customer } from '@/types'
import { Printer, ScanBarcode } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { useStore } from '@/contexts/StoreContext'
import { createImmediateSale } from '@/lib/services/transactions'
import { getProductByBarcode } from '@/lib/services/products'

const CART_STORAGE_KEY = 'pos-cart'
const DISCOUNT_STORAGE_KEY = 'pos-discount'
const CUSTOMER_STORAGE_KEY = 'pos-customer'
const PARKED_CARTS_KEY = 'pos-parked-carts'

interface ParkedCart {
  id: string
  name: string
  items: CartItem[]
  discount: number
  customer: Customer | null
  parkedAt: string
}

export default function POSPage() {
  const { user } = useAuth()
  const { currentStore } = useStore()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [discount, setDiscount] = useState(0)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [completedTransactionId, setCompletedTransactionId] = useState<string | null>(null)
  const [isReceiptOpen, setIsReceiptOpen] = useState(false)
  const [isCartExpanded, setIsCartExpanded] = useState(false)
  const [parkedCarts, setParkedCarts] = useState<ParkedCart[]>([])
  const [isParkedCartsOpen, setIsParkedCartsOpen] = useState(false)
  const [isScannerOpen, setIsScannerOpen] = useState(false)

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY)
    const savedDiscount = localStorage.getItem(DISCOUNT_STORAGE_KEY)
    const savedCustomer = localStorage.getItem(CUSTOMER_STORAGE_KEY)
    
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart))
      } catch (error) {
        console.error('Failed to load cart from localStorage', error)
      }
    }
    
    if (savedDiscount) {
      setDiscount(Number(savedDiscount))
    }

    if (savedCustomer) {
      try {
        setSelectedCustomer(JSON.parse(savedCustomer))
      } catch (error) {
        console.error('Failed to load customer from localStorage', error)
      }
    }

    // Load parked carts
    const savedParkedCarts = localStorage.getItem(PARKED_CARTS_KEY)
    if (savedParkedCarts) {
      try {
        setParkedCarts(JSON.parse(savedParkedCarts))
      } catch (error) {
        console.error('Failed to load parked carts from localStorage', error)
      }
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems))
  }, [cartItems])

  // Save discount to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(DISCOUNT_STORAGE_KEY, discount.toString())
  }, [discount])

  // Save customer to localStorage whenever it changes
  useEffect(() => {
    if (selectedCustomer) {
      localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(selectedCustomer))
    } else {
      localStorage.removeItem(CUSTOMER_STORAGE_KEY)
    }
  }, [selectedCustomer])

  // Save parked carts to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(PARKED_CARTS_KEY, JSON.stringify(parkedCarts))
  }, [parkedCarts])

  const handleAddToCart = (product: Product) => {
    if (Number(product.stock_quantity) <= 0) {
      toast.error('Product is out of stock')
      return
    }

    setCartItems((prev) => {
      const existingItem = prev.find((item) => item.product.id === product.id)
      
      if (existingItem) {
        // Check if we can add more
        if (existingItem.quantity >= Number(product.stock_quantity)) {
          toast.error('Cannot add more items than available in stock')
          return prev
        }
        // Increment quantity
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      } else {
        // Add new item
        return [...prev, { product, quantity: 1 }]
      }
    })

    toast.success(`${product.name} added to cart`)
  }

  const handleImmediateSale = async (product: Product, customPrice: number) => {
    if (!user) {
      toast.error('User not authenticated')
      return
    }

    if (!currentStore) {
      toast.error('No store selected')
      return
    }

    try {
      const transaction = await createImmediateSale(
        user.tenant_id,
        user.id,
        currentStore.id,
        product.id,
        product.name,
        product.sku,
        customPrice,
        selectedCustomer?.id
      )

      toast.success(`Sale completed: ${product.name} - KES ${customPrice.toFixed(2)}`)
      
      // Show receipt
      setCompletedTransactionId(transaction.id)
      setIsReceiptOpen(true)
    } catch (error: any) {
      console.error('Immediate sale error:', error)
      toast.error(error.message || 'Failed to complete sale')
      throw error // Re-throw to let ProductCard handle it
    }
  }

  // Park current cart
  const handleParkCart = () => {
    if (cartItems.length === 0) {
      toast.error('Cart is empty')
      return
    }

    const cartName = selectedCustomer?.name || `Cart ${parkedCarts.length + 1}`
    const newParkedCart: ParkedCart = {
      id: Date.now().toString(),
      name: cartName,
      items: cartItems,
      discount,
      customer: selectedCustomer,
      parkedAt: new Date().toISOString(),
    }

    setParkedCarts((prev) => [...prev, newParkedCart])
    setCartItems([])
    setDiscount(0)
    setSelectedCustomer(null)
    toast.success(`Cart parked as "${cartName}"`)
  }

  // Resume a parked cart
  const handleResumeCart = (parkedCart: ParkedCart) => {
    // If current cart has items, park it first
    if (cartItems.length > 0) {
      const currentCartName = selectedCustomer?.name || `Cart ${parkedCarts.length + 1}`
      const currentParkedCart: ParkedCart = {
        id: Date.now().toString(),
        name: currentCartName,
        items: cartItems,
        discount,
        customer: selectedCustomer,
        parkedAt: new Date().toISOString(),
      }
      setParkedCarts((prev) => [...prev.filter(c => c.id !== parkedCart.id), currentParkedCart])
    } else {
      setParkedCarts((prev) => prev.filter(c => c.id !== parkedCart.id))
    }

    setCartItems(parkedCart.items)
    setDiscount(parkedCart.discount)
    setSelectedCustomer(parkedCart.customer)
    setIsParkedCartsOpen(false)
    toast.success(`Resumed cart "${parkedCart.name}"`)
  }

  // Delete a parked cart
  const handleDeleteParkedCart = (cartId: string) => {
    setParkedCarts((prev) => prev.filter(c => c.id !== cartId))
    toast.success('Parked cart deleted')
  }

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    )
  }

  const handleUpdatePrice = (productId: string, price: number) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, customPrice: price } : item
      )
    )
  }

  const handleRemoveItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId))
  }

  const handleClearCart = () => {
    if (confirm('Are you sure you want to clear the cart?')) {
      setCartItems([])
      setDiscount(0)
      setSelectedCustomer(null)
    }
  }

  const handleCheckout = () => {
    setIsCheckoutOpen(true)
  }

  const handleCheckoutSuccess = (transactionId: string) => {
    setCompletedTransactionId(transactionId)
    setIsReceiptOpen(true)
    // Clear cart
    setCartItems([])
    setDiscount(0)
    setSelectedCustomer(null)
  }

  const getItemPrice = (item: CartItem) => {
    return item.customPrice !== undefined ? item.customPrice : Number(item.product.price)
  }

  const subtotal = cartItems.reduce((sum, item) => sum + getItemPrice(item) * item.quantity, 0)
  const discountAmount = discount > 0 ? discount : 0
  const total = Math.max(0, subtotal - discountAmount)

  const handleToggleCart = () => {
    setIsCartExpanded((prev) => !prev)
  }

  const handleBarcodeDetected = async (barcode: string) => {
    if (!user || !currentStore) {
      toast.error('User or store not available')
      return
    }

    try {
      const product = await getProductByBarcode(user.tenant_id, barcode, currentStore.id)
      
      if (product) {
        handleAddToCart(product)
      } else {
        toast.error(`No product found with barcode: ${barcode}`)
      }
    } catch (error) {
      console.error('Error fetching product by barcode:', error)
      toast.error('Failed to fetch product')
    }
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="h-[calc(100vh-4rem)] pos-container" data-tour-id="pos-container">
          <div className="bg-card border rounded-lg p-4 sm:p-6 h-full flex flex-col">
            <div className="mb-3 sm:mb-4 flex items-start justify-between">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">Point of Sale</h1>
                <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                  Browse and add products to cart
                </p>
              </div>
              <Button
                onClick={() => setIsScannerOpen(true)}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <ScanBarcode className="h-4 w-4" />
                <span className="hidden sm:inline">Scan</span>
              </Button>
            </div>
            
            <div className="mb-3 sm:mb-4" data-tour-id="customer-selector">
              <CustomerSelector
                selectedCustomer={selectedCustomer}
                onSelectCustomer={setSelectedCustomer}
              />
            </div>

            <div className="flex-1 overflow-hidden" data-tour-id="product-grid">
              <ProductCardGrid 
                onAddToCart={handleAddToCart}
                onImmediateSale={handleImmediateSale}
              />
            </div>
          </div>
        </div>

        {/* Floating Cart */}
        <FloatingCart
          items={cartItems}
          discount={discount}
          isExpanded={isCartExpanded}
          onToggle={handleToggleCart}
          onUpdateQuantity={handleUpdateQuantity}
          onUpdatePrice={handleUpdatePrice}
          onRemoveItem={handleRemoveItem}
          onUpdateDiscount={setDiscount}
          onClearCart={handleClearCart}
          onCheckout={handleCheckout}
          parkedCarts={parkedCarts}
          onParkCart={handleParkCart}
          onResumeCart={handleResumeCart}
          onDeleteParkedCart={handleDeleteParkedCart}
        />

        {/* Checkout Modal */}
        <CheckoutModal
          open={isCheckoutOpen}
          onOpenChange={setIsCheckoutOpen}
          items={cartItems}
          subtotal={subtotal}
          discount={discount}
          total={total}
          customer={selectedCustomer}
          onCustomerChange={setSelectedCustomer}
          onSuccess={handleCheckoutSuccess}
        />

        {/* Barcode Scanner */}
        <BarcodeScanner
          open={isScannerOpen}
          onOpenChange={setIsScannerOpen}
          onBarcodeDetected={handleBarcodeDetected}
        />

        {/* Receipt Modal */}
        <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
          <DialogContent className="max-w-lg">
            {completedTransactionId && (
              <>
                <ReceiptPrint transactionId={completedTransactionId} />
                <div className="flex justify-center gap-2 mt-4">
                  <Button onClick={() => window.print()}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print Receipt
                  </Button>
                  <Button variant="outline" onClick={() => setIsReceiptOpen(false)}>
                    Close
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </AppLayout>
    </ProtectedRoute>
  )
}
