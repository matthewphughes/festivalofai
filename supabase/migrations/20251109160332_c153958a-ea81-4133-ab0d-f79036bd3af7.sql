-- Add phone column to discount_claims table
ALTER TABLE public.discount_claims 
ADD COLUMN IF NOT EXISTS phone text;