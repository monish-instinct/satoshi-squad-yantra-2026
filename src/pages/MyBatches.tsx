import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Package, ExternalLink, Boxes, AlertOctagon } from 'lucide-react';
import QRCode from 'qrcode';
import type { Batch } from '@/types';

export default function MyBatches() {
  const { user, activeRole } = useAuth();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [qrUrls, setQrUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchBatches = async () => {
      let query = supabase.from('batches').select('*').order('created_at', { ascending: false });
      if (activeRole !== 'regulator' && user) {
        query = query.eq('registered_by', user.id);
      }
      const { data } = await query;
      if (data) {
        setBatches(data as Batch[]);
        const urls: Record<string, string> = {};
        for (const b of data) {
          urls[b.batch_id] = await QRCode.toDataURL(b.batch_id, {
            width: 80,
            margin: 1,
            color: { dark: '#1a1a1a', light: '#ffffff00' },
          });
        }
        setQrUrls(urls);
      }
    };
    fetchBatches();
  }, [user, activeRole]);

  return (
    <main className="container py-10 animate-fade-in">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 glow-primary">
          <Boxes className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {activeRole === 'regulator' ? 'All Batches' : 'My Batches'}
          </h1>
          <p className="text-[13px] text-muted-foreground">
            {activeRole === 'regulator' ? 'Every registered batch in the system' : 'Your registered drug batches'}
          </p>
        </div>
      </div>

      {batches.length === 0 ? (
        <div className="apple-card flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent mb-4">
            <Package className="h-7 w-7 text-muted-foreground/40" />
          </div>
          <p className="text-[15px] font-medium text-muted-foreground">No batches registered yet</p>
          <p className="text-[13px] text-muted-foreground/60 mt-1">Batches will appear here once registered</p>
        </div>
      ) : (
        <div className="apple-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-3 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider">QR</th>
                  <th className="px-6 py-3 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Batch ID</th>
                  <th className="px-6 py-3 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Manufacturer</th>
                  <th className="px-6 py-3 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Storage</th>
                  <th className="px-6 py-3 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Registered</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((batch) => (
                  <tr key={batch.id} className="border-b border-border/50 last:border-0 hover:bg-accent/50 transition-colors">
                    <td className="px-6 py-3">
                      {qrUrls[batch.batch_id] && (
                        <img src={qrUrls[batch.batch_id]} alt={`QR for ${batch.batch_id}`} className="h-10 w-10 rounded-lg" />
                      )}
                    </td>
                    <td className="px-6 py-3 text-[13px] font-mono font-medium text-foreground">{batch.batch_id}</td>
                    <td className="px-6 py-3 text-[13px] text-foreground">{batch.manufacturer_name}</td>
                    <td className="px-6 py-3">
                      <Badge variant="outline" className={`text-[11px] font-medium rounded-full px-2.5 py-0.5 capitalize ${
                        (batch as any).status === 'recalled' ? 'bg-destructive text-destructive-foreground border-destructive' :
                        (batch as any).status === 'expired' ? 'bg-warning/10 text-warning border-warning/20' :
                        (batch as any).status === 'sold' ? 'bg-primary/10 text-primary border-primary/20' :
                        'bg-success/10 text-success border-success/20'
                      }`}>
                        {(batch as any).status === 'recalled' && <AlertOctagon className="h-3 w-3 mr-1" />}
                        {(batch as any).status || 'active'}
                      </Badge>
                    </td>
                    <td className="px-6 py-3">
                      {batch.blockchain_tx_hash ? (
                        <Badge variant="outline" className="text-[11px] font-medium rounded-full px-2.5 py-0.5 bg-primary/5 text-primary border-primary/20">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          On-chain
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[11px] font-medium rounded-full px-2.5 py-0.5 border-border text-muted-foreground">
                          Off-chain
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-3 text-[13px] text-muted-foreground">
                      {new Date(batch.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
