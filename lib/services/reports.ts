import { createClient } from '@/lib/supabase/client'

// Sales Report Types
export interface SalesReportSummary {
  totalSales: number
  totalRevenue: number
  totalCost: number
  grossProfit: number
  profitMargin: number
  averageSaleValue: number
}

export interface SalesReport {
  summary: SalesReportSummary
  byPaymentMethod: Array<{
    payment_method: string
    count: number
    total: number
  }>
  topProducts: Array<{
    product_name: string
    product_sku: string
    quantity_sold: number
    revenue: number
    profit: number
  }>
  byCategory: Array<{
    category: string
    quantity_sold: number
    revenue: number
    profit: number
  }>
  dailyBreakdown: Array<{
    date: string
    sales_count: number
    revenue: number
    profit: number
  }>
}

export async function generateSalesReport(
  tenantId: string,
  storeId: string,
  startDate: string,
  endDate: string
): Promise<SalesReport> {
  const supabase = createClient()

  // Get all transactions with items
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select(`
      *,
      items:transaction_items(*)
    `)
    .eq('tenant_id', tenantId)
    .eq('store_id', storeId)
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: true })

  if (error) throw error

  // Calculate summary
  const totalSales = transactions?.length || 0
  const totalRevenue = transactions?.reduce((sum, t) => sum + Number(t.total), 0) || 0
  
  // Calculate total cost from items
  let totalCost = 0
  const productCosts = new Map<string, number>()
  
  // Fetch product costs
  const productIds = [...new Set(transactions?.flatMap(t => t.items.map((i: any) => i.product_id)) || [])]
  if (productIds.length > 0) {
    const { data: products } = await supabase
      .from('products')
      .select('id, cost')
      .in('id', productIds)
    
    products?.forEach(p => {
      productCosts.set(p.id, Number(p.cost) || 0)
    })
  }

  // Calculate costs
  transactions?.forEach(t => {
    t.items.forEach((item: any) => {
      const cost = productCosts.get(item.product_id) || 0
      totalCost += cost * Number(item.quantity)
    })
  })

  const grossProfit = totalRevenue - totalCost
  const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0
  const averageSaleValue = totalSales > 0 ? totalRevenue / totalSales : 0

  // Group by payment method
  const paymentMethodMap = new Map<string, { count: number; total: number }>()
  transactions?.forEach(t => {
    const pm = t.payment_method
    const existing = paymentMethodMap.get(pm) || { count: 0, total: 0 }
    paymentMethodMap.set(pm, {
      count: existing.count + 1,
      total: existing.total + Number(t.total)
    })
  })

  const byPaymentMethod = Array.from(paymentMethodMap.entries()).map(([pm, data]) => ({
    payment_method: pm,
    count: data.count,
    total: data.total
  }))

  // Top products
  const productMap = new Map<string, {
    product_name: string
    product_sku: string
    quantity_sold: number
    revenue: number
    cost: number
  }>()

  transactions?.forEach(t => {
    t.items.forEach((item: any) => {
      const existing = productMap.get(item.product_id) || {
        product_name: item.product_name,
        product_sku: item.product_sku,
        quantity_sold: 0,
        revenue: 0,
        cost: 0
      }
      const itemCost = productCosts.get(item.product_id) || 0
      productMap.set(item.product_id, {
        ...existing,
        quantity_sold: existing.quantity_sold + Number(item.quantity),
        revenue: existing.revenue + Number(item.subtotal) + Number(item.tax_amount),
        cost: existing.cost + (itemCost * Number(item.quantity))
      })
    })
  })

  const topProducts = Array.from(productMap.values())
    .map(p => ({
      ...p,
      profit: p.revenue - p.cost
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 20)

  // By category
  const categoryMap = new Map<string, {
    quantity_sold: number
    revenue: number
    cost: number
  }>()

  // Fetch product categories
  const { data: products } = await supabase
    .from('products')
    .select('id, category')
    .in('id', productIds)

  const productCategories = new Map<string, string>()
  products?.forEach(p => {
    productCategories.set(p.id, p.category)
  })

  transactions?.forEach(t => {
    t.items.forEach((item: any) => {
      const category = productCategories.get(item.product_id) || 'Uncategorized'
      const existing = categoryMap.get(category) || {
        quantity_sold: 0,
        revenue: 0,
        cost: 0
      }
      const itemCost = productCosts.get(item.product_id) || 0
      categoryMap.set(category, {
        quantity_sold: existing.quantity_sold + Number(item.quantity),
        revenue: existing.revenue + Number(item.subtotal) + Number(item.tax_amount),
        cost: existing.cost + (itemCost * Number(item.quantity))
      })
    })
  })

  const byCategory = Array.from(categoryMap.entries()).map(([category, data]) => ({
    category,
    quantity_sold: data.quantity_sold,
    revenue: data.revenue,
    profit: data.revenue - data.cost
  }))

  // Daily breakdown
  const dailyMap = new Map<string, {
    sales_count: number
    revenue: number
    cost: number
  }>()

  transactions?.forEach(t => {
    const date = new Date(t.created_at).toISOString().split('T')[0]
    const existing = dailyMap.get(date) || {
      sales_count: 0,
      revenue: 0,
      cost: 0
    }
    
    let transactionCost = 0
    t.items.forEach((item: any) => {
      const itemCost = productCosts.get(item.product_id) || 0
      transactionCost += itemCost * Number(item.quantity)
    })

    dailyMap.set(date, {
      sales_count: existing.sales_count + 1,
      revenue: existing.revenue + Number(t.total),
      cost: existing.cost + transactionCost
    })
  })

  const dailyBreakdown = Array.from(dailyMap.entries()).map(([date, data]) => ({
    date,
    sales_count: data.sales_count,
    revenue: data.revenue,
    profit: data.revenue - data.cost
  }))

  return {
    summary: {
      totalSales,
      totalRevenue,
      totalCost,
      grossProfit,
      profitMargin,
      averageSaleValue
    },
    byPaymentMethod,
    topProducts,
    byCategory,
    dailyBreakdown
  }
}


// Stock Report Types
export interface StockReportSummary {
  totalProducts: number
  openingStockValue: number
  currentStockValue: number
  stockValueChange: number
  lowStockCount: number
  outOfStockCount: number
}

export interface StockReport {
  summary: StockReportSummary
  products: Array<{
    id: string
    name: string
    sku: string
    category: string
    opening_stock: number
    current_stock: number
    stock_change: number
    base_unit: string
    cost: number
    opening_value: number
    current_value: number
    status: string
  }>
  movements: Array<{
    created_at: string
    product?: { name: string; sku: string }
    type: string
    quantity_change: number
    quantity_after: number
    reason: string | null
    user?: { full_name: string }
  }>
  byCategory: Array<{
    category: string
    product_count: number
    total_value: number
    low_stock_count: number
  }>
}

export async function generateStockReport(
  tenantId: string,
  storeId: string,
  startDate: string,
  endDate: string
): Promise<StockReport> {
  const supabase = createClient()

  // Get all products
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('store_id', storeId)
    .eq('is_archived', false)

  if (productsError) throw productsError

  // Get stock movements in the period
  const { data: movements, error: movementsError } = await supabase
    .from('stock_history')
    .select(`
      *,
      product:products(name, sku),
      user:users(full_name)
    `)
    .eq('tenant_id', tenantId)
    .eq('store_id', storeId)
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: true })

  if (movementsError) throw movementsError

  // Calculate opening stock for each product
  const productStockData = await Promise.all(
    (products || []).map(async (product) => {
      // Get movements before start date to calculate opening stock
      const { data: beforeMovements } = await supabase
        .from('stock_history')
        .select('quantity_after')
        .eq('product_id', product.id)
        .lt('created_at', startDate)
        .order('created_at', { ascending: false })
        .limit(1)

      let openingStock: number
      
      if (beforeMovements && beforeMovements.length > 0) {
        // We have historical data before the start date
        openingStock = beforeMovements[0].quantity_after
      } else {
        // No historical data before start date
        // Calculate opening stock by adding back all movements during the period
        const { data: periodMovements } = await supabase
          .from('stock_history')
          .select('quantity_change, type')
          .eq('product_id', product.id)
          .gte('created_at', startDate)
          .lte('created_at', endDate)
        
        // Start with current stock and reverse all movements in the period
        let calculatedOpening = product.stock_quantity
        periodMovements?.forEach(movement => {
          // Reverse the movement: subtract what was added, add what was subtracted
          calculatedOpening -= movement.quantity_change
        })
        
        openingStock = calculatedOpening
      }

      const currentStock = product.stock_quantity
      const stockChange = currentStock - openingStock
      const cost = Number(product.cost) || 0

      let status = 'Normal'
      if (currentStock === 0) status = 'Out of Stock'
      else if (currentStock <= product.low_stock_threshold) status = 'Low Stock'

      return {
        id: product.id,
        name: product.name,
        sku: product.sku,
        category: product.category,
        opening_stock: openingStock,
        current_stock: currentStock,
        stock_change: stockChange,
        base_unit: product.base_unit,
        cost,
        opening_value: openingStock * cost,
        current_value: currentStock * cost,
        status
      }
    })
  )

  // Calculate summary
  const totalProducts = productStockData.length
  const openingStockValue = productStockData.reduce((sum, p) => sum + p.opening_value, 0)
  const currentStockValue = productStockData.reduce((sum, p) => sum + p.current_value, 0)
  const stockValueChange = currentStockValue - openingStockValue
  const lowStockCount = productStockData.filter(p => p.status === 'Low Stock').length
  const outOfStockCount = productStockData.filter(p => p.status === 'Out of Stock').length

  // Group by category
  const categoryMap = new Map<string, {
    product_count: number
    total_value: number
    low_stock_count: number
  }>()

  productStockData.forEach(p => {
    const existing = categoryMap.get(p.category) || {
      product_count: 0,
      total_value: 0,
      low_stock_count: 0
    }
    categoryMap.set(p.category, {
      product_count: existing.product_count + 1,
      total_value: existing.total_value + p.current_value,
      low_stock_count: existing.low_stock_count + (p.status === 'Low Stock' ? 1 : 0)
    })
  })

  const byCategory = Array.from(categoryMap.entries()).map(([category, data]) => ({
    category,
    ...data
  }))

  return {
    summary: {
      totalProducts,
      openingStockValue,
      currentStockValue,
      stockValueChange,
      lowStockCount,
      outOfStockCount
    },
    products: productStockData,
    movements: movements || [],
    byCategory
  }
}


