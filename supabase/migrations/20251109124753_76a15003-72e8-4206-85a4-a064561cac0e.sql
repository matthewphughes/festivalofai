-- Remove the duplicate cart_items table since shopping_cart already exists
DROP TABLE IF EXISTS public.cart_items CASCADE;