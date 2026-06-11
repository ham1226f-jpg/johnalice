'use client'

import { useTopProducts } from '@/hooks/useDashboard'
import { Card } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { TrendingUp, Package } from 'lucide-react'

interface TopProductsTableProps {
  limit?: number
  startDate?: Date
  endDate?: Date
}

export function TopProductsTable({ limit = 10, startDate, endDate }: TopProductsTableProps) {
  const { data: products, isLoading } = useTopProducts(limit, startDate, endDate)

  const formatCurrency = (amount: number) => {
    return `KSH ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Top Performing Products
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Best sellers by revenue
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : !products || products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-1">No sales data</h3>
          <p className="text-muted-foreground text-sm">
            Start making sales to see top products
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full" style={{ minWidth: '690px' }}>
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground" style={{ minWidth: '40px' }}>#</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground" style={{ minWidth: '150px' }}>Product</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground" style={{ minWidth: '100px' }}>Category</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground" style={{ minWidth: '80px' }}>Qty Sold</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground" style={{ minWidth: '120px' }}>Revenue</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground" style={{ minWidth: '120px' }}>Profit</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground" style={{ minWidth: '80px' }}>In Stock</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product, index) => (
                  <tr key={product.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="py-3 px-2 text-sm font-medium">{index + 1}</td>
                    <td className="py-3 px-2">
                      <div>
                        <div className="font-medium text-sm">{product.name}</div>
                        <div className="text-xs text-muted-foreground">{product.sku}</div>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-sm">{product.category}</td>
                    <td className="py-3 px-2 text-sm text-right font-medium">
                      {product.totalQuantitySold.toFixed(0)}
                    </td>
                    <td className="py-3 px-2 text-sm text-right font-medium text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(product.totalRevenue)}
                    </td>
                    <td className="py-3 px-2 text-sm text-right font-medium text-blue-600 dark:text-blue-400">
                      {formatCurrency(product.totalProfit)}
                    </td>
                    <td className="py-3 px-2 text-sm text-right">
                      {product.stockQuantity.toFixed(0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Card>
  )
}
