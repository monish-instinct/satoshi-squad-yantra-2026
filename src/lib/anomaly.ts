import { supabase } from '@/integrations/supabase/client';

const RAPID_SCAN_THRESHOLD = 5;
const RAPID_SCAN_WINDOW_MINUTES = 10;
const GEO_DISTANCE_THRESHOLD_KM = 100;
const GEO_TIME_WINDOW_MINUTES = 30;
const DUPLICATE_SCAN_THRESHOLD = 15;
const DUPLICATE_WINDOW_HOURS = 24;

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export interface RiskAssessment {
  isSuspicious: boolean;
  flags: string[];
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export async function detectAnomalies(
  batchId: string,
  latitude: number | null,
  longitude: number | null
): Promise<RiskAssessment> {
  const flags: string[] = [];
  let riskScore = 0;
  const now = new Date();

  // Check rapid scans
  const rapidWindowStart = new Date(now.getTime() - RAPID_SCAN_WINDOW_MINUTES * 60 * 1000).toISOString();
  const { data: recentScans } = await supabase
    .from('scan_logs')
    .select('*')
    .eq('batch_id', batchId)
    .gte('scanned_at', rapidWindowStart)
    .order('scanned_at', { ascending: false });

  if (recentScans && recentScans.length >= RAPID_SCAN_THRESHOLD) {
    const severity = Math.min(recentScans.length / RAPID_SCAN_THRESHOLD, 3);
    riskScore += Math.round(severity * 20);
    flags.push(`Rapid scanning: ${recentScans.length} scans in ${RAPID_SCAN_WINDOW_MINUTES} min`);
  }

  // Check geographic velocity
  if (latitude !== null && longitude !== null && recentScans) {
    const geoWindowStart = new Date(now.getTime() - GEO_TIME_WINDOW_MINUTES * 60 * 1000);
    for (const scan of recentScans) {
      if (scan.latitude && scan.longitude && new Date(scan.scanned_at) >= geoWindowStart) {
        const dist = haversineDistance(latitude, longitude, scan.latitude, scan.longitude);
        if (dist > GEO_DISTANCE_THRESHOLD_KM) {
          const timeDiffMin = (now.getTime() - new Date(scan.scanned_at).getTime()) / 60000;
          const velocity = dist / (timeDiffMin / 60);
          riskScore += Math.min(Math.round(dist / 50), 40);
          flags.push(`Geographic anomaly: ${Math.round(dist)}km apart in ${Math.round(timeDiffMin)} min (~${Math.round(velocity)} km/h)`);
          break;
        }
      }
    }
  }

  // Check duplicate QR reuse (24h window)
  const dupWindowStart = new Date(now.getTime() - DUPLICATE_WINDOW_HOURS * 60 * 60 * 1000).toISOString();
  const { count: dayCount } = await supabase
    .from('scan_logs')
    .select('*', { count: 'exact', head: true })
    .eq('batch_id', batchId)
    .gte('scanned_at', dupWindowStart);

  if (dayCount && dayCount >= DUPLICATE_SCAN_THRESHOLD) {
    riskScore += 15;
    flags.push(`Excessive scans: ${dayCount} verifications in 24 hours`);
  }

  // Check expired medicine
  const { data: batch } = await supabase
    .from('batches')
    .select('expiry_date')
    .eq('batch_id', batchId)
    .maybeSingle();

  if (batch?.expiry_date && new Date(batch.expiry_date) < now) {
    riskScore += 25;
    flags.push(`Expired medicine: expired on ${new Date(batch.expiry_date).toLocaleDateString()}`);
  }

  // Cap risk score at 100
  riskScore = Math.min(riskScore, 100);

  const riskLevel: RiskAssessment['riskLevel'] =
    riskScore >= 70 ? 'critical' :
    riskScore >= 45 ? 'high' :
    riskScore >= 20 ? 'medium' : 'low';

  return {
    isSuspicious: flags.length > 0,
    flags,
    riskScore,
    riskLevel,
  };
}
