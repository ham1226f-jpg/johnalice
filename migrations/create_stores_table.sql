-- Migration: Create stores table for multi-store support
-- Date: 2026-04-01
-- Description: Creates the stores table to enable multi-store functionality
-- Requirements: 1.1, 1.2, 1.3

-- Create stores table
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_store_name_per_tenant UNIQUE(tenant_id, name)
);

-- Create index on tenant_id for efficient lookups
CREATE INDEX IF NOT EXISTS idx_stores_tenant_id ON stores(tenant_id);

-- Create updated_at trigger for stores
CREATE OR REPLACE FUNCTION update_stores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_stores_updated_at
  BEFORE UPDATE ON stores
  FOR EACH ROW
  EXECUTE FUNCTION update_stores_updated_at();

-- Enable RLS on stores table
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for stores table
-- Users can view stores in their tenant
CREATE POLICY "Users can view stores in their tenant" ON stores
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

-- Admins can manage stores in their tenant
CREATE POLICY "Admins can manage stores in their tenant" ON stores
  FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    AND (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- Verification query
SELECT 'Stores table created successfully' as status;
