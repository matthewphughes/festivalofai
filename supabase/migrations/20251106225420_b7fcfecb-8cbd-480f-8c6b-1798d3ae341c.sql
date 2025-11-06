-- Change year column to array to support multiple years
ALTER TABLE public.speakers 
DROP COLUMN year;

ALTER TABLE public.speakers 
ADD COLUMN years INTEGER[];

-- Drop the old index
DROP INDEX IF EXISTS idx_speakers_year;

-- Create index for array queries
CREATE INDEX idx_speakers_years ON public.speakers USING GIN(years);