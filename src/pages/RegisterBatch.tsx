import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { registerBatchOnChain, isBlockchainConfigured } from '@/lib/blockchain';
import { uploadToIPFS, type BatchMetadata } from '@/lib/ipfs';
import QRCode from 'qrcode';
import { Package, Download, Loader2, CheckCircle, Pill, Calendar, Globe, Link as LinkIcon } from 'lucide-react';

export default function RegisterBatch() {
  const { user, walletAddress, demoMode } = useAuth();
  const [batchId, setBatchId] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [medicineName, setMedicineName] = useState('');
  const [dosage, setDosage] = useState('');
  const [countryOfOrigin, setCountryOfOrigin] = useState('');
  const [manufacturingDate, setManufacturingDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [lastBatchId, setLastBatchId] = useState('');
  const [lastIpfsHash, setLastIpfsHash] = useState<string | null>(null);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchId.trim() || !manufacturer.trim()) return;
    setLoading(true);
    setStatus('');
    setLastIpfsHash(null);
    setLastTxHash(null);

    try {
      // Step 0: Ensure blockchain is configured
      if (!isBlockchainConfigured()) {
        toast.error('Blockchain not configured. Go to Settings and set your smart contract address.');
        setLoading(false);
        return;
      }

      // Step 1: Upload metadata to IPFS via Pinata
      setStatus('Uploading metadata to IPFS...');
      const metadata: BatchMetadata = {
        batchId,
        medicineName: medicineName || 'N/A',
        manufacturer,
        expiryDate: expiryDate || 'N/A',
        manufacturingDate: manufacturingDate || 'N/A',
        dosage: dosage || 'N/A',
        countryOrigin: countryOfOrigin || 'N/A',
      };

      const ipfsHash = await uploadToIPFS(metadata);
      if (!ipfsHash) {
        toast.error('IPFS upload failed. Cannot register without metadata hash.');
        setLoading(false);
        return;
      }
      setLastIpfsHash(ipfsHash);
      toast.success('Metadata uploaded to IPFS');

      // Step 2: Register on blockchain — MetaMask will prompt for approval
      setStatus('Waiting for MetaMask approval...');
      let txHash: string | null = null;
      try {
        txHash = await registerBatchOnChain(batchId, ipfsHash);
      } catch (err: any) {
        toast.error(err.message || 'Blockchain transaction failed.');
        setLoading(false);
        return;
      }
      if (!txHash) {
        toast.error('Blockchain transaction failed. Batch not registered.');
        setLoading(false);
        return;
      }
      setLastTxHash(txHash);
      toast.success('Batch registered on blockchain');

      // Step 3: Save to Supabase
      setStatus('Saving to database...');
      if (!demoMode && user) {
        const { error } = await supabase.from('batches').insert({
          batch_id: batchId,
          manufacturer_name: manufacturer,
          batch_hash: ipfsHash,
          blockchain_tx_hash: txHash,
          registered_by: user.id,
          medicine_name: medicineName || null,
          dosage: dosage || null,
          country_of_origin: countryOfOrigin || null,
          manufacturing_date: manufacturingDate || null,
          expiry_date: expiryDate || null,
        });
        if (error) throw error;

        await supabase.from('audit_logs').insert({
          action: 'batch_registered',
          entity_type: 'batch',
          entity_id: batchId,
          actor_id: user.id,
          actor_wallet: walletAddress,
          details: { manufacturer, medicine_name: medicineName, tx_hash: txHash, ipfs_hash: ipfsHash },
        });

        // Add initial supply chain event
        await supabase.from('supply_chain_events').insert({
          batch_id: batchId,
          event_type: 'manufactured',
          from_wallet: null,
          to_wallet: walletAddress,
          actor_id: user.id,
          location: countryOfOrigin || null,
          notes: `Batch registered by ${manufacturer}`,
        });
      }

      // Step 4: Generate QR
      setStatus('Generating QR code...');
      const qr = await QRCode.toDataURL(batchId, {
        width: 300,
        margin: 2,
        color: { dark: '#1a1a1a', light: '#ffffff00' },
      });
      setQrDataUrl(qr);
      setLastBatchId(batchId);
      setStatus('');
      toast.success(`Batch ${batchId} registered successfully!`);
      setBatchId('');
      setManufacturer('');
      setMedicineName('');
      setDosage('');
      setCountryOfOrigin('');
      setManufacturingDate('');
      setExpiryDate('');
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
      setStatus('');
    } finally {
      setLoading(false);
    }
  };

  const downloadQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `batch-${lastBatchId}.png`;
    a.click();
  };

  return (
    <main className="container max-w-3xl py-10 animate-fade-in">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 glow-primary">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Register Batch</h1>
            <p className="text-[13px] text-muted-foreground">Register on IPFS + Blockchain with full metadata</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <div className="apple-card p-6 md:col-span-3">
          <h2 className="text-[15px] font-semibold text-foreground mb-5">Batch Details</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="batchId" className="text-[13px] font-medium text-foreground">Batch ID *</Label>
                <Input id="batchId" placeholder="e.g. BATCH-2026-001" value={batchId} onChange={(e) => setBatchId(e.target.value)} required className="h-11 rounded-xl text-[14px]" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="manufacturer" className="text-[13px] font-medium text-foreground">Manufacturer *</Label>
                <Input id="manufacturer" placeholder="e.g. PharmaCorp" value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} required className="h-11 rounded-xl text-[14px]" />
              </div>
            </div>

            <div className="h-px bg-border" />

            <div className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
              <Pill className="h-4 w-4" /> Medicine Information
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="medicineName" className="text-[13px] font-medium text-foreground">Medicine Name</Label>
                <Input id="medicineName" placeholder="e.g. Amoxicillin" value={medicineName} onChange={(e) => setMedicineName(e.target.value)} className="h-11 rounded-xl text-[14px]" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="dosage" className="text-[13px] font-medium text-foreground">Dosage</Label>
                <Input id="dosage" placeholder="e.g. 500mg" value={dosage} onChange={(e) => setDosage(e.target.value)} className="h-11 rounded-xl text-[14px]" />
              </div>
            </div>

            <div className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
              <Calendar className="h-4 w-4" /> Dates
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="mfgDate" className="text-[13px] font-medium text-foreground">Manufacturing Date</Label>
                <Input id="mfgDate" type="date" value={manufacturingDate} onChange={(e) => setManufacturingDate(e.target.value)} className="h-11 rounded-xl text-[14px]" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="expDate" className="text-[13px] font-medium text-foreground">Expiry Date</Label>
                <Input id="expDate" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="h-11 rounded-xl text-[14px]" />
              </div>
            </div>

            <div className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
              <Globe className="h-4 w-4" /> Origin
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="country" className="text-[13px] font-medium text-foreground">Country of Origin</Label>
              <Input id="country" placeholder="e.g. United States" value={countryOfOrigin} onChange={(e) => setCountryOfOrigin(e.target.value)} className="h-11 rounded-xl text-[14px]" />
            </div>

            {status && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/10">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-[13px] text-primary font-medium">{status}</span>
              </div>
            )}

            <Button type="submit" className="w-full h-11 rounded-xl text-[14px] font-medium mt-1 glow-primary" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Register Batch'}
            </Button>
            {!isBlockchainConfigured() && (
              <p className="text-[11px] text-muted-foreground text-center">No blockchain configured — data stored in Supabase + IPFS</p>
            )}
          </form>
        </div>

        <div className="md:col-span-2 flex flex-col gap-4">
          {qrDataUrl ? (
            <div className="apple-card p-6 flex flex-col items-center gap-4 animate-scale-in border-success/20 glow-success">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <h2 className="text-[15px] font-semibold text-foreground">QR Code Ready</h2>
              <div className="rounded-2xl border border-border overflow-hidden bg-card p-4">
                <img src={qrDataUrl} alt={`QR code for batch ${lastBatchId}`} className="rounded-lg" />
              </div>
              <p className="text-[13px] font-mono font-medium text-muted-foreground">{lastBatchId}</p>
              <Button variant="outline" onClick={downloadQR} className="rounded-xl h-10 px-5 text-[13px] border-border hover:bg-accent text-foreground">
                <Download className="h-4 w-4 mr-2" />
                Download PNG
              </Button>
            </div>
          ) : (
            <div className="apple-card p-6 flex flex-col items-center justify-center text-center min-h-[280px]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent mb-3">
                <Package className="h-6 w-6 text-muted-foreground/40" />
              </div>
              <p className="text-[14px] text-muted-foreground font-medium">No QR code yet</p>
              <p className="text-[12px] text-muted-foreground/60 mt-1">Register a batch to generate its QR code</p>
            </div>
          )}

          {/* IPFS + Blockchain Status */}
          {(lastIpfsHash || lastTxHash) && (
            <div className="apple-card p-5 flex flex-col gap-3 animate-fade-in">
              <h3 className="text-[13px] font-semibold text-foreground">On-Chain Details</h3>
              {lastIpfsHash && (
                <div className="flex items-start gap-2">
                  <LinkIcon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground">IPFS Hash</p>
                    <a
                      href={`https://gateway.pinata.cloud/ipfs/${lastIpfsHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[12px] font-mono text-primary hover:underline break-all"
                    >
                      {lastIpfsHash}
                    </a>
                  </div>
                </div>
              )}
              {lastTxHash && (
                <div className="flex items-start gap-2">
                  <LinkIcon className="h-4 w-4 text-success mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground">Transaction Hash</p>
                    <a
                      href={`https://sepolia.etherscan.io/tx/${lastTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[12px] font-mono text-primary hover:underline break-all"
                    >
                      {lastTxHash}
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
