-- GroomerBot Database Schema
-- Run this against your Supabase project via the SQL Editor

-- ============================================
-- 1. CLIENTS TABLE (the groomers who sign up)
-- ============================================
CREATE TABLE IF NOT EXISTS public.clients (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name text NOT NULL,
  owner_name text NOT NULL,
  phone text,
  email text NOT NULL,
  services_pricing text,
  vapi_assistant_id text,
  vapi_phone_number text,
  vapi_phone_number_id text,
  stripe_customer_id text,
  subscription_status text DEFAULT 'inactive',
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- 2. CALL_LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.call_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  caller_name text,
  caller_phone text,
  dog_name text,
  summary text,
  duration_seconds integer,
  recording_url text,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- 3. APPOINTMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  customer_name text,
  dog_name text,
  service_type text,
  requested_date timestamptz,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- 4. ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Clients: users can only read/write their own row
CREATE POLICY "Users can view own client record"
  ON public.clients FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own client record"
  ON public.clients FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own client record"
  ON public.clients FOR UPDATE
  USING (auth.uid() = id);

-- Call logs: users can only read their own call logs
CREATE POLICY "Users can view own call logs"
  ON public.call_logs FOR SELECT
  USING (auth.uid() = client_id);

-- Call logs: service role inserts (webhooks), but allow user reads
CREATE POLICY "Service role can insert call logs"
  ON public.call_logs FOR INSERT
  WITH CHECK (true);

-- Appointments: users can read/update their own
CREATE POLICY "Users can view own appointments"
  ON public.appointments FOR SELECT
  USING (auth.uid() = client_id);

CREATE POLICY "Users can update own appointments"
  ON public.appointments FOR UPDATE
  USING (auth.uid() = client_id);

CREATE POLICY "Service role can insert appointments"
  ON public.appointments FOR INSERT
  WITH CHECK (true);

-- ============================================
-- 5. INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_call_logs_client_id ON public.call_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_created_at ON public.call_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON public.appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_clients_stripe_customer_id ON public.clients(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_clients_vapi_assistant_id ON public.clients(vapi_assistant_id);
