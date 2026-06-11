/**
 * Report Data Transformation Utilities
 * 
 * This module provides functions to transform report data from the service layer
 * into table-friendly formats for preview display.
 */

import type {
  SalesTableData,
  StockTableData,
  TransactionTableData,
  ExpenseTableData
} from '@/types'
import type {
  SalesReport,
  StockReport,
  TransactionsReport,
  ExpensesReport
} from '@/lib/services/reports'

/**
 * Transform sales report data into table format
 * 
 * @param report - Sales report from generateSalesReport service
 * @returns Array of sales table data
 * 
 * Preconditions:
 * - report is non-null and contains valid SalesReport structure
 * - report.topProducts is an array (may be empty)
 * 
 * Postconditions:
 * - Returns array of SalesTableData objects
 * - Each item has all required fields populated
 * - avgPrice is calculated as revenue / quantity_sold
 * - All monetary values are rounded to 2 decimal places
 */
export function transformSalesDataForTable(report: SalesReport): SalesTableData[] {
  if (!report || !report.topProducts) {
    return []
  }

  return report.topProducts.map(product => {
    // Calculate average price
    const avgPrice = product.quantity_sold > 0
      ? product.revenue / product.quantity_sold
      : 0

    return {
      itemName: product.product_name,
      itemSku: product.product_sku,
      qtySold: product.quantity_sold,
      avgPrice: Math.round(avgPrice * 100) / 100, // Round to 2 decimal places
      discount: 0, // TODO: Calculate from transaction-level discounts if available
      amount: Math.round(product.revenue * 100) / 100
    }
  })
}

/**
 * Transform stock report data into simplified table format
 * 
 * @param report - Stock report from generateStockReport service
 * @returns Array of stock table data
 * 
 * Preconditions:
 * - report is non-null and contains valid StockReport structure
 * - report.products is an array (may be empty)
 * - report.movements is an array of stock movements
 * 
 * Postconditions:
 * - Returns array of StockTableData objects
 * - Each item has all required fields populated
 * - stockAdded is sum of restock movements
 * - stockAdjustments is sum of adjustment movements
 * - stockSold is sum of sale movements
 * - closingStock equals openingStock + stockAdded + stockAdjustments - stockSold + returns
 * - All monetary values are rounded to 2 decimal places
 */
export function transformStockDataForTable(report: StockReport): StockTableData[] {
  if (!report || !report.products) {
    return []
  }

  return report.products.map(product => {
    // Filter movements for this product by id (not SKU - SKU can be empty/duplicate)
    const productMovements = report.movements.filter(
      m => (m as any).product_id === product.id
    )

    // Calculate stock added (restocks only)
    const stockAdded = productMovements
      .filter(m => m.type === 'restock')
      .reduce((sum, m) => sum + m.quantity_change, 0)

    // Calculate stock adjustments (positive and negative adjustments)
    const stockAdjustments = productMovements
      .filter(m => m.type === 'adjustment')
      .reduce((sum, m) => sum + m.quantity_change, 0)

    // Calculate stock sold (sales - these are negative in quantity_change)
    const stockSold = productMovements
      .filter(m => m.type === 'sale')
      .reduce((sum, m) => sum + Math.abs(m.quantity_change), 0)

    // Calculate returns
    const returns = productMovements
      .filter(m => m.type === 'return')
      .reduce((sum, m) => sum + m.quantity_change, 0)

    return {
      productName: product.name,
      productSku: product.sku,
      openingStock: product.opening_stock,
      stockAdded,
      stockAdjustments,
      stockSold,
      returns,
      closingStock: product.current_stock,
      closingStockValue: Math.round(product.current_value * 100) / 100
    }
  })
}

/**
 * Transform transactions report data into table format
 * 
 * @param report - Transactions report from generateTransactionsReport service
 * @returns Array of transaction table data
 * 
 * Preconditions:
 * - report is non-null and contains valid TransactionsReport structure
 * - report.transactions is an array (may be empty)
 * 
 * Postconditions:
 * - Returns array of TransactionTableData objects
 * - Each item has all required fields populated
 * - Dates are formatted to ISO string
 * - Customer name defaults to "Walk-in" if not provided
 * - All monetary values are rounded to 2 decimal places
 */
