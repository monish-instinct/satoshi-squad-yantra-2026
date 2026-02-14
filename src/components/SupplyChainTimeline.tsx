import { Package, Truck, Building2, ShoppingBag, CheckCircle } from 'lucide-react';

interface ChainEvent {
  id: string;
  event_type: string;
  from_wallet: string | null;
  to_wallet: string | null;
  location: string | null;
  notes: string | null;
  created_at: string;
}

const eventIcons: Record<string, React.ElementType> = {
  manufactured: Package,
  shipped: Truck,
  received: Building2,
  dispensed: ShoppingBag,
  verified: CheckCircle,
};

export function SupplyChainTimeline({ events }: { events: ChainEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-[14px] text-muted-foreground">No supply chain events recorded</p>
      </div>
    );
  }

  return (
    <div className="relative pl-6">
      <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border" />
      {events.map((event, i) => {
        const Icon = eventIcons[event.event_type] || CheckCircle;
        return (
          <div key={event.id} className="relative flex gap-4 pb-6 last:pb-0">
            <div className="absolute left-[-16px] flex h-6 w-6 items-center justify-center rounded-full bg-card border-2 border-primary/30 z-10">
              <Icon className="h-3 w-3 text-primary" />
            </div>
            <div className="flex-1 ml-4">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-semibold text-foreground capitalize">{event.event_type}</span>
                <span className="text-[11px] text-muted-foreground">
                  {new Date(event.created_at).toLocaleDateString()} {new Date(event.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              {event.location && (
                <p className="text-[13px] text-muted-foreground mt-0.5">📍 {event.location}</p>
              )}
              {event.notes && (
                <p className="text-[12px] text-muted-foreground/80 mt-0.5">{event.notes}</p>
              )}
              {(event.from_wallet || event.to_wallet) && (
                <div className="flex gap-3 mt-1 text-[11px] font-mono text-muted-foreground/60">
                  {event.from_wallet && <span>From: {event.from_wallet}</span>}
                  {event.to_wallet && <span>To: {event.to_wallet}</span>}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
