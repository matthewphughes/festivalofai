-- Make quote field nullable in testimonials table
ALTER TABLE public.testimonials 
ALTER COLUMN quote DROP NOT NULL;