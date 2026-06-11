-- Migration: Add served_by column to transactions table
-- This allows tracking which user (admin or sales person) served each customer

-- Add served_by column to transactions table
ALTER TABLE transactions
ADD COLUMN served_by UUID REFERENCES users(id);

-- Set default value for existing records to use created_by
UPDATE transactions
SET served_by = created_by
WHERE served_by IS NULL;

-- Make served_by required for new records (optional: uncomment if you want it to be NOT NULL)
-- ALTER TABLE transactions
-- ALTER COLUMN served_by SET NOT NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_transactions_served_by ON transactions(served_by);

-- Add comment to document the column
COMMENT ON COLUMN transactions.served_by IS 'User who served the customer and completed the sale';
