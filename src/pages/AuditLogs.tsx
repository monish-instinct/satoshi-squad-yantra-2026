import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download } from 'lucide-react';
import { downloadCSV } from '@/lib/export';

interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  actor_wallet: string | null;
  details: Record<string, any>;
  created_at: string;
}

const actionColors: Record<string, string> = {
  batch_registered: 'bg-primary/10 text-primary border-primary/20',
  batch_verified: 'bg-success/10 text-success border-success/20',
  alert_created: 'bg-destructive/10 text-destructive border-destructive/20',
  ownership_transfer: 'bg-warning/10 text-warning border-warning/20',
};

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    const fetchLogs = async () => {
      let query = supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(200);
      if (filterType !== 'all') query = query.eq('entity_type', filterType);
      const { data } = await query;
      if (data) setLogs(data as AuditLog[]);
    };
    fetchLogs();
  }, [filterType]);

  const handleExport = () => {
    downloadCSV(logs.map(l => ({
      action: l.action,
      entity_type: l.entity_type,
      entity_id: l.entity_id,
      timestamp: l.created_at,
      details: JSON.stringify(l.details),
    })), 'audit-logs');
  };

  return (
    <main className="container py-10 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 glow-primary">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Audit & Compliance</h1>
            <p className="text-[13px] text-muted-foreground">Immutable activity history for compliance</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[130px] h-9 rounded-lg text-[13px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="batch">Batches</SelectItem>
              <SelectItem value="scan">Scans</SelectItem>
              <SelectItem value="alert">Alerts</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleExport} className="h-9 rounded-lg text-[12px] gap-1.5">
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="apple-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-6 py-3 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Action</th>
                <th className="px-6 py-3 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Entity</th>
                <th className="px-6 py-3 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Details</th>
                <th className="px-6 py-3 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent">
                        <FileText className="h-6 w-6 text-muted-foreground/40" />
                      </div>
                      <p className="text-[14px] text-muted-foreground font-medium">No audit logs found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b border-border/50 last:border-0 hover:bg-accent/50 transition-colors">
                    <td className="px-6 py-3.5">
                      <Badge variant="outline" className={`text-[11px] font-medium rounded-full px-2.5 py-0.5 capitalize ${actionColors[log.action] || 'border-border text-muted-foreground'}`}>
                        {log.action.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex flex-col">
                        <span className="text-[12px] text-muted-foreground capitalize">{log.entity_type}</span>
                        {log.entity_id && <span className="text-[13px] font-mono font-medium text-foreground">{log.entity_id}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-[12px] text-muted-foreground max-w-[250px] truncate">
                      {Object.entries(log.details || {}).map(([k, v]) => `${k}: ${v}`).join(', ') || '—'}
                    </td>
                    <td className="px-6 py-3.5 text-[13px] text-muted-foreground whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
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
