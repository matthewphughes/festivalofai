-- Add notes column to replay_purchases table
ALTER TABLE public.replay_purchases
ADD COLUMN notes text;