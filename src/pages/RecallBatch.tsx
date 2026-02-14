import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { AlertOctagon, Loader2, CheckCircle } from 'lucide-react';

export default function RecallBatch() {
  const { user, walletAddress } = useAuth();
  const [batchId, setBatchId] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleRecall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchId.trim() || !user) return;
    setLoading(true);

    try {
      // Update batch status to recalled
      const { error } = await supabase
        .from('batches')
        .update({
          status: 'recalled',
          recalled_at: new Date().toISOString(),
          recalled_by: user.id,
        })
        .eq('batch_id', batchId.trim());

      if (error) throw error;

      // Create alert
      await supabase.from('alerts').insert({
        batch_id: batchId.trim(),
        alert_type: 'recall',
        severity: 'critical',
        message: `Batch recalled: ${reason || 'No reason specified'}`,
        risk_score: 100,
      });

      // Audit log
      await supabase.from('audit_logs').insert({
        action: 'batch_recalled',
        entity_type: 'batch',
        entity_id: batchId.trim(),
        actor_id: user.id,
        actor_wallet: walletAddress,
        details: { reason },
      });

      setDone(true);
      toast.success('Batch recalled successfully');
    } catch (err: any) {
      toast.error(err.message || 'Recall failed');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <main className="container max-w-lg py-16 animate-fade-in">
        <div className="apple-card p-10 flex flex-col items-center gap-4 text-center border-destructive/20">
          <CheckCircle className="h-12 w-12 text-success" />
          <h1 className="text-[20px] font-bold text-foreground">Batch Recalled</h1>
          <p className="text-[14px] text-muted-foreground">
            <span className="font-mono font-semibold">{batchId}</span> has been marked as recalled. Consumers scanning this batch will see a recall warning.
          </p>
          <Button variant="outline" onClick={() => { setDone(false); setBatchId(''); setReason(''); }} className="rounded-xl mt-2">
            Recall Another Batch
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="container max-w-lg py-10 animate-fade-in">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10">
          <AlertOctagon className="h-5 w-5 text-destructive" />
        </div>
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-foreground">Recall Batch</h1>
          <p className="text-[13px] text-muted-foreground">Mark a batch as recalled — consumers will be warned</p>
        </div>
      </div>

      <div className="apple-card p-6">
        <form onSubmit={handleRecall} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="batchId" className="text-[13px] font-medium text-foreground">Batch ID *</Label>
            <Input id="batchId" placeholder="e.g. BATCH-2026-001" value={batchId} onChange={(e) => setBatchId(e.target.value)} required className="h-11 rounded-xl text-[14px]" />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="reason" className="text-[13px] font-medium text-foreground">Reason for Recall</Label>
            <Textarea
              id="reason"
              placeholder="Describe why this batch is being recalled..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="rounded-xl text-[14px] min-h-[100px]"
            />
          </div>

          <Button type="submit" variant="destructive" className="w-full h-11 rounded-xl text-[14px] font-medium mt-1" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Recall Batch'}
          </Button>
        </form>
      </div>
    </main>
  );
}
