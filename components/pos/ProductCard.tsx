'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Product } from '@/types'
import { Button } from '@/components/ui/button'
import { Plus, Package } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProductCardProps {
  product: Product
  onAddToCart: (product: Product) => void
  onImmediateSale?: (product: Product, customPrice: number) => void
}

export function ProductCard({ product, onAddToCart, onImmediateSale }: ProductCardProps) {
  const [imageError, setImageError] = useState(false)
  const [isPressed, setIsPressed] = useState(false)
  const [customPrice, setCustomPrice] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)

  const isOutOfStock = Number(product.stock_quantity) <= 0
  const isLowStock = Number(product.stock_quantity) <= Number(product.low_stock_threshold)
  const isVariablePrice = product.is_variable_price || false
  const isPriceValid = customPrice && parseFloat(customPrice) > 0

  const formatCurrency = (value: number | string) => {
    return `KSH ${Number(value).toLocaleString('en-KE', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`
  }

  const handleAddToCart = () => {
    if (!isOutOfStock && !isVariablePrice) {
      setIsPressed(true)
      onAddToCart(product)
      setTimeout(() => setIsPressed(false), 200)
    }
  }

  const handleImmediateSale = async () => {
    if (!isVariablePrice || !isPriceValid || !onImmediateSale || isOutOfStock) return
    
    setIsProcessing(true)
    setIsPressed(true)
    
    try {
      await onImmediateSale(product, parseFloat(customPrice))
      setCustomPrice('') // Clear input after successful sale
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setIsProcessing(false)
      setTimeout(() => setIsPressed(false), 200)
    }
  }

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Allow only numbers and decimal point
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setCustomPrice(value)
    }
  }

  const handleImageError = () => {
    setImageError(true)
  }

  // Get optimized image URL with transformations
  const getOptimizedImageUrl = (url: string) => {
    if (!url) return url
    
    // Check if it's a Supabase Storage URL
    if (url.includes('/storage/v1/object/public/')) {
      // Add transformation parameters for thumbnail
      const transformParams = '?width=400&height=400&resize=cover&quality=80'
      return url + transformParams
    }
    
    return url
  }

  const imageUrl = product.image_url ? getOptimizedImageUrl(product.image_url) : null

  return (
    <div
      className={cn(
        'group relative flex flex-col bg-card border rounded-lg overflow-hidden transition-all duration-200',
        isOutOfStock 
          ? 'opacity-60 cursor-not-allowed' 
          : isVariablePrice
          ? 'hover:border-primary hover:shadow-md'
          : 'hover:border-primary hover:shadow-md cursor-pointer',
        isPressed && 'scale-95'
      )}
      onClick={!isVariablePrice ? handleAddToCart : undefined}
    >
      {/* Image Section */}
      <div className="relative w-full aspect-square bg-muted">
        {imageUrl && !imageError ? (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            loading="lazy"
            onError={handleImageError}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Package className="h-16 w-16 text-muted-foreground/30" />
          </div>
        )}
        
        {/* Stock Badge */}
        {isOutOfStock && (
          <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs font-semibold px-2 py-1 rounded">
            Out of Stock
          </div>
        )}
        {!isOutOfStock && isLowStock && (
          <div className="absolute top-2 left-2 bg-yellow-500 text-yellow-950 text-xs font-semibold px-2 py-1 rounded">
            Low Stock
          </div>
        )}
        
        {/* Variable Price Badge */}
        {isVariablePrice && !isOutOfStock && !isLowStock && (
          <div className="absolute top-2 left-2 bg-alert-warning text-alert-warning-foreground text-xs font-semibold px-2 py-1 rounded">
            Enter Price
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="flex flex-col flex-1 p-2 sm:p-3 space-y-1.5 sm:space-y-2">
        {/* Product Name */}
        <h3 className="font-semibold text-xs sm:text-sm line-clamp-2">
          {product.name}
        </h3>
        
        {/* Product Description */}
        {product.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {product.description}
          </p>
        )}

        {/* Price and Stock Info */}
        <div className="flex items-end justify-between mt-auto gap-2">
          <div className="flex flex-col flex-1 min-w-0">
            {isVariablePrice ? (
              <div className="flex items-center space-x-1 mb-1">
                <span className="text-xs sm:text-sm font-medium text-muted-foreground">KES</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={customPrice}
                  onChange={handlePriceChange}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="0.00"
                  disabled={isOutOfStock || isProcessing}
                  className="flex-1 text-base sm:text-lg font-bold text-primary bg-transparent border-b-2 border-input focus:border-primary outline-none px-1 py-0.5 min-w-0"
                />
              </div>
            ) : (
              <span className="text-base sm:text-lg font-bold text-primary">
                {formatCurrency(product.price || 0)}
              </span>
            )}
            {product.cost && (
              <span className="text-xs text-muted-foreground/70">
                Cost: {formatCurrency(product.cost)}
              </span>
            )}
            <span className={cn(
              'text-xs',
              isOutOfStock 
                ? 'text-destructive font-medium' 
                : isLowStock 
                ? 'text-yellow-600 dark:text-yellow-500' 
                : 'text-muted-foreground'
            )}>
              {isOutOfStock 
                ? 'Out of Stock' 
                : `${Number(product.stock_quantity).toFixed(0)} ${product.base_unit}`
              }
            </span>
          </div>

          {/* Action Button - Always visible on mobile */}
          {!isOutOfStock && (
            <Button
              size="sm"
              className="h-10 w-10 sm:h-11 sm:w-11 rounded-full p-0 shrink-0 flex-none"
              onClick={(e) => {
                e.stopPropagation()
                if (isVariablePrice) {
                  handleImmediateSale()
                } else {
                  handleAddToCart()
                }
              }}
              disabled={isOutOfStock || (isVariablePrice && !isPriceValid) || isProcessing}
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
