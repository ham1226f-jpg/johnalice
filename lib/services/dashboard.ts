import { createClient } from '@/lib/supabase/client'

export interface DashboardKPIs {
  totalRevenue: number
  totalProfit: number
  totalSales: number
  lowStockCount: number
  revenueChange: number
  profitChange: number
  salesChange: number
  grossRevenue: number
  totalReturns: number
  totalExpenses: number
}

export interface PaymentMethodBreakdown {
  cash: number
  mpesa: number
  bank: number
  debt: number
  total: number
}

export interface LowStockProduct {
  id: string
  name: string
  sku: string
  stock_quantity: number
  low_stock_threshold: number
  base_unit: string
}

// Helper to format date as YYYY-MM-DD in local time (avoids UTC offset issues)
function toLocalDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export async function getDashboardKPIs(
  tenantId: string,
  startDate?: Date,
  endDate?: Date,
  storeId?: string
): Promise<DashboardKPIs> {
  const supabase = createClient()

  // Get date range for current period
  const now = new Date()
  const currentStart = startDate || new Date(now.getFullYear(), now.getMonth(), 1)
  const currentEnd = endDate || now

  // Get previous period for comparison
  const periodLength = currentEnd.getTime() - currentStart.getTime()
  const previousStart = new Date(currentStart.getTime() - periodLength)
  const previousEnd = currentStart

  // Build transaction query
  let transactionQuery = supabase
    .from('transactions')
    .select('total, subtotal, transaction_items(quantity, unit_price, product_id, products(cost))')
    .eq('tenant_id', tenantId)
    .eq('status', 'completed')

  // Apply store filter if provided
  if (storeId) {
    transactionQuery = transactionQuery.eq('store_id', storeId)
  }

  // Only apply date filters if dates are provided
  if (startDate) {
    transactionQuery = transactionQuery.gte('created_at', currentStart.toISOString())
  }
  if (endDate) {
    transactionQuery = transactionQuery.lte('created_at', currentEnd.toISOString())
  }

  const { data: currentTransactions } = await transactionQuery

  // Fetch previous period transactions for comparison
  let previousTransactionQuery = supabase
    .from('transactions')
    .select('total')
    .eq('tenant_id', tenantId)
    .eq('status', 'completed')
    .gte('created_at', previousStart.toISOString())
    .lte('created_at', previousEnd.toISOString())

  // Apply store filter if provided
  if (storeId) {
    previousTransactionQuery = previousTransactionQuery.eq('store_id', storeId)
  }

  const { data: previousTransactions } = await previousTransactionQuery

  // Fetch approved returns with their original transaction date
  const { data: approvedReturns } = await supabase
    .from('returns')
    .select('total_amount, return_items(quantity, unit_price, product_id, products(cost)), transaction:transactions(created_at)')
    .eq('tenant_id', tenantId)
    .eq('status', 'approved')

  // Calculate total returns amount and profit loss (only for returns whose original transaction is in the date range)
  // Products without cost prices (NULL or 0) are excluded from profit calculation
  let totalReturnsAmount = 0
  let returnsProfitLoss = 0
  
  approvedReturns?.forEach((returnItem: any) => {
    // Use the original transaction's created_at date
    const transactionDate = returnItem.transaction?.created_at
    if (!transactionDate) return
    
    const txDate = new Date(transactionDate)
    // Only include if the original transaction date is within our date range
    if (startDate && txDate < currentStart) return
    if (endDate && txDate > currentEnd) return
    
    totalReturnsAmount += Number(returnItem.total_amount)
    
    const items = returnItem.return_items || []
    items.forEach((item: any) => {
      const cost = item.products?.cost
      // Skip products without valid cost prices
      if (!cost || Number(cost) === 0) return
      
      const revenue = Number(item.unit_price) * Number(item.quantity)
      const itemCost = Number(cost) * Number(item.quantity)
      returnsProfitLoss += revenue - itemCost
    })
  })

  // Fetch expenses for the period
  let expensesQuery = supabase
    .from('expenses')
    .select('amount, expense_date')
    .eq('tenant_id', tenantId)

  // Apply store filter if provided
  if (storeId) {
    expensesQuery = expensesQuery.eq('store_id', storeId)
  }

  if (startDate) {
    expensesQuery = expensesQuery.gte('expense_date', toLocalDateStr(currentStart))
  }
  if (endDate) {
    expensesQuery = expensesQuery.lte('expense_date', toLocalDateStr(currentEnd))
  }

  const { data: expenses } = await expensesQuery
  const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0

  // Calculate current period metrics
  const grossRevenue = currentTransactions?.reduce((sum, t) => sum + Number(t.total), 0) || 0
  // Net revenue = gross sales - returns - expenses
  const totalRevenue = grossRevenue - totalReturnsAmount - totalExpenses
  const totalSales = currentTransactions?.length || 0

  // Calculate profit (revenue - cost) minus returns profit loss
  // Note: For profit, we subtract the profit lost from returns (not the full return amount)
  // because when a return happens, we get the product back (recover the cost)
  // Expenses are NOT subtracted from profit, only from revenue
  // Products without cost prices (NULL or 0) are excluded from profit calculation
  let grossProfit = 0
  currentTransactions?.forEach((transaction: any) => {
    const items = transaction.transaction_items || []
    items.forEach((item: any) => {
      const cost = item.products?.cost
      // Skip products without valid cost prices
      if (!cost || Number(cost) === 0) return
      
      const revenue = Number(item.unit_price) * Number(item.quantity)
      const itemCost = Number(cost) * Number(item.quantity)
      grossProfit += revenue - itemCost
    })
  })
  // Total profit = gross profit - returns profit loss (expenses NOT subtracted)
  const totalProfit = grossProfit - returnsProfitLoss

  // Calculate previous period metrics for comparison
  const previousRevenue = previousTransactions?.reduce((sum, t) => sum + Number(t.total), 0) || 0
  const previousSales = previousTransactions?.length || 0

  // Calculate percentage changes (comparing net revenue to net revenue)
  const revenueChange = previousRevenue > 0 
    ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
    : totalRevenue > 0 ? 100 : 0
  const salesChange = previousSales > 0 
    ? ((totalSales - previousSales) / previousSales) * 100 
    : totalSales > 0 ? 100 : 0
  const profitChange = 0 // Would need previous profit calculation

  // Get low stock count - fetch all products and filter in JavaScript
  // because Supabase doesn't support column-to-column comparison in filters
  let lowStockQuery = supabase
    .from('products')
    .select('stock_quantity, low_stock_threshold')
    .eq('tenant_id', tenantId)
    .eq('is_archived', false)

  // Apply store filter if provided
  if (storeId) {
    lowStockQuery = lowStockQuery.eq('store_id', storeId)
  }

  const { data: lowStockData } = await lowStockQuery
  const lowStockCount = lowStockData?.filter(p => {
    const stockQty = Number(p.stock_quantity) || 0
    const threshold = Number(p.low_stock_threshold) || 0
    return stockQty <= threshold
  }).length || 0

  return {
    totalRevenue,
    totalProfit,
    totalSales,
    lowStockCount: lowStockCount || 0,
    revenueChange,
    profitChange,
    salesChange,
    grossRevenue,
    totalReturns: totalReturnsAmount,
    totalExpenses,
  }
}

