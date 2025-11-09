-- Add test mode setting to site_settings if not exists
INSERT INTO site_settings (setting_key, setting_value)
VALUES ('stripe_test_mode', 'false')
ON CONFLICT (setting_key) DO NOTHING;

-- Create coupons management table
CREATE TABLE IF NOT EXISTS stripe_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_coupon_id TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value INTEGER NOT NULL,
  currency TEXT DEFAULT 'gbp',
  active BOOLEAN DEFAULT true,
  max_redemptions INTEGER,
  times_redeemed INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on coupons
ALTER TABLE stripe_coupons ENABLE ROW LEVEL SECURITY;

-- RLS Policies for coupons
CREATE POLICY "Anyone can view active coupons"
  ON stripe_coupons FOR SELECT
  USING (active = true);

CREATE POLICY "Admins can manage coupons"
  ON stripe_coupons FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at on coupons
CREATE TRIGGER update_stripe_coupons_updated_at
  BEFORE UPDATE ON stripe_coupons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create shopping cart table for persistence
CREATE TABLE IF NOT EXISTS shopping_cart (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  product_id UUID REFERENCES stripe_products(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER DEFAULT 1 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id),
  UNIQUE(session_id, product_id)
);

-- Enable RLS on cart
ALTER TABLE shopping_cart ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cart
CREATE POLICY "Users can view own cart"
  ON shopping_cart FOR SELECT
  USING (auth.uid() = user_id OR session_id IS NOT NULL);

CREATE POLICY "Users can manage own cart"
  ON shopping_cart FOR ALL
  USING (auth.uid() = user_id OR session_id IS NOT NULL);

-- Trigger for updated_at on cart
CREATE TRIGGER update_shopping_cart_updated_at
  BEFORE UPDATE ON shopping_cart
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add coupon tracking to replay_purchases
ALTER TABLE replay_purchases
  ADD COLUMN IF NOT EXISTS coupon_code TEXT,
  ADD COLUMN IF NOT EXISTS discount_amount INTEGER DEFAULT 0;