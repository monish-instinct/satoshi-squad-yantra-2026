
-- Add wallet_address column to profiles
ALTER TABLE public.profiles ADD COLUMN wallet_address text UNIQUE;

-- Create index for wallet lookups
CREATE INDEX idx_profiles_wallet_address ON public.profiles (wallet_address);
