export type AppRole = 'manufacturer' | 'pharmacy' | 'regulator' | 'distributor' | 'auditor' | 'consumer';

export type BatchStatus = 'active' | 'sold' | 'recalled' | 'expired';

export interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  organization: string | null;
  wallet_address: string | null;
}

export interface Batch {
  id: string;
  batch_id: string;
  manufacturer_name: string;
  batch_hash: string;
  blockchain_tx_hash: string | null;
  registered_by: string | null;
  created_at: string;
  medicine_name: string | null;
  expiry_date: string | null;
  manufacturing_date: string | null;
  dosage: string | null;
  country_of_origin: string | null;
  status: BatchStatus;
  image_url: string | null;
  storage_conditions: string | null;
  recalled_at: string | null;
  recalled_by: string | null;
}

export interface ScanLog {
  id: string;
  batch_id: string;
  scanner_user_id: string | null;
  verification_status: 'authentic' | 'suspicious' | 'not_found';
  latitude: number | null;
  longitude: number | null;
  anomaly_flags: string[];
  scanned_at: string;
}

export interface ConsumerReport {
  id: string;
  batch_id: string;
  reporter_id: string | null;
  report_type: string;
  description: string | null;
  photo_url: string | null;
  status: string;
  created_at: string;
}

export interface TrustScore {
  id: string;
  manufacturer_id: string;
  manufacturer_name: string;
  score: number;
  total_batches: number;
  suspicious_count: number;
  verified_count: number;
  complaint_count: number;
  updated_at: string;
}

export type VerificationResult = 'authentic' | 'suspicious' | 'not_found';
