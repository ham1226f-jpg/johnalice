'use client'

import { useState, useEffect, useRef } from 'react'
import { useProducts } from '@/hooks/useProducts'
import { Product } from '@/types'
import { ProductCard } from './ProductCard'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Search, Loader2 } from 'lucide-react'

interface ProductCardGridProps {
  onAddToCart: (product: Product) => void
  onImmediateSale?: (product: Product, customPrice: number) => void
}

export function ProductCardGrid({ onAddToCart, onImmediateSale }: ProductCardGridProps) {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 100
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const loadMoreButtonRef = useRef<HTMLButtonElement>(null)

  // Debounce search input (200ms for faster feel)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1) // Reset to page 1 when search changes
    }, 200)

    return () => clearTimeout(timer)
  }, [search])

  const { data, isLoading, isFetching, error, refetch } = useProducts({ 
    search: debouncedSearch,
    archived: false,
    page,
    pageSize
  })

  // Use data directly from query, accumulate for pagination
  const [accumulatedProducts, setAccumulatedProducts] = useState<Product[]>([])
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const previousProductCountRef = useRef(0)
  
  useEffect(() => {
    if (data?.products) {
      if (page === 1) {
        // First page - replace all products
        setAccumulatedProducts(data.products)
        setIsLoadingMore(false)
        previousProductCountRef.current = data.products.length
      } else {
        // Subsequent pages - append products
        const previousCount = previousProductCountRef.current
        setAccumulatedProducts(prev => {
          const existingIds = new Set(prev.map(p => p.id))
          const newProducts = data.products.filter(p => !existingIds.has(p.id))
          const updated = [...prev, ...newProducts]
          previousProductCountRef.current = updated.length
          return updated
        })
        setIsLoadingMore(false)
        
        // Maintain scroll position by scrolling to the first new product
        // Wait for DOM to update
        setTimeout(() => {
          if (scrollContainerRef.current) {
            // Calculate approximate position of first new product
            const productCards = scrollContainerRef.current.querySelectorAll('[data-product-card]')
            if (productCards.length > previousCount) {
              const firstNewCard = productCards[previousCount] as HTMLElement
              if (firstNewCard) {
                // Scroll to show the first new product
                const containerTop = scrollContainerRef.current.scrollTop
                const cardTop = firstNewCard.offsetTop
                const containerHeight = scrollContainerRef.current.clientHeight
                
                // Only adjust if the card is not visible
                if (cardTop > containerTop + containerHeight) {
                  scrollContainerRef.current.scrollTop = cardTop - 100 // 100px offset from top
                }
              }
            }
          }
        }, 100)
      }
    }
  }, [data?.products, page])
  
  // Reset accumulated products when search changes
  useEffect(() => {
    setAccumulatedProducts([])
    setIsLoadingMore(false)
    previousProductCountRef.current = 0
  }, [debouncedSearch])

  // Handle errors
  useEffect(() => {
    if (error) {
      console.error('Error loading products:', error)
    }
  }, [error])

  // Use accumulated products for display, but show data.products on first page if accumulated is empty
  const displayProducts = accumulatedProducts.length > 0 ? accumulatedProducts : (data?.products || [])
  const hasMore = data && displayProducts.length < data.total
  const showingCount = displayProducts.length
  const totalCount = data?.total || 0

  const handleLoadMore = () => {
    setIsLoadingMore(true)
    setPage(prev => prev + 1)
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search by name, SKU, or scan barcode..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-12 text-lg"
        />
      </div>

      {/* Product Grid */}
      <div className="flex-1 overflow-y-auto" ref={scrollContainerRef}>
        {error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-destructive/10 p-4 mb-4">
              <Search className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="font-semibold text-lg mb-1">Error loading products</h3>
            <p className="text-muted-foreground mb-4">
              {error instanceof Error ? error.message : 'Failed to load products'}
            </p>
            <Button onClick={() => refetch()} variant="outline">
              Try Again
            </Button>
          </div>
        ) : isLoading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* Loading skeleton */}
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-muted animate-pulse rounded-lg h-48" />
              ))}
            </div>
          </div>
        ) : displayProducts.length > 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {displayProducts.map((product) => (
                <div key={product.id} data-product-card>
                  <ProductCard
                    product={product}
                    onAddToCart={onAddToCart}
                    onImmediateSale={onImmediateSale}
                  />
                </div>
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="flex flex-col items-center gap-2 py-4">
                <p className="text-sm text-muted-foreground">
                  Showing {showingCount} of {totalCount} products
                </p>
                <Button
                  ref={loadMoreButtonRef}
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={isFetching || isLoadingMore}
                  className="min-w-[200px]"
                >
                  {isFetching || isLoadingMore ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    `Load More (${totalCount - showingCount} remaining)`
                  )}
                </Button>
              </div>
            )}

            {/* All Loaded Message */}
            {!hasMore && totalCount > pageSize && (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">
                  All {totalCount} products loaded
                </p>
              </div>
            )}
          </div>
        ) : search ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-1">No products found</h3>
            <p className="text-muted-foreground">
              No products match "{search}"
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-1">No products available</h3>
            <p className="text-muted-foreground">
              Add products to get started
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
