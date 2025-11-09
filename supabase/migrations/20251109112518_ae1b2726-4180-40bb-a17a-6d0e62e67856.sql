-- Drop the existing check constraint
ALTER TABLE stripe_products DROP CONSTRAINT stripe_products_product_type_check;

-- Add updated check constraint that includes 'ticket' product type
ALTER TABLE stripe_products 
ADD CONSTRAINT stripe_products_product_type_check 
CHECK (product_type IN ('individual_replay', 'year_bundle', 'ticket'));