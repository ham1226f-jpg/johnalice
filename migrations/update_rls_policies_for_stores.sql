-- Migration: Update RLS policies for store-based access control
-- Date: 2026-04-01
-- Description: Updates RLS policies to enforce store-based access control
-- Requirements: 13.1, 13.2, 13.3, 13.4, 13.5

-- This migration should be run AFTER:
-- 1. create_stores_table.sql
-- 2. add_store_id_columns.sql
-- 3. migrate_data_to_stores.sql

BEGIN;

-- =====================================================
-- Phase 1: Drop existing RLS policies
-- =====================================================

-- Drop existing policies on products table
DROP POLICY IF EXISTS "Users can access products in their tenant" ON products;
DROP POLICY IF EXISTS "Users can view products in their tenant" ON products;
DROP POLICY IF EXISTS "Users can manage products in their tenant" ON products;

-- Drop existing policies on transactions table
DROP POLICY IF EXISTS "Users can access transactions in their tenant" ON transactions;
DROP POLICY IF EXISTS "Users can view transactions in their tenant" ON transactions;
DROP POLICY IF EXISTS "Users can manage transactions in their tenant" ON transactions;

-- Drop existing policies on customers table
DROP POLICY IF EXISTS "Users can access customers in their tenant" ON customers;
DROP POLICY IF EXISTS "Users can view customers in their tenant" ON customers;
DROP POLICY IF EXISTS "Users can manage customers in their tenant" ON customers;

-- Drop existing policies on expenses table
DROP POLICY IF EXISTS "Users can access expenses in their tenant" ON expenses;
DROP POLICY IF EXISTS "Users can view expenses in their tenant" ON expenses;
DROP POLICY IF EXISTS "Users can manage expenses in their tenant" ON expenses;

-- Drop existing policies on purchase_orders table
DROP POLICY IF EXISTS "Users can access purchase orders in their tenant" ON purchase_orders;
DROP POLICY IF EXISTS "Users can view purchase orders in their tenant" ON purchase_orders;
DROP POLICY IF EXISTS "Users can manage purchase orders in their tenant" ON purchase_orders;

-- Drop existing policies on returns table
DROP POLICY IF EXISTS "Users can access returns in their tenant" ON returns;
DROP POLICY IF EXISTS "Users can view returns in their tenant" ON returns;
DROP POLICY IF EXISTS "Users can manage returns in their tenant" ON returns;

-- Drop existing policies on stock_history table
DROP POLICY IF EXISTS "Users can access stock history in their tenant" ON stock_history;
DROP POLICY IF EXISTS "Users can view stock history in their tenant" ON stock_history;
DROP POLICY IF EXISTS "Users can manage stock history in their tenant" ON stock_history;

-- =====================================================
-- Phase 2: Create new RLS policies with store filtering
-- =====================================================

-- RLS Policy Pattern:
-- - Admins can access all stores (app layer filters by selected store)
-- - Sales persons can only access their assigned store
-- - All users must be in the same tenant

-- Products table policies
CREATE POLICY "Users can access products in their store" ON products
  FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    AND (
      -- Admins can access all stores (app layer filters by selected store)
      (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
      OR
      -- Sales persons can only access their assigned store
      store_id = (SELECT store_id FROM users WHERE id = auth.uid())
    )
  );

-- Transactions table policies
CREATE POLICY "Users can access transactions in their store" ON transactions
  FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    AND (
      (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
      OR
      store_id = (SELECT store_id FROM users WHERE id = auth.uid())
    )
  );

-- Customers table policies
CREATE POLICY "Users can access customers in their store" ON customers
  FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    AND (
      (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
      OR
      store_id = (SELECT store_id FROM users WHERE id = auth.uid())
    )
  );

-- Expenses table policies
CREATE POLICY "Users can access expenses in their store" ON expenses
  FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    AND (
      (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
      OR
      store_id = (SELECT store_id FROM users WHERE id = auth.uid())
    )
  );

-- Purchase orders table policies
CREATE POLICY "Users can access purchase orders in their store" ON purchase_orders
  FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    AND (
      (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
      OR
      store_id = (SELECT store_id FROM users WHERE id = auth.uid())
    )
  );

-- Returns table policies
CREATE POLICY "Users can access returns in their store" ON returns
  FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    AND (
      (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
      OR
      store_id = (SELECT store_id FROM users WHERE id = auth.uid())
    )
  );

-- Stock history table policies
CREATE POLICY "Users can access stock history in their store" ON stock_history
  FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    AND (
      (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
      OR
      store_id = (SELECT store_id FROM users WHERE id = auth.uid())
    )
  );

-- =====================================================
-- Phase 3: Verification
-- =====================================================

-- Verify all policies were created successfully
DO $
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  AND policyname LIKE '%store%';
  
  RAISE NOTICE 'Created % store-based RLS policies', policy_count;
  
  IF policy_count < 7 THEN
    RAISE EXCEPTION 'Expected at least 7 store-based policies, found %', policy_count;
  END IF;
END $;

-- List all created policies
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
AND policyname LIKE '%store%'
ORDER BY tablename, policyname;

-- Final summary
SELECT 'RLS policies updated successfully for store-based access control' as status;

COMMIT;

-- =====================================================
-- Post-Migration Testing Queries
-- =====================================================

-- Run these queries to test RLS policies:

-- 1. Test as admin user (should see all stores)
-- SET ROLE admin_user;
-- SELECT COUNT(*) FROM products;
-- SELECT COUNT(*) FROM transactions;

-- 2. Test as sales person (should only see their store)
-- SET ROLE sales_person_user;
-- SELECT COUNT(*) FROM products;
-- SELECT COUNT(*) FROM transactions;

-- 3. Verify policy enforcement
-- SELECT 
--   tablename,
--   policyname,
--   CASE 
--     WHEN qual IS NOT NULL THEN 'Enforced'
--     ELSE 'Not Enforced'
--   END as enforcement_status
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- AND policyname LIKE '%store%'
-- ORDER BY tablename;

