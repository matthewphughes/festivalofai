-- Add custom_amount column to replay_purchases for manual orders with custom pricing
ALTER TABLE public.replay_purchases
ADD COLUMN custom_amount integer;

COMMENT ON COLUMN public.replay_purchases.custom_amount IS 'Custom amount in minor currency units (e.g., cents) for manual orders. When set, overrides the product amount.';