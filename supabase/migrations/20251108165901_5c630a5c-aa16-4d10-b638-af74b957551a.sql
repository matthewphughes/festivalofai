-- Add slug column to speakers table
ALTER TABLE public.speakers
ADD COLUMN slug TEXT;

-- Create function to generate slug from name
CREATE OR REPLACE FUNCTION public.generate_speaker_slug(speaker_name TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Convert to lowercase, replace spaces with hyphens, remove special chars
  base_slug := lower(regexp_replace(speaker_name, '[^a-zA-Z0-9\s-]', '', 'g'));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  
  final_slug := base_slug;
  
  -- Check for uniqueness and add counter if needed
  WHILE EXISTS (SELECT 1 FROM public.speakers WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Populate slugs for existing speakers
UPDATE public.speakers
SET slug = public.generate_speaker_slug(name)
WHERE slug IS NULL;

-- Make slug required and unique
ALTER TABLE public.speakers
ALTER COLUMN slug SET NOT NULL,
ADD CONSTRAINT speakers_slug_unique UNIQUE (slug);

-- Create index on slug for faster lookups
CREATE INDEX idx_speakers_slug ON public.speakers(slug);