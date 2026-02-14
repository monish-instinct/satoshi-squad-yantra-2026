import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Package, ScanLine, AlertTriangle, ShieldCheck, Bell, TrendingUp,
  ArrowRight, Truck, FileText, Star, Users, Flag, Activity,
  Boxes, Download, Pill, BarChart3, ArrowRightLeft, LayoutDashboard,
  CheckCircle, Clock, Globe, Wallet, Loader2, Shield
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { RiskBadge } from '@/components/RiskBadge';
import { downloadCSV } from '@/lib/export';
import type { AppRole, ScanLog, Batch } from '@/types';

/* ───── Shared Components ───── */

function StatCard({ label, value, icon: Icon, accent, subtitle, loading: isLoading }: {
  label: string; value: string | number; icon: React.ElementType; accent: string; subtitle?: string; loading?: boolean;
}) {
  return (
    <div className="apple-card p-5 flex items-center gap-4 transition-all duration-300 hover:-translate-y-0.5 hover:apple-shadow-lg">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${accent}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground font-medium tracking-wide uppercase">{label}</p>
        {isLoading ? (
          <Skeleton className="h-7 w-16 mt-1 rounded-lg" />
        ) : (
          <>
            <p className="text-[24px] font-bold tracking-tight text-foreground mt-0.5 leading-none">{value}</p>
            {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>}
          </>
        )}
      </div>
    </div>
  );
}

function QuickAction({ icon: Icon, title, description, path, accent = 'bg-primary/[0.06] text-primary' }: {
  icon: React.ElementType; title: string; description: string; path: string; accent?: string;
}) {
  return (
    <Link to={path}>
      <div className="apple-card-interactive p-4 flex items-center gap-3.5 h-full">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accent}`}>
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[14px] font-semibold text-foreground">{title}</h3>
          <p className="text-[12px] text-muted-foreground mt-0.5 leading-snug">{description}</p>
        </div>
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
      </div>
    </Link>
  );
}

function ActivityItem({ icon: Icon, label, detail, time, accent }: {
  icon: React.ElementType; label: string; detail: string; time: string; accent: string;
}) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-border/40 last:border-0">
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${accent}`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-foreground truncate">{label}</p>
        <p className="text-[11px] text-muted-foreground truncate">{detail}</p>
      </div>
      <span className="text-[11px] text-muted-foreground whitespace-nowrap">{time}</span>
    </div>
  );
}

function SectionHeader({ title, action, actionPath }: { title: string; action?: string; actionPath?: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-[15px] font-semibold text-foreground">{title}</h2>
      {action && actionPath && (
        <Link to={actionPath}>
          <Button variant="ghost" size="sm" className="h-7 px-2.5 text-[11px] text-muted-foreground hover:text-foreground rounded-lg gap-1">
            {action} <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
      )}
    </div>
  );
}

function EmptyState({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/50 mb-3">
        <Icon className="h-6 w-6 text-muted-foreground/30" />
      </div>
      <p className="text-[13px] text-muted-foreground">{message}</p>
    </div>
  );
}

const chartTooltipStyle = {
  borderRadius: '12px', border: '0.5px solid hsl(0,0%,91%)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.08)', fontSize: '12px',
  backgroundColor: 'hsl(0,0%,100%)', color: 'hsl(0,0%,11%)', padding: '6px 10px',
};

const STATUS_COLORS: Record<string, string> = {
  authentic: 'hsl(142,71%,45%)', suspicious: 'hsl(36,100%,50%)', not_found: 'hsl(4,74%,49%)',
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return new Date(dateStr).toLocaleDateString();
}

/* ═══════════════════════════════════════════ */
/* ═══ MANUFACTURER DASHBOARD ═══ */
/* ═══════════════════════════════════════════ */

