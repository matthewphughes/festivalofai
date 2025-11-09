-- Remove the unique constraint on display_order to allow flexible reordering
ALTER TABLE public.speakers 
DROP CONSTRAINT IF EXISTS unique_speaker_display_order;