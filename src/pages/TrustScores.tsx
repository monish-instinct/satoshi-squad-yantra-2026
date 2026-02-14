import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Star, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { TrustScore } from '@/types';

export default function TrustScores() {
  const [scores, setScores] = useState<TrustScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScores = async () => {
      // Compute trust scores from batches and scan data
      const { data: batches } = await supabase.from('batches').select('manufacturer_name, registered_by, batch_id').limit(500);
      if (!batches || batches.length === 0) {
        setLoading(false);
        return;
      }

      const manufacturers: Record<string, { name: string; id: string; batches: string[] }> = {};
      for (const b of batches) {
        const key = b.manufacturer_name;
        if (!manufacturers[key]) {
          manufacturers[key] = { name: b.manufacturer_name, id: b.registered_by || '', batches: [] };
        }
        manufacturers[key].batches.push(b.batch_id);
      }

      const computed: TrustScore[] = [];
      for (const [, mfr] of Object.entries(manufacturers)) {
        // Count suspicious scans for this manufacturer's batches
        let suspiciousCount = 0;
        let verifiedCount = 0;
        for (const bId of mfr.batches) {
          const { count: susCount } = await supabase.from('scan_logs').select('*', { count: 'exact', head: true })
            .eq('batch_id', bId).eq('verification_status', 'suspicious');
          const { count: verCount } = await supabase.from('scan_logs').select('*', { count: 'exact', head: true })
            .eq('batch_id', bId).eq('verification_status', 'authentic');
          suspiciousCount += susCount || 0;
          verifiedCount += verCount || 0;
        }

        const { count: complaintCount } = await supabase.from('consumer_reports').select('*', { count: 'exact', head: true })
          .in('batch_id', mfr.batches);

        const totalScans = suspiciousCount + verifiedCount;
        const suspiciousRate = totalScans > 0 ? suspiciousCount / totalScans : 0;
        const complaintRate = mfr.batches.length > 0 ? (complaintCount || 0) / mfr.batches.length : 0;

        // Score: start at 100, deduct for suspicious rate and complaints
        let score = 100;
        score -= Math.round(suspiciousRate * 50);
        score -= Math.round(complaintRate * 30);
        score = Math.max(0, Math.min(100, score));

        computed.push({
          id: mfr.id,
          manufacturer_id: mfr.id,
          manufacturer_name: mfr.name,
          score,
          total_batches: mfr.batches.length,
          suspicious_count: suspiciousCount,
          verified_count: verifiedCount,
          complaint_count: complaintCount || 0,
          updated_at: new Date().toISOString(),
        });
      }

      computed.sort((a, b) => b.score - a.score);
      setScores(computed);
      setLoading(false);
    };
    fetchScores();
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-success/10 border-success/20';
    if (score >= 60) return 'bg-warning/10 border-warning/20';
    return 'bg-destructive/10 border-destructive/20';
  };

  const getTrend = (score: number) => {
    if (score >= 80) return { icon: TrendingUp, label: 'Trusted' };
    if (score >= 60) return { icon: Minus, label: 'Watchlist' };
    return { icon: TrendingDown, label: 'At Risk' };
  };

  return (
    <main className="container py-10 animate-fade-in">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10">
          <Star className="h-5 w-5 text-warning" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Trust Scores</h1>
          <p className="text-[13px] text-muted-foreground">Manufacturer reputation based on verification data</p>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="apple-card p-6 h-40 animate-pulse bg-muted/50" />
          ))}
        </div>
      ) : scores.length === 0 ? (
        <div className="apple-card flex flex-col items-center justify-center py-16 text-center">
          <Star className="h-8 w-8 text-muted-foreground/30 mb-3" />
          <p className="text-[15px] font-medium text-muted-foreground">No manufacturers found</p>
          <p className="text-[13px] text-muted-foreground/60 mt-1">Register batches to see trust scores</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {scores.map((s) => {
            const trend = getTrend(s.score);
            const TrendIcon = trend.icon;
            return (
              <div key={s.manufacturer_name} className="apple-card p-6 flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-[15px] font-semibold text-foreground">{s.manufacturer_name}</h3>
                    <p className="text-[12px] text-muted-foreground mt-0.5">{s.total_batches} batch{s.total_batches !== 1 ? 'es' : ''}</p>
                  </div>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${getScoreBg(s.score)}`}>
                    <span className={`text-[20px] font-bold ${getScoreColor(s.score)}`}>{s.score}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`text-[11px] rounded-full px-2.5 py-0.5 gap-1 ${getScoreBg(s.score)} ${getScoreColor(s.score)}`}>
                    <TrendIcon className="h-3 w-3" />
                    {trend.label}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-xl bg-muted/50">
                    <p className="text-[16px] font-bold text-foreground">{s.verified_count}</p>
                    <p className="text-[10px] text-muted-foreground">Verified</p>
                  </div>
                  <div className="p-2 rounded-xl bg-muted/50">
                    <p className="text-[16px] font-bold text-warning">{s.suspicious_count}</p>
                    <p className="text-[10px] text-muted-foreground">Suspicious</p>
                  </div>
                  <div className="p-2 rounded-xl bg-muted/50">
                    <p className="text-[16px] font-bold text-destructive">{s.complaint_count}</p>
                    <p className="text-[10px] text-muted-foreground">Reports</p>
                  </div>
                </div>

                {/* Score bar */}
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      s.score >= 80 ? 'bg-success' : s.score >= 60 ? 'bg-warning' : 'bg-destructive'
                    }`}
                    style={{ width: `${s.score}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
