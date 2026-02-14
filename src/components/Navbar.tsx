import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, LogOut, FlaskConical, Settings, Menu, X, Wallet, Bell, Wifi, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { shortenAddress } from '@/lib/wallet';
import { isOnSepolia, switchToSepolia, isBlockchainConfigured } from '@/lib/blockchain';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { AppRole } from '@/types';

const roleNavItems: Record<AppRole, { label: string; path: string }[]> = {
  manufacturer: [
    { label: 'Home', path: '/home' },
    { label: 'Register', path: '/register' },
    { label: 'Batches', path: '/batches' },
    { label: 'Transfer', path: '/transfer' },
    { label: 'Supply Chain', path: '/supply-chain' },
    { label: 'Recall', path: '/recall' },
  ],
  distributor: [
    { label: 'Home', path: '/home' },
    { label: 'Verify', path: '/verify' },
    { label: 'Transfer', path: '/transfer' },
    { label: 'Supply Chain', path: '/supply-chain' },
    { label: 'Scan Logs', path: '/logs' },
  ],
  pharmacy: [
    { label: 'Home', path: '/home' },
    { label: 'Verify', path: '/verify' },
    { label: 'Scan Logs', path: '/logs' },
    { label: 'Supply Chain', path: '/supply-chain' },
  ],
  consumer: [
    { label: 'Home', path: '/home' },
    { label: 'Verify', path: '/consumer' },
    { label: 'Report', path: '/report' },
  ],
  regulator: [
    { label: 'Home', path: '/home' },
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Batches', path: '/batches' },
    { label: 'Scan Logs', path: '/logs' },
    { label: 'Alerts', path: '/alerts' },
    { label: 'Audit', path: '/audit' },
    { label: 'Trust', path: '/trust' },
    { label: 'Recall', path: '/recall' },
    { label: 'Feed', path: '/feed' },
  ],
  auditor: [
    { label: 'Home', path: '/home' },
    { label: 'Audit', path: '/audit' },
    { label: 'Scan Logs', path: '/logs' },
    { label: 'Supply Chain', path: '/supply-chain' },
    { label: 'Trust', path: '/trust' },
    { label: 'Feed', path: '/feed' },
  ],
};

const roleLabels: Record<AppRole, string> = {
  manufacturer: 'Manufacturer',
  distributor: 'Distributor',
  pharmacy: 'Pharmacy',
  consumer: 'Consumer',
  regulator: 'Regulator',
  auditor: 'Auditor',
};

