import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { Package, ScanLine, AlertTriangle, ShieldCheck, Bell, TrendingUp, Download, Globe, Pill } from 'lucide-react';
import { RiskBadge } from '@/components/RiskBadge';
import { downloadCSV } from '@/lib/export';
import type { ScanLog } from '@/types';

const STATUS_COLORS: Record<string, string> = {
  authentic: 'hsl(142, 71%, 45%)',
  suspicious: 'hsl(36, 100%, 50%)',
  not_found: 'hsl(4, 74%, 49%)',
};

const statusBadgeClass: Record<string, string> = {
  authentic: 'bg-success/10 text-success border-success/20',
  suspicious: 'bg-warning/10 text-warning border-warning/20',
  not_found: 'bg-destructive/10 text-destructive border-destructive/20',
};

function StatCard({ label, value, icon: Icon, accent, loading: isLoading }: { label: string; value: string | number; icon: React.ElementType; accent: string; loading?: boolean }) {
  return (
    <div className="apple-card p-5 flex items-center gap-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${accent}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-[12px] text-muted-foreground font-medium tracking-wide uppercase">{label}</p>
        {isLoading ? (
          <Skeleton className="h-7 w-16 mt-1 rounded-lg" />
        ) : (
          <p className="text-[24px] font-bold tracking-tight text-foreground mt-0.5">{value}</p>
        )}
      </div>
    </div>
  );
}

const chartTooltipStyle = {
  borderRadius: '14px',
  border: '0.5px solid hsl(0, 0%, 91%)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
  fontSize: '13px',
  backgroundColor: 'hsl(0, 0%, 100%)',
  color: 'hsl(0, 0%, 11%)',
  padding: '8px 12px',
};

interface Alert {
  id: string;
  batch_id: string;
  severity: string;
  message: string;
  risk_score: number;
  created_at: string;
  resolved: boolean;
}

