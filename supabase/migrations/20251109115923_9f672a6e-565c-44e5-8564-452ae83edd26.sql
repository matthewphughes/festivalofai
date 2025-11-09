-- Add a junction table to support multiple replays per product (for bundles)
CREATE TABLE IF NOT EXISTS public.stripe_product_replays (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.stripe_products(id) ON DELETE CASCADE,
  replay_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, replay_id)
);

-- Enable RLS
ALTER TABLE public.stripe_product_replays ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view active product replays"
ON public.stripe_product_replays
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage product replays"
ON public.stripe_product_replays
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));