export function Navbar() {
  const { activeRole, demoMode, demoRole, setDemoMode, setDemoRole, user, walletAddress, signOut } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const [onSepolia, setOnSepolia] = useState<boolean | null>(null);
  const isLanding = location.pathname === '/' && !activeRole;
  const isConsumerPage = location.pathname === '/consumer' || location.pathname === '/report';

  const navItems = activeRole ? roleNavItems[activeRole] : [];

  useEffect(() => {
    if (!user) return;
    supabase.from('alerts').select('*', { count: 'exact', head: true }).eq('resolved', false)
      .then(({ count }) => setAlertCount(count || 0));
  }, [user, location.pathname]);

  useEffect(() => {
    if (!walletAddress || !isBlockchainConfigured()) return;
    isOnSepolia().then(setOnSepolia);
    const handleChainChanged = () => { isOnSepolia().then(setOnSepolia); };
    (window as any).ethereum?.on?.('chainChanged', handleChainChanged);
    return () => { (window as any).ethereum?.removeListener?.('chainChanged', handleChainChanged); };
  }, [walletAddress]);

  const handleSwitchNetwork = async () => {
    const ok = await switchToSepolia();
    if (ok) { toast.success('Switched to Ethereum Sepolia'); setOnSepolia(true); }
    else { toast.error('Failed to switch network'); }
  };

  if (isConsumerPage && !activeRole) return null;

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* macOS-style floating bar */}
      <div className={`mx-auto transition-all duration-300 ${
        isLanding
          ? 'bg-background/60 backdrop-blur-2xl border-b border-transparent'
          : 'bg-card/70 backdrop-blur-2xl border-b border-border/40 shadow-[0_1px_3px_rgba(0,0,0,0.04)]'
      }`}>
        <div className="container flex h-12 items-center gap-3">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0 group">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary transition-transform duration-200 group-hover:scale-105">
              <Shield className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-[14px] tracking-tight text-foreground hidden sm:inline">
              PharmaShield
            </span>
          </Link>

          {/* Divider */}
          {!isLanding && navItems.length > 0 && (
            <div className="hidden md:block h-4 w-px bg-border/60 mx-1" />
          )}

          {/* Landing nav */}
          {isLanding && (
            <nav className="hidden md:flex items-center gap-0.5 ml-4">
              {[
                { label: 'About', href: '#technology' },
                { label: 'Technology', href: '#technology' },
                { label: 'Consumer', to: '/consumer' },
                { label: 'Dashboard', to: '/login' },
              ].map((item) =>
                'to' in item ? (
                  <Link key={item.label} to={item.to!}>
                    <button className="px-3 py-1.5 rounded-lg text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-accent/70 transition-all duration-150">
                      {item.label}
                    </button>
                  </Link>
                ) : (
                  <a key={item.label} href={item.href}>
                    <button className="px-3 py-1.5 rounded-lg text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-accent/70 transition-all duration-150">
                      {item.label}
                    </button>
                  </a>
                )
              )}
            </nav>
          )}

          {/* App nav - pill style */}
          {!isLanding && navItems.length > 0 && (
            <nav className="hidden md:flex items-center gap-0.5 rounded-lg bg-muted/50 p-0.5">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link key={item.path} to={item.path}>
                    <button className={`px-3 py-1 rounded-md text-[12px] font-medium transition-all duration-150 relative ${
                      isActive
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}>
                      {item.label}
                      {item.label === 'Alerts' && alertCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground px-1">
                          {alertCount > 9 ? '9+' : alertCount}
                        </span>
                      )}
                    </button>
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Right section */}
          <div className="ml-auto flex items-center gap-1.5">
            {user && (
              <Link to="/search" className="hidden md:inline-flex">
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground">
                  <Search className="h-3.5 w-3.5" />
                </Button>
              </Link>
            )}

            {walletAddress && onSepolia !== null && isBlockchainConfigured() && (
              onSepolia ? (
                <Badge variant="secondary" className="hidden md:inline-flex text-[10px] font-medium px-2 py-0.5 rounded-full bg-success/8 text-success border-success/15 gap-1">
                  <Wifi className="h-2.5 w-2.5" /> Sepolia
                </Badge>
              ) : (
                <Button variant="outline" size="sm" onClick={handleSwitchNetwork}
                  className="hidden md:inline-flex h-6 px-2 text-[10px] rounded-full border-warning/30 text-warning hover:bg-warning/10">
                  <Wifi className="h-2.5 w-2.5 mr-1" /> Switch Network
                </Button>
              )
            )}

            {demoMode && (
              <div className="hidden md:flex items-center gap-1.5 rounded-full border border-warning/20 bg-warning/5 px-2.5 py-0.5">
                <FlaskConical className="h-3 w-3 text-warning" />
                <Select value={demoRole} onValueChange={(v) => setDemoRole(v as AppRole)}>
                  <SelectTrigger className="h-5 w-[100px] text-[10px] border-0 bg-transparent p-0 shadow-none focus:ring-0 text-warning">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manufacturer">Manufacturer</SelectItem>
                    <SelectItem value="distributor">Distributor</SelectItem>
                    <SelectItem value="pharmacy">Pharmacy</SelectItem>
                    <SelectItem value="consumer">Consumer</SelectItem>
                    <SelectItem value="regulator">Regulator</SelectItem>
                    <SelectItem value="auditor">Auditor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {walletAddress && (
              <Badge variant="secondary" className="hidden md:inline-flex text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-muted/70 text-muted-foreground border-border/50">
                <Wallet className="h-2.5 w-2.5 mr-1" />
                {shortenAddress(walletAddress)}
              </Badge>
            )}

            {activeRole && (
              <Badge variant="secondary" className="hidden md:inline-flex text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/8 text-primary border-primary/15">
                {roleLabels[activeRole]}
              </Badge>
            )}

            {alertCount > 0 && (
              <Link to="/alerts" className="hidden md:inline-flex">
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground relative">
                  <Bell className="h-3.5 w-3.5" />
                  <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-destructive text-[8px] font-bold text-destructive-foreground">
                    {alertCount > 9 ? '9+' : alertCount}
                  </span>
                </Button>
              </Link>
            )}

            <Button variant="ghost" size="sm" onClick={() => setDemoMode(!demoMode)}
              className="hidden md:inline-flex h-7 px-2.5 text-[11px] rounded-lg text-muted-foreground hover:text-foreground gap-1">
              <FlaskConical className="h-3 w-3" />
              {demoMode ? 'Exit' : 'Demo'}
            </Button>

            <Link to="/settings" className="hidden md:inline-flex">
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground">
                <Settings className="h-3.5 w-3.5" />
              </Button>
            </Link>

            {user ? (
              <Button variant="ghost" size="icon" onClick={signOut} className="hidden md:inline-flex h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground">
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Link to="/login" className="hidden md:inline-flex">
                <Button size="sm" className="h-7 px-4 text-[11px] rounded-full font-semibold">
                  Connect Wallet
                </Button>
              </Link>
            )}

            <Button variant="ghost" size="icon" className="md:hidden h-8 w-8 rounded-lg text-muted-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-card/95 backdrop-blur-2xl border-b border-border/40 animate-fade-in">
          <div className="container py-3 flex flex-col gap-0.5">
            {isLanding && (
              <>
                <a href="#technology" onClick={() => setMobileOpen(false)}>
                  <div className="px-3 py-2.5 rounded-xl text-[14px] font-medium text-foreground hover:bg-accent/60 transition-colors">Technology</div>
                </a>
                <Link to="/consumer" onClick={() => setMobileOpen(false)}>
                  <div className="px-3 py-2.5 rounded-xl text-[14px] font-medium text-foreground hover:bg-accent/60 transition-colors">Consumer Verify</div>
                </Link>
                <div className="h-px bg-border/40 my-1.5" />
              </>
            )}
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}>
                  <div className={`px-3 py-2.5 rounded-xl text-[14px] font-medium transition-colors ${
                    isActive ? 'bg-primary/8 text-primary' : 'text-foreground hover:bg-accent/60'
                  }`}>{item.label}</div>
                </Link>
              );
            })}
            <div className="h-px bg-border/40 my-1.5" />
            <Link to="/search" onClick={() => setMobileOpen(false)}>
              <div className="px-3 py-2.5 rounded-xl text-[14px] font-medium text-muted-foreground hover:bg-accent/60">Search</div>
            </Link>
            <button onClick={() => { setDemoMode(!demoMode); setMobileOpen(false); }} className="px-3 py-2.5 rounded-xl text-[14px] font-medium text-muted-foreground text-left hover:bg-accent/60">
              {demoMode ? 'Exit Demo Mode' : 'Enable Demo Mode'}
            </button>
            <Link to="/settings" onClick={() => setMobileOpen(false)}>
              <div className="px-3 py-2.5 rounded-xl text-[14px] font-medium text-muted-foreground hover:bg-accent/60">Settings</div>
            </Link>
            {user ? (
              <button onClick={() => { signOut(); setMobileOpen(false); }} className="px-3 py-2.5 rounded-xl text-[14px] font-medium text-destructive text-left">Disconnect Wallet</button>
            ) : (
              <Link to="/login" onClick={() => setMobileOpen(false)}>
                <div className="px-3 py-2.5 rounded-xl text-[14px] font-medium text-primary">Connect Wallet</div>
              </Link>
            )}
            {demoMode && (
              <div className="px-3 py-2 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Role:</span>
                <Select value={demoRole} onValueChange={(v) => setDemoRole(v as AppRole)}>
                  <SelectTrigger className="h-8 flex-1 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manufacturer">Manufacturer</SelectItem>
                    <SelectItem value="distributor">Distributor</SelectItem>
                    <SelectItem value="pharmacy">Pharmacy</SelectItem>
                    <SelectItem value="consumer">Consumer</SelectItem>
                    <SelectItem value="regulator">Regulator</SelectItem>
                    <SelectItem value="auditor">Auditor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
