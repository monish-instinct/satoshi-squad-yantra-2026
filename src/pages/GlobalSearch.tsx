import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Package, Wallet, Pill } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SearchResult {
  type: 'batch' | 'medicine' | 'manufacturer';
  title: string;
  subtitle: string;
  batchId?: string;
}

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);

    const q = query.trim();
    const found: SearchResult[] = [];

    // Search batches
    const { data: batches } = await supabase
      .from('batches')
      .select('batch_id, manufacturer_name, medicine_name')
      .or(`batch_id.ilike.%${q}%,manufacturer_name.ilike.%${q}%,medicine_name.ilike.%${q}%`)
      .limit(20);

    if (batches) {
      for (const b of batches) {
        found.push({
          type: b.medicine_name ? 'medicine' : 'batch',
          title: b.medicine_name || b.batch_id,
          subtitle: `${b.batch_id} • ${b.manufacturer_name}`,
          batchId: b.batch_id,
        });
      }
    }

    setResults(found);
    setLoading(false);
  };

  const typeIcon: Record<string, React.ElementType> = {
    batch: Package,
    medicine: Pill,
    manufacturer: Wallet,
  };

  const typeColor: Record<string, string> = {
    batch: 'bg-primary/10 text-primary',
    medicine: 'bg-success/10 text-success',
    manufacturer: 'bg-warning/10 text-warning',
  };

  return (
    <main className="container max-w-2xl py-10 animate-fade-in">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Search className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Search</h1>
          <p className="text-[13px] text-muted-foreground">Find batches, medicines, or manufacturers</p>
        </div>
      </div>

      <div className="apple-card p-4 mb-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="Search by batch ID, medicine name, or manufacturer..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-12 rounded-xl text-[14px] flex-1"
            autoFocus
          />
          <Button type="submit" disabled={loading} className="h-12 rounded-xl px-6">
            <Search className="h-4 w-4" />
          </Button>
        </form>
      </div>

      {searched && (
        <div className="flex flex-col gap-2">
          {results.length === 0 ? (
            <div className="apple-card flex flex-col items-center justify-center py-12 text-center">
              <Search className="h-8 w-8 text-muted-foreground/30 mb-3" />
              <p className="text-[15px] font-medium text-muted-foreground">No results found</p>
              <p className="text-[13px] text-muted-foreground/60 mt-1">Try a different search term</p>
            </div>
          ) : (
            <>
              <p className="text-[13px] text-muted-foreground mb-2">{results.length} result{results.length !== 1 ? 's' : ''}</p>
              {results.map((r, i) => {
                const Icon = typeIcon[r.type] || Package;
                return (
                  <Link key={i} to={r.batchId ? `/verify?batch=${r.batchId}` : '#'}>
                    <div className="apple-card-interactive p-4 flex items-center gap-4">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${typeColor[r.type]}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-medium text-foreground truncate">{r.title}</p>
                        <p className="text-[12px] text-muted-foreground truncate">{r.subtitle}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] rounded-full px-2 capitalize border-border text-muted-foreground">
                        {r.type}
                      </Badge>
                    </div>
                  </Link>
                );
              })}
            </>
          )}
        </div>
      )}
    </main>
  );
}
