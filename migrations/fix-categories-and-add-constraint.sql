-- Migration: Fix duplicate categories and add constraint to prevent future issues
-- Date: 2026-04-26

-- Step 1: Trim all categories to remove leading/trailing spaces
UPDATE products 
SET category = TRIM(category) 
WHERE category != TRIM(category);

-- Step 2: Add a trigger to automatically trim category on insert/update
CREATE OR REPLACE FUNCTION trim_category()
RETURNS TRIGGER AS $$
BEGIN
  NEW.category = TRIM(NEW.category);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists (for re-running migration)
DROP TRIGGER IF EXISTS trim_category_trigger ON products;

-- Create trigger
CREATE TRIGGER trim_category_trigger
  BEFORE INSERT OR UPDATE OF category ON products
  FOR EACH ROW
  EXECUTE FUNCTION trim_category();

-- Step 3: Create an index for case-insensitive category lookups
CREATE INDEX IF NOT EXISTS idx_products_category_lower 
ON products (LOWER(category)) 
WHERE is_archived = false;

-- Verification query
SELECT 'Migration completed successfully' as status;
