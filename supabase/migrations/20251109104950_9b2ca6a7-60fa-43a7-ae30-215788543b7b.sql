-- Fix security warning: Drop trigger, update function with search_path, recreate trigger
DROP TRIGGER IF EXISTS set_replay_purchase_grant_timestamp ON replay_purchases;
DROP FUNCTION IF EXISTS set_grant_timestamp();

CREATE OR REPLACE FUNCTION set_grant_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_admin_grant = true AND NEW.granted_at IS NULL THEN
    NEW.granted_at = NOW();
    NEW.granted_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER set_replay_purchase_grant_timestamp
  BEFORE INSERT ON replay_purchases
  FOR EACH ROW
  EXECUTE FUNCTION set_grant_timestamp();