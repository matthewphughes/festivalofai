-- Add product_id column to stripe_coupons table
ALTER TABLE public.stripe_coupons 
ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.stripe_products(id);