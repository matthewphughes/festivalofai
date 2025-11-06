-- Add YouTube and TikTok URL columns to speakers table
ALTER TABLE public.speakers
ADD COLUMN youtube_url TEXT,
ADD COLUMN tiktok_url TEXT;