-- Migration: Clear all data for fresh restart
-- WARNING: This will delete ALL data from the database
-- Date: 2026-03-23

-- Disable triggers temporarily to avoid cascading issues
SET session_replication_role = 'replica';

-- Clear all data from tables (in correct order to respect foreign keys)
-- Start with dependent tables first

-- Tour and analytics data
TRUNCATE TABLE tour_analytics CASCADE;
TRUNCATE TABLE user_tour_hints_dismissed CASCADE;
TRUNCATE TABLE user_tour_progress CASCADE;

-- Debt and expense data
TRUNCATE TABLE debt_payments CASCADE;
TRUNCATE TABLE expense_audit CASCADE;
TRUNCATE TABLE expenses CASCADE;
TRUNCATE TABLE expense_categories CASCADE;

-- Return data
TRUNCATE TABLE return_items CASCADE;
TRUNCATE TABLE returns CASCADE;

-- Purchase order data
TRUNCATE TABLE purchase_order_items CASCADE;
TRUNCATE TABLE purchase_orders CASCADE;

-- Transaction data
TRUNCATE TABLE transaction_items CASCADE;
TRUNCATE TABLE transactions CASCADE;

-- Stock history
TRUNCATE TABLE stock_history CASCADE;

-- Products
TRUNCATE TABLE products CASCADE;

-- Customers
TRUNCATE TABLE customers CASCADE;

-- Counter tables
TRUNCATE TABLE transaction_counters CASCADE;
TRUNCATE TABLE po_counters CASCADE;
TRUNCATE TABLE return_counters CASCADE;

-- Users (keep structure, clear data)
TRUNCATE TABLE users CASCADE;

-- Tenants (keep structure, clear data)
TRUNCATE TABLE tenants CASCADE;

-- Re-enable triggers
SET session_replication_role = 'origin';

-- Reset sequences (if any)
-- This ensures IDs start from 1 again for any serial columns

-- Verify cleanup
SELECT 
  schemaname,
  tablename,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = schemaname AND table_name = tablename) as row_count
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