// Transactions Report Types
export interface TransactionsReportSummary {
  totalTransactions: number
  totalAmount: number
  totalCost: number
  totalProfit: number
  averageTransaction: number
  completedCount: number
  debtCount: number
  totalOutstanding: number
}

export interface TransactionsReport {
  summary: TransactionsReportSummary
  transactions: Array<any>
  dailyProfitLoss: Array<{
    date: string
    transaction_count: number
    revenue: number
    cost: number
    profit: number
    margin: number
  }>
}

export async function generateTransactionsReport(
  tenantId: string,
  storeId: string,
  startDate: string,
  endDate: string
): Promise<TransactionsReport> {
  const supabase = createClient()

  // Get all transactions with related data
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select(`
      *,
      customer:customers(name),
      served_by_user:users!transactions_served_by_fkey(full_name),
      items:transaction_items(*)
    `)
    .eq('tenant_id', tenantId)
    .eq('store_id', storeId)
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: false })

  if (error) throw error

  // Fetch product costs
  const productIds = [...new Set(transactions?.flatMap(t => t.items.map((i: any) => i.product_id)) || [])]
  const productCosts = new Map<string, number>()
  
  if (productIds.length > 0) {
    const { data: products } = await supabase
      .from('products')
      .select('id, cost')
      .in('id', productIds)
    
    products?.forEach(p => {
      productCosts.set(p.id, Number(p.cost) || 0)
    })
  }

  // Calculate costs and profits for each transaction
  const enrichedTransactions = (transactions || []).map(t => {
    let totalCost = 0
    t.items.forEach((item: any) => {
      const cost = productCosts.get(item.product_id) || 0
      totalCost += cost * Number(item.quantity)
    })
    
    return {
      ...t,
      total_cost: totalCost,
      profit: Number(t.total) - totalCost
    }
  })

  // Calculate summary
  const totalTransactions = enrichedTransactions.length
  const totalAmount = enrichedTransactions.reduce((sum, t) => sum + Number(t.total), 0)
  const totalCost = enrichedTransactions.reduce((sum, t) => sum + t.total_cost, 0)
  const totalProfit = totalAmount - totalCost
  const averageTransaction = totalTransactions > 0 ? totalAmount / totalTransactions : 0
  const completedCount = enrichedTransactions.filter(t => t.status === 'completed').length
  const debtCount = enrichedTransactions.filter(t => t.status === 'debt_pending').length
  const totalOutstanding = enrichedTransactions
    .filter(t => t.status === 'debt_pending')
    .reduce((sum, t) => sum + Number(t.outstanding_balance), 0)

  // Daily profit/loss
  const dailyMap = new Map<string, {
    transaction_count: number
    revenue: number
    cost: number
  }>()

  enrichedTransactions.forEach(t => {
    const date = new Date(t.created_at).toISOString().split('T')[0]
    const existing = dailyMap.get(date) || {
      transaction_count: 0,
      revenue: 0,
      cost: 0
    }
    dailyMap.set(date, {
      transaction_count: existing.transaction_count + 1,
      revenue: existing.revenue + Number(t.total),
      cost: existing.cost + t.total_cost
    })
  })

  const dailyProfitLoss = Array.from(dailyMap.entries()).map(([date, data]) => {
    const profit = data.revenue - data.cost
    const margin = data.revenue > 0 ? (profit / data.revenue) * 100 : 0
    return {
      date,
      transaction_count: data.transaction_count,
      revenue: data.revenue,
      cost: data.cost,
      profit,
      margin
    }
  }).sort((a, b) => a.date.localeCompare(b.date))

  return {
    summary: {
      totalTransactions,
      totalAmount,
      totalCost,
      totalProfit,
      averageTransaction,
      completedCount,
      debtCount,
      totalOutstanding
    },
    transactions: enrichedTransactions,
    dailyProfitLoss
  }
}


