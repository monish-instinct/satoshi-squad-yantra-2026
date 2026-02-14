
-- Add batch metadata columns
ALTER TABLE public.batches
ADD COLUMN IF NOT EXISTS medicine_name text,
ADD COLUMN IF NOT EXISTS expiry_date date,
ADD COLUMN IF NOT EXISTS manufacturing_date date,
ADD COLUMN IF NOT EXISTS dosage text,
ADD COLUMN IF NOT EXISTS country_of_origin text;

-- Create alerts table
CREATE TABLE public.alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id text NOT NULL,
  alert_type text NOT NULL,
  severity text NOT NULL DEFAULT 'medium',
  message text NOT NULL,
  risk_score integer DEFAULT 0,
  latitude double precision,
  longitude double precision,
  resolved boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view alerts"
  ON public.alerts FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can insert alerts"
  ON public.alerts FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Regulators can update alerts"
  ON public.alerts FOR UPDATE
  USING (has_role(auth.uid(), 'regulator'::app_role));

-- Create audit_logs table
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  actor_id uuid,
  actor_wallet text,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create supply_chain_events table for tracking ownership transfers
CREATE TABLE public.supply_chain_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id text NOT NULL,
  event_type text NOT NULL,
  from_wallet text,
  to_wallet text,
  location text,
  notes text,
  actor_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.supply_chain_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view supply chain events"
  ON public.supply_chain_events FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert supply chain events"
  ON public.supply_chain_events FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_alerts_batch_id ON public.alerts(batch_id);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON public.alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_resolved ON public.alerts(resolved);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON public.audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_supply_chain_batch_id ON public.supply_chain_events(batch_id);
CREATE INDEX IF NOT EXISTS idx_batches_medicine_name ON public.batches(medicine_name);
CREATE INDEX IF NOT EXISTS idx_scan_logs_scanned_at ON public.scan_logs(scanned_at DESC);
