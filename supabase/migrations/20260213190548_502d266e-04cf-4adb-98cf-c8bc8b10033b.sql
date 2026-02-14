
-- Phase 1: Expand app_role enum with new roles
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'distributor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'auditor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'consumer';

-- Add batch_status enum
CREATE TYPE public.batch_status AS ENUM ('active', 'sold', 'recalled', 'expired');

-- Add new columns to batches table
ALTER TABLE public.batches
  ADD COLUMN IF NOT EXISTS status public.batch_status NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS storage_conditions text,
  ADD COLUMN IF NOT EXISTS recalled_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS recalled_by uuid;

-- Create consumer_reports table
CREATE TABLE public.consumer_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id text NOT NULL,
  reporter_id uuid,
  report_type text NOT NULL DEFAULT 'suspicious',
  description text,
  photo_url text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.consumer_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can insert reports"
  ON public.consumer_reports FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view own reports"
  ON public.consumer_reports FOR SELECT
  USING (auth.uid() = reporter_id);

CREATE POLICY "Regulators can view all reports"
  ON public.consumer_reports FOR SELECT
  USING (has_role(auth.uid(), 'regulator'::app_role));

-- Create trust_scores table
CREATE TABLE public.trust_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manufacturer_id uuid NOT NULL,
  manufacturer_name text NOT NULL,
  score integer NOT NULL DEFAULT 100,
  total_batches integer NOT NULL DEFAULT 0,
  suspicious_count integer NOT NULL DEFAULT 0,
  verified_count integer NOT NULL DEFAULT 0,
  complaint_count integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.trust_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view trust scores"
  ON public.trust_scores FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can insert trust scores"
  ON public.trust_scores FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "System can update trust scores"
  ON public.trust_scores FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Allow manufacturers and regulators to update batch status (for recalls)
CREATE POLICY "Manufacturers can update own batch status"
  ON public.batches FOR UPDATE
  USING (auth.uid() = registered_by AND has_role(auth.uid(), 'manufacturer'::app_role));

CREATE POLICY "Regulators can update any batch"
  ON public.batches FOR UPDATE
  USING (has_role(auth.uid(), 'regulator'::app_role));

-- Storage bucket for medicine images
INSERT INTO storage.buckets (id, name, public) VALUES ('medicine-images', 'medicine-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload medicine images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'medicine-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can view medicine images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'medicine-images');
