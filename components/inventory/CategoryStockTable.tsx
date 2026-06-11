'use client'

import { useState } from 'react'
import { useCategoryStockValue } from '@/hooks/useDashboard'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Layers, Package, ChevronLeft, ChevronRight } from 'lucide-react'

const PAGE_SIZE = 5

export function CategoryStockTable() {
  const { data: categories, isLoading } = useCategoryStockValue()
  const [page, setPage] = useState(1)

  const formatCurrency = (amount: number) =>
    `KSH ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const totalPages = Math.ceil((categories?.length ?? 0) / PAGE_SIZE)
  const paged = categories?.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) ?? []

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Stock Value by Category
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Inventory breakdown by product category
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : !categories || categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-1">No inventory data</h3>
          <p className="text-muted-foreground text-sm">Add products to see category breakdown</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full" style={{ minWidth: '670px' }}>
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground" style={{ minWidth: '120px' }}>Category</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground" style={{ minWidth: '80px' }}>Products</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground" style={{ minWidth: '90px' }}>Stock Qty</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground" style={{ minWidth: '120px' }}>Cost Value</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground" style={{ minWidth: '120px' }}>Selling Value</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground" style={{ minWidth: '130px' }}>Potential Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((category) => (
                    <tr key={category.category} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-3 px-2 font-medium text-sm">{category.category}</td>
                      <td className="py-3 px-2 text-sm text-right">{category.productCount}</td>
                      <td className="py-3 px-2 text-sm text-right">{category.stockQuantity.toFixed(0)}</td>
                      <td className="py-3 px-2 text-sm text-right font-medium text-orange-600 dark:text-orange-400">
                        {formatCurrency(category.costValue)}
                      </td>
                      <td className="py-3 px-2 text-sm text-right font-medium text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(category.sellingValue)}
                      </td>
                      <td className="py-3 px-2 text-sm text-right font-medium text-blue-600 dark:text-blue-400">
                        {formatCurrency(category.potentialProfit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {paged.map((category) => (
              <div key={category.category} className="border rounded-lg p-3 space-y-2">
                <div className="font-semibold text-sm">{category.category}</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <span className="text-muted-foreground">Products</span>
                  <span className="text-right">{category.productCount}</span>
                  <span className="text-muted-foreground">Stock Qty</span>
                  <span className="text-right">{category.stockQuantity.toFixed(0)}</span>
                  <span className="text-muted-foreground">Cost Value</span>
                  <span className="text-right font-medium text-orange-600 dark:text-orange-400">
                    {formatCurrency(category.costValue)}
                  </span>
                  <span className="text-muted-foreground">Selling Value</span>
                  <span className="text-right font-medium text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(category.sellingValue)}
                  </span>
                  <span className="text-muted-foreground">Potential Profit</span>
                  <span className="text-right font-medium text-blue-600 dark:text-blue-400">
                    {formatCurrency(category.potentialProfit)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  )
}
