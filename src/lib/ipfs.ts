import { supabase } from '@/integrations/supabase/client';

export interface BatchMetadata {
  medicineName: string;
  manufacturer: string;
  expiryDate: string;
  manufacturingDate: string;
  dosage: string;
  countryOrigin: string;
  batchId: string;
}

export async function uploadToIPFS(metadata: BatchMetadata): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke('pinata-upload', {
      body: { metadata },
    });

    if (error) {
      console.error('IPFS upload error:', error);
      return null;
    }

    return data?.ipfsHash || null;
  } catch (e) {
    console.error('IPFS upload failed:', e);
    return null;
  }
}

export async function fetchFromIPFS(ipfsHash: string): Promise<BatchMetadata | null> {
  if (!ipfsHash) return null;

  const gateways = [
    `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
    `https://ipfs.io/ipfs/${ipfsHash}`,
    `https://cloudflare-ipfs.com/ipfs/${ipfsHash}`,
  ];

  for (const url of gateways) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (response.ok) {
        return await response.json();
      }
    } catch {
      continue;
    }
  }

  return null;
}