// Expenses Report Types
export interface ExpensesReportSummary {
  totalExpenses: number
  expenseCount: number
  averageExpense: number
  categoryCount: number
}

export interface ExpensesReport {
  summary: ExpensesReportSummary
  expenses: Array<any>
  byCategory: Array<{
    category_name: string
    count: number
    total: number
    average: number
    percentage: number
  }>
  dailyBreakdown: Array<{
    date: string
    count: number
    total: number
  }>
  topCategories: Array<{
    category_name: string
    total: number
    percentage: number
  }>
}

export async function generateExpensesReport(
  tenantId: string,
  storeId: string,
  startDate: string,
  endDate: string
): Promise<ExpensesReport> {
  const supabase = createClient()

  // Get all expenses with related data
  const { data: expenses, error } = await supabase
    .from('expenses')
    .select(`
      *,
      category:expense_categories(name),
      created_by_user:users(full_name)
    `)
    .eq('tenant_id', tenantId)
    .eq('store_id', storeId)
    .gte('expense_date', startDate)
    .lte('expense_date', endDate)
    .order('expense_date', { ascending: false })

  if (error) throw error

  // Calculate summary
  const expenseCount = expenses?.length || 0
  const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0
  const averageExpense = expenseCount > 0 ? totalExpenses / expenseCount : 0
  const categoryCount = new Set(expenses?.map(e => e.category_id)).size

  // Group by category
  const categoryMap = new Map<string, {
    count: number
    total: number
  }>()

  expenses?.forEach(e => {
    const categoryName = e.category?.name || 'Uncategorized'
    const existing = categoryMap.get(categoryName) || { count: 0, total: 0 }
    categoryMap.set(categoryName, {
      count: existing.count + 1,
      total: existing.total + Number(e.amount)
    })
  })

  const byCategory = Array.from(categoryMap.entries()).map(([category_name, data]) => ({
    category_name,
    count: data.count,
    total: data.total,
    average: data.total / data.count,
    percentage: totalExpenses > 0 ? (data.total / totalExpenses) * 100 : 0
  })).sort((a, b) => b.total - a.total)

  // Daily breakdown
  const dailyMap = new Map<string, {
    count: number
    total: number
  }>()

  expenses?.forEach(e => {
    const date = new Date(e.expense_date).toISOString().split('T')[0]
    const existing = dailyMap.get(date) || { count: 0, total: 0 }
    dailyMap.set(date, {
      count: existing.count + 1,
      total: existing.total + Number(e.amount)
    })
  })

  const dailyBreakdown = Array.from(dailyMap.entries()).map(([date, data]) => ({
    date,
    count: data.count,
    total: data.total
  })).sort((a, b) => a.date.localeCompare(b.date))

  // Top categories (top 10)
  const topCategories = byCategory.slice(0, 10)

  return {
    summary: {
      totalExpenses,
      expenseCount,
      averageExpense,
      categoryCount
    },
    expenses: expenses || [],
    byCategory,
    dailyBreakdown,
    topCategories
  }
}
