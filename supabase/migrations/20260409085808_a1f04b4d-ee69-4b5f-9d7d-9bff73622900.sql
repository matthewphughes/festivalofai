
-- Create speaker_applications table
CREATE TABLE public.speaker_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT,
  user_id UUID,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  postal_code TEXT,
  website_url TEXT,
  youtube_url TEXT,
  linkedin_url TEXT,
  tiktok_url TEXT,
  instagram_url TEXT,
  session_title TEXT,
  session_description TEXT,
  profile_picture_url TEXT,
  profile_picture_original_url TEXT,
  bio TEXT,
  preferred_track TEXT,
  supporting_materials TEXT,
  additional_comments TEXT,
  admin_notes TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  submitted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.speaker_applications ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_speaker_applications_status ON public.speaker_applications(status);
CREATE INDEX idx_speaker_applications_session_id ON public.speaker_applications(session_id);
CREATE INDEX idx_speaker_applications_user_id ON public.speaker_applications(user_id);

-- RLS Policies
CREATE POLICY "Admins can do everything with speaker applications"
ON public.speaker_applications
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view their own applications"
ON public.speaker_applications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_speaker_applications_updated_at
BEFORE UPDATE ON public.speaker_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Status validation trigger (instead of CHECK constraint)
CREATE OR REPLACE FUNCTION public.validate_speaker_application_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status NOT IN ('draft', 'submitted', 'reviewed', 'shortlist', 'accepted', 'rejected') THEN
    RAISE EXCEPTION 'Invalid status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_speaker_application_status_trigger
BEFORE INSERT OR UPDATE ON public.speaker_applications
FOR EACH ROW
EXECUTE FUNCTION public.validate_speaker_application_status();

-- RPC: create_speaker_application
CREATE OR REPLACE FUNCTION public.create_speaker_application(
  client_session_id TEXT,
  app_data JSONB
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
BEGIN
  INSERT INTO speaker_applications (
    session_id, user_id, first_name, last_name, email, phone,
    address_line1, address_line2, city, postal_code,
    website_url, youtube_url, linkedin_url, tiktok_url, instagram_url,
    session_title, session_description, bio, preferred_track,
    supporting_materials, additional_comments,
    profile_picture_url, profile_picture_original_url, status
  ) VALUES (
    client_session_id, NULL,
    app_data->>'first_name', app_data->>'last_name',
    app_data->>'email', app_data->>'phone',
    app_data->>'address_line1', app_data->>'address_line2',
    app_data->>'city', app_data->>'postal_code',
    app_data->>'website_url', app_data->>'youtube_url',
    app_data->>'linkedin_url', app_data->>'tiktok_url',
    app_data->>'instagram_url',
    app_data->>'session_title', app_data->>'session_description',
    app_data->>'bio', app_data->>'preferred_track',
    app_data->>'supporting_materials', app_data->>'additional_comments',
    app_data->>'profile_picture_url', app_data->>'profile_picture_original_url',
    COALESCE(app_data->>'status', 'draft')
  )
  RETURNING id INTO new_id;
  RETURN new_id;
END;
$$;

-- RPC: get_my_speaker_application
CREATE OR REPLACE FUNCTION public.get_my_speaker_application(client_session_id TEXT)
RETURNS SETOF speaker_applications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM speaker_applications
  WHERE session_id = client_session_id
  ORDER BY updated_at DESC
  LIMIT 1;
END;
$$;

-- RPC: update_my_speaker_application
CREATE OR REPLACE FUNCTION public.update_my_speaker_application(
  client_session_id TEXT,
  app_id UUID,
  app_data JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE speaker_applications
  SET
    first_name = COALESCE(app_data->>'first_name', first_name),
    last_name = COALESCE(app_data->>'last_name', last_name),
    email = COALESCE(app_data->>'email', email),
    phone = COALESCE(app_data->>'phone', phone),
    address_line1 = COALESCE(app_data->>'address_line1', address_line1),
    address_line2 = COALESCE(app_data->>'address_line2', address_line2),
    city = COALESCE(app_data->>'city', city),
    postal_code = COALESCE(app_data->>'postal_code', postal_code),
    website_url = COALESCE(app_data->>'website_url', website_url),
    youtube_url = COALESCE(app_data->>'youtube_url', youtube_url),
    linkedin_url = COALESCE(app_data->>'linkedin_url', linkedin_url),
    tiktok_url = COALESCE(app_data->>'tiktok_url', tiktok_url),
    instagram_url = COALESCE(app_data->>'instagram_url', instagram_url),
    session_title = COALESCE(app_data->>'session_title', session_title),
    session_description = COALESCE(app_data->>'session_description', session_description),
    bio = COALESCE(app_data->>'bio', bio),
    preferred_track = COALESCE(app_data->>'preferred_track', preferred_track),
    supporting_materials = COALESCE(app_data->>'supporting_materials', supporting_materials),
    additional_comments = COALESCE(app_data->>'additional_comments', additional_comments),
    profile_picture_url = COALESCE(app_data->>'profile_picture_url', profile_picture_url),
    profile_picture_original_url = COALESCE(app_data->>'profile_picture_original_url', profile_picture_original_url),
    status = COALESCE(app_data->>'status', status),
    submitted_at = CASE
      WHEN app_data->>'status' = 'submitted' THEN NOW()
      ELSE submitted_at
    END,
    updated_at = NOW()
  WHERE id = app_id
    AND session_id = client_session_id
    AND user_id IS NULL;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count > 0;
END;
$$;
