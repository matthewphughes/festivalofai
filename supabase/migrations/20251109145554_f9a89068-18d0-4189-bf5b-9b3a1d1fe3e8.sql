-- Add order_type column to replay_purchases table
ALTER TABLE public.replay_purchases
ADD COLUMN order_type TEXT DEFAULT NULL;

-- Add comment to column
COMMENT ON COLUMN public.replay_purchases.order_type IS 'Type of order: manual, stripe, etc.';