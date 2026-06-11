'use client'

import { useState, useEffect, useCallback } from 'react'
import { useProducts } from '@/hooks/useProducts'
import { Product } from '@/types'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Search, Plus } from 'lucide-react'
import { toast } from 'sonner'

interface ProductSearchProps {
  onAddToCart: (product: Product) => void
}

export function ProductSearch({ onAddToCart }: ProductSearchProps) {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)

    return () => clearTimeout(timer)
  }, [search])

  const { data, isLoading } = useProducts({ 
    search: debouncedSearch,
    pageSize: 10,
    archived: false
  })

  const handleAddToCart = (product: Product) => {
    if (Number(product.stock_quantity) <= 0) {
      toast.error('Product is out of stock')
      return
    }
    onAddToCart(product)
    toast.success(`${product.name} added to cart`)
  }

  const formatCurrency = (value: number | string) => {
    return `KSH ${Number(value).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  return (
    <div className="space-y-4">
      <div className="relative" data-tour="product-search">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search by name, SKU, or scan barcode..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-12 text-lg"
          autoFocus
          data-tour="product-search-input"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : search && data?.products && data.products.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[calc(100vh-300px)] overflow-y-auto">
          {data.products.map((product) => {
            const isOutOfStock = Number(product.stock_quantity) <= 0
            const isLowStock = Number(product.stock_quantity) <= Number(product.low_stock_threshold)
            
            return (
              <div
                key={product.id}
                className={`border rounded-lg p-4 ${
                  isOutOfStock 
                    ? 'bg-muted opacity-60' 
                    : 'bg-card hover:border-primary cursor-pointer transition-colors'
                }`}
                onClick={() => !isOutOfStock && handleAddToCart(product)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold">{product.name}</h3>
                    <p className="text-sm text-muted-foreground">{product.sku}</p>
                  </div>
                  {!isOutOfStock && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleAddToCart(product)
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-primary">
                    {formatCurrency(product.price || 0)}
                  </span>
                  <span className={`text-sm ${
                    isOutOfStock 
                      ? 'text-destructive font-medium' 
                      : isLowStock 
                      ? 'text-yellow-600 dark:text-yellow-500' 
                      : 'text-muted-foreground'
                  }`}>
                    {isOutOfStock 
                      ? 'Out of Stock' 
                      : `${Number(product.stock_quantity).toFixed(0)} ${product.base_unit}`
                    }
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      ) : search ? (
        <div className="text-center py-8 text-muted-foreground">
          No products found matching "{search}"
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          Start typing to search for products
        </div>
      )}
    </div>
  )
}
