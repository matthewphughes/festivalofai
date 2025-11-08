-- Create replay_purchases table to track user purchases
CREATE TABLE public.replay_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_year INTEGER NOT NULL,
  stripe_payment_intent TEXT,
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, event_year)
);

-- Enable RLS
ALTER TABLE public.replay_purchases ENABLE ROW LEVEL SECURITY;

-- Users can view their own purchases
CREATE POLICY "Users can view own purchases"
ON public.replay_purchases
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all purchases
CREATE POLICY "Admins can view all purchases"
ON public.replay_purchases
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only authenticated users with proper permissions can insert (will be done via edge function)
CREATE POLICY "Service role can insert purchases"
ON public.replay_purchases
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add index for faster lookups
CREATE INDEX idx_replay_purchases_user_year ON public.replay_purchases(user_id, event_year);