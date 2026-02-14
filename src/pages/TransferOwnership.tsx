import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { transferOwnershipOnChain, isBlockchainConfigured } from '@/lib/blockchain';
import { ArrowRightLeft, Loader2, CheckCircle, Wallet } from 'lucide-react';
import { shortenAddress } from '@/lib/wallet';

export default function TransferOwnership() {
  const { user, walletAddress, demoMode } = useAuth();
  const [batchId, setBatchId] = useState('');
  const [newOwner, setNewOwner] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastTx, setLastTx] = useState<string | null>(null);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchId.trim() || !newOwner.trim()) return;
    setLoading(true);
    setLastTx(null);

    try {
      let txHash: string | null = null;

      if (isBlockchainConfigured()) {
        txHash = await transferOwnershipOnChain(batchId, newOwner);
        if (!txHash) {
          toast.error('Blockchain transfer failed. Are you the batch owner?');
          return;
        }
      }

      if (!demoMode && user) {
        // Log supply chain event
        await supabase.from('supply_chain_events').insert({
          batch_id: batchId,
          event_type: 'ownership_transfer',
          from_wallet: walletAddress,
          to_wallet: newOwner.toLowerCase(),
          actor_id: user.id,
          notes: `Ownership transferred${txHash ? ` (tx: ${txHash})` : ''}`,
        });

        // Log audit event
        await supabase.from('audit_logs').insert({
          action: 'ownership_transfer',
          entity_type: 'batch',
          entity_id: batchId,
          actor_id: user.id,
          actor_wallet: walletAddress,
          details: { from: walletAddress, to: newOwner, tx_hash: txHash },
        });
      }

      setLastTx(txHash);
      toast.success(`Batch ${batchId} ownership transferred!`);
      setBatchId('');
      setNewOwner('');
    } catch (err: any) {
      toast.error(err.message || 'Transfer failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container max-w-xl py-10 animate-fade-in">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 glow-primary">
          <ArrowRightLeft className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Transfer Ownership</h1>
          <p className="text-[13px] text-muted-foreground">Transfer batch ownership to another wallet via smart contract on Sepolia</p>
        </div>
      </div>

      {walletAddress && (
        <div className="apple-card p-4 mb-4 flex items-center gap-3">
          <Wallet className="h-4 w-4 text-primary shrink-0" />
          <div>
            <p className="text-[12px] text-muted-foreground">Your wallet (sender)</p>
            <p className="text-[13px] font-mono font-medium text-foreground">{shortenAddress(walletAddress)}</p>
          </div>
        </div>
      )}

      <div className="apple-card p-6">
        <form onSubmit={handleTransfer} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="batchId" className="text-[13px] font-medium text-foreground">Batch ID</Label>
            <Input id="batchId" placeholder="e.g. BATCH-2026-001" value={batchId} onChange={(e) => setBatchId(e.target.value)} required className="h-11 rounded-xl text-[14px]" />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="newOwner" className="text-[13px] font-medium text-foreground">New Owner Wallet Address</Label>
            <Input id="newOwner" placeholder="0x..." value={newOwner} onChange={(e) => setNewOwner(e.target.value)} required className="h-11 rounded-xl font-mono text-[13px]" />
          </div>

          <Button type="submit" className="w-full h-11 rounded-xl text-[14px] font-medium mt-1 glow-primary" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Transfer Ownership'}
          </Button>
          {!isBlockchainConfigured() && (
            <p className="text-[11px] text-muted-foreground text-center">No blockchain configured — transfer logged in Supabase only</p>
          )}
        </form>
      </div>

      {lastTx && (
        <div className="apple-card p-6 mt-4 flex flex-col items-center gap-3 animate-scale-in border-success/20 glow-success">
          <CheckCircle className="h-10 w-10 text-success" />
          <h2 className="text-[15px] font-semibold text-foreground">Transfer Complete</h2>
          <p className="text-[12px] font-mono text-muted-foreground break-all text-center">{lastTx}</p>
        </div>
      )}
    </main>
  );
}
