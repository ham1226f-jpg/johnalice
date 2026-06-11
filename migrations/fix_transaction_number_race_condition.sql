-- Migration: Fix transaction number race condition for concurrent sales
-- Date: 2026-03-23
-- Issue: Duplicate key error when multiple salespeople create transactions simultaneously

-- Step 1: Create counter tables for atomic increments
CREATE TABLE IF NOT EXISTS transaction_counters (
  tenant_id UUID NOT NULL,
  date DATE NOT NULL,
  counter INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (tenant_id, date)
);

CREATE TABLE IF NOT EXISTS po_counters (
  tenant_id UUID NOT NULL,
  date DATE NOT NULL,
  counter INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (tenant_id, date)
);

CREATE TABLE IF NOT EXISTS return_counters (
  tenant_id UUID NOT NULL,
  date DATE NOT NULL,
  counter INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (tenant_id, date)
);

-- Step 2: Enable RLS on counter tables
ALTER TABLE transaction_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE po_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_counters ENABLE ROW LEVEL SECURITY;

-- Step 3: Create RLS policies for counter tables
CREATE POLICY "Users can access counters in their tenant" ON transaction_counters
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can access po counters in their tenant" ON po_counters
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can access return counters in their tenant" ON return_counters
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- Step 4: Fix transaction number generation function
DROP FUNCTION IF EXISTS generate_transaction_number(UUID);

CREATE OR REPLACE FUNCTION generate_transaction_number(p_tenant_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER -- Run with elevated privileges to bypass RLS
AS $$
DECLARE
  v_next_val INTEGER;
  v_number TEXT;
  v_date DATE;
BEGIN
  v_date := CURRENT_DATE;
  
  -- Atomic counter increment using INSERT...ON CONFLICT
  -- This is thread-safe and prevents race conditions
  INSERT INTO transaction_counters (tenant_id, date, counter)
  VALUES (p_tenant_id, v_date, 1)
  ON CONFLICT (tenant_id, date)
  DO UPDATE SET counter = transaction_counters.counter + 1
  RETURNING counter INTO v_next_val;
  
  -- Generate number with format TXN-YYYYMMDD-XXXX
  v_number := 'TXN-' || TO_CHAR(v_date, 'YYYYMMDD') || '-' || LPAD(v_next_val::TEXT, 4, '0');
  
  RETURN v_number;
END;
$$;

-- Step 5: Fix purchase order number generation function
DROP FUNCTION IF EXISTS generate_po_number(UUID);

CREATE OR REPLACE FUNCTION generate_po_number(p_tenant_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_next_val INTEGER;
  v_number TEXT;
  v_date DATE;
BEGIN
  v_date := CURRENT_DATE;
  
  INSERT INTO po_counters (tenant_id, date, counter)
  VALUES (p_tenant_id, v_date, 1)
  ON CONFLICT (tenant_id, date)
  DO UPDATE SET counter = po_counters.counter + 1
  RETURNING counter INTO v_next_val;
  
  v_number := 'PO-' || TO_CHAR(v_date, 'YYYYMMDD') || '-' || LPAD(v_next_val::TEXT, 4, '0');
  
  RETURN v_number;
END;
$$;

-- Step 6: Fix return number generation function
DROP FUNCTION IF EXISTS generate_return_number(UUID);

CREATE OR REPLACE FUNCTION generate_return_number(p_tenant_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_next_val INTEGER;
  v_number TEXT;
  v_date DATE;
BEGIN
  v_date := CURRENT_DATE;
  
  INSERT INTO return_counters (tenant_id, date, counter)
  VALUES (p_tenant_id, v_date, 1)
  ON CONFLICT (tenant_id, date)
  DO UPDATE SET counter = return_counters.counter + 1
  RETURNING counter INTO v_next_val;
  
  v_number := 'RET-' || TO_CHAR(v_date, 'YYYYMMDD') || '-' || LPAD(v_next_val::TEXT, 4, '0');
  
  RETURN v_number;
END;
$$;

-- Step 7: Initialize counters for existing tenants (optional, for clean numbering)
-- This sets the counter to match existing transaction counts
INSERT INTO transaction_counters (tenant_id, date, counter)
SELECT 
  tenant_id,
  CURRENT_DATE,
  COUNT(*)
FROM transactions
WHERE DATE(created_at) = CURRENT_DATE
GROUP BY tenant_id
ON CONFLICT (tenant_id, date) DO NOTHING;

-- Verification queries (run these to confirm the fix)
-- SELECT * FROM transaction_counters;
-- SELECT generate_transaction_number('your-tenant-id-here');
