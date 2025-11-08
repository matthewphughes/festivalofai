-- Drop the existing unique constraint
ALTER TABLE public.replay_purchases 
DROP CONSTRAINT IF EXISTS replay_purchases_user_id_event_year_key;

-- Add a new unique constraint that allows multiple replays per year
-- but prevents duplicate purchases of the same replay
ALTER TABLE public.replay_purchases
ADD CONSTRAINT replay_purchases_unique_user_replay_year 
UNIQUE (user_id, replay_id, event_year);