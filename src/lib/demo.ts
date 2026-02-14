import { supabase } from '@/integrations/supabase/client';

const DEMO_BATCHES = [
  { batch_id: 'DEMO-AMOX-001', manufacturer_name: 'PharmaCorp Inc.', medicine_name: 'Amoxicillin 500mg', dosage: '500mg', country_of_origin: 'United States', manufacturing_date: '2025-11-01', expiry_date: '2027-11-01' },
  { batch_id: 'DEMO-IBUP-002', manufacturer_name: 'MedLife Labs', medicine_name: 'Ibuprofen 200mg', dosage: '200mg', country_of_origin: 'Germany', manufacturing_date: '2025-09-15', expiry_date: '2027-09-15' },
  { batch_id: 'DEMO-PARA-003', manufacturer_name: 'HealthGen SA', medicine_name: 'Paracetamol 650mg', dosage: '650mg', country_of_origin: 'India', manufacturing_date: '2025-06-20', expiry_date: '2027-06-20' },
  { batch_id: 'DEMO-METR-004', manufacturer_name: 'BioPharm Ltd', medicine_name: 'Metformin 1000mg', dosage: '1000mg', country_of_origin: 'UK', manufacturing_date: '2025-08-10', expiry_date: '2024-08-10' }, // expired
  { batch_id: 'DEMO-ASPR-005', manufacturer_name: 'PharmaCorp Inc.', medicine_name: 'Aspirin 100mg', dosage: '100mg', country_of_origin: 'United States', manufacturing_date: '2026-01-05', expiry_date: '2028-01-05' },
];

const DEMO_LOCATIONS = [
  { lat: 40.7128, lng: -74.006 },
  { lat: 34.0522, lng: -118.2437 },
  { lat: 51.5074, lng: -0.1278 },
  { lat: 28.6139, lng: 77.209 },
  { lat: 35.6762, lng: 139.6503 },
  { lat: -23.5505, lng: -46.6333 },
];

const STATUS_DIST: ('authentic' | 'suspicious' | 'not_found')[] = [
  'authentic', 'authentic', 'authentic', 'authentic', 'authentic',
  'authentic', 'authentic', 'suspicious', 'suspicious', 'not_found',
];

export async function generateDemoData(userId: string) {
  // Insert demo batches
  const batchHash = '0'.repeat(64);
  for (const b of DEMO_BATCHES) {
    await supabase.from('batches').upsert({
      ...b,
      batch_hash: batchHash,
      registered_by: userId,
    }, { onConflict: 'batch_id' }).select();
  }

  // Insert demo scan logs
  const now = Date.now();
  const scans = [];
  for (let i = 0; i < 30; i++) {
    const batch = DEMO_BATCHES[Math.floor(Math.random() * DEMO_BATCHES.length)];
    const loc = DEMO_LOCATIONS[Math.floor(Math.random() * DEMO_LOCATIONS.length)];
    const status = STATUS_DIST[Math.floor(Math.random() * STATUS_DIST.length)];
    const hoursAgo = Math.floor(Math.random() * 72);
    scans.push({
      batch_id: batch.batch_id,
      scanner_user_id: userId,
      verification_status: status,
      latitude: loc.lat + (Math.random() - 0.5) * 0.1,
      longitude: loc.lng + (Math.random() - 0.5) * 0.1,
      anomaly_flags: status === 'suspicious'
        ? ['Rapid scanning detected', 'Geographic anomaly: 450km in 10 min']
        : [],
      scanned_at: new Date(now - hoursAgo * 3600000).toISOString(),
    });
  }
  await supabase.from('scan_logs').insert(scans);

  // Insert demo alerts
  const alerts = [
    { batch_id: 'DEMO-METR-004', alert_type: 'expired_medicine', severity: 'high', message: 'Expired medicine detected during scan', risk_score: 75 },
    { batch_id: 'DEMO-IBUP-002', alert_type: 'geographic_anomaly', severity: 'medium', message: 'Same batch scanned 450km apart within 10 minutes', risk_score: 55, latitude: 40.7128, longitude: -74.006 },
    { batch_id: 'DEMO-PARA-003', alert_type: 'rapid_scan', severity: 'low', message: 'Unusually high scan frequency detected', risk_score: 25 },
  ];
  await supabase.from('alerts').insert(alerts);

  // Insert demo audit logs
  const auditLogs = DEMO_BATCHES.map(b => ({
    action: 'batch_registered',
    entity_type: 'batch',
    entity_id: b.batch_id,
    actor_id: userId,
    details: { manufacturer: b.manufacturer_name, medicine: b.medicine_name },
  }));
  await supabase.from('audit_logs').insert(auditLogs);

  // Insert demo supply chain events
  const chainEvents = [
    { batch_id: 'DEMO-AMOX-001', event_type: 'manufactured', from_wallet: null, to_wallet: '0xabc...123', location: 'New York, USA', notes: 'Initial production', actor_id: userId },
    { batch_id: 'DEMO-AMOX-001', event_type: 'shipped', from_wallet: '0xabc...123', to_wallet: '0xdef...456', location: 'Chicago, USA', notes: 'Shipped to distributor', actor_id: userId },
    { batch_id: 'DEMO-AMOX-001', event_type: 'received', from_wallet: '0xdef...456', to_wallet: '0xghi...789', location: 'Los Angeles, USA', notes: 'Received at pharmacy', actor_id: userId },
  ];
  await supabase.from('supply_chain_events').insert(chainEvents);
}