export async function getLowStockProducts(tenantId: string, storeId?: string): Promise<LowStockProduct[]> {
  const supabase = createClient()

  // Get all non-archived products
  let query = supabase
    .from('products')
    .select('id, name, sku, stock_quantity, low_stock_threshold, base_unit')
    .eq('tenant_id', tenantId)
    .eq('is_archived', false)
    .order('stock_quantity', { ascending: true })

  // Apply store filter if provided
  if (storeId) {
    query = query.eq('store_id', storeId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching low stock products:', error)
    return []
  }

  // Filter in JavaScript to compare stock_quantity with low_stock_threshold
  // Convert to numbers for proper comparison
  const lowStockProducts = (data || []).filter(
    product => {
      const stockQty = Number(product.stock_quantity) || 0
      const threshold = Number(product.low_stock_threshold) || 0
      return stockQty <= threshold
    }
  ).slice(0, 10)

  return lowStockProducts
}

export async function getSalesTrend(
  tenantId: string,
  days: number = 30,
  filterStartDate?: Date,
  filterEndDate?: Date,
  storeId?: string
): Promise<{ date: string; revenue: number; profit: number; sales: number }[]> {
  const supabase = createClient()
  
  // If both dates are undefined (All Time), fetch all transactions
  // Otherwise use provided dates or default to last N days
  const isAllTime = filterStartDate === undefined && filterEndDate === undefined
  
  let startDate: Date | undefined
  let endDate: Date | undefined
  
  if (!isAllTime) {
    endDate = filterEndDate || new Date()
    startDate = filterStartDate || (() => {
      const d = new Date()
      d.setDate(d.getDate() - days)
      return d
    })()
  }

  let transactionQuery = supabase
    .from('transactions')
    .select('created_at, total, transaction_items(quantity, unit_price, product_id, products(cost))')
    .eq('tenant_id', tenantId)
    .eq('status', 'completed')
  
  // Apply store filter if provided
  if (storeId) {
    transactionQuery = transactionQuery.eq('store_id', storeId)
  }

  if (startDate) {
    transactionQuery = transactionQuery.gte('created_at', startDate.toISOString())
  }
  if (endDate) {
    transactionQuery = transactionQuery.lte('created_at', endDate.toISOString())
  }
  
  const { data: transactions } = await transactionQuery.order('created_at', { ascending: true })

  // Fetch approved returns with their original transaction date
  const { data: approvedReturns } = await supabase
    .from('returns')
    .select('transaction_id, total_amount, return_items(quantity, unit_price, product_id, products(cost)), transaction:transactions(created_at)')
    .eq('tenant_id', tenantId)
    .eq('status', 'approved')

  // Group transactions by date
  const grouped = new Map<string, { revenue: number; profit: number; sales: number }>()
  
  transactions?.forEach((t: any) => {
    const date = toLocalDateStr(new Date(t.created_at))
    const existing = grouped.get(date) || { revenue: 0, profit: 0, sales: 0 }
    
    // Calculate profit for this transaction
    // Products without cost prices (NULL or 0) are excluded from profit calculation
    let transactionProfit = 0
    const items = t.transaction_items || []
    items.forEach((item: any) => {
      const cost = item.products?.cost
      // Skip products without valid cost prices
      if (!cost || Number(cost) === 0) return
      
      const revenue = Number(item.unit_price) * Number(item.quantity)
      const itemCost = Number(cost) * Number(item.quantity)
      transactionProfit += revenue - itemCost
    })
    
    grouped.set(date, {
      revenue: existing.revenue + Number(t.total),
      profit: existing.profit + transactionProfit,
      sales: existing.sales + 1,
    })
  })

  // Subtract returns from revenue and profit using the ORIGINAL TRANSACTION DATE
  // Products without cost prices (NULL or 0) are excluded from profit calculation
  approvedReturns?.forEach((returnItem: any) => {
    // Use the original transaction's created_at date, not the return approval date
    const transactionDate = returnItem.transaction?.created_at
    if (!transactionDate) return
    
    const date = toLocalDateStr(new Date(transactionDate))
    // Only process if the transaction date is within our date range (skip check for All Time)
    if (startDate && date < toLocalDateStr(startDate!)) return
    if (endDate && date > toLocalDateStr(endDate!)) return
    
    const existing = grouped.get(date) || { revenue: 0, profit: 0, sales: 0 }
    
    // Calculate profit loss from return
    let returnProfitLoss = 0
    const items = returnItem.return_items || []
    items.forEach((item: any) => {
      const cost = item.products?.cost
      // Skip products without valid cost prices
      if (!cost || Number(cost) === 0) return
      
      const revenue = Number(item.unit_price) * Number(item.quantity)
      const itemCost = Number(cost) * Number(item.quantity)
      returnProfitLoss += revenue - itemCost
    })
    
    grouped.set(date, {
      revenue: existing.revenue - Number(returnItem.total_amount),
      profit: existing.profit - returnProfitLoss,
      sales: existing.sales,
    })
  })

  return Array.from(grouped.entries()).map(([date, data]) => ({
    date,
    ...data,
  }))
}


export interface DailySummary {
  grossSales: number
  grossProfit: number
  returns: number
  returnsProfitLoss: number
  expenses: number
  transactionCount: number
}

export async function getDailySummary(
  tenantId: string,
  startDate?: Date,
  endDate?: Date,
  storeId?: string
): Promise<DailySummary> {
  const supabase = createClient()

  // Use provided dates or default to today
  const now = new Date()
  const start = startDate || new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const end = endDate || new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
  
  // Format date as YYYY-MM-DD for expense_date comparison
  const dateStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`

  // Fetch completed transactions for the date range
  let transactionQuery = supabase
    .from('transactions')
    .select('total, transaction_items(quantity, unit_price, product_id, products(cost))')
    .eq('tenant_id', tenantId)
    .eq('status', 'completed')
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString())

  // Apply store filter if provided
  if (storeId) {
    transactionQuery = transactionQuery.eq('store_id', storeId)
  }

  const { data: transactions } = await transactionQuery

  // Calculate gross sales and profit
  // Products without cost prices (NULL or 0) are excluded from profit calculation
  let grossSales = 0
  let grossProfit = 0
  
  transactions?.forEach((t: any) => {
    grossSales += Number(t.total)
    const items = t.transaction_items || []
    items.forEach((item: any) => {
      const cost = item.products?.cost
      // Skip products without valid cost prices
      if (!cost || Number(cost) === 0) return
      
      const revenue = Number(item.unit_price) * Number(item.quantity)
      const itemCost = Number(cost) * Number(item.quantity)
      grossProfit += revenue - itemCost
    })
  })

  // Fetch approved returns (by approval date for daily tracking)
  const { data: returns } = await supabase
    .from('returns')
    .select('total_amount, return_items(quantity, unit_price, product_id, products(cost))')
    .eq('tenant_id', tenantId)
    .eq('status', 'approved')
    .gte('approved_at', start.toISOString())
    .lte('approved_at', end.toISOString())

  let totalReturns = 0
  let returnsProfitLoss = 0
  
  returns?.forEach((returnItem: any) => {
    totalReturns += Number(returnItem.total_amount)
    const items = returnItem.return_items || []
    items.forEach((item: any) => {
      const cost = item.products?.cost
      // Skip products without valid cost prices
      if (!cost || Number(cost) === 0) return
      
      const revenue = Number(item.unit_price) * Number(item.quantity)
      const itemCost = Number(cost) * Number(item.quantity)
      returnsProfitLoss += revenue - itemCost
    })
  })

  // Fetch expenses for the date range - always filter by date
  let expensesQuery = supabase
    .from('expenses')
    .select('amount')
    .eq('tenant_id', tenantId)
    .gte('expense_date', toLocalDateStr(start))
    .lte('expense_date', toLocalDateStr(end))

  // Apply store filter if provided
  if (storeId) {
    expensesQuery = expensesQuery.eq('store_id', storeId)
  }

  const { data: expenses } = await expensesQuery
  const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0

  return {
    grossSales,
    grossProfit,
    returns: totalReturns,
    returnsProfitLoss,
    expenses: totalExpenses,
    transactionCount: transactions?.length || 0,
  }
}

export async function getPaymentMethodBreakdown(
  tenantId: string,
  startDate?: Date,
  endDate?: Date,
  storeId?: string
): Promise<PaymentMethodBreakdown> {
  const supabase = createClient()

  // Build query
  let query = supabase
    .from('transactions')
    .select('payment_method, total')
    .eq('tenant_id', tenantId)
    .eq('status', 'completed')

  // Apply store filter if provided
  if (storeId) {
    query = query.eq('store_id', storeId)
  }

  if (startDate) {
    query = query.gte('created_at', startDate.toISOString())
  }
  if (endDate) {
    query = query.lte('created_at', endDate.toISOString())
  }

  const { data: transactions, error } = await query

  if (error) throw error

  // Calculate totals by payment method
  const breakdown = {
    cash: 0,
    mpesa: 0,
    bank: 0,
    debt: 0,
    total: 0,
  }

  transactions?.forEach((t: any) => {
    const amount = Number(t.total)
    breakdown.total += amount

    switch (t.payment_method) {
      case 'cash':
        breakdown.cash += amount
        break
      case 'mpesa':
        breakdown.mpesa += amount
        break
      case 'bank':
        breakdown.bank += amount
        break
      case 'debt':
        breakdown.debt += amount
        break
    }
  })

  return breakdown
}

export interface InventoryAnalytics {
  totalCostValue: number
  totalSellingValue: number
  potentialProfit: number
  productCount: number
  variablePriceCount: number
}

export async function getInventoryAnalytics(tenantId: string, storeId?: string): Promise<InventoryAnalytics> {
  const supabase = createClient()

  let query = supabase
    .from('products')
    .select('stock_quantity, cost, price, is_variable_price')
    .eq('tenant_id', tenantId)
    .eq('is_archived', false)

  // Apply store filter if provided
  if (storeId) {
    query = query.eq('store_id', storeId)
  }

  const { data: products } = await query

  let totalCostValue = 0
  let totalSellingValue = 0
  let productCount = 0
  let variablePriceCount = 0

  products?.forEach((product) => {
    const stockQty = Number(product.stock_quantity) || 0
    const cost = Number(product.cost) || 0
    const price = Number(product.price) || 0
    const isVariable = product.is_variable_price || false

    if (isVariable) {
      variablePriceCount++
    }

    // Only count products with valid cost and price
    if (cost > 0 && stockQty > 0) {
      totalCostValue += cost * stockQty
      productCount++
      
      // Only add to selling value if price is set (not variable price)
      if (price > 0 && !isVariable) {
        totalSellingValue += price * stockQty
      }
    }
  })

  const potentialProfit = totalSellingValue - totalCostValue

  return {
    totalCostValue,
    totalSellingValue,
    potentialProfit,
    productCount,
    variablePriceCount,
  }
}

export interface TopProduct {
  id: string
  name: string
  sku: string
  category: string
  totalRevenue: number
  totalQuantitySold: number
  totalProfit: number
  averagePrice: number
  stockQuantity: number
}

export interface CategoryStockValue {
  category: string
  costValue: number
  sellingValue: number
  potentialProfit: number
  productCount: number
  stockQuantity: number
}

export async function getTopProducts(
  tenantId: string,
  limit: number = 10,
  startDate?: Date,
  endDate?: Date,
  storeId?: string
): Promise<TopProduct[]> {
  const supabase = createClient()

  // Build query for transaction items
  let query = supabase
    .from('transaction_items')
    .select(`
      product_id,
      product_name,
      product_sku,
      quantity,
      unit_price,
      subtotal,
      transaction:transactions!inner(
        status,
        created_at,
        tenant_id
      ),
      product:products(
        category,
        cost,
        stock_quantity
      )
    `)
    .eq('transaction.tenant_id', tenantId)
    .eq('transaction.status', 'completed')

  // Apply store filter if provided
  if (storeId) {
    query = query.eq('transaction.store_id', storeId)
  }

  if (startDate) {
    query = query.gte('transaction.created_at', startDate.toISOString())
  }
  if (endDate) {
    query = query.lte('transaction.created_at', endDate.toISOString())
  }

  const { data: items } = await query

  // Group by product and calculate metrics
  const productMap = new Map<string, {
    name: string
    sku: string
    category: string
    totalRevenue: number
    totalQuantitySold: number
    totalProfit: number
    priceSum: number
    priceCount: number
    cost: number
    stockQuantity: number
  }>()

  items?.forEach((item: any) => {
    const productId = item.product_id
    const existing = productMap.get(productId)
    const quantity = Number(item.quantity)
    const revenue = Number(item.subtotal)
    const cost = Number(item.product?.cost || 0)
    const profit = cost > 0 ? revenue - (cost * quantity) : 0

    if (existing) {
      existing.totalRevenue += revenue
      existing.totalQuantitySold += quantity
      existing.totalProfit += profit
      existing.priceSum += Number(item.unit_price)
      existing.priceCount += 1
    } else {
      productMap.set(productId, {
        name: item.product_name,
        sku: item.product_sku,
        category: item.product?.category || 'Uncategorized',
        totalRevenue: revenue,
        totalQuantitySold: quantity,
        totalProfit: profit,
        priceSum: Number(item.unit_price),
        priceCount: 1,
        cost: cost,
        stockQuantity: Number(item.product?.stock_quantity || 0)
      })
    }
  })

  // Convert to array and sort by revenue
  const topProducts = Array.from(productMap.entries())
    .map(([id, data]) => ({
      id,
      name: data.name,
      sku: data.sku,
      category: data.category,
      totalRevenue: data.totalRevenue,
      totalQuantitySold: data.totalQuantitySold,
      totalProfit: data.totalProfit,
      averagePrice: data.priceSum / data.priceCount,
      stockQuantity: data.stockQuantity
    }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, limit)

  return topProducts
}

export async function getCategoryStockValue(tenantId: string, storeId?: string): Promise<CategoryStockValue[]> {
  const supabase = createClient()

  let query = supabase
    .from('products')
    .select('category, stock_quantity, cost, price, is_variable_price')
    .eq('tenant_id', tenantId)
    .eq('is_archived', false)

  // Apply store filter if provided
  if (storeId) {
    query = query.eq('store_id', storeId)
  }

  const { data: products } = await query

  // Group by category
  const categoryMap = new Map<string, {
    costValue: number
    sellingValue: number
    productCount: number
    stockQuantity: number
  }>()

  products?.forEach((product) => {
    const category = product.category || 'Uncategorized'
    const stockQty = Number(product.stock_quantity) || 0
    const cost = Number(product.cost) || 0
    const price = Number(product.price) || 0
    const isVariable = product.is_variable_price || false

    const existing = categoryMap.get(category) || {
      costValue: 0,
      sellingValue: 0,
      productCount: 0,
      stockQuantity: 0
    }

    if (cost > 0 && stockQty > 0) {
      existing.costValue += cost * stockQty
      existing.productCount += 1
      existing.stockQuantity += stockQty
      
      if (price > 0 && !isVariable) {
        existing.sellingValue += price * stockQty
      }
    }

    categoryMap.set(category, existing)
  })

  // Convert to array and sort by cost value
  return Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      costValue: data.costValue,
      sellingValue: data.sellingValue,
      potentialProfit: data.sellingValue - data.costValue,
      productCount: data.productCount,
      stockQuantity: data.stockQuantity
    }))
    .sort((a, b) => b.costValue - a.costValue)
}
