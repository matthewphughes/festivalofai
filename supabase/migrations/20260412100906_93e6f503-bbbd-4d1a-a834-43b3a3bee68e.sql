-- Allow anonymous users to upload to speaker-profiles/ folder
CREATE POLICY "Anonymous users can upload speaker profile images"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (
  bucket_id = 'speaker-images'
  AND (storage.foldername(name))[1] = 'speaker-profiles'
);

-- Allow authenticated users to upload to speaker-profiles/ folder too
CREATE POLICY "Authenticated users can upload speaker profile images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'speaker-images'
  AND (storage.foldername(name))[1] = 'speaker-profiles'
);