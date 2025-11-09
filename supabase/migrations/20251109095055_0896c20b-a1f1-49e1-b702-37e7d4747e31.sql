-- Create the update_updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create site_settings table for managing site configuration
CREATE TABLE IF NOT EXISTS public.site_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key text NOT NULL UNIQUE,
  setting_value text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read site settings
CREATE POLICY "Anyone can view site settings"
  ON public.site_settings
  FOR SELECT
  USING (true);

-- Only admins can insert site settings
CREATE POLICY "Admins can insert site settings"
  ON public.site_settings
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update site settings
CREATE POLICY "Admins can update site settings"
  ON public.site_settings
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete site settings
CREATE POLICY "Admins can delete site settings"
  ON public.site_settings
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default site settings
INSERT INTO public.site_settings (setting_key, setting_value) VALUES
  ('site_title', 'Festival of AI 2026'),
  ('site_description', 'Join us for the premier AI conference at the National Space Centre'),
  ('site_logo_url', '/src/assets/logo-white.png'),
  ('site_share_image_url', '')
ON CONFLICT (setting_key) DO NOTHING;