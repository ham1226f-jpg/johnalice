-- Migration: Add store_id columns to existing tables
-- Date: 2026-04-01
-- Description: Adds store_id foreign key columns to all store-scoped tables
-- Requirements: 2.1, 4.1, 5.1, 6.1, 8.1, 9.1, 10.5, 11.1

-- =====================================================
-- Phase 1: Add store_id columns (nullable initially)
-- =====================================================

-- Add store_id to users table (nullable for admins)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE RESTRICT;

-- Add store_id to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE RESTRICT;

-- Add store_id to transactions table
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE RESTRICT;

-- Add store_id to customers table
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE RESTRICT;

-- Add store_id to expenses table
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE RESTRICT;

-- Add store_id to purchase_orders table
ALTER TABLE purchase_orders 
ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE RESTRICT;

-- Add store_id to returns table
ALTER TABLE returns 
ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE RESTRICT;

-- Add store_id to stock_history table
ALTER TABLE stock_history 
ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE RESTRICT;

-- =====================================================
-- Phase 2: Create indexes for query performance
-- =====================================================

-- Index on users.store_id
CREATE INDEX IF NOT EXISTS idx_users_store_id ON users(store_id);

-- Index on products.store_id
CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);

-- Index on transactions.store_id
CREATE INDEX IF NOT EXISTS idx_transactions_store_id ON transactions(store_id);

-- Index on customers.store_id
CREATE INDEX IF NOT EXISTS idx_customers_store_id ON customers(store_id);

-- Index on expenses.store_id
CREATE INDEX IF NOT EXISTS idx_expenses_store_id ON expenses(store_id);

-- Index on purchase_orders.store_id
CREATE INDEX IF NOT EXISTS idx_purchase_orders_store_id ON purchase_orders(store_id);

-- Index on returns.store_id
CREATE INDEX IF NOT EXISTS idx_returns_store_id ON returns(store_id);

-- Index on stock_history.store_id
CREATE INDEX IF NOT EXISTS idx_stock_history_store_id ON stock_history(store_id);

-- =====================================================
-- Phase 3: Create composite indexes for common queries
-- =====================================================

-- Composite index for tenant + store queries on products
CREATE INDEX IF NOT EXISTS idx_products_tenant_store ON products(tenant_id, store_id);

-- Composite index for tenant + store queries on transactions
CREATE INDEX IF NOT EXISTS idx_transactions_tenant_store ON transactions(tenant_id, store_id);

-- Composite index for tenant + store queries on customers
CREATE INDEX IF NOT EXISTS idx_customers_tenant_store ON customers(tenant_id, store_id);

-- Composite index for tenant + store queries on expenses
CREATE INDEX IF NOT EXISTS idx_expenses_tenant_store ON expenses(tenant_id, store_id);

-- Composite index for tenant + store queries on purchase_orders
CREATE INDEX IF NOT EXISTS idx_purchase_orders_tenant_store ON purchase_orders(tenant_id, store_id);

-- Composite index for tenant + store queries on stock_history
CREATE INDEX IF NOT EXISTS idx_stock_history_tenant_store ON stock_history(tenant_id, store_id);

-- =====================================================
-- Verification queries
-- =====================================================

-- Check that all columns were added successfully
SELECT 
  'users' as table_name,
  COUNT(*) FILTER (WHERE column_name = 'store_id') as store_id_exists
FROM information_schema.columns 
WHERE table_name = 'users'
UNION ALL
SELECT 
  'products',
  COUNT(*) FILTER (WHERE column_name = 'store_id')
FROM information_schema.columns 
WHERE table_name = 'products'
UNION ALL
SELECT 
  'transactions',
  COUNT(*) FILTER (WHERE column_name = 'store_id')
FROM information_schema.columns 
WHERE table_name = 'transactions'
UNION ALL
SELECT 
  'customers',
  COUNT(*) FILTER (WHERE column_name = 'store_id')
FROM information_schema.columns 
WHERE table_name = 'customers'
UNION ALL
SELECT 
  'expenses',
  COUNT(*) FILTER (WHERE column_name = 'store_id')
FROM information_schema.columns 
WHERE table_name = 'expenses'
UNION ALL
SELECT 
  'purchase_orders',
  COUNT(*) FILTER (WHERE column_name = 'store_id')
FROM information_schema.columns 
WHERE table_name = 'purchase_orders'
UNION ALL
SELECT 
  'returns',
  COUNT(*) FILTER (WHERE column_name = 'store_id')
FROM information_schema.columns 
WHERE table_name = 'returns'
UNION ALL
SELECT 
  'stock_history',
  COUNT(*) FILTER (WHERE column_name = 'store_id')
FROM information_schema.columns 
WHERE table_name = 'stock_history';

-- Check that all indexes were created successfully
SELECT 
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE indexname LIKE 'idx_%_store%'
ORDER BY tablename, indexname;

-- Summary
SELECT 'Store ID columns and indexes added successfully' as status;
