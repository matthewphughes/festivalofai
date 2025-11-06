-- Add year column to speakers table
ALTER TABLE public.speakers 
ADD COLUMN year INTEGER;

-- Add index for better performance when filtering by year
CREATE INDEX idx_speakers_year ON public.speakers(year);