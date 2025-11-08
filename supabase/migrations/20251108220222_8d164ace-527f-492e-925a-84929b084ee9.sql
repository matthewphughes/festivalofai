-- Create settings table for email configuration
CREATE TABLE public.email_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_settings ENABLE ROW LEVEL SECURITY;

-- Admins can view settings
CREATE POLICY "Admins can view email settings"
ON public.email_settings
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Admins can update settings
CREATE POLICY "Admins can update email settings"
ON public.email_settings
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Admins can insert settings
CREATE POLICY "Admins can insert email settings"
ON public.email_settings
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Insert default email settings
INSERT INTO public.email_settings (setting_key, setting_value) VALUES
  ('contact_primary_email', 'team@festivalof.ai'),
  ('contact_cc_email', 'team@creatorcompany.co.uk'),
  ('sponsor_primary_email', 'team@festivalof.ai'),
  ('sponsor_cc_email', 'team@creatorcompany.co.uk');