-- Add display_order column to speakers table
ALTER TABLE public.speakers 
ADD COLUMN IF NOT EXISTS display_order integer;

-- Set default order based on existing data (alphabetical by name)
WITH ordered_speakers AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY name) as row_num
  FROM public.speakers
)
UPDATE public.speakers
SET display_order = ordered_speakers.row_num
FROM ordered_speakers
WHERE speakers.id = ordered_speakers.id;

-- Make display_order NOT NULL after setting defaults
ALTER TABLE public.speakers 
ALTER COLUMN display_order SET NOT NULL;

-- Add a unique constraint to ensure no duplicate orders
ALTER TABLE public.speakers 
ADD CONSTRAINT unique_speaker_display_order UNIQUE (display_order);