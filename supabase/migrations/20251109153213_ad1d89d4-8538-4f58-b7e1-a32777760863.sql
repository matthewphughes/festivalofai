-- Create discount campaigns table for managing promotional offers
CREATE TABLE public.discount_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_name text NOT NULL,
  discount_code text NOT NULL,
  discount_percentage integer,
  discount_amount integer,
  currency text DEFAULT 'gbp',
  countdown_end_date timestamp with time zone NOT NULL,
  banner_message text NOT NULL DEFAULT 'Limited Time Offer!',
  email_subject text NOT NULL DEFAULT 'Your Exclusive Discount Code',
  email_content text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create table for tracking discount claims
CREATE TABLE public.discount_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.discount_campaigns(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  claimed_at timestamp with time zone DEFAULT now(),
  email_sent boolean DEFAULT false
);

-- Enable RLS
ALTER TABLE public.discount_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_claims ENABLE ROW LEVEL SECURITY;

-- RLS Policies for discount_campaigns
CREATE POLICY "Anyone can view active campaigns"
  ON public.discount_campaigns
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage campaigns"
  ON public.discount_campaigns
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for discount_claims
CREATE POLICY "Users can create claims"
  ON public.discount_claims
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all claims"
  ON public.discount_claims
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_discount_campaigns_updated_at
  BEFORE UPDATE ON public.discount_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for active campaigns
CREATE INDEX idx_discount_campaigns_active ON public.discount_campaigns(is_active, countdown_end_date);

COMMENT ON TABLE public.discount_campaigns IS 'Stores promotional discount campaigns with countdown timers and email templates';
COMMENT ON TABLE public.discount_claims IS 'Tracks user claims for discount codes';