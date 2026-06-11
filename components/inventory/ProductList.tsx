'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useProducts, useCategories, useArchiveProduct, useRestoreProduct } from '@/hooks/useProducts'
import { Product } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { SemanticBadge } from '@/components/ui/semantic-badge'
import { MonetaryValue, StockDisplay } from '@/components/ui/value-display'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ProductForm } from './ProductForm'
import { StockAdjustmentModal } from './StockAdjustmentModal'
import { StockHistoryDrawer } from './StockHistoryDrawer'
import { useAuth } from '@/contexts/AuthContext'
import { isAdmin } from '@/lib/utils/permissions'
import { exportToCSV, formatDateTimeForCSV } from '@/lib/utils/csv'
import { toast } from 'sonner'
import { 
  Plus, 
  Search, 
  Download, 
  Edit, 
  Archive, 
  ArchiveRestore,
  TrendingUp, 
  History,
  ChevronLeft,
  ChevronRight,
  AlertTriangle
} from 'lucide-react'

export function ProductList() {
  const { user } = useAuth()
  const adminUser = isAdmin(user)
  const searchParams = useSearchParams()
  const filterParam = searchParams?.get('filter')
  
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [showArchived, setShowArchived] = useState(false)
  const [showLowStockOnly, setShowLowStockOnly] = useState(filterParam === 'low-stock')
  const [showCostErrorsOnly, setShowCostErrorsOnly] = useState(filterParam === 'cost-errors')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isStockModalOpen, setIsStockModalOpen] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)

  // Update filters when URL parameter changes
  useEffect(() => {
    if (filterParam === 'low-stock') {
      setShowLowStockOnly(true)
      setShowCostErrorsOnly(false)
    } else if (filterParam === 'cost-errors') {
      setShowCostErrorsOnly(true)
      setShowLowStockOnly(false)
    }
  }, [filterParam])

  const pageSize = 20
  const { data, isLoading } = useProducts({ 
    search, 
    category: category === 'all' ? undefined : category,
    archived: showArchived,
    page,
    pageSize
  })
  const { data: categories = [] } = useCategories()
  const archiveProduct = useArchiveProduct()
  const restoreProduct = useRestoreProduct()

  // Filter and sort products based on active filter
  const filteredProducts = data?.products
    ? (() => {
        let products = data.products
        
        if (showLowStockOnly) {
          products = products
            .filter(p => Number(p.stock_quantity) <= Number(p.low_stock_threshold))
            .sort((a, b) => Number(a.stock_quantity) - Number(b.stock_quantity)) // Lowest stock first
        } else if (showCostErrorsOnly) {
          products = products
            .filter(p => {
              const cost = Number(p.cost) || 0
              const price = Number(p.price) || 0
              return cost > price && cost > 0 && price > 0
            })
            .sort((a, b) => (Number(b.cost) - Number(b.price)) - (Number(a.cost) - Number(a.price))) // Biggest loss first
        }
        
        return products
      })()
    : data?.products

  const totalPages = data?.totalPages || 1
  
  const displayData = {
    products: filteredProducts || [],
    total: filteredProducts?.length || 0,
    totalPages,
    page: data?.page || 1,
    pageSize: data?.pageSize || 20,
  }

  const handleCreateNew = () => {
    setSelectedProduct(null)
    setIsFormOpen(true)
  }

  const handleEdit = (product: Product) => {
    setSelectedProduct(product)
    setIsFormOpen(true)
  }

  const handleStockAdjustment = (product: Product) => {
    setSelectedProduct(product)
    setIsStockModalOpen(true)
  }

  const handleViewHistory = (product: Product) => {
    setSelectedProduct(product)
    setIsHistoryOpen(true)
  }

  const handleArchive = async (product: Product) => {
    if (!confirm(`Are you sure you want to archive "${product.name}"?`)) return

    try {
      await archiveProduct.mutateAsync(product.id)
      toast.success('Product archived successfully')
    } catch (error: any) {
      toast.error(error.message || 'Failed to archive product')
    }
  }

  const handleRestore = async (product: Product) => {
    if (!confirm(`Are you sure you want to restore "${product.name}"?`)) return

    try {
      await restoreProduct.mutateAsync(product.id)
      toast.success('Product restored successfully')
    } catch (error: any) {
      toast.error(error.message || 'Failed to restore product')
    }
  }

  const handleExportCSV = () => {
    if (!displayData?.products || displayData.products.length === 0) {
      toast.error('No products to export')
      return
    }

    try {
      const exportData = displayData.products.map(product => ({
        SKU: product.sku,
        Name: product.name,
        Description: product.description || '',
        Category: product.category,
        Price: Number(product.price).toFixed(2),
        Cost: Number(product.cost).toFixed(2),
        'Base Unit': product.base_unit,
        'Purchase Unit': product.purchase_unit,
        'Conversion Ratio': Number(product.unit_conversion_ratio),
        'Stock Quantity': Number(product.stock_quantity),
        'Low Stock Threshold': Number(product.low_stock_threshold),
        'Created At': formatDateTimeForCSV(product.created_at),
        'Updated At': formatDateTimeForCSV(product.updated_at),
      }))

      const timestamp = new Date().toISOString().split('T')[0]
      exportToCSV(exportData, `products-${timestamp}.csv`)
      toast.success('Products exported successfully')
    } catch (error: any) {
      toast.error(error.message || 'Failed to export products')
    }
  }

  const formatCurrency = (value: number | string) => {
    return `KSH ${Number(value).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const getStockStatus = (product: Product) => {
    const stock = Number(product.stock_quantity)
    const threshold = Number(product.low_stock_threshold)
    
    if (stock === 0) return { label: 'Out of Stock', variant: 'stock-out' as const }
    if (stock <= threshold) return { label: 'Low Stock', variant: 'stock-low' as const }
    return { label: 'In Stock', variant: 'stock-in' as const }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">
            {showArchived ? 'Archived Products' : showLowStockOnly ? 'Low Stock Products' : showCostErrorsOnly ? 'Cost Error Products' : 'Products'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {displayData?.total || 0} total {showArchived ? 'archived ' : showLowStockOnly ? 'low stock ' : showCostErrorsOnly ? 'cost error ' : ''}products
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant={showArchived ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setShowArchived(!showArchived)
              setShowLowStockOnly(false)
              setShowCostErrorsOnly(false)
              setPage(1)
            }}
          >
            <Archive className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{showArchived ? 'View Active' : 'View Archived'}</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={!displayData?.products?.length}>
            <Download className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
          {!showArchived && (
            <Button size="sm" onClick={handleCreateNew}>
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Add Product</span>
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or SKU..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-9"
          />
        </div>
        <Select value={category} onValueChange={(value) => {
          setCategory(value)
          setPage(1)
        }}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!showArchived && (
          <>
            <Button
              variant={showLowStockOnly ? "default" : "outline"}
              size="default"
              onClick={() => {
                setShowLowStockOnly(!showLowStockOnly)
                setShowCostErrorsOnly(false)
                setPage(1)
              }}
              className="w-full sm:w-auto"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              {showLowStockOnly ? 'Show All' : 'Low Stock'}
            </Button>
            <Button
              variant={showCostErrorsOnly ? "default" : "outline"}
              size="default"
              onClick={() => {
                setShowCostErrorsOnly(!showCostErrorsOnly)
                setShowLowStockOnly(false)
                setPage(1)
              }}
              className="w-full sm:w-auto"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              {showCostErrorsOnly ? 'Show All' : 'Cost Errors'}
            </Button>
          </>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : !displayData?.products || displayData.products.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-lg">
          <p className="text-muted-foreground">
            {search || category !== 'all' || showLowStockOnly ? 'No products found matching your filters' : 'No products yet. Create your first product to get started.'}
          </p>
        </div>
      ) : (
        <>
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[60px]">Image</TableHead>
                    <TableHead className="min-w-[200px]">Name</TableHead>
                    <TableHead className="min-w-[120px]">Category</TableHead>
                    <TableHead className="text-right min-w-[100px]">Price</TableHead>
                    <TableHead className="text-right min-w-[100px]">Stock</TableHead>
                    <TableHead className="min-w-[100px]">Status</TableHead>
                    <TableHead className="text-right min-w-[180px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayData.products.map((product) => {
                    const stockStatus = getStockStatus(product)
                    return (
                      <TableRow key={product.id}>
                        <TableCell>
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="h-16 w-16 rounded object-cover" />
                          ) : (
                            <div className="h-16 w-16 rounded bg-muted flex items-center justify-center text-muted-foreground text-xs">No img</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {product.name}
                              {showArchived && (
                                <SemanticBadge variant="neutral" className="ml-2 text-xs">
                                  Archived
                                </SemanticBadge>
                              )}
                              {product.is_variable_price && (
                                <SemanticBadge variant="warning" className="ml-2 text-xs">
                                  Variable Price
                                </SemanticBadge>
                              )}
                              {(!product.cost || Number(product.cost) === 0) && (
                                <SemanticBadge variant="warning" className="ml-2 text-xs">
                                  No Cost Price
                                </SemanticBadge>
                              )}
                              {Number(product.cost) > Number(product.price) && Number(product.cost) > 0 && Number(product.price) > 0 && (
                                <SemanticBadge variant="error" className="ml-2 text-xs">
                                  Cost Error
                                </SemanticBadge>
                              )}
                            </div>
                            {product.description && (
                              <div className="text-sm text-muted-foreground line-clamp-1">
                                {product.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell className="text-right">
                          {product.is_variable_price ? (
                            <span className="text-muted-foreground italic">Set at POS</span>
                          ) : (
                            <MonetaryValue value={Number(product.price)} type="revenue" />
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <StockDisplay
                            quantity={Number(product.stock_quantity)}
                            threshold={Number(product.low_stock_threshold)}
                            unit={product.base_unit}
                          />
                        </TableCell>
                        <TableCell>
                          <SemanticBadge variant={stockStatus.variant}>{stockStatus.label}</SemanticBadge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {showArchived ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewHistory(product)}
                                  title="View history"
                                >
                                  <History className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRestore(product)}
                                  title="Restore product"
                                >
                                  <ArchiveRestore className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(product)}
                                  title="Edit product"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleStockAdjustment(product)}
                                  title="Adjust stock"
                                >
                                  <TrendingUp className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewHistory(product)}
                                  title="View history"
                                >
                                  <History className="h-4 w-4" />
                                </Button>
                                {adminUser && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleArchive(product)}
                                    title="Archive product"
                                  >
                                    <Archive className="h-4 w-4" />
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Pagination */}
          {displayData && displayData.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page} of {displayData.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(displayData.totalPages, p + 1))}
                  disabled={page === displayData.totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <ProductForm
        product={selectedProduct}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
      />
      
      {selectedProduct && (
        <>
          <StockAdjustmentModal
            product={selectedProduct}
            open={isStockModalOpen}
            onOpenChange={setIsStockModalOpen}
          />
          <StockHistoryDrawer
            productId={selectedProduct.id}
            productName={selectedProduct.name}
            open={isHistoryOpen}
            onOpenChange={setIsHistoryOpen}
          />
        </>
      )}
    </div>
  )
}
