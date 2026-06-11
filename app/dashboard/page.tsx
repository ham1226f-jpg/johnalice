'use client'

import { useState, useMemo } from 'react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { useAuth } from '@/contexts/AuthContext'
import { useDashboardKPIs } from '@/hooks/useDashboard'
import { canViewSensitiveData } from '@/lib/utils/permissions'
import { KPICard } from '@/components/dashboard/KPICard'
import { SalesTrendChart } from '@/components/dashboard/SalesTrendChart'
import { DebtKPICards } from '@/components/dashboard/DebtKPICards'
import { DailySummaryCard } from '@/components/dashboard/DailySummaryCard'
import { PaymentMethodCard } from '@/components/dashboard/PaymentMethodCard'
import { DateFilter, DateFilterOption, getDateRange } from '@/components/dashboard/DateFilter'
import { DollarSign, TrendingUp, ShoppingCart, AlertTriangle } from 'lucide-react'

export default function DashboardPage() {
  const { user, tenant } = useAuth()
  const showSensitiveData = canViewSensitiveData(user)
  
  // Sales team defaults to 'today', admins default to 'all'
  const [dateFilter, setDateFilter] = useState<DateFilterOption>(
    showSensitiveData ? 'all' : 'today'
  )
  const [customDate, setCustomDate] = useState<Date>(new Date())
  
  const dateRange = useMemo(() => getDateRange(dateFilter, customDate), [dateFilter, customDate])
  const { data: kpis, isLoading } = useDashboardKPIs(dateRange.startDate, dateRange.endDate)

  const formatCurrency = (amount: number) => {
    return `KSH ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const getDateDescription = () => {
    const labels: Record<DateFilterOption, string> = {
      all: "",
      today: "today",
      yesterday: "yesterday",
      last7days: "the last 7 days",
      last30days: "the last 30 days",
      thisWeek: "this week",
      lastWeek: "last week",
      thisMonth: "this month",
      lastMonth: "last month",
      custom: `on ${customDate.toLocaleDateString()}`,
    }
    return labels[dateFilter]
  }

  return (
    <ProtectedRoute requireAdmin={false}>
      <AppLayout>
        <div className="space-y-6" data-tour="dashboard-container">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Welcome back, {user?.full_name}</h1>
              <p className="text-muted-foreground mt-1">
                {showSensitiveData 
                  ? `Here's what's happening with your business ${getDateDescription()}`
                  : `Here's your daily summary ${getDateDescription()}`
                }
              </p>
            </div>
            <DateFilter 
              value={dateFilter} 
              onChange={setDateFilter}
              customDate={customDate}
              onCustomDateChange={setCustomDate}
              restrictToToday={!showSensitiveData}
            />
          </div>

          {/* KPI Cards - Only show to authorized users */}
          {showSensitiveData && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4" data-tour="kpi-cards">
              <KPICard
                title="Total Revenue"
                value={formatCurrency(kpis?.totalRevenue || 0)}
                change={kpis?.revenueChange}
                icon={DollarSign}
                loading={isLoading}
                valueType="revenue"
              />
              <KPICard
                title="Total Profit"
                value={formatCurrency(kpis?.totalProfit || 0)}
                change={kpis?.profitChange}
                icon={TrendingUp}
                loading={isLoading}
                valueType="profit"
              />
              <KPICard
                title="Total Sales"
                value={kpis?.totalSales?.toString() || '0'}
                change={kpis?.salesChange}
                icon={ShoppingCart}
                loading={isLoading}
                valueType="neutral"
              />
              <KPICard
                title="Low Stock Items"
                value={kpis?.lowStockCount?.toString() || '0'}
                icon={AlertTriangle}
                loading={isLoading}
                valueType="neutral"
              />
            </div>
          )}

          {/* Debt Overview - Only show to authorized users */}
          {showSensitiveData && (
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Debt Overview</h2>
              <DebtKPICards />
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <PaymentMethodCard startDate={dateRange.startDate} endDate={dateRange.endDate} />
            <DailySummaryCard startDate={dateRange.startDate} endDate={dateRange.endDate} showProfit={showSensitiveData} />
          </div>

          {/* Sales Chart - Only show to authorized users */}
          {showSensitiveData && (
            <div className="grid gap-6 lg:grid-cols-3">
              <div data-tour="sales-chart" className="lg:col-span-3">
                <SalesTrendChart 
                  startDate={dateRange.startDate} 
                  endDate={dateRange.endDate}
                  kpiRevenue={kpis?.totalRevenue}
                  kpiProfit={kpis?.totalProfit}
                />
              </div>
            </div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
