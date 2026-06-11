-- Migration to add missing barcode column to products table
-- This fixes the error: "Could not find the 'barcode' column of 'products' in the schema cache"

-- Add barcode column to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS barcode text;

-- Add index for barcode lookups to improve performance
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(barcode);

-- Add comment for documentation
COMMENT ON COLUMN public.products.barcode IS 'Product barcode for scanning and identification';