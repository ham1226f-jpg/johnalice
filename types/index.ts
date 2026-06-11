// Core type definitions for the POS system
export type UserRole = 'admin' | 'sales_person';

export interface Tenant {
  id: string;
  name: string;
  created_at: string;
  settings: {
    low_stock_threshold: number;
    currency: string;
    tax_rate?: number;
  };
}

export interface StoreSettings {
  low_stock_threshold?: number;
  currency?: string;
  tax_rate?: number;
}

export interface Store {
  id: string;
  tenant_id: string;
  name: string;
  settings: StoreSettings;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  tenant_id: string;
  store_id: string | null; // NULL for admins, set for sales persons
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  tenant_id: string;
  store_id: string;
  sku: string;
  barcode?: string;
  name: string;
  description: string;
  category: string;
  price: number | null; // Nullable for variable-priced products
  cost: number | null; // Nullable for variable-priced products
  tax_rate: number | null; // Tax rate as percentage (e.g., 16 for 16% VAT)
  base_unit: string;
  purchase_unit: string;
  unit_conversion_ratio: number;
  stock_quantity: number;
  low_stock_threshold: number;
  is_archived: boolean;
  is_variable_price: boolean; // New field for variable pricing
  image_url: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface Customer {
  id: string;
  tenant_id: string;
  store_id: string;
  name: string;
  phone?: string;
  email?: string;
  total_purchases: number;
  is_credit_approved: boolean;
  credit_limit: number | null;
  created_at: string;
  updated_at: string;
  // Computed fields (from service)
  outstanding_debt?: number;
  available_credit?: number;
}

export interface Transaction {
  id: string;
  tenant_id: string;
  store_id: string;
  transaction_number: string;
  customer_id?: string;
  customer?: Customer;
  subtotal: number;
  tax_amount: number;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  discount_amount: number;
  total: number;
  outstanding_balance: number;
  payment_method: 'cash' | 'mpesa' | 'bank' | 'debt';
  status: 'completed' | 'debt_pending';
  created_at: string;
  created_by: string;
  served_by: string;
  served_by_user?: User;
  items: TransactionItem[];
  payments?: DebtPayment[];
}

// Debt payment record
export interface DebtPayment {
  id: string;
  tenant_id: string;
  transaction_id: string;
  amount: number;
  payment_method: 'cash' | 'mpesa' | 'bank';
  payment_date: string;
  recorded_by: string;
  recorded_by_user?: User;
  created_at: string;
}

// Debt transaction with computed fields for display
export interface DebtTransaction extends Transaction {
  days_overdue: number;
  total_paid: number;
}

// Debt summary statistics
export interface DebtSummary {
  total_outstanding: number;
  customer_count: number;
  aging: {
    current: number;      // 0-30 days
    overdue_30: number;   // 31-60 days
    overdue_60: number;   // 61-90 days
    overdue_90: number;   // 90+ days
  };
  collected_this_month: number;
  collected_today: number;
}

// Customer debt summary for grouped view
export interface CustomerDebtSummary {
  customer: Customer;
  total_outstanding: number;
  transaction_count: number;
  oldest_debt_date: string;
  debts: DebtTransaction[];
}

export interface TransactionItem {
  id: string;
  tenant_id: string;
  transaction_id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price: number;
  tax_rate: number | null;
  tax_amount: number;
  subtotal: number;
  created_at: string;
}

export interface PurchaseOrder {
  id: string;
  tenant_id: string;
  store_id: string;
  po_number: string;
  supplier_name: string;
  supplier_contact?: string;
  status: 'draft' | 'ordered' | 'received' | 'completed';
  expected_delivery_date: string;
  total_cost: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  items: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
  id: string;
  tenant_id: string;
  purchase_order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  cost_per_unit: number;
  total_cost: number;
  created_at: string;
}

export interface Return {
  id: string;
  tenant_id: string;
  store_id: string;
  return_number: string;
  transaction_id: string;
  transaction?: Transaction;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  total_amount: number;
  approved_at?: string;
  approved_by?: string;
  created_at: string;
  created_by: string;
  items: ReturnItem[];
}

export interface ReturnItem {
  id: string;
  tenant_id: string;
  return_id: string;
  transaction_item_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at: string;
}

export interface StockHistory {
  id: string;
  tenant_id: string;
  store_id: string;
  product_id: string;
  type: 'restock' | 'adjustment' | 'sale' | 'return';
  quantity_change: number;
  quantity_after: number;
  reason: string;
  reference_id?: string;
  created_at: string;
  created_by: string;
  user?: User;
  product?: Product;
}

// Expense category
export interface ExpenseCategory {
  id: string;
  tenant_id: string;
  name: string;
  is_default: boolean;
  created_at: string;
}

// Expense record
export interface Expense {
  id: string;
  tenant_id: string;
  store_id: string;
  category_id: string;
  category?: ExpenseCategory;
  amount: number;
  description?: string;
  receipt_reference?: string;
  expense_date: string;
  created_by: string;
  created_by_user?: User;
  created_at: string;
  updated_at: string;
}

// Expense audit trail
export interface ExpenseAudit {
  id: string;
  expense_id: string;
  changed_by: string;
  changed_by_user?: User;
  changes: Record<string, { old: unknown; new: unknown }>;
  created_at: string;
}

// Expense summary by category
export interface ExpenseSummary {
  total: number;
  by_category: { category: ExpenseCategory; amount: number }[];
}

// Report Preview Table Types

// Sales report preview table data
export interface SalesTableData {
  itemName: string;          // Product name
  itemSku: string;           // Product SKU
  qtySold: number;           // Total quantity sold
  avgPrice: number;          // Average selling price
  discount: number;          // Total discount amount
  amount: number;            // Total revenue (after discount)
}

// Stock report preview table data
export interface StockTableData {
  productName: string;       // Product name
  productSku: string;        // Product SKU
  openingStock: number;      // Stock at start of period
  stockAdded: number;        // Stock added during period (restocks)
  stockAdjustments: number;  // Stock adjustments during period
  stockSold: number;         // Stock sold during period
  returns: number;           // Returns during period
  closingStock: number;      // Stock at end of period
  closingStockValue: number; // Closing stock * cost per unit
}

// Transaction report preview table data
export interface TransactionTableData {
  transactionNumber: string; // Unique transaction identifier
  date: string;              // Transaction date (ISO format)
  customer: string;          // Customer name or "Walk-in"
  items: number;             // Number of items in transaction
  subtotal: number;          // Subtotal before tax and discount
  tax: number;               // Tax amount
  discount: number;          // Discount amount
  total: number;             // Final total
  paymentMethod: string;     // 'cash' | 'mpesa' | 'bank' | 'debt'
  status: string;            // 'completed' | 'debt_pending'
}

// Expense report preview table data
export interface ExpenseTableData {
  date: string;              // Expense date (ISO format)
  category: string;          // Expense category name
  description: string;       // Expense description
  amount: number;            // Expense amount
  receiptReference: string;  // Receipt reference number
  recordedBy: string;        // User who recorded the expense
}

// Common table props
export interface BaseTableProps {
  loading: boolean;
  onExport: () => void;
}

// Table column definition
export interface TableColumn<T> {
  key: keyof T;
  header: string;
  align?: 'left' | 'center' | 'right';
  format?: (value: any) => string;
  sortable?: boolean;
}

// Export options
export interface ExportOptions {
  filename: string;
  includeHeaders: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  filter?: {
    field: string;
    value: any;
  };
}

// Report state
export interface ReportState {
  data: any[];
  loading: boolean;
  error: string | null;
  lastGenerated: Date | null;
}

// Export tour types
export * from './tour';
