import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Wallet, Loader2, CheckCircle, ChevronRight } from 'lucide-react';
import { isMetaMaskAvailable, shortenAddress } from '@/lib/wallet';
import { toast } from 'sonner';
import type { AppRole } from '@/types';

const roleRedirectMap: Record<AppRole, string> = {
  manufacturer: '/home',
  distributor: '/home',
  pharmacy: '/home',
  consumer: '/home',
  regulator: '/home',
  auditor: '/home',
};

const roleDescriptions: Record<AppRole, string> = {
  manufacturer: 'Register & manage drug batches',
  distributor: 'Verify & transfer shipments',
  pharmacy: 'Verify authenticity at point of sale',
  consumer: 'Scan & verify your medicines',
  regulator: 'Monitor the full supply chain',
  auditor: 'Audit trail & compliance review',
};

export default function Login() {
  const navigate = useNavigate();
  const { connectWithWallet, walletConnecting, walletAddress, user, roles, loading } = useAuth();
  const [selectedRole, setSelectedRole] = useState<AppRole>('manufacturer');
  const [savingRole, setSavingRole] = useState(false);

  const isConnected = !!walletAddress && !!user;
  const hasRole = roles.length > 0;

  useEffect(() => {
    if (!loading && isConnected && hasRole) {
      const targetPath = roleRedirectMap[roles[0]] || '/';
      navigate(targetPath, { replace: true });
    }
  }, [loading, isConnected, hasRole, roles, navigate]);

  const handleConnect = async () => {
    await connectWithWallet();
  };

  const handleSaveRole = async () => {
    if (!user) return;
    setSavingRole(true);
    try {
      const { error } = await supabase.from('user_roles').insert({
        user_id: user.id,
        role: selectedRole,
      });
      if (error) {
        if (error.code === '23505') {
          // Duplicate — user already has this role
        } else {
          throw error;
        }
      }
      toast.success('Role assigned! Redirecting...');
      const targetPath = roleRedirectMap[selectedRole] || '/';
      setTimeout(() => navigate(targetPath, { replace: true }), 400);
    } catch (err: any) {
      toast.error(err.message || 'Failed to assign role');
    } finally {
      setSavingRole(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-background to-accent/[0.05]" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-primary/[0.04] blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-primary/[0.03] blur-3xl" />

      <div className="w-full max-w-[380px] animate-scale-in relative z-10">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[18px] bg-primary glow-primary shadow-lg">
            <Shield className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            PharmaShield
          </h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            {isConnected
              ? 'Choose your role to get started'
              : 'Secure pharmaceutical verification'}
          </p>
        </div>

        {/* Main Card */}
        <div className="rounded-2xl bg-card/80 backdrop-blur-xl border border-border/60 apple-shadow-xl overflow-hidden">
          {!isConnected ? (
            <div className="p-6">
              <div className="mb-5">
                <h2 className="text-[15px] font-semibold text-foreground mb-1">Connect Wallet</h2>
                <p className="text-[13px] text-muted-foreground">
                  Sign in with MetaMask to continue
                </p>
              </div>

              <Button
                onClick={handleConnect}
                disabled={walletConnecting || !isMetaMaskAvailable()}
                className="w-full h-12 rounded-xl text-[14px] font-semibold gap-3 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
              >
                {walletConnecting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Wallet className="h-5 w-5" />
                )}
                {isMetaMaskAvailable() ? 'Connect MetaMask' : 'MetaMask Not Detected'}
              </Button>

              {!isMetaMaskAvailable() && (
                <p className="text-[12px] text-muted-foreground text-center mt-3">
                  Install the{' '}
                  <a href="https://metamask.io" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    MetaMask extension
                  </a>{' '}
                  to continue.
                </p>
              )}

              <div className="mt-6 pt-5 border-t border-border/50">
                <div className="flex items-center gap-3 text-[12px] text-muted-foreground">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-success/10">
                    <Shield className="h-3.5 w-3.5 text-success" />
                  </div>
                  <span>End-to-end encrypted • No passwords stored</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6">
              {/* Connected status */}
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-success/[0.06] border border-success/15 mb-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-success/10">
                  <CheckCircle className="h-4.5 w-4.5 text-success" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-foreground">Wallet Connected</p>
                  <p className="text-[12px] font-mono text-muted-foreground tracking-wide">{shortenAddress(walletAddress)}</p>
                </div>
              </div>

              {/* Role Selection */}
              <div className="mb-5">
                <label className="text-[13px] font-semibold text-foreground mb-2.5 block">
                  Select Your Role
                </label>
                <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)}>
                  <SelectTrigger className="h-12 rounded-xl text-[14px] bg-muted/40 border-border/60 focus:bg-card transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="manufacturer">Manufacturer</SelectItem>
                    <SelectItem value="distributor">Distributor</SelectItem>
                    <SelectItem value="pharmacy">Pharmacy</SelectItem>
                    <SelectItem value="consumer">Consumer</SelectItem>
                    <SelectItem value="regulator">Regulator</SelectItem>
                    <SelectItem value="auditor">Auditor</SelectItem>
                  </SelectContent>
                </Select>
                <p className="mt-2 text-[12px] text-muted-foreground pl-0.5">
                  {roleDescriptions[selectedRole]}
                </p>
              </div>

              <Button
                onClick={handleSaveRole}
                disabled={savingRole}
                className="w-full h-12 rounded-xl text-[14px] font-semibold gap-2 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
              >
                {savingRole ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Continue
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center mt-6 text-[11px] text-muted-foreground/60">
          Powered by Ethereum & IPFS
        </p>
      </div>
    </main>
  );
}
