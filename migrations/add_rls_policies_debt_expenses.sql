-- Migration: Add RLS policies for debt_payments, expense_categories, expenses, expense_audit
-- These policies ensure tenant isolation for all new tables

-- Enable RLS on all new tables
ALTER TABLE debt_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_audit ENABLE ROW LEVEL SECURITY;

-- debt_payments policies
CREATE POLICY "Users can view debt payments in their tenant" ON debt_payments
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Users can insert debt payments in their tenant" ON debt_payments
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Users can update debt payments in their tenant" ON debt_payments
  FOR UPDATE USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

-- expense_categories policies
CREATE POLICY "Users can view expense categories in their tenant" ON expense_categories
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Users can insert expense categories in their tenant" ON expense_categories
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Users can update expense categories in their tenant" ON expense_categories
  FOR UPDATE USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Users can delete expense categories in their tenant" ON expense_categories
  FOR DELETE USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

-- expenses policies
CREATE POLICY "Users can view expenses in their tenant" ON expenses
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Users can insert expenses in their tenant" ON expenses
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Users can update expenses in their tenant" ON expenses
  FOR UPDATE USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Users can delete expenses in their tenant" ON expenses
  FOR DELETE USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

-- expense_audit policies (read-only for users)
CREATE POLICY "Users can view expense audit in their tenant" ON expense_audit
  FOR SELECT USING (
    expense_id IN (SELECT id FROM expenses WHERE tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()))
  );

CREATE POLICY "Users can insert expense audit in their tenant" ON expense_audit
  FOR INSERT WITH CHECK (
    expense_id IN (SELECT id FROM expenses WHERE tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()))
  );