export default function Dashboard() {
  const [totalBatches, setTotalBatches] = useState(0);
  const [totalScans, setTotalScans] = useState(0);
  const [suspiciousCount, setSuspiciousCount] = useState(0);
  const [alertCount, setAlertCount] = useState(0);
  const [recentScans, setRecentScans] = useState<ScanLog[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<{ name: string; value: number }[]>([]);
  const [dailyScans, setDailyScans] = useState<{ date: string; count: number }[]>([]);
  const [topMedicines, setTopMedicines] = useState<{ name: string; count: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [
        { count: batchCount },
        { data: scans },
        { data: alerts },
        { data: batches },
      ] = await Promise.all([
        supabase.from('batches').select('*', { count: 'exact', head: true }),
        supabase.from('scan_logs').select('*').order('scanned_at', { ascending: false }).limit(200),
        supabase.from('alerts').select('*').eq('resolved', false).order('created_at', { ascending: false }).limit(5),
        supabase.from('batches').select('medicine_name').not('medicine_name', 'is', null).limit(500),
      ]);

      setTotalBatches(batchCount || 0);

      if (scans) {
        const scanData = scans as ScanLog[];
        setTotalScans(scanData.length);
        setSuspiciousCount(scanData.filter((s) => s.verification_status === 'suspicious').length);
        setRecentScans(scanData.slice(0, 20));

        const breakdown: Record<string, number> = { authentic: 0, suspicious: 0, not_found: 0 };
        const daily: Record<string, number> = {};
        scanData.forEach((s) => {
          breakdown[s.verification_status] = (breakdown[s.verification_status] || 0) + 1;
          const day = new Date(s.scanned_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          daily[day] = (daily[day] || 0) + 1;
        });

        setStatusBreakdown(Object.entries(breakdown).map(([name, value]) => ({ name, value })));
        setDailyScans(Object.entries(daily).map(([date, count]) => ({ date, count })).reverse().slice(-14));
      }

      if (alerts) {
        setRecentAlerts(alerts as Alert[]);
        setAlertCount(alerts.length);
      }

      if (batches) {
        const medCounts: Record<string, number> = {};
        batches.forEach((b: any) => {
          if (b.medicine_name) medCounts[b.medicine_name] = (medCounts[b.medicine_name] || 0) + 1;
        });
        setTopMedicines(
          Object.entries(medCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }))
        );
      }

      setIsLoading(false);
    };
    fetchData();
  }, []);

  const authenticRate = totalScans > 0
    ? Math.round(((totalScans - suspiciousCount) / totalScans) * 100)
    : 100;

  const handleExportScans = () => {
    downloadCSV(recentScans.map(s => ({
      batch_id: s.batch_id,
      status: s.verification_status,
      latitude: s.latitude,
      longitude: s.longitude,
      scanned_at: s.scanned_at,
      anomaly_flags: (s.anomaly_flags as string[]).join('; '),
    })), 'scan-report');
  };

  return (
    <main className="container py-10 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[24px] font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-[14px] text-muted-foreground mt-1">Real-time analytics and supply chain overview</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExportScans} className="h-9 rounded-xl text-[12px] font-medium gap-1.5 border-border hover:bg-accent">
          <Download className="h-3.5 w-3.5" /> Export Report
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-5 mb-8">
        <StatCard label="Batches" value={totalBatches} icon={Package} accent="bg-primary/[0.07] text-primary" loading={isLoading} />
        <StatCard label="Scans" value={totalScans} icon={ScanLine} accent="bg-primary/[0.07] text-primary" loading={isLoading} />
        <StatCard label="Suspicious" value={suspiciousCount} icon={AlertTriangle} accent="bg-warning/10 text-warning" loading={isLoading} />
        <StatCard label="Alerts" value={alertCount} icon={Bell} accent="bg-destructive/10 text-destructive" loading={isLoading} />
        <StatCard label="Authentic" value={`${authenticRate}%`} icon={ShieldCheck} accent="bg-success/10 text-success" loading={isLoading} />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2 mb-8">
        <div className="apple-card p-6">
          <h2 className="text-[15px] font-semibold text-foreground mb-5">Scan Trends</h2>
          {isLoading ? (
            <Skeleton className="h-[240px] w-full rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={dailyScans}>
                <defs>
                  <linearGradient id="scanGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(211, 100%, 50%)" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="hsl(211, 100%, 50%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 93%)" />
                <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} stroke="hsl(0, 0%, 60%)" />
                <YAxis fontSize={11} tickLine={false} axisLine={false} stroke="hsl(0, 0%, 60%)" />
                <Tooltip contentStyle={chartTooltipStyle} cursor={{ fill: 'hsla(0, 0%, 96%, 0.5)' }} />
                <Area type="monotone" dataKey="count" stroke="hsl(211, 100%, 50%)" fill="url(#scanGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="apple-card p-6">
          <h2 className="text-[15px] font-semibold text-foreground mb-5">Verification Breakdown</h2>
          {isLoading ? (
            <Skeleton className="h-[240px] w-full rounded-xl" />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={statusBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={48} strokeWidth={2} stroke="hsl(0, 0%, 100%)">
                    {statusBreakdown.map((entry) => (
                      <Cell key={entry.name} fill={STATUS_COLORS[entry.name]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={chartTooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-5 mt-2">
                {statusBreakdown.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ background: STATUS_COLORS[entry.name] }} />
                    <span className="text-[12px] text-muted-foreground capitalize">{entry.name.replace('_', ' ')} ({entry.value})</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Alerts + Top Medicines */}
      <div className="grid gap-4 md:grid-cols-2 mb-8">
        <div className="apple-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-semibold text-foreground">Recent Alerts</h2>
            {alertCount > 0 && (
              <Badge variant="outline" className="text-[10px] rounded-full px-2 py-0 bg-destructive/10 text-destructive border-destructive/20">
                {alertCount} active
              </Badge>
            )}
          </div>
          {recentAlerts.length === 0 ? (
            <div className="text-center py-10">
              <ShieldCheck className="h-8 w-8 text-success/40 mx-auto mb-2" />
              <p className="text-[13px] text-muted-foreground">No active alerts</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {recentAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 transition-colors hover:bg-muted">
                  <AlertTriangle className={`h-4 w-4 shrink-0 ${alert.severity === 'high' || alert.severity === 'critical' ? 'text-destructive' : 'text-warning'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-foreground truncate">{alert.message}</p>
                    <p className="text-[11px] font-mono text-muted-foreground">{alert.batch_id}</p>
                  </div>
                  <RiskBadge score={alert.risk_score} level={alert.severity as any} showScore={false} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="apple-card p-6">
          <h2 className="text-[15px] font-semibold text-foreground mb-4">Top Medicines</h2>
          {topMedicines.length === 0 ? (
            <div className="text-center py-10">
              <Pill className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-[13px] text-muted-foreground">No medicine data yet</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {topMedicines.map((med, i) => (
                <div key={med.name} className="flex items-center gap-3">
                  <span className="text-[12px] font-bold text-muted-foreground w-5 text-right">{i + 1}</span>
                  <Pill className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-[13px] font-medium text-foreground flex-1 truncate">{med.name}</span>
                  <Badge variant="outline" className="text-[10px] rounded-full px-2 py-0 border-border text-muted-foreground">
                    {med.count} batch{med.count > 1 ? 'es' : ''}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Scans Table */}
      <div className="apple-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-foreground">Recent Scan Activity</h2>
          <Badge variant="outline" className="text-[10px] rounded-full px-2 py-0 border-border text-muted-foreground">
            {totalScans} total
          </Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-6 py-3 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Batch ID</th>
                <th className="px-6 py-3 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Time</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="px-6 py-3.5"><Skeleton className="h-4 w-32 rounded-md" /></td>
                    <td className="px-6 py-3.5"><Skeleton className="h-5 w-20 rounded-full" /></td>
                    <td className="px-6 py-3.5"><Skeleton className="h-4 w-24 rounded-md" /></td>
                    <td className="px-6 py-3.5"><Skeleton className="h-4 w-28 rounded-md" /></td>
                  </tr>
                ))
              ) : recentScans.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center text-[14px] text-muted-foreground">No scans recorded yet</td>
                </tr>
              ) : (
                recentScans.map((scan) => (
                  <tr key={scan.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors duration-150">
                    <td className="px-6 py-3.5 text-[13px] font-mono font-medium text-foreground">{scan.batch_id}</td>
                    <td className="px-6 py-3.5">
                      <Badge variant="outline" className={`text-[11px] font-medium capitalize rounded-full px-2.5 py-0.5 ${statusBadgeClass[scan.verification_status]}`}>
                        {scan.verification_status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-6 py-3.5 text-[13px] text-muted-foreground">
                      {scan.latitude && scan.longitude ? `${scan.latitude.toFixed(2)}, ${scan.longitude.toFixed(2)}` : 'Unknown'}
                    </td>
                    <td className="px-6 py-3.5 text-[13px] text-muted-foreground">{new Date(scan.scanned_at).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
