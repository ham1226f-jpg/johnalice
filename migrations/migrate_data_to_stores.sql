-- Migration: Migrate existing data to default stores
-- Date: 2026-04-01
-- Description: Creates default stores for existing tenants and migrates all data
-- Requirements: 14.1, 14.2, 14.3, 14.4

-- This migration should be run AFTER:
-- 1. create_stores_table.sql
-- 2. add_store_id_columns.sql

BEGIN;

-- =====================================================
-- Phase 1: Create default stores for existing tenants
-- =====================================================

-- Create a default store for each tenant named "{Tenant Name} - Main Store"
INSERT INTO stores (tenant_id, name, settings)
SELECT 
  t.id, 
  t.name || ' - Main Store', 
  t.settings
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM stores s WHERE s.tenant_id = t.id
)
ON CONFLICT (tenant_id, name) DO NOTHING;

-- Verify stores were created
DO $
DECLARE
  store_count INTEGER;
  tenant_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO store_count FROM stores;
  SELECT COUNT(*) INTO tenant_count FROM tenants;
  
  RAISE NOTICE 'Created % stores for % tenants', store_count, tenant_count;
END $;

-- =====================================================
-- Phase 2: Migrate existing data to default stores
-- =====================================================

-- Update products to reference default store
UPDATE products 
SET store_id = (
  SELECT s.id 
  FROM stores s 
  WHERE s.tenant_id = products.tenant_id 
  LIMIT 1
)
WHERE store_id IS NULL;

-- Update transactions to reference default store
UPDATE transactions 
SET store_id = (
  SELECT s.id 
  FROM stores s 
  WHERE s.tenant_id = transactions.tenant_id 
  LIMIT 1
)
WHERE store_id IS NULL;

-- Update customers to reference default store
UPDATE customers 
SET store_id = (
  SELECT s.id 
  FROM stores s 
  WHERE s.tenant_id = customers.tenant_id 
  LIMIT 1
)
WHERE store_id IS NULL;

-- Update expenses to reference default store
UPDATE expenses 
SET store_id = (
  SELECT s.id 
  FROM stores s 
  WHERE s.tenant_id = expenses.tenant_id 
  LIMIT 1
)
WHERE store_id IS NULL;

-- Update purchase_orders to reference default store
UPDATE purchase_orders 
SET store_id = (
  SELECT s.id 
  FROM stores s 
  WHERE s.tenant_id = purchase_orders.tenant_id 
  LIMIT 1
)
WHERE store_id IS NULL;

-- Update returns to reference default store (inherit from transaction)
UPDATE returns 
SET store_id = (
  SELECT t.store_id 
  FROM transactions t 
  WHERE t.id = returns.transaction_id
)
WHERE store_id IS NULL;

-- Update stock_history to reference default store (inherit from product)
UPDATE stock_history 
SET store_id = (
  SELECT p.store_id 
  FROM products p 
  WHERE p.id = stock_history.product_id
)
WHERE store_id IS NULL;

-- =====================================================
-- Phase 3: Update users to reference default store
-- =====================================================

-- Update all sales_person users to reference default store
UPDATE users 
SET store_id = (
  SELECT s.id 
  FROM stores s 
  WHERE s.tenant_id = users.tenant_id 
  LIMIT 1
)
WHERE role = 'sales_person' AND store_id IS NULL;

-- Admin users keep store_id as NULL (they can access all stores)
-- No action needed for admin users

-- =====================================================
-- Phase 4: Make store_id NOT NULL for required tables
-- =====================================================

-- Make store_id NOT NULL for all tables except users
-- (users.store_id stays nullable for admins)

ALTER TABLE products 
ALTER COLUMN store_id SET NOT NULL;

ALTER TABLE transactions 
ALTER COLUMN store_id SET NOT NULL;

ALTER TABLE customers 
ALTER COLUMN store_id SET NOT NULL;