export function transformTransactionsDataForTable(
  report: TransactionsReport
): TransactionTableData[] {
  if (!report || !report.transactions) {
    return []
  }

  return report.transactions.map(transaction => ({
    transactionNumber: transaction.transaction_number,
    date: transaction.created_at,
    customer: transaction.customer?.name || 'Walk-in',
    items: transaction.items?.length || 0,
    subtotal: Math.round(transaction.subtotal * 100) / 100,
    tax: Math.round(transaction.tax_amount * 100) / 100,
    discount: Math.round(transaction.discount_amount * 100) / 100,
    total: Math.round(transaction.total * 100) / 100,
    paymentMethod: transaction.payment_method,
    status: transaction.status
  }))
}

/**
 * Transform expenses report data into table format
 * 
 * @param report - Expenses report from generateExpensesReport service
 * @returns Array of expense table data
 * 
 * Preconditions:
 * - report is non-null and contains valid ExpensesReport structure
 * - report.expenses is an array (may be empty)
 * 
 * Postconditions:
 * - Returns array of ExpenseTableData objects
 * - Each item has all required fields populated
 * - Dates are formatted to ISO string
 * - All monetary values are rounded to 2 decimal places
 */
export function transformExpensesDataForTable(
  report: ExpensesReport
): ExpenseTableData[] {
  if (!report || !report.expenses) {
    return []
  }

  return report.expenses.map(expense => ({
    date: expense.expense_date,
    category: expense.category?.name || 'Uncategorized',
    description: expense.description || '',
    amount: Math.round(expense.amount * 100) / 100,
    receiptReference: expense.receipt_reference || '',
    recordedBy: expense.created_by_user?.full_name || 'N/A'
  }))
}

/**
 * Filter transactions by payment method
 * 
 * @param transactions - Array of transaction table data
 * @param paymentMethod - Payment method to filter by (null or 'all' for all methods)
 * @returns Filtered array of transactions
 * 
 * Preconditions:
 * - transactions is a valid array (may be empty)
 * - paymentMethod is either null, 'all', or a valid payment method string
 * 
 * Postconditions:
 * - Returns filtered array of transactions
 * - If paymentMethod is null or 'all', returns all transactions
 * - Otherwise, returns only matching transactions
 * - Original array is not mutated
 * - Returned array maintains original sort order
 */
export function filterTransactionsByPaymentMethod(
  transactions: TransactionTableData[],
  paymentMethod: string | null
): TransactionTableData[] {
  if (!paymentMethod || paymentMethod === 'all') {
    return transactions
  }

  return transactions.filter(t => t.paymentMethod === paymentMethod)
}

/**
 * Calculate totals for numeric columns in table data
 * 
 * @param data - Array of table data objects
 * @param numericFields - Array of field names to calculate totals for
 * @returns Object with totals for each numeric field
 * 
 * Preconditions:
 * - data is a valid array (may be empty)
 * - numericFields contains only keys that exist in T and have numeric values
 * 
 * Postconditions:
 * - Returns object with totals for specified numeric fields
 * - Non-numeric fields are omitted
 * - If data is empty, all totals are 0
 * - Calculations are accurate to 2 decimal places for monetary values
 */
export function calculateTableTotals<T extends Record<string, any>>(
  data: T[],
  numericFields: (keyof T)[]
): Partial<T> {
  const totals: Partial<T> = {} as Partial<T>

  // Initialize totals to 0
  numericFields.forEach(field => {
    totals[field] = 0 as any
  })

  // Calculate sums
  data.forEach(row => {
    numericFields.forEach(field => {
      const value = row[field]
      if (typeof value === 'number') {
        totals[field] = ((totals[field] as number) + value) as any
      }
    })
  })

  // Round monetary values to 2 decimal places
  numericFields.forEach(field => {
    if (typeof totals[field] === 'number') {
      totals[field] = (Math.round((totals[field] as number) * 100) / 100) as any
    }
  })

  return totals
}
