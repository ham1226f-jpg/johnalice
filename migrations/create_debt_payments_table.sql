-- Migration: Create debt_payments table
-- This table tracks individual payments made against debt transactions

CREATE TABLE debt_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('cash', 'mpesa', 'bank')),
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  recorded_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for common queries
CREATE INDEX idx_debt_payments_tenant_id ON debt_payments(tenant_id);
CREATE INDEX idx_debt_payments_transaction_id ON debt_payments(transaction_id);
CREATE INDEX idx_debt_payments_payment_date ON debt_payments(payment_date);
CREATE INDEX idx_debt_payments_recorded_by ON debt_payments(recorded_by);

-- Add comments
COMMENT ON TABLE debt_payments IS 'Tracks individual payments made against debt transactions';
COMMENT ON COLUMN debt_payments.amount IS 'Payment amount (must be positive)';
COMMENT ON COLUMN debt_payments.payment_method IS 'Method used for this payment (cash, mpesa, bank)';
COMMENT ON COLUMN debt_payments.payment_date IS 'When the payment was made';
COMMENT ON COLUMN debt_payments.recorded_by IS 'User who recorded this payment';
