'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useSalesTrend } from '@/hooks/useDashboard'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  ComposedChart,
  Line,
  Area
} from 'recharts'
import { format } from 'date-fns'
import { BarChart3, LineChart as LineChartIcon, TrendingUp, TrendingDown, DollarSign, Wallet } from 'lucide-react'

type ChartType = 'bar' | 'composed'
type MetricType = 'revenue' | 'profit'

interface SalesTrendChartProps {
  startDate?: Date
  endDate?: Date
  kpiRevenue?: number
  kpiProfit?: number
}

export function SalesTrendChart({ startDate, endDate, kpiRevenue, kpiProfit }: SalesTrendChartProps) {
  const { data: salesData, isLoading } = useSalesTrend(30, startDate, endDate)
  const [chartType, setChartType] = useState<ChartType>('bar')
  const [metricType, setMetricType] = useState<MetricType>('revenue')
  const [isDark, setIsDark] = useState(false)

  // Detect theme changes
  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'))
    }
    checkTheme()
    
    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    
    return () => observer.disconnect()
  }, [])

  // Theme-aware colors
  const colors = {
    grid: isDark ? '#374151' : '#e5e7eb',
    text: isDark ? '#9ca3af' : '#6b7280',
    primary: isDark ? '#60a5fa' : '#3b82f6',
    green: isDark ? '#34d399' : '#10b981',
    tooltipBg: isDark ? '#1f2937' : '#ffffff',
    tooltipBorder: isDark ? '#374151' : '#e5e7eb',
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Sales Overview</h2>
        </div>
        <div className="h-72 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading chart...</div>
        </div>
      </Card>
    )
  }

  const chartData = salesData?.map((item, index, arr) => {
    const prevValue = index > 0 ? arr[index - 1][metricType] : item[metricType]
    const change = prevValue > 0 ? ((item[metricType] - prevValue) / prevValue) * 100 : 0
    return {
      date: format(new Date(item.date), 'MMM dd'),
      shortDate: format(new Date(item.date), 'MMM dd'),
      revenue: item.revenue,
      profit: item.profit || 0,
      sales: item.sales,
      change: change,
      isUp: change >= 0,
    }
  }) || []

  // Calculate totals for summary
  const totalRevenue = chartData.reduce((sum, d) => sum + d.revenue, 0)
  const totalProfit = chartData.reduce((sum, d) => sum + d.profit, 0)
  const totalSales = chartData.reduce((sum, d) => sum + d.sales, 0)
  const avgValue = chartData.length > 0 ? (metricType === 'revenue' ? totalRevenue : totalProfit) / chartData.length : 0
  
  // Calculate trend (compare last 7 days vs previous 7 days)
  const last7 = chartData.slice(-7)
  const prev7 = chartData.slice(-14, -7)
  const last7Total = last7.reduce((sum, d) => sum + d[metricType], 0)
  const prev7Total = prev7.reduce((sum, d) => sum + d[metricType], 0)
  const trendPercent = prev7Total > 0 ? ((last7Total - prev7Total) / prev7Total) * 100 : 0
  const isUpTrend = trendPercent >= 0
  
  // Dynamic colors based on metric type
  const metricColor = metricType === 'revenue' ? colors.primary : colors.green

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
    return value.toFixed(0)
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = chartData.find(d => d.date === label || d.shortDate === label)
      return (
        <div 
          className="rounded-lg shadow-lg p-3 min-w-[150px]"
          style={{ 
            backgroundColor: colors.tooltipBg, 
            border: `1px solid ${colors.tooltipBorder}` 
          }}
        >
          <p className="font-medium text-sm mb-2" style={{ color: isDark ? '#f3f4f6' : '#111827' }}>{label}</p>
          <div className="flex items-center justify-between gap-4 text-sm">
            <span style={{ color: colors.text }}>Revenue:</span>
            <span className="font-medium" style={{ color: colors.primary }}>
              KSH {(dataPoint?.revenue || 0).toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 text-sm">
            <span style={{ color: colors.text }}>Profit:</span>
            <span className="font-medium" style={{ color: (dataPoint?.profit || 0) >= 0 ? colors.green : '#ef4444' }}>
              KSH {(dataPoint?.profit || 0).toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 text-sm">
            <span style={{ color: colors.text }}>Sales:</span>
            <span className="font-medium" style={{ color: colors.text }}>
              {dataPoint?.sales || 0}
            </span>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold">Sales Overview</h2>
          <p className="text-sm text-muted-foreground">
            {startDate && endDate 
              ? `${format(startDate, 'MMM dd, yyyy')} - ${format(endDate, 'MMM dd, yyyy')}`
              : 'All time performance'}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {/* Trend indicator */}
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            isUpTrend 
              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' 
              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
          }`}>
            {isUpTrend ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            <span>{Math.abs(trendPercent).toFixed(1)}%</span>
          </div>
          
          {/* Metric type toggle */}
          <div className="flex border rounded-lg overflow-hidden">
            <Button
              variant={metricType === 'revenue' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-none h-8 px-2"
              onClick={() => setMetricType('revenue')}
              title="Show Revenue"
            >
              <DollarSign className="h-4 w-4" />
            </Button>
            <Button
              variant={metricType === 'profit' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-none h-8 px-2"
              onClick={() => setMetricType('profit')}
              title="Show Profit"
            >
              <Wallet className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Chart type toggle */}
          <div className="flex border rounded-lg overflow-hidden">
            <Button
              variant={chartType === 'bar' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-none h-8 px-2"
              onClick={() => setChartType('bar')}
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
            <Button
              variant={chartType === 'composed' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-none h-8 px-2"
              onClick={() => setChartType('composed')}
            >
              <LineChartIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="text-center p-2 sm:p-3 bg-muted/50 rounded-lg">
          <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">Revenue</p>
          <p className="text-sm sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 truncate">
            KSH {(kpiRevenue ?? totalRevenue).toLocaleString()}
          </p>
        </div>
        <div className="text-center p-2 sm:p-3 bg-muted/50 rounded-lg">
          <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">Profit</p>
          <p className={`text-sm sm:text-lg font-bold truncate ${(kpiProfit ?? totalProfit) >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
            KSH {(kpiProfit ?? totalProfit).toLocaleString()}
          </p>
        </div>
        <div className="text-center p-2 sm:p-3 bg-muted/50 rounded-lg">
          <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">Sales</p>
          <p className="text-sm sm:text-lg font-bold text-purple-600 dark:text-purple-400">{totalSales}</p>
        </div>
        <div className="text-center p-2 sm:p-3 bg-muted/50 rounded-lg">
          <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">Daily Avg</p>
          <p className="text-sm sm:text-lg font-bold text-orange-600 dark:text-orange-400 truncate">
            KSH {avgValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>

      <div className="h-72">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart data={chartData} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.grid} />
                <XAxis 
                  dataKey="shortDate" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: colors.text, fontSize: 11 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: colors.text, fontSize: 11 }}
                  tickFormatter={formatCurrency}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ paddingTop: '10px' }}
                  formatter={(value) => <span className="text-sm" style={{ color: colors.text }}>{value}</span>}
                />
                <Bar 
                  dataKey={metricType} 
                  name={metricType === 'revenue' ? 'Revenue' : 'Profit'}
                  fill={metricColor}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            ) : (
              <ComposedChart data={chartData}>
                <defs>
                  <linearGradient id="metricGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={metricColor} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={metricColor} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.grid} />
                <XAxis 
                  dataKey="shortDate" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: colors.text, fontSize: 11 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: colors.text, fontSize: 11 }}
                  tickFormatter={formatCurrency}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ paddingTop: '10px' }}
                  formatter={(value) => <span className="text-sm" style={{ color: colors.text }}>{value}</span>}
                />
                <Area
                  type="monotone"
                  dataKey={metricType}
                  name={metricType === 'revenue' ? 'Revenue' : 'Profit'}
                  fill="url(#metricGradient)"
                  stroke={metricColor}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="sales"
                  name="Sales Count"
                  stroke={colors.primary}
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            No sales data available
          </div>
        )}
      </div>
    </Card>
  )
}
