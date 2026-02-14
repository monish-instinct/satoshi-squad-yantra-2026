import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { verifyBatchOnChain, isBlockchainConfigured } from '@/lib/blockchain';
import { fetchFromIPFS, type BatchMetadata } from '@/lib/ipfs';
import { detectAnomalies, type RiskAssessment } from '@/lib/anomaly';
import { RiskMeter } from '@/components/RiskBadge';
import { SupplyChainTimeline } from '@/components/SupplyChainTimeline';
import {
  CheckCircle, AlertTriangle, XCircle, Camera, Loader2, Search,
  Shield, Pill, Calendar, Globe, Package, Wallet,
  AlertOctagon, Clock, ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { shortenAddress } from '@/lib/wallet';
import type { Batch, VerificationResult, BatchStatus } from '@/types';

const statusConfig: Record<VerificationResult, { icon: React.ElementType; label: string; color: string; bg: string; glow: string }> = {
  authentic: { icon: CheckCircle, label: 'Verified Authentic', color: 'text-success', bg: 'bg-success/[0.04] border-success/20', glow: 'glow-success' },
  suspicious: { icon: AlertTriangle, label: 'Suspicious Activity', color: 'text-warning', bg: 'bg-warning/[0.04] border-warning/20', glow: 'glow-warning' },
  not_found: { icon: XCircle, label: 'Not Found', color: 'text-destructive', bg: 'bg-destructive/[0.04] border-destructive/20', glow: 'glow-destructive' },
};

interface ChainEvent {
  id: string;
  event_type: string;
  from_wallet: string | null;
  to_wallet: string | null;
  location: string | null;
  notes: string | null;
  created_at: string;
}

export default function ConsumerVerify() {
  const [manualId, setManualId] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [scannedId, setScannedId] = useState('');
  const [risk, setRisk] = useState<RiskAssessment | null>(null);
  const [batchInfo, setBatchInfo] = useState<Batch | null>(null);
  const [ipfsMetadata, setIpfsMetadata] = useState<BatchMetadata | null>(null);
  const [chainOwner, setChainOwner] = useState<string | null>(null);
  const [chainIpfsHash, setChainIpfsHash] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState('');
  const [supplyEvents, setSupplyEvents] = useState<ChainEvent[]>([]);
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrRef = useRef<any>(null);

  const startScanner = async () => {
    setScanning(true);
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('consumer-qr-reader');
      html5QrRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (text) => {
          scanner.stop().catch(() => {});
          setScanning(false);
          verifyBatch(text);
        },
        () => {}
      );
    } catch {
      toast.error('Camera access denied or unavailable');
      setScanning(false);
    }
  };

  const stopScanner = () => {
    html5QrRef.current?.stop().catch(() => {});
    setScanning(false);
  };

  useEffect(() => {
    return () => { html5QrRef.current?.stop().catch(() => {}); };
  }, []);

  const verifyBatch = async (batchId: string) => {
    setLoading(true);
    setScannedId(batchId);
    setResult(null);
    setRisk(null);
    setBatchInfo(null);
    setIpfsMetadata(null);
    setChainOwner(null);
    setChainIpfsHash(null);
    setSupplyEvents([]);
    setVerifyStatus('');

    try {
      if (isBlockchainConfigured()) {
        setVerifyStatus('Querying blockchain...');
        const chainResult = await verifyBatchOnChain(batchId);
        if (chainResult) {
          if (!chainResult.exists) {
            setResult('not_found');
            setVerifyStatus('');
            return;
          }
          setChainOwner(chainResult.currentOwner || null);
          setChainIpfsHash(chainResult.ipfsHash || null);

          if (chainResult.ipfsHash) {
            setVerifyStatus('Fetching IPFS metadata...');
            const ipfsData = await fetchFromIPFS(chainResult.ipfsHash);
            if (ipfsData) setIpfsMetadata(ipfsData);
          }
        }
      }

      setVerifyStatus('Checking database...');
      const { data: batch } = await supabase.from('batches').select('*').eq('batch_id', batchId).maybeSingle();
      if (!batch && !chainOwner) {
        setResult('not_found');
        setVerifyStatus('');
        return;
      }

      if (batch) setBatchInfo(batch as unknown as Batch);

      // Fetch supply chain events
      setVerifyStatus('Loading supply chain...');
      const { data: events } = await supabase
        .from('supply_chain_events')
        .select('*')
        .eq('batch_id', batchId)
        .order('created_at', { ascending: true });
      if (events) setSupplyEvents(events as ChainEvent[]);

      setVerifyStatus('Running anomaly detection...');
      const assessment = await detectAnomalies(batchId, null, null);
      const status: VerificationResult = assessment.isSuspicious ? 'suspicious' : 'authentic';
      setResult(status);
      setRisk(assessment);
      setVerifyStatus('');
    } catch (err: any) {
      toast.error(err.message || 'Verification failed');
      setVerifyStatus('');
    } finally {
      setLoading(false);
    }
  };

  const handleManualVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualId.trim()) verifyBatch(manualId.trim());
  };

  const StatusIcon = result ? statusConfig[result].icon : null;
  const isRecalled = batchInfo?.status === 'recalled';
  const isExpired = batchInfo?.expiry_date && new Date(batchInfo.expiry_date) < new Date();

  const batchStatusLabel = (status: BatchStatus | undefined) => {
    if (!status) return null;
    const map: Record<BatchStatus, { label: string; className: string }> = {
      active: { label: 'Active', className: 'bg-success/10 text-success border-success/20' },
      sold: { label: 'Sold', className: 'bg-primary/10 text-primary border-primary/20' },
      recalled: { label: 'RECALLED', className: 'bg-destructive text-destructive-foreground border-destructive' },
      expired: { label: 'Expired', className: 'bg-warning/10 text-warning border-warning/20' },
    };
    return map[status];
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Consumer Hero Header */}
      <div className="bg-gradient-to-b from-primary/[0.03] to-background border-b border-border">
        <div className="container max-w-lg py-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/[0.07]">
            <Shield className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-[28px] font-bold tracking-tight text-foreground">
            Verify Your Medicine
          </h1>
          <p className="mt-2 text-[15px] text-muted-foreground max-w-sm mx-auto leading-relaxed">
            Scan the QR code on your medicine to instantly verify its authenticity
          </p>
        </div>
      </div>

      <div className="container max-w-lg py-8">
        <div className="flex flex-col gap-4">
          {/* Scanner Card */}
          <div className="apple-card p-6">
            <div
              id="consumer-qr-reader"
              ref={scannerRef}
              className={scanning ? 'rounded-2xl overflow-hidden mb-4 apple-shadow' : 'hidden'}
            />
            {!scanning ? (
              <Button onClick={startScanner} className="w-full h-14 rounded-2xl text-[15px] font-semibold glow-primary gap-3">
                <Camera className="h-5 w-5" /> Scan QR Code
              </Button>
            ) : (
              <Button variant="outline" onClick={stopScanner} className="w-full h-12 rounded-xl text-[14px] font-medium border-destructive/20 text-destructive hover:bg-destructive/5">
                Stop Scanner
              </Button>
            )}

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-[11px] uppercase tracking-[0.08em]">
                <span className="bg-card px-3 text-muted-foreground font-medium">or enter batch ID</span>
              </div>
            </div>

            <form onSubmit={handleManualVerify} className="flex gap-2">
              <Input
                placeholder="Enter Batch ID"
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                className="h-11 rounded-xl text-[14px] flex-1 bg-muted/50 border-border"
              />
              <Button type="submit" disabled={loading} className="h-11 rounded-xl px-5">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </form>
          </div>

          {/* Progress */}
          {verifyStatus && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-muted/50 border border-border animate-fade-in">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-[13px] text-muted-foreground font-medium">{verifyStatus}</span>
            </div>
          )}

          {/* RECALLED Warning */}
          {isRecalled && (
            <div className="apple-card border-2 border-destructive p-6 flex flex-col items-center gap-3 animate-scale-in bg-destructive/[0.03]">
              <AlertOctagon className="h-12 w-12 text-destructive" />
              <h2 className="text-[18px] font-bold text-destructive">RECALLED</h2>
              <p className="text-[13px] text-muted-foreground text-center">
                This medicine batch has been recalled. Do not consume. Contact your pharmacy immediately.
              </p>
              {batchInfo?.recalled_at && (
                <p className="text-[11px] text-muted-foreground">
                  Recalled on {new Date(batchInfo.recalled_at).toLocaleDateString()}
                </p>
              )}
            </div>
          )}

          {/* Result Card */}
          {result && StatusIcon && !isRecalled && (
            <div className={`apple-card border p-8 flex flex-col items-center gap-5 animate-scale-in ${statusConfig[result].bg} ${statusConfig[result].glow}`}>
              <StatusIcon className={`h-20 w-20 ${statusConfig[result].color}`} />
              <Badge className={`text-[16px] px-6 py-2.5 rounded-full font-bold ${
                result === 'authentic' ? 'bg-success text-success-foreground' :
                result === 'suspicious' ? 'bg-warning text-warning-foreground' :
                'bg-destructive text-destructive-foreground'
              }`}>
                {statusConfig[result].label}
              </Badge>
              <p className="font-mono text-[13px] text-muted-foreground">{scannedId}</p>

              {/* Batch Status */}
              {batchInfo?.status && (
                <Badge variant="outline" className={`text-[12px] font-semibold rounded-full px-3 py-1 ${batchStatusLabel(batchInfo.status)?.className}`}>
                  {batchStatusLabel(batchInfo.status)?.label}
                </Badge>
              )}

              {/* Expired warning */}
              {isExpired && !isRecalled && (
                <div className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-warning/[0.06] border border-warning/20">
                  <Clock className="h-5 w-5 text-warning shrink-0" />
                  <div>
                    <p className="text-[13px] font-semibold text-warning">Medicine Expired</p>
                    <p className="text-[11px] text-muted-foreground">
                      Expired on {new Date(batchInfo!.expiry_date!).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}

              {/* On-chain owner */}
              {chainOwner && (
                <div className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-card border border-border">
                  <Wallet className="h-4 w-4 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground">Current Owner (on-chain)</p>
                    <p className="text-[12px] font-mono font-medium text-foreground">{shortenAddress(chainOwner)}</p>
                  </div>
                </div>
              )}

              {/* Risk Score */}
              {risk && risk.riskScore > 0 && (
                <div className="w-full">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12px] font-medium text-muted-foreground">Risk Level</span>
                    <Badge variant="outline" className={`text-[10px] rounded-full px-2 py-0 capitalize ${
                      risk.riskLevel === 'critical' || risk.riskLevel === 'high' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                      risk.riskLevel === 'medium' ? 'bg-warning/10 text-warning border-warning/20' :
                      'bg-success/10 text-success border-success/20'
                    }`}>
                      {risk.riskLevel}
                    </Badge>
                  </div>
                  <RiskMeter score={risk.riskScore} />
                </div>
              )}

              {/* Anomaly Flags */}
              {risk && risk.flags.length > 0 && (
                <div className="w-full flex flex-col gap-1.5">
                  {risk.flags.map((flag, i) => (
                    <div key={i} className="text-[13px] text-warning bg-warning/[0.04] border border-warning/15 rounded-xl px-4 py-2.5 flex items-start gap-2.5">
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{flag}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Scan timestamp */}
              <p className="text-[11px] text-muted-foreground">
                Verified at {new Date().toLocaleString()}
              </p>
            </div>
          )}

          {/* Medicine Details */}
          {result && result !== 'not_found' && (ipfsMetadata || batchInfo) && (
            <div className="apple-card p-6 animate-fade-in">
              <div className="flex items-center gap-2 mb-4">
                <Pill className="h-4 w-4 text-primary" />
                <span className="text-[14px] font-semibold text-foreground">Medicine Details</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {(ipfsMetadata?.medicineName || batchInfo?.medicine_name) && (
                  <InfoItem icon={Pill} label="Medicine" value={ipfsMetadata?.medicineName || batchInfo?.medicine_name || ''} />
                )}
                {(ipfsMetadata?.dosage || batchInfo?.dosage) && (
                  <InfoItem icon={Package} label="Dosage" value={ipfsMetadata?.dosage || batchInfo?.dosage || ''} />
                )}
                {(ipfsMetadata?.manufacturer || batchInfo?.manufacturer_name) && (
                  <InfoItem icon={Package} label="Manufacturer" value={ipfsMetadata?.manufacturer || batchInfo?.manufacturer_name || ''} />
                )}
                {(ipfsMetadata?.countryOrigin || batchInfo?.country_of_origin) && (
                  <InfoItem icon={Globe} label="Origin" value={ipfsMetadata?.countryOrigin || batchInfo?.country_of_origin || ''} />
                )}
                {(ipfsMetadata?.manufacturingDate || batchInfo?.manufacturing_date) && (
                  <InfoItem icon={Calendar} label="Mfg Date" value={
                    ipfsMetadata?.manufacturingDate || (batchInfo?.manufacturing_date ? new Date(batchInfo.manufacturing_date).toLocaleDateString() : '')
                  } />
                )}
                {(ipfsMetadata?.expiryDate || batchInfo?.expiry_date) && (
                  <InfoItem icon={Calendar} label="Expiry" value={
                    ipfsMetadata?.expiryDate || (batchInfo?.expiry_date ? new Date(batchInfo.expiry_date).toLocaleDateString() : '')
                  } />
                )}
                {batchInfo?.storage_conditions && (
                  <InfoItem icon={Package} label="Storage" value={batchInfo.storage_conditions} />
                )}
              </div>
            </div>
          )}

          {/* Ownership History */}
          {supplyEvents.length > 0 && (
            <div className="apple-card p-6 animate-fade-in">
              <div className="flex items-center gap-2 mb-5">
                <ArrowRight className="h-4 w-4 text-primary" />
                <span className="text-[14px] font-semibold text-foreground">Ownership History</span>
              </div>
              <SupplyChainTimeline events={supplyEvents} />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  if (!value || value === 'N/A') return null;
  return (
    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/50">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="text-[13px] font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}
