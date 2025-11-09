-- Create stripe_products table for centralized product management
CREATE TABLE stripe_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_product_id TEXT NOT NULL UNIQUE,
  stripe_price_id TEXT NOT NULL UNIQUE,
  product_name TEXT NOT NULL,
  product_type TEXT NOT NULL CHECK (product_type IN ('individual_replay', 'year_bundle')),
  event_year INTEGER NOT NULL,
  replay_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'gbp',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create partial unique indexes for business rules
CREATE UNIQUE INDEX unique_replay_product 
  ON stripe_products(replay_id) 
  WHERE replay_id IS NOT NULL;

CREATE UNIQUE INDEX unique_year_bundle 
  ON stripe_products(event_year, product_type) 
  WHERE product_type = 'year_bundle';

-- Enable RLS
ALTER TABLE stripe_products ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active products"
  ON stripe_products FOR SELECT
  USING (active = true);

CREATE POLICY "Admins can manage products"
  ON stripe_products FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_stripe_products_updated_at
  BEFORE UPDATE ON stripe_products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enhance replay_purchases table
ALTER TABLE replay_purchases
  ADD COLUMN product_id UUID REFERENCES stripe_products(id) ON DELETE SET NULL,
  ADD COLUMN granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN granted_at TIMESTAMPTZ;

-- Function to set grant timestamp
CREATE OR REPLACE FUNCTION set_grant_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_admin_grant = true AND NEW.granted_at IS NULL THEN
    NEW.granted_at = NOW();
    NEW.granted_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for grant timestamp
CREATE TRIGGER set_replay_purchase_grant_timestamp
  BEFORE INSERT ON replay_purchases
  FOR EACH ROW
  EXECUTE FUNCTION set_grant_timestamp();