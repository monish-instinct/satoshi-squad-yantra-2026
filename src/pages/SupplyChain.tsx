import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SupplyChainTimeline } from '@/components/SupplyChainTimeline';
import { Truck, Search, Loader2 } from 'lucide-react';

interface ChainEvent {
  id: string;
  event_type: string;
  from_wallet: string | null;
  to_wallet: string | null;
  location: string | null;
  notes: string | null;
  created_at: string;
}

export default function SupplyChain() {
  const [batchId, setBatchId] = useState('');
  const [events, setEvents] = useState<ChainEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchId.trim()) return;
    setLoading(true);
    setSearched(true);
    const { data } = await supabase
      .from('supply_chain_events')
      .select('*')
      .eq('batch_id', batchId.trim())
      .order('created_at', { ascending: true });
    setEvents((data as ChainEvent[]) || []);
    setLoading(false);
  };

  return (
    <main className="container max-w-2xl py-10 animate-fade-in">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 glow-primary">
          <Truck className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Supply Chain</h1>
          <p className="text-[13px] text-muted-foreground">Track batch journey from manufacturer to pharmacy</p>
        </div>
      </div>

      <div className="apple-card p-6 mb-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="Enter Batch ID to track..."
            value={batchId}
            onChange={(e) => setBatchId(e.target.value)}
            className="h-11 rounded-xl text-[14px] flex-1"
          />
          <Button type="submit" disabled={loading} className="h-11 rounded-xl px-5">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </form>
      </div>

      {searched && (
        <div className="apple-card p-6">
          <h2 className="text-[15px] font-semibold text-foreground mb-6">
            Journey for <span className="font-mono">{batchId}</span>
          </h2>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <SupplyChainTimeline events={events} />
          )}
        </div>
      )}
    </main>
  );
}
