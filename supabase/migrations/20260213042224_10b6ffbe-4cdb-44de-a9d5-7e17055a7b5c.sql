
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('manufacturer', 'pharmacy', 'regulator');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  organization TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Create batches table
CREATE TABLE public.batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id TEXT NOT NULL UNIQUE,
  manufacturer_name TEXT NOT NULL,
  batch_hash TEXT NOT NULL,
  blockchain_tx_hash TEXT,
  registered_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create scan_logs table
CREATE TABLE public.scan_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id TEXT NOT NULL,
  scanner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  verification_status TEXT NOT NULL CHECK (verification_status IN ('authentic', 'suspicious', 'not_found')),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  anomaly_flags JSONB DEFAULT '[]'::jsonb,
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_logs ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Regulators can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'regulator'));

-- User roles policies
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own role on signup" ON public.user_roles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Batches policies
CREATE POLICY "Manufacturers can view own batches" ON public.batches FOR SELECT USING (auth.uid() = registered_by);
CREATE POLICY "Manufacturers can insert batches" ON public.batches FOR INSERT WITH CHECK (auth.uid() = registered_by AND public.has_role(auth.uid(), 'manufacturer'));
CREATE POLICY "Regulators can view all batches" ON public.batches FOR SELECT USING (public.has_role(auth.uid(), 'regulator'));
CREATE POLICY "Anyone authenticated can verify batches" ON public.batches FOR SELECT USING (auth.uid() IS NOT NULL);

-- Scan logs policies
CREATE POLICY "Users can insert scan logs" ON public.scan_logs FOR INSERT WITH CHECK (auth.uid() = scanner_user_id);
CREATE POLICY "Users can view own scan logs" ON public.scan_logs FOR SELECT USING (auth.uid() = scanner_user_id);
CREATE POLICY "Regulators can view all scan logs" ON public.scan_logs FOR SELECT USING (public.has_role(auth.uid(), 'regulator'));

-- Auto-create profile on signup trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
