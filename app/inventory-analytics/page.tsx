'use client'

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { useInventoryAnalytics } from '@/hooks/useDashboard'
import { KPICard } from '@/components/dashboard/KPICard'
import { LowStockTable } from '@/components/dashboard/LowStockTable'
import { TopProductsTable } from '@/components/inventory/TopProductsTable'
import { CategoryStockTable } from '@/components/inventory/CategoryStockTable'
import { Package, DollarSign, TrendingUp, AlertCircle } from 'lucide-react'

export default function InventoryAnalyticsPage() {
  const { data: analytics, isLoading } = useInventoryAnalytics()

  const formatCurrency = (amount: number) => {
    return `KSH ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  return (
    <ProtectedRoute requireAdmin={true}>
      <AppLayout>
        <div className="space-y-6 max-w-full overflow-hidden">
          <div>
            <h1 className="text-2xl font-bold">Inventory Analytics</h1>
            <p className="text-muted-foreground mt-1">
              Overview of your inventory value and potential profit
            </p>
          </div>

          <div className="grid gap-4 sm:gap-6 grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-4">
            <KPICard
              title="Total Inventory (Cost)"
              value={formatCurrency(analytics?.totalCostValue || 0)}
              icon={Package}
              loading={isLoading}
              valueType="cost"
              subtitle={`${analytics?.productCount || 0} products with cost`}
            />
            <KPICard
              title="Total Inventory (Selling)"
              value={formatCurrency(analytics?.totalSellingValue || 0)}
              icon={DollarSign}
              loading={isLoading}
              valueType="revenue"
              subtitle="Based on current prices"
            />
            <KPICard
              title="Potential Profit"
              value={formatCurrency(analytics?.potentialProfit || 0)}
              icon={TrendingUp}
              loading={isLoading}
              valueType="profit"
              subtitle="If all inventory sold"
            />
            <KPICard
              title="Variable Price Products"
              value={analytics?.variablePriceCount?.toString() || '0'}
              icon={AlertCircle}
              loading={isLoading}
              valueType="neutral"
              subtitle="Not included in selling value"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="min-w-0">
              <TopProductsTable limit={10} />
            </div>
            <div className="min-w-0">
              <CategoryStockTable />
            </div>
          </div>

          <div>
            <LowStockTable />
          </div>

          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">About These Metrics</h2>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">Total Inventory (Cost):</span> The total value of all products in stock calculated at their cost price. This represents your investment in inventory.
              </p>
              <p>
                <span className="font-medium text-foreground">Total Inventory (Selling):</span> The total value of all products in stock calculated at their selling price. Variable price products are excluded as they don't have fixed prices.
              </p>
              <p>
                <span className="font-medium text-foreground">Potential Profit:</span> The difference between selling value and cost value. This is the profit you would make if you sold all current inventory at the listed prices.
              </p>
              <p>
                <span className="font-medium text-foreground">Variable Price Products:</span> Products that require manual price entry at the point of sale. These are not included in the selling value calculation.
              </p>
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
