-- Block anonymous access to profiles table explicitly
-- This prevents any potential gaps where unauthenticated users could access email addresses
CREATE POLICY "Block anonymous access to profiles"
ON public.profiles
FOR ALL
TO anon
USING (false);