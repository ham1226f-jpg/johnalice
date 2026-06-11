import { Tour } from '@/types'

export const dashboardTours: Tour[] = [
  {
    id: 'dashboard-overview',
    title: 'Understanding Your Dashboard',
    description: 'Learn about your business metrics and analytics',
    pageId: 'dashboard',
    category: 'getting-started',
    estimatedDuration: 2,
    requiredRole: 'admin',
    steps: [
      {
        id: 'dashboard-welcome',
        title: 'Welcome to Your Dashboard',
        content: 'This is your business overview page where you can see key metrics, sales trends, and important alerts.',
        targetSelector: '[data-tour="dashboard-container"]',
        placement: 'center',
        isInteractive: false
      },
      {
        id: 'dashboard-kpis',
        title: 'Key Performance Indicators',
        content: 'These cards show your most important business metrics: Total Revenue, Total Profit, Total Sales, and Low Stock Items.',
        targetSelector: '[data-tour="kpi-cards"]',
        placement: 'bottom',
        isInteractive: false
      },
      {
        id: 'dashboard-sales-trend',
        title: 'Sales Trend Chart',
        content: 'This chart shows your sales performance over time. You can change the date range to view different periods.',
        targetSelector: '[data-tour="sales-chart"]',
        placement: 'top',
        isInteractive: false
      },
      {
        id: 'dashboard-low-stock',
        title: 'Low Stock Alerts',
        content: 'This table shows products that are running low on stock. Click "Restock" to quickly adjust inventory levels.',
        targetSelector: '[data-tour="low-stock-table"]',
        placement: 'top',
        isInteractive: false
      },
      {
        id: 'dashboard-date-filter',
        title: 'Date Range Filter',
        content: 'Use the date range selector to view metrics for different time periods: Today, This Week, This Month, or a custom range.',
        targetSelector: '[data-tour="date-filter"]',
        placement: 'bottom',
        isInteractive: false
      }
    ]
  }
]