function ManufacturerDashboard() {
  const { user, walletAddress } = useAuth();
  const [stats, setStats] = useState({ batches: 0, onChain: 0, recalled: 0 });
  const [recentBatches, setRecentBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const [{ data: batches }, { count: onChain }, { count: recalled }] = await Promise.all([
        supabase.from('batches').select('*').eq('registered_by', user.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('batches').select('*', { count: 'exact', head: true }).eq('registered_by', user.id).not('blockchain_tx_hash', 'is', null),
        supabase.from('batches').select('*', { count: 'exact', head: true }).eq('registered_by', user.id).eq('status', 'recalled'),
      ]);
      setRecentBatches((batches as Batch[]) || []);
      setStats({ batches: batches?.length || 0, onChain: onChain || 0, recalled: recalled || 0 });
      setLoading(false);
    };
    fetch();
  }, [user]);

  return (
    <>
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard label="My Batches" value={stats.batches} icon={Package} accent="bg-primary/[0.07] text-primary" loading={loading} />
        <StatCard label="On-Chain" value={stats.onChain} icon={Shield} accent="bg-success/10 text-success" loading={loading} />
        <StatCard label="Recalled" value={stats.recalled} icon={AlertTriangle} accent="bg-destructive/10 text-destructive" loading={loading} />
        <StatCard label="Wallet" value={walletAddress ? `${walletAddress.slice(0, 6)}…` : '—'} icon={Wallet} accent="bg-muted text-muted-foreground" />
      </div>

      <div className="grid gap-4 md:grid-cols-5 mb-8">
        <div className="md:col-span-3">
          <div className="apple-card p-6">
            <SectionHeader title="Recent Batches" action="View All" actionPath="/batches" />
            {loading ? <Skeleton className="h-40 rounded-xl" /> : recentBatches.length === 0 ? (
              <EmptyState icon={Package} message="No batches yet. Register your first batch." />
            ) : (
              <div className="flex flex-col">
                {recentBatches.map((b) => (
                  <ActivityItem
                    key={b.id}
                    icon={Package}
                    label={b.medicine_name || b.batch_id}
                    detail={`${b.manufacturer_name} · ${b.batch_id}`}
                    time={timeAgo(b.created_at)}
                    accent={b.status === 'recalled' ? 'bg-destructive/10 text-destructive' : 'bg-primary/[0.06] text-primary'}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="md:col-span-2 flex flex-col gap-4">
          <QuickAction icon={Package} title="Register Batch" description="Register a new drug batch on-chain" path="/register" />
          <QuickAction icon={ArrowRightLeft} title="Transfer Ownership" description="Transfer batch to distributor" path="/transfer" />
          <QuickAction icon={Truck} title="Supply Chain" description="Track batch journey" path="/supply-chain" />
          <QuickAction icon={AlertTriangle} title="Recall Batch" description="Issue a batch recall" path="/recall" accent="bg-destructive/[0.06] text-destructive" />
        </div>
      </div>
    </>
  );
}

/* ═══ DISTRIBUTOR DASHBOARD ═══ */

function DistributorDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ transfers: 0, scans: 0, suspicious: 0 });
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const [{ count: transfers }, { data: scans }, { data: events }] = await Promise.all([
        supabase.from('supply_chain_events').select('*', { count: 'exact', head: true }).eq('actor_id', user.id).eq('event_type', 'ownership_transfer'),
        supabase.from('scan_logs').select('*', { count: 'exact', head: true }).eq('scanner_user_id', user.id),
        supabase.from('supply_chain_events').select('*').eq('actor_id', user.id).order('created_at', { ascending: false }).limit(5),
      ]);
      const { count: susCount } = await supabase.from('scan_logs').select('*', { count: 'exact', head: true }).eq('scanner_user_id', user.id).eq('verification_status', 'suspicious');
      setStats({ transfers: transfers || 0, scans: scans?.length || 0, suspicious: susCount || 0 });
      setRecentEvents(events || []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  return (
    <>
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-3 mb-8">
        <StatCard label="Transfers" value={stats.transfers} icon={ArrowRightLeft} accent="bg-primary/[0.07] text-primary" loading={loading} />
        <StatCard label="Verifications" value={stats.scans} icon={ScanLine} accent="bg-success/10 text-success" loading={loading} />
        <StatCard label="Suspicious" value={stats.suspicious} icon={AlertTriangle} accent="bg-warning/10 text-warning" loading={loading} />
      </div>
      <div className="grid gap-4 md:grid-cols-5 mb-8">
        <div className="md:col-span-3 apple-card p-6">
          <SectionHeader title="Recent Activity" action="Supply Chain" actionPath="/supply-chain" />
          {recentEvents.length === 0 ? <EmptyState icon={Truck} message="No transfers yet" /> : (
            <div className="flex flex-col">
              {recentEvents.map((e: any) => (
                <ActivityItem key={e.id} icon={ArrowRightLeft} label={e.batch_id} detail={e.notes || e.event_type} time={timeAgo(e.created_at)} accent="bg-primary/[0.06] text-primary" />
              ))}
            </div>
          )}
        </div>
        <div className="md:col-span-2 flex flex-col gap-4">
          <QuickAction icon={ScanLine} title="Verify Batch" description="Scan incoming shipment" path="/verify" />
          <QuickAction icon={ArrowRightLeft} title="Transfer" description="Transfer to next party" path="/transfer" />
          <QuickAction icon={Truck} title="Supply Chain" description="Track batch journey" path="/supply-chain" />
          <QuickAction icon={BarChart3} title="Scan Logs" description="Review past scans" path="/logs" />
        </div>
      </div>
    </>
  );
}

/* ═══ PHARMACY DASHBOARD ═══ */

function PharmacyDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ scans: 0, authentic: 0, suspicious: 0 });
  const [recentScans, setRecentScans] = useState<ScanLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: scans } = await supabase.from('scan_logs').select('*').eq('scanner_user_id', user.id).order('scanned_at', { ascending: false }).limit(10);
      const scanData = (scans as ScanLog[]) || [];
      setRecentScans(scanData.slice(0, 5));
      setStats({
        scans: scanData.length,
        authentic: scanData.filter(s => s.verification_status === 'authentic').length,
        suspicious: scanData.filter(s => s.verification_status === 'suspicious').length,
      });
      setLoading(false);
    };
    fetch();
  }, [user]);

  return (
    <>
      <div className="grid gap-3 grid-cols-3 mb-8">
        <StatCard label="Total Scans" value={stats.scans} icon={ScanLine} accent="bg-primary/[0.07] text-primary" loading={loading} />
        <StatCard label="Authentic" value={stats.authentic} icon={CheckCircle} accent="bg-success/10 text-success" loading={loading} />
        <StatCard label="Suspicious" value={stats.suspicious} icon={AlertTriangle} accent="bg-warning/10 text-warning" loading={loading} />
      </div>
      <div className="grid gap-4 md:grid-cols-5 mb-8">
        <div className="md:col-span-3 apple-card p-6">
          <SectionHeader title="Recent Verifications" action="View All" actionPath="/logs" />
          {recentScans.length === 0 ? <EmptyState icon={ScanLine} message="No scans yet" /> : (
            <div className="flex flex-col">
              {recentScans.map((s) => (
                <ActivityItem
                  key={s.id} icon={s.verification_status === 'authentic' ? CheckCircle : AlertTriangle}
                  label={s.batch_id} detail={s.verification_status.replace('_', ' ')} time={timeAgo(s.scanned_at)}
                  accent={s.verification_status === 'authentic' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}
                />
              ))}
            </div>
          )}
        </div>
        <div className="md:col-span-2 flex flex-col gap-4">
          <QuickAction icon={ScanLine} title="Verify Batch" description="Scan QR to verify" path="/verify" />
          <QuickAction icon={BarChart3} title="Scan History" description="Past verification records" path="/logs" />
          <QuickAction icon={Truck} title="Supply Chain" description="Batch journey tracker" path="/supply-chain" />
        </div>
      </div>
    </>
  );
}

