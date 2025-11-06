-- Create speakers table
CREATE TABLE IF NOT EXISTS public.speakers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  bio TEXT,
  title TEXT,
  company TEXT,
  image_url TEXT,
  linkedin_url TEXT,
  twitter_url TEXT,
  website_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.speakers ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view speakers
CREATE POLICY "Anyone can view speakers"
ON public.speakers
FOR SELECT
USING (true);

-- Only admins can manage speakers
CREATE POLICY "Admins can insert speakers"
ON public.speakers
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update speakers"
ON public.speakers
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete speakers"
ON public.speakers
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add speaker_id column to event_replays
ALTER TABLE public.event_replays 
ADD COLUMN IF NOT EXISTS speaker_id UUID REFERENCES public.speakers(id) ON DELETE SET NULL;

-- Add trigger for updated_at
CREATE TRIGGER update_speakers_updated_at
BEFORE UPDATE ON public.speakers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Migrate existing speaker names to speakers table and link them
DO $$
DECLARE
  replay_record RECORD;
  new_speaker_id UUID;
BEGIN
  FOR replay_record IN 
    SELECT DISTINCT speaker_name 
    FROM public.event_replays 
    WHERE speaker_name IS NOT NULL AND speaker_name != ''
  LOOP
    -- Insert speaker if not exists
    INSERT INTO public.speakers (name)
    VALUES (replay_record.speaker_name)
    ON CONFLICT DO NOTHING
    RETURNING id INTO new_speaker_id;
    
    -- If speaker already existed, get their id
    IF new_speaker_id IS NULL THEN
      SELECT id INTO new_speaker_id 
      FROM public.speakers 
      WHERE name = replay_record.speaker_name 
      LIMIT 1;
    END IF;
    
    -- Update replays with speaker_id
    UPDATE public.event_replays
    SET speaker_id = new_speaker_id
    WHERE speaker_name = replay_record.speaker_name;
  END LOOP;
END $$;