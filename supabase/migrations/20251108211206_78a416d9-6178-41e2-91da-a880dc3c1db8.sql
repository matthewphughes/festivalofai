-- Add speaker and attendee roles to the app_role enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_role' AND e.enumlabel = 'speaker') THEN
    ALTER TYPE public.app_role ADD VALUE 'speaker';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_role' AND e.enumlabel = 'attendee') THEN
    ALTER TYPE public.app_role ADD VALUE 'attendee';
  END IF;
END $$;

-- Add a column to replay_purchases to track admin grants
ALTER TABLE public.replay_purchases 
ADD COLUMN IF NOT EXISTS is_admin_grant boolean DEFAULT false;

-- Drop existing policy if it exists and create new one
DROP POLICY IF EXISTS "Admins can insert access grants" ON public.replay_purchases;

CREATE POLICY "Admins can insert access grants"
ON public.replay_purchases
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));