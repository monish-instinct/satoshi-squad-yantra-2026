import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Activity, Package, ArrowRightLeft, ScanLine, Shield } from 'lucide-react';

interface AuditEvent {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  created_at: string;
  details: Record<string, any>;
}

const actionIcons: Record<string, React.ElementType> = {
  batch_registered: Package,
  batch_verified: ScanLine,
  ownership_transfer: ArrowRightLeft,
  alert_created: Shield,
};

const actionColors: Record<string, string> = {
  batch_registered: 'bg-primary/10 text-primary',
  batch_verified: 'bg-success/10 text-success',
  ownership_transfer: 'bg-warning/10 text-warning',
  alert_created: 'bg-destructive/10 text-destructive',
};

export default function BlockchainFeed() {
  const [events, setEvents] = useState<AuditEvent[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {
      const { data } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (data) setEvents(data as AuditEvent[]);
    };
    fetchEvents();

    // Real-time subscription
    const channel = supabase
      .channel('audit-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_logs' }, (payload) => {
        setEvents(prev => [payload.new as AuditEvent, ...prev].slice(0, 50));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <main className="container max-w-2xl py-10 animate-fade-in">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Activity className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Blockchain Event Feed</h1>
          <p className="text-[13px] text-muted-foreground">Live stream of on-chain and system events</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
          <span className="text-[11px] text-success font-medium">Live</span>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="apple-card flex flex-col items-center justify-center py-16 text-center">
          <Activity className="h-8 w-8 text-muted-foreground/30 mb-3" />
          <p className="text-[15px] font-medium text-muted-foreground">No events yet</p>
        </div>
      ) : (
        <div className="relative pl-6">
          <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border" />
          {events.map((event) => {
            const Icon = actionIcons[event.action] || Activity;
            const colorClass = actionColors[event.action] || 'bg-muted text-muted-foreground';
            const timeDiff = Date.now() - new Date(event.created_at).getTime();
            const timeAgo = timeDiff < 60000 ? 'Just now' :
              timeDiff < 3600000 ? `${Math.floor(timeDiff / 60000)}m ago` :
              timeDiff < 86400000 ? `${Math.floor(timeDiff / 3600000)}h ago` :
              new Date(event.created_at).toLocaleDateString();

            return (
              <div key={event.id} className="relative flex gap-4 pb-4 last:pb-0">
                <div className={`absolute left-[-16px] flex h-6 w-6 items-center justify-center rounded-full z-10 ${colorClass}`}>
                  <Icon className="h-3 w-3" />
                </div>
                <div className="flex-1 ml-4 apple-card p-4">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className={`text-[11px] font-medium rounded-full px-2.5 py-0.5 capitalize ${colorClass} border-transparent`}>
                      {event.action.replace(/_/g, ' ')}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">{timeAgo}</span>
                  </div>
                  {event.entity_id && (
                    <p className="text-[13px] font-mono font-medium text-foreground mt-2">{event.entity_id}</p>
                  )}
                  {event.details && Object.keys(event.details).length > 0 && (
                    <p className="text-[12px] text-muted-foreground mt-1 truncate">
                      {Object.entries(event.details).filter(([,v]) => v).map(([k, v]) => `${k}: ${v}`).join(' • ')}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
