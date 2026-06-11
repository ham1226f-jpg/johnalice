-- Fix products with swapped cost and price values
-- This script swaps cost and price for products where cost > price

-- First, let's see what we're fixing
SELECT 
    id,
    name,
    sku,
    category,
    cost as "Current Cost (should be Price)",
    price as "Current Price (should be Cost)",
    (price - cost) as "Current Profit (negative)"
FROM products 
WHERE cost IS NOT NULL 
  AND price IS NOT NULL 
  AND cost > price 
  AND is_archived = false
ORDER BY name;

-- Now fix them by swapping cost and price
UPDATE products
SET 
    cost = price,   -- Old price becomes new cost (buying price)
    price = cost    -- Old cost becomes new price (selling price)
WHERE cost IS NOT NULL 
  AND price IS NOT NULL 
  AND cost > price 
  AND is_archived = false;

-- Verify the fix
SELECT 
    id,
    name,
    sku,
    category,
    cost as "Buying Price (Cost)",
    price as "Selling Price",
    (price - cost) as "Profit"
FROM products 
WHERE id IN (
    'bf05a8a0-1b0e-4e33-bfb5-97e4ebfdf575',
    'b598e0e3-4c5f-4de1-a051-c8184b52a765',
    '9b3e892b-dc9e-4eff-a606-6484810a10a3',
    '4878c1d8-0776-45d1-9bb9-9af7a3c5cb3e'
)
ORDER BY name;
