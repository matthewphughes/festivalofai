-- Create storage bucket for speaker images
INSERT INTO storage.buckets (id, name, public)
VALUES ('speaker-images', 'speaker-images', true);

-- Create RLS policies for speaker images bucket
CREATE POLICY "Anyone can view speaker images"
ON storage.objects FOR SELECT
USING (bucket_id = 'speaker-images');

CREATE POLICY "Admins can upload speaker images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'speaker-images' 
  AND has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can update speaker images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'speaker-images' 
  AND has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete speaker images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'speaker-images' 
  AND has_role(auth.uid(), 'admin')
);