-- Create receipt_settings table for customizable receipts
CREATE TABLE IF NOT EXISTS receipt_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  additional_info TEXT,
  footer_text TEXT DEFAULT 'Thank you for your business!',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, store_id)
);

-- Create index for faster lookups
CREATE INDEX idx_receipt_settings_tenant_store ON receipt_settings(tenant_id, store_id);

-- Enable RLS
ALTER TABLE receipt_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their tenant's receipt settings"
  ON receipt_settings FOR SELECT
  USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can insert receipt settings"
  ON receipt_settings FOR INSERT
  WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
    AND (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can update receipt settings"
  ON receipt_settings FOR UPDATE
  USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
    AND (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can delete receipt settings"
  ON receipt_settings FOR DELETE
  USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
    AND (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- Add comment
COMMENT ON TABLE receipt_settings IS 'Stores customizable receipt information for each store';
