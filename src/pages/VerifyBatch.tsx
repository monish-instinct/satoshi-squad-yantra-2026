import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { verifyBatchOnChain, isBlockchainConfigured } from '@/lib/blockchain';
import { fetchFromIPFS, type BatchMetadata } from '@/lib/ipfs';
import { detectAnomalies, type RiskAssessment } from '@/lib/anomaly';
import { RiskMeter } from '@/components/RiskBadge';
import { ScanLine, CheckCircle, AlertTriangle, XCircle, Camera, Loader2, Search, Shield, Pill, Calendar, Globe, Package, Wallet, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';
import { shortenAddress } from '@/lib/wallet';
import type { Batch, VerificationResult } from '@/types';

const statusConfig: Record<VerificationResult, { icon: React.ElementType; label: string; color: string; bg: string; glow: string }> = {
  authentic: { icon: CheckCircle, label: 'Authentic', color: 'text-success', bg: 'bg-success/[0.04] border-success/20', glow: 'glow-success' },
  suspicious: { icon: AlertTriangle, label: 'Suspicious', color: 'text-warning', bg: 'bg-warning/[0.04] border-warning/20', glow: 'glow-warning' },
  not_found: { icon: XCircle, label: 'Not Found', color: 'text-destructive', bg: 'bg-destructive/[0.04] border-destructive/20', glow: 'glow-destructive' },
};

export default function VerifyBatch() {
  const { user, demoMode } = useAuth();
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
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrRef = useRef<any>(null);

  const startScanner = async () => {
    setScanning(true);
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('qr-reader');
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

  const getLocation = (): Promise<{ lat: number; lng: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { timeout: 5000 }
      );
    });
  };

  const verifyBatch = async (batchId: string) => {
    setLoading(true);
    setScannedId(batchId);
    setResult(null);
    setRisk(null);
    setBatchInfo(null);
    setIpfsMetadata(null);
    setChainOwner(null);
    setChainIpfsHash(null);
    setVerifyStatus('');

    try {
      const loc = await getLocation();

      if (isBlockchainConfigured()) {
        setVerifyStatus('Querying blockchain...');
        const chainResult = await verifyBatchOnChain(batchId);
        if (chainResult) {
          if (!chainResult.exists) {
            setResult('not_found');
            await logScan(batchId, 'not_found', loc, [], 0);
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
        await logScan(batchId, 'not_found', loc, [], 0);
        setVerifyStatus('');
        return;
      }

      if (batch) setBatchInfo(batch as unknown as Batch);

      setVerifyStatus('Running anomaly detection...');
      const assessment = await detectAnomalies(batchId, loc?.lat ?? null, loc?.lng ?? null);
      const status: VerificationResult = assessment.isSuspicious ? 'suspicious' : 'authentic';
      setResult(status);
      setRisk(assessment);
      await logScan(batchId, status, loc, assessment.flags, assessment.riskScore);

      if (assessment.riskScore >= 45) {
        await supabase.from('alerts').insert({
          batch_id: batchId,
          alert_type: assessment.riskLevel === 'critical' ? 'critical_risk' : 'suspicious_scan',
          severity: assessment.riskLevel,
          message: assessment.flags[0] || 'Suspicious activity detected',
          risk_score: assessment.riskScore,
          latitude: loc?.lat ?? null,
          longitude: loc?.lng ?? null,
        });
      }
      setVerifyStatus('');
    } catch (err: any) {
      toast.error(err.message || 'Verification failed');
      setVerifyStatus('');
    } finally {
      setLoading(false);
    }
  };

  const logScan = async (batchId: string, status: VerificationResult, loc: { lat: number; lng: number } | null, flags: string[], riskScore: number) => {
    if (demoMode) return;
    await supabase.from('scan_logs').insert({
      batch_id: batchId,
      scanner_user_id: user?.id ?? null,
      verification_status: status,
      latitude: loc?.lat ?? null,
      longitude: loc?.lng ?? null,
      anomaly_flags: flags,
    });
    await supabase.from('audit_logs').insert({
      action: 'batch_verified',
      entity_type: 'scan',
      entity_id: batchId,
      actor_id: user?.id ?? null,
      details: { status, risk_score: riskScore },
    });
  };

  const handleManualVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualId.trim()) verifyBatch(manualId.trim());
  };

  const StatusIcon = result ? statusConfig[result].icon : null;

  return (
    <main className="container max-w-lg py-10 animate-fade-in">
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/[0.07]">
          <ScanLine className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-foreground">Verify Batch</h1>
          <p className="text-[13px] text-muted-foreground">Blockchain-verified authenticity check</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* Scanner Card */}
        <div className="apple-card p-6">
          <div
            id="qr-reader"
            ref={scannerRef}
            className={scanning ? 'rounded-2xl overflow-hidden mb-4 apple-shadow' : 'hidden'}
          />
          {!scanning ? (
            <Button onClick={startScanner} className="w-full h-12 rounded-xl text-[14px] font-medium glow-primary gap-2">
              <Camera className="h-4 w-4" /> Open Camera Scanner
            </Button>
          ) : (
            <Button variant="outline" onClick={stopScanner} className="w-full h-12 rounded-xl text-[14px] font-medium border-destructive/20 text-destructive hover:bg-destructive/5">
              Stop Scanner
            </Button>
          )}

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-[11px] uppercase tracking-[0.08em]">
              <span className="bg-card px-3 text-muted-foreground font-medium">or enter manually</span>
            </div>
          </div>

          <form onSubmit={handleManualVerify} className="flex gap-2">
            <Input
              placeholder="Enter Batch ID"
              value={manualId}
              onChange={(e) => setManualId(e.target.value)}
              className="h-11 rounded-xl text-[14px] flex-1 bg-muted/50 border-border focus:bg-card"
            />
            <Button type="submit" disabled={loading} className="h-11 rounded-xl px-5">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </form>
        </div>

        {/* Progress indicator */}
        {verifyStatus && (
          <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-muted/50 border border-border animate-fade-in">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-[13px] text-muted-foreground font-medium">{verifyStatus}</span>
          </div>
        )}

        {/* Result Card */}
        {result && StatusIcon && (
          <div className={`apple-card border p-8 flex flex-col items-center gap-5 animate-scale-in ${statusConfig[result].bg} ${statusConfig[result].glow}`}>
            <StatusIcon className={`h-16 w-16 ${statusConfig[result].color}`} />
            <Badge className={`text-[15px] px-5 py-2 rounded-full font-semibold ${
              result === 'authentic' ? 'bg-success text-success-foreground' :
              result === 'suspicious' ? 'bg-warning text-warning-foreground' :
              'bg-destructive text-destructive-foreground'
            }`}>
              {statusConfig[result].label}
            </Badge>
            <p className="font-mono text-[13px] text-muted-foreground">{scannedId}</p>

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

            {/* IPFS Hash */}
            {chainIpfsHash && (
              <div className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-card border border-border">
                <LinkIcon className="h-4 w-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] text-muted-foreground">IPFS Metadata</p>
                  <a href={`https://gateway.pinata.cloud/ipfs/${chainIpfsHash}`} target="_blank" rel="noopener noreferrer"
                    className="text-[12px] font-mono text-primary hover:underline break-all">
                    {chainIpfsHash.slice(0, 20)}...
                  </a>
                </div>
              </div>
            )}

            {/* Risk Score */}
            {risk && risk.riskScore > 0 && (
              <div className="w-full">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] font-medium text-muted-foreground">Risk Score</span>
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
          </div>
        )}

        {/* IPFS Metadata Card */}
        {ipfsMetadata && result === 'authentic' && (
          <div className="apple-card p-6 animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-4 w-4 text-success" />
              <span className="text-[14px] font-semibold text-foreground">IPFS Verified Details</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {ipfsMetadata.medicineName && ipfsMetadata.medicineName !== 'N/A' && (
                <InfoItem icon={Pill} label="Medicine" value={ipfsMetadata.medicineName} />
              )}
              {ipfsMetadata.dosage && ipfsMetadata.dosage !== 'N/A' && (
                <InfoItem icon={Package} label="Dosage" value={ipfsMetadata.dosage} />
              )}
              {ipfsMetadata.manufacturer && (
                <InfoItem icon={Package} label="Manufacturer" value={ipfsMetadata.manufacturer} />
              )}
              {ipfsMetadata.countryOrigin && ipfsMetadata.countryOrigin !== 'N/A' && (
                <InfoItem icon={Globe} label="Origin" value={ipfsMetadata.countryOrigin} />
              )}
              {ipfsMetadata.manufacturingDate && ipfsMetadata.manufacturingDate !== 'N/A' && (
                <InfoItem icon={Calendar} label="Mfg Date" value={ipfsMetadata.manufacturingDate} />
              )}
              {ipfsMetadata.expiryDate && ipfsMetadata.expiryDate !== 'N/A' && (
                <InfoItem icon={Calendar} label="Expiry" value={ipfsMetadata.expiryDate} />
              )}
            </div>
            <div className="mt-4 pt-3 border-t border-border flex items-center gap-2 text-[11px] text-muted-foreground">
              <CheckCircle className="h-3 w-3 text-success" />
              Verified from IPFS at {new Date().toLocaleString()}
            </div>
          </div>
        )}

        {/* Supabase batch info fallback */}
        {batchInfo && !ipfsMetadata && result === 'authentic' && (
          <div className="apple-card p-6 animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-4 w-4 text-success" />
              <span className="text-[14px] font-semibold text-foreground">Verified Medicine Details</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {batchInfo.medicine_name && <InfoItem icon={Pill} label="Medicine" value={batchInfo.medicine_name} />}
              {batchInfo.dosage && <InfoItem icon={Package} label="Dosage" value={batchInfo.dosage} />}
              {batchInfo.manufacturer_name && <InfoItem icon={Package} label="Manufacturer" value={batchInfo.manufacturer_name} />}
              {batchInfo.country_of_origin && <InfoItem icon={Globe} label="Origin" value={batchInfo.country_of_origin} />}
              {batchInfo.manufacturing_date && <InfoItem icon={Calendar} label="Mfg Date" value={new Date(batchInfo.manufacturing_date).toLocaleDateString()} />}
              {batchInfo.expiry_date && <InfoItem icon={Calendar} label="Expiry" value={new Date(batchInfo.expiry_date).toLocaleDateString()} />}
            </div>
            <div className="mt-4 pt-3 border-t border-border flex items-center gap-2 text-[11px] text-muted-foreground">
              <CheckCircle className="h-3 w-3 text-success" />
              Verified at {new Date().toLocaleString()}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
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
