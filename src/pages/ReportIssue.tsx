import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Flag, Loader2, CheckCircle } from 'lucide-react';

export default function ReportIssue() {
  const { user } = useAuth();
  const [batchId, setBatchId] = useState('');
  const [reportType, setReportType] = useState('suspicious');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchId.trim()) return;
    setLoading(true);

    try {
      const { error } = await supabase.from('consumer_reports').insert({
        batch_id: batchId.trim(),
        reporter_id: user?.id || null,
        report_type: reportType,
        description: description || null,
      });
      if (error) throw error;

      // Auto-create alert for regulators
      await supabase.from('alerts').insert({
        batch_id: batchId.trim(),
        alert_type: 'consumer_report',
        severity: reportType === 'counterfeit' ? 'high' : 'medium',
        message: `Consumer report: ${reportType} — ${description || 'No details'}`,
        risk_score: reportType === 'counterfeit' ? 70 : 40,
      });

      setSubmitted(true);
      toast.success('Report submitted. Thank you for helping keep medicines safe.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <main className="container max-w-lg py-16 animate-fade-in">
        <div className="apple-card p-10 flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-success/10">
            <CheckCircle className="h-8 w-8 text-success" />
          </div>
          <h1 className="text-[20px] font-bold text-foreground">Report Submitted</h1>
          <p className="text-[14px] text-muted-foreground max-w-sm">
            Thank you for your report. Our team will investigate and take necessary action.
          </p>
          <Button variant="outline" onClick={() => { setSubmitted(false); setBatchId(''); setDescription(''); }} className="rounded-xl mt-2">
            Submit Another Report
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="container max-w-lg py-10 animate-fade-in">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10">
          <Flag className="h-5 w-5 text-warning" />
        </div>
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-foreground">Report Suspicious Medicine</h1>
          <p className="text-[13px] text-muted-foreground">Help us identify counterfeit or suspicious products</p>
        </div>
      </div>

      <div className="apple-card p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="batchId" className="text-[13px] font-medium text-foreground">Batch ID *</Label>
            <Input id="batchId" placeholder="e.g. BATCH-2026-001" value={batchId} onChange={(e) => setBatchId(e.target.value)} required className="h-11 rounded-xl text-[14px]" />
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-[13px] font-medium text-foreground">Report Type</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="h-11 rounded-xl text-[14px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="suspicious">Suspicious Packaging</SelectItem>
                <SelectItem value="counterfeit">Suspected Counterfeit</SelectItem>
                <SelectItem value="expired">Expired Medicine Sold</SelectItem>
                <SelectItem value="side_effects">Unexpected Side Effects</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="desc" className="text-[13px] font-medium text-foreground">Details (Optional)</Label>
            <Textarea
              id="desc"
              placeholder="Describe the issue..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-xl text-[14px] min-h-[100px]"
            />
          </div>

          <Button type="submit" className="w-full h-11 rounded-xl text-[14px] font-medium mt-1" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit Report'}
          </Button>
        </form>
      </div>
    </main>
  );
}
