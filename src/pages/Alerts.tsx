import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, CheckCircle, AlertTriangle, XCircle, Shield } from 'lucide-react';
import { RiskBadge } from '@/components/RiskBadge';
import { toast } from 'sonner';

interface Alert {
  id: string;
  batch_id: string;
  alert_type: string;
  severity: string;
  message: string;
  risk_score: number;
  resolved: boolean;
  created_at: string;
}

const severityIcon: Record<string, React.ElementType> = {
  low: Shield,
  medium: AlertTriangle,
  high: XCircle,
  critical: XCircle,
};

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState('all');

  const fetchAlerts = async () => {
    let query = supabase.from('alerts').select('*').order('created_at', { ascending: false }).limit(100);
    if (filter === 'unresolved') query = query.eq('resolved', false);
    if (filter === 'resolved') query = query.eq('resolved', true);
    const { data } = await query;
    if (data) setAlerts(data as Alert[]);
  };

  useEffect(() => { fetchAlerts(); }, [filter]);

  const resolveAlert = async (id: string) => {
    await supabase.from('alerts').update({ resolved: true }).eq('id', id);
    toast.success('Alert resolved');
    fetchAlerts();
  };

  const unresolvedCount = alerts.filter(a => !a.resolved).length;

  return (
    <main className="container py-10 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 glow-destructive">
            <Bell className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Alerts</h1>
            <p className="text-[13px] text-muted-foreground">
              {unresolvedCount} unresolved alert{unresolvedCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[140px] h-9 rounded-lg text-[13px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="unresolved">Unresolved</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {alerts.length === 0 ? (
        <div className="apple-card flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent mb-4">
            <Bell className="h-7 w-7 text-muted-foreground/40" />
          </div>
          <p className="text-[15px] font-medium text-muted-foreground">No alerts</p>
          <p className="text-[13px] text-muted-foreground/60 mt-1">Everything looks clean</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {alerts.map((alert) => {
            const Icon = severityIcon[alert.severity] || AlertTriangle;
            return (
              <div key={alert.id} className={`apple-card p-5 flex items-start gap-4 transition-all ${alert.resolved ? 'opacity-60' : ''}`}>
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  alert.severity === 'high' || alert.severity === 'critical'
                    ? 'bg-destructive/10 text-destructive'
                    : alert.severity === 'medium'
                    ? 'bg-warning/10 text-warning'
                    : 'bg-success/10 text-success'
                }`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[14px] font-semibold text-foreground">{alert.message}</span>
                    {alert.resolved && (
                      <Badge variant="outline" className="text-[10px] rounded-full px-2 py-0 bg-success/10 text-success border-success/20">
                        <CheckCircle className="h-3 w-3 mr-0.5" /> Resolved
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className="text-[12px] font-mono text-muted-foreground">{alert.batch_id}</span>
                    <RiskBadge score={alert.risk_score} level={alert.severity as any} />
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(alert.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
                {!alert.resolved && (
                  <Button size="sm" variant="outline" onClick={() => resolveAlert(alert.id)} className="shrink-0 h-8 rounded-lg text-[12px]">
                    Resolve
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
