-- Add replay_id column to replay_purchases table to support individual replay purchases
-- This allows tracking both individual replay purchases (when replay_id IS NOT NULL)
-- and year bundle purchases (when replay_id IS NULL and event_year IS NOT NULL)

ALTER TABLE public.replay_purchases
ADD COLUMN IF NOT EXISTS replay_id uuid REFERENCES public.event_replays(id) ON DELETE CASCADE;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_replay_purchases_replay_id ON public.replay_purchases(replay_id);

-- Add unique constraint to prevent duplicate individual replay purchases
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_replay_purchase 
ON public.replay_purchases(user_id, replay_id) 
WHERE replay_id IS NOT NULL;