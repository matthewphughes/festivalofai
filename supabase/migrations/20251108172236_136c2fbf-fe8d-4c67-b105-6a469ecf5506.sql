-- Create storage bucket for event assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-assets', 'event-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for event-assets bucket
CREATE POLICY "Public access to event assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-assets');

CREATE POLICY "Admins can upload event assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'event-assets' 
  AND auth.uid() IN (
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  )
);

CREATE POLICY "Admins can update event assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'event-assets' 
  AND auth.uid() IN (
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  )
);

CREATE POLICY "Admins can delete event assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'event-assets' 
  AND auth.uid() IN (
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  )
);