ALTER TABLE expenses 
ALTER COLUMN store_id SET NOT NULL;

ALTER TABLE purchase_orders 
ALTER COLUMN store_id SET NOT NULL;

ALTER TABLE returns 
ALTER COLUMN store_id SET NOT NULL;

ALTER TABLE stock_history 
ALTER COLUMN store_id SET NOT NULL;

-- =====================================================
-- Phase 5: Verification
-- =====================================================

-- Verify all data has been migrated
DO $
DECLARE
  products_count INTEGER;
  transactions_count INTEGER;
  customers_count INTEGER;
  expenses_count INTEGER;
  purchase_orders_count INTEGER;
  returns_count INTEGER;
  stock_history_count INTEGER;
  sales_person_count INTEGER;
  admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO products_count FROM products WHERE store_id IS NOT NULL;
  SELECT COUNT(*) INTO transactions_count FROM transactions WHERE store_id IS NOT NULL;
  SELECT COUNT(*) INTO customers_count FROM customers WHERE store_id IS NOT NULL;
  SELECT COUNT(*) INTO expenses_count FROM expenses WHERE store_id IS NOT NULL;
  SELECT COUNT(*) INTO purchase_orders_count FROM purchase_orders WHERE store_id IS NOT NULL;
  SELECT COUNT(*) INTO returns_count FROM returns WHERE store_id IS NOT NULL;
  SELECT COUNT(*) INTO stock_history_count FROM stock_history WHERE store_id IS NOT NULL;
  SELECT COUNT(*) INTO sales_person_count FROM users WHERE role = 'sales_person' AND store_id IS NOT NULL;
  SELECT COUNT(*) INTO admin_count FROM users WHERE role = 'admin' AND store_id IS NULL;
  
  RAISE NOTICE 'Migration Summary:';
  RAISE NOTICE '  Products migrated: %', products_count;
  RAISE NOTICE '  Transactions migrated: %', transactions_count;
  RAISE NOTICE '  Customers migrated: %', customers_count;
  RAISE NOTICE '  Expenses migrated: %', expenses_count;
  RAISE NOTICE '  Purchase orders migrated: %', purchase_orders_count;
  RAISE NOTICE '  Returns migrated: %', returns_count;
  RAISE NOTICE '  Stock history migrated: %', stock_history_count;
  RAISE NOTICE '  Sales persons assigned: %', sales_person_count;
  RAISE NOTICE '  Admins (no store): %', admin_count;
END $;

-- Check for any orphaned records (should be 0)
SELECT 
  'Orphaned Products' as issue,
  COUNT(*) as count
FROM products 
WHERE store_id IS NULL
HAVING COUNT(*) > 0

UNION ALL

SELECT 
  'Orphaned Transactions',
  COUNT(*)
FROM transactions 
WHERE store_id IS NULL
HAVING COUNT(*) > 0

UNION ALL

SELECT 
  'Orphaned Customers',
  COUNT(*)
FROM customers 
WHERE store_id IS NULL
HAVING COUNT(*) > 0

UNION ALL

SELECT 
  'Orphaned Expenses',
  COUNT(*)
FROM expenses 
WHERE store_id IS NULL
HAVING COUNT(*) > 0

UNION ALL

SELECT 
  'Orphaned Purchase Orders',
  COUNT(*)
FROM purchase_orders 
WHERE store_id IS NULL
HAVING COUNT(*) > 0

UNION ALL

SELECT 
  'Orphaned Returns',
  COUNT(*)
FROM returns 
WHERE store_id IS NULL
HAVING COUNT(*) > 0

UNION ALL

SELECT 
  'Orphaned Stock History',
  COUNT(*)
FROM stock_history 
WHERE store_id IS NULL
HAVING COUNT(*) > 0

UNION ALL

SELECT 
  'Sales Persons without Store',
  COUNT(*)
FROM users 
WHERE role = 'sales_person' AND store_id IS NULL
HAVING COUNT(*) > 0;

