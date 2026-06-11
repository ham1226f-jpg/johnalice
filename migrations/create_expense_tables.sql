-- Migration: Create expense tracking tables
-- This includes expense_categories, expenses, and expense_audit tables

-- Expense categories table
CREATE TABLE expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

-- Expenses table
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES expense_categories(id),
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  description TEXT,
  receipt_reference VARCHAR(100),
  expense_date DATE NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expense audit trail table
CREATE TABLE expense_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  changed_by UUID NOT NULL REFERENCES users(id),
  changes JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_expense_categories_tenant_id ON expense_categories(tenant_id);
CREATE INDEX idx_expenses_tenant_id ON expenses(tenant_id);
CREATE INDEX idx_expenses_category_id ON expenses(category_id);
CREATE INDEX idx_expenses_expense_date ON expenses(expense_date);
CREATE INDEX idx_expenses_created_by ON expenses(created_by);
CREATE INDEX idx_expense_audit_expense_id ON expense_audit(expense_id);

-- Add comments
COMMENT ON TABLE expense_categories IS 'Categories for organizing business expenses';
COMMENT ON TABLE expenses IS 'Business expenditure records';
COMMENT ON TABLE expense_audit IS 'Audit trail for expense modifications';
COMMENT ON COLUMN expenses.receipt_reference IS 'Optional reference number or identifier for the receipt';