/* ═══ CONSUMER DASHBOARD ═══ */

function ConsumerDashboard() {
  return (
    <>
      <div className="apple-card p-8 mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/[0.07]">
          <Shield className="h-7 w-7 text-primary" />
        </div>
        <h2 className="text-[20px] font-bold text-foreground mb-2">Verify Your Medicine</h2>
        <p className="text-[14px] text-muted-foreground max-w-sm mx-auto mb-6">
          Scan the QR code on your medicine packaging to instantly verify its authenticity and view its full supply chain history.
        </p>
        <Link to="/consumer">
          <Button size="lg" className="rounded-full px-8 h-12 text-[14px] font-semibold glow-primary gap-2">
            <ScanLine className="h-4 w-4" /> Open Scanner
          </Button>
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <QuickAction icon={ScanLine} title="Verify Medicine" description="Scan QR code to check authenticity" path="/consumer" />
        <QuickAction icon={Flag} title="Report Issue" description="Report suspicious medicine" path="/report" accent="bg-warning/[0.06] text-warning" />
      </div>
    </>
  );
}

/* ═══ REGULATOR DASHBOARD ═══ */

function RegulatorDashboard() {
  const [totalBatches, setTotalBatches] = useState(0);
  const [totalScans, setTotalScans] = useState(0);
  const [suspiciousCount, setSuspiciousCount] = useState(0);
  const [alertCount, setAlertCount] = useState(0);
  const [recentScans, setRecentScans] = useState<ScanLog[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<{ name: string; value: number }[]>([]);
  const [dailyScans, setDailyScans] = useState<{ date: string; count: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [{ count: batchCount }, { data: scans }, { data: alerts }] = await Promise.all([
        supabase.from('batches').select('*', { count: 'exact', head: true }),
        supabase.from('scan_logs').select('*').order('scanned_at', { ascending: false }).limit(200),
        supabase.from('alerts').select('*', { count: 'exact', head: true }).eq('resolved', false),
      ]);
      setTotalBatches(batchCount || 0);
      setAlertCount(alerts?.length || 0);
      if (scans) {
        const scanData = scans as ScanLog[];
        setTotalScans(scanData.length);
        setSuspiciousCount(scanData.filter(s => s.verification_status === 'suspicious').length);
        setRecentScans(scanData.slice(0, 8));
        const breakdown: Record<string, number> = { authentic: 0, suspicious: 0, not_found: 0 };
        const daily: Record<string, number> = {};
        scanData.forEach(s => {
          breakdown[s.verification_status] = (breakdown[s.verification_status] || 0) + 1;
          const day = new Date(s.scanned_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          daily[day] = (daily[day] || 0) + 1;
        });
        setStatusBreakdown(Object.entries(breakdown).map(([name, value]) => ({ name, value })));
        setDailyScans(Object.entries(daily).map(([date, count]) => ({ date, count })).reverse().slice(-14));
      }
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const authenticRate = totalScans > 0 ? Math.round(((totalScans - suspiciousCount) / totalScans) * 100) : 100;

  return (
    <>
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-5 mb-8">
        <StatCard label="Batches" value={totalBatches} icon={Package} accent="bg-primary/[0.07] text-primary" loading={isLoading} />
        <StatCard label="Scans" value={totalScans} icon={ScanLine} accent="bg-primary/[0.07] text-primary" loading={isLoading} />
        <StatCard label="Suspicious" value={suspiciousCount} icon={AlertTriangle} accent="bg-warning/10 text-warning" loading={isLoading} />
        <StatCard label="Alerts" value={alertCount} icon={Bell} accent="bg-destructive/10 text-destructive" loading={isLoading} />
        <StatCard label="Authentic" value={`${authenticRate}%`} icon={ShieldCheck} accent="bg-success/10 text-success" loading={isLoading} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 mb-8">
        <div className="apple-card p-6">
          <SectionHeader title="Scan Trends" />
          {isLoading ? <Skeleton className="h-[200px] rounded-xl" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={dailyScans}>
                <defs>
                  <linearGradient id="scanGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(211,100%,50%)" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="hsl(211,100%,50%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,93%)" />
                <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} stroke="hsl(0,0%,60%)" />
                <YAxis fontSize={10} tickLine={false} axisLine={false} stroke="hsl(0,0%,60%)" />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Area type="monotone" dataKey="count" stroke="hsl(211,100%,50%)" fill="url(#scanGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="apple-card p-6">
          <SectionHeader title="Verification Breakdown" />
          {isLoading ? <Skeleton className="h-[200px] rounded-xl" /> : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={statusBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} innerRadius={38} strokeWidth={2} stroke="hsl(0,0%,100%)">
                    {statusBreakdown.map(e => <Cell key={e.name} fill={STATUS_COLORS[e.name]} />)}
                  </Pie>
                  <Tooltip contentStyle={chartTooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-1">
                {statusBreakdown.map(e => (
                  <div key={e.name} className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full" style={{ background: STATUS_COLORS[e.name] }} />
                    <span className="text-[11px] text-muted-foreground capitalize">{e.name.replace('_', ' ')} ({e.value})</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-5 mb-8">
        <div className="md:col-span-3 apple-card p-6">
          <SectionHeader title="Recent Scans" action="View All" actionPath="/logs" />
          {recentScans.length === 0 ? <EmptyState icon={ScanLine} message="No scans recorded" /> : (
            <div className="flex flex-col">
              {recentScans.map(s => (
                <ActivityItem key={s.id} icon={s.verification_status === 'authentic' ? CheckCircle : AlertTriangle}
                  label={s.batch_id} detail={s.verification_status.replace('_', ' ')} time={timeAgo(s.scanned_at)}
                  accent={s.verification_status === 'authentic' ? 'bg-success/10 text-success' : s.verification_status === 'suspicious' ? 'bg-warning/10 text-warning' : 'bg-destructive/10 text-destructive'}
                />
              ))}
            </div>
          )}
        </div>
        <div className="md:col-span-2 flex flex-col gap-4">
          <QuickAction icon={Package} title="All Batches" description="Browse registered batches" path="/batches" />
          <QuickAction icon={Bell} title="Alerts" description={`${alertCount} active alerts`} path="/alerts" accent="bg-destructive/[0.06] text-destructive" />
          <QuickAction icon={Star} title="Trust Scores" description="Manufacturer reputation" path="/trust" />
          <QuickAction icon={AlertTriangle} title="Recall Batch" description="Issue a recall" path="/recall" accent="bg-destructive/[0.06] text-destructive" />
          <QuickAction icon={Activity} title="Event Feed" description="Live blockchain events" path="/feed" />
        </div>
      </div>
    </>
  );
}

/* ═══ AUDITOR DASHBOARD ═══ */

function AuditorDashboard() {
  const [logCount, setLogCount] = useState(0);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [{ count }, { data: logs }] = await Promise.all([
        supabase.from('audit_logs').select('*', { count: 'exact', head: true }),
        supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(6),
      ]);
      setLogCount(count || 0);
      setRecentLogs(logs || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const actionAccent: Record<string, string> = {
    batch_registered: 'bg-primary/[0.06] text-primary',
    batch_verified: 'bg-success/10 text-success',
    ownership_transfer: 'bg-warning/10 text-warning',
    batch_recalled: 'bg-destructive/10 text-destructive',
  };

  return (
    <>
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-3 mb-8">
        <StatCard label="Audit Entries" value={logCount} icon={FileText} accent="bg-primary/[0.07] text-primary" loading={loading} />
        <StatCard label="Last Updated" value={recentLogs[0] ? timeAgo(recentLogs[0].created_at) : '—'} icon={Clock} accent="bg-muted text-muted-foreground" loading={loading} />
        <StatCard label="Compliance" value="Active" icon={ShieldCheck} accent="bg-success/10 text-success" loading={loading} />
      </div>
      <div className="grid gap-4 md:grid-cols-5 mb-8">
        <div className="md:col-span-3 apple-card p-6">
          <SectionHeader title="Recent Audit Entries" action="Full Log" actionPath="/audit" />
          {recentLogs.length === 0 ? <EmptyState icon={FileText} message="No audit logs yet" /> : (
            <div className="flex flex-col">
              {recentLogs.map((l: any) => (
                <ActivityItem key={l.id} icon={FileText} label={l.action.replace(/_/g, ' ')} detail={l.entity_id || l.entity_type} time={timeAgo(l.created_at)}
                  accent={actionAccent[l.action] || 'bg-muted text-muted-foreground'} />
              ))}
            </div>
          )}
        </div>
        <div className="md:col-span-2 flex flex-col gap-4">
          <QuickAction icon={FileText} title="Audit Logs" description="Full compliance records" path="/audit" />
          <QuickAction icon={Star} title="Trust Scores" description="Manufacturer reputation" path="/trust" />
          <QuickAction icon={Truck} title="Supply Chain" description="Ownership history" path="/supply-chain" />
          <QuickAction icon={Activity} title="Event Feed" description="Live event stream" path="/feed" />
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════ */
/* ═══ ROLE DASHBOARD HUB ═══ */
/* ═══════════════════════════════════════════ */

export default function RoleDashboard() {
  const { activeRole, demoMode, walletAddress } = useAuth();

  const roleLabels: Record<AppRole, { title: string; subtitle: string }> = {
    manufacturer: { title: 'Manufacturer Hub', subtitle: 'Register, manage, and track your medicine batches' },
    distributor: { title: 'Distributor Hub', subtitle: 'Verify shipments and transfer ownership' },
    pharmacy: { title: 'Pharmacy Hub', subtitle: 'Verify medicine authenticity at point of sale' },
    consumer: { title: 'Consumer Hub', subtitle: 'Verify and report medicine safety' },
    regulator: { title: 'Regulator Dashboard', subtitle: 'Monitor the pharmaceutical network' },
    auditor: { title: 'Auditor Dashboard', subtitle: 'Compliance monitoring and audit trails' },
  };

  const info = activeRole ? roleLabels[activeRole] : { title: 'Dashboard', subtitle: '' };

  return (
    <main className="container py-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/[0.07]">
            <LayoutDashboard className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-[22px] font-bold tracking-tight text-foreground">
              {info.title}
              {demoMode && <span className="text-[13px] font-normal text-warning ml-2">(Demo)</span>}
            </h1>
            <p className="text-[13px] text-muted-foreground">{info.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Role-specific dashboard */}
      {activeRole === 'manufacturer' && <ManufacturerDashboard />}
      {activeRole === 'distributor' && <DistributorDashboard />}
      {activeRole === 'pharmacy' && <PharmacyDashboard />}
      {activeRole === 'consumer' && <ConsumerDashboard />}
      {activeRole === 'regulator' && <RegulatorDashboard />}
      {activeRole === 'auditor' && <AuditorDashboard />}
    </main>
  );
}