-- Final summary
SELECT 'Data migration completed successfully' as status;

COMMIT;

-- =====================================================
-- Post-Migration Verification Queries
-- =====================================================

-- Run these queries after migration to verify success:

-- 1. Check stores created
SELECT 
  t.name as tenant_name,
  s.name as store_name,
  s.created_at
FROM stores s
JOIN tenants t ON t.id = s.tenant_id
ORDER BY t.name, s.name;

-- 2. Check entity counts per store
SELECT 
  s.name as store_name,
  COUNT(DISTINCT p.id) as products,
  COUNT(DISTINCT t.id) as transactions,
  COUNT(DISTINCT c.id) as customers,
  COUNT(DISTINCT e.id) as expenses,
  COUNT(DISTINCT po.id) as purchase_orders,
  COUNT(DISTINCT r.id) as returns,
  COUNT(DISTINCT sh.id) as stock_history_entries
FROM stores s
LEFT JOIN products p ON p.store_id = s.id
LEFT JOIN transactions t ON t.store_id = s.id
LEFT JOIN customers c ON c.store_id = s.id
LEFT JOIN expenses e ON e.store_id = s.id
LEFT JOIN purchase_orders po ON po.store_id = s.id
LEFT JOIN returns r ON r.store_id = s.id
LEFT JOIN stock_history sh ON sh.store_id = s.id
GROUP BY s.id, s.name
ORDER BY s.name;

-- 3. Check user assignments
SELECT 
  u.full_name,
  u.email,
  u.role,
  s.name as assigned_store,
  t.name as tenant_name
FROM users u
JOIN tenants t ON t.id = u.tenant_id
LEFT JOIN stores s ON s.id = u.store_id
ORDER BY u.role, u.full_name;

-- 4. Verify referential integrity
SELECT 
  'All products have valid store_id' as check_name,
  CASE 
    WHEN COUNT(*) = 0 THEN 'PASS' 
    ELSE 'FAIL: ' || COUNT(*) || ' products with invalid store_id'
  END as result
FROM products p
LEFT JOIN stores s ON s.id = p.store_id
WHERE s.id IS NULL

UNION ALL

SELECT 
  'All transactions have valid store_id',
  CASE 
    WHEN COUNT(*) = 0 THEN 'PASS' 
    ELSE 'FAIL: ' || COUNT(*) || ' transactions with invalid store_id'
  END
FROM transactions t
LEFT JOIN stores s ON s.id = t.store_id
WHERE s.id IS NULL

UNION ALL

SELECT 
  'All returns inherit correct store from transaction',
  CASE 
    WHEN COUNT(*) = 0 THEN 'PASS' 
    ELSE 'FAIL: ' || COUNT(*) || ' returns with mismatched store_id'
  END
FROM returns r
JOIN transactions t ON t.id = r.transaction_id
WHERE r.store_id != t.store_id

UNION ALL

SELECT 
  'All stock history inherits correct store from product',
  CASE 
    WHEN COUNT(*) = 0 THEN 'PASS' 
    ELSE 'FAIL: ' || COUNT(*) || ' stock history entries with mismatched store_id'
  END
FROM stock_history sh
JOIN products p ON p.id = sh.product_id
WHERE sh.store_id != p.store_id

UNION ALL

SELECT 
  'All sales_person users have store assignment',
  CASE 
    WHEN COUNT(*) = 0 THEN 'PASS' 
    ELSE 'FAIL: ' || COUNT(*) || ' sales persons without store'
  END
FROM users
WHERE role = 'sales_person' AND store_id IS NULL

UNION ALL

SELECT 
  'All admin users have NULL store_id',
  CASE 
    WHEN COUNT(*) = (SELECT COUNT(*) FROM users WHERE role = 'admin') THEN 'PASS' 
    ELSE 'FAIL: Some admins have store_id set'
  END
FROM users
WHERE role = 'admin' AND store_id IS NULL;
