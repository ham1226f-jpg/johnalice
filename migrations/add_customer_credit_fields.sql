-- Migration: Add credit fields to customers table
-- This allows tracking customer credit approval status and limits

-- Add credit approval status to customers
ALTER TABLE customers
ADD COLUMN is_credit_approved BOOLEAN DEFAULT false;

-- Add credit limit to customers (nullable, only set when approved)
ALTER TABLE customers
ADD COLUMN credit_limit DECIMAL(10,2) DEFAULT NULL;

-- Add outstanding_balance to transactions for tracking partial payments
ALTER TABLE transactions
ADD COLUMN outstanding_balance DECIMAL(10,2);

-- Set outstanding_balance for existing debt transactions to their total
UPDATE transactions
SET outstanding_balance = total
WHERE payment_method = 'debt' AND status = 'debt_pending';

-- Set outstanding_balance to 0 for completed transactions
UPDATE transactions
SET outstanding_balance = 0
WHERE status = 'completed' OR outstanding_balance IS NULL;

-- Add index for credit-approved customers
CREATE INDEX IF NOT EXISTS idx_customers_credit_approved ON customers(is_credit_approved) WHERE is_credit_approved = true;

-- Add index for outstanding balances
CREATE INDEX IF NOT EXISTS idx_transactions_outstanding_balance ON transactions(outstanding_balance) WHERE outstanding_balance > 0;

-- Add comments
COMMENT ON COLUMN customers.is_credit_approved IS 'Whether the customer is approved to make purchases on credit';
COMMENT ON COLUMN customers.credit_limit IS 'Maximum amount of outstanding debt allowed for this customer';
COMMENT ON COLUMN transactions.outstanding_balance IS 'Remaining amount owed on this transaction (for debt transactions)';
