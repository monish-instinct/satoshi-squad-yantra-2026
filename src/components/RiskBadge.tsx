import { Badge } from '@/components/ui/badge';

interface RiskBadgeProps {
  score: number;
  level: 'low' | 'medium' | 'high' | 'critical';
  showScore?: boolean;
}

const levelConfig = {
  low: { label: 'Low Risk', className: 'bg-success/10 text-success border-success/20' },
  medium: { label: 'Medium Risk', className: 'bg-warning/10 text-warning border-warning/20' },
  high: { label: 'High Risk', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  critical: { label: 'Critical', className: 'bg-destructive text-destructive-foreground border-destructive' },
};

export function RiskBadge({ score, level, showScore = true }: RiskBadgeProps) {
  const config = levelConfig[level];
  return (
    <Badge variant="outline" className={`text-[11px] font-semibold rounded-full px-2.5 py-0.5 ${config.className}`}>
      {config.label}{showScore && ` (${score})`}
    </Badge>
  );
}

export function RiskMeter({ score }: { score: number }) {
  const color =
    score >= 70 ? 'bg-destructive' :
    score >= 45 ? 'bg-warning' :
    score >= 20 ? 'bg-warning' : 'bg-success';

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-[13px] font-bold text-foreground tabular-nums w-8 text-right">{score}</span>
    </div>
  );
}
