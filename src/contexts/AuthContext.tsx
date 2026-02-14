import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { connectWallet, signMessage, getNonce, shortenAddress } from '@/lib/wallet';
import { toast } from 'sonner';
import type { AppRole, UserProfile } from '@/types';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  roles: AppRole[];
  loading: boolean;
  walletAddress: string | null;
  walletConnecting: boolean;
  demoMode: boolean;
  demoRole: AppRole;
  setDemoMode: (v: boolean) => void;
  setDemoRole: (r: AppRole) => void;
  activeRole: AppRole | null;
  connectWithWallet: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletConnecting, setWalletConnecting] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [demoRole, setDemoRole] = useState<AppRole>('manufacturer');

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => {
          fetchProfile(session.user.id);
          fetchRoles(session.user.id);
        }, 0);
      } else {
        setProfile(null);
        setRoles([]);
        setWalletAddress(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        fetchRoles(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('user_id', userId).single();
    if (data) {
      setProfile(data as unknown as UserProfile);
      if (data.wallet_address) setWalletAddress(data.wallet_address);
    }
  };

  const fetchRoles = async (userId: string) => {
    const { data } = await supabase.from('user_roles').select('role').eq('user_id', userId);
    if (data) setRoles(data.map((r: any) => r.role as AppRole));
  };

  const connectWithWallet = async () => {
    setWalletConnecting(true);
    try {
      const address = await connectWallet();
      if (!address) throw new Error('Failed to connect wallet. Is MetaMask installed?');

      const nonce = getNonce();
      const signature = await signMessage(nonce);
      if (!signature) throw new Error('Signature rejected');

      const { data, error } = await supabase.functions.invoke('wallet-auth', {
        body: { walletAddress: address, signature, message: nonce },
      });

      if (error) throw new Error(error.message || 'Auth failed');
      if (!data?.session) throw new Error('No session returned');

      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });

      setWalletAddress(address.toLowerCase());

      if (data.isNewUser) {
        toast.success('Wallet connected! Select your role to continue.');
      } else {
        toast.success(`Welcome back, ${shortenAddress(address)}`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Wallet connection failed');
    } finally {
      setWalletConnecting(false);
    }
  };

  const activeRole: AppRole | null = demoMode ? demoRole : (roles[0] ?? null);

  const signOut = async () => {
    await supabase.auth.signOut();
    setWalletAddress(null);
    setDemoMode(false);
  };

  return (
    <AuthContext.Provider value={{
      session, user, profile, roles, loading,
      walletAddress, walletConnecting,
      demoMode, demoRole, setDemoMode, setDemoRole,
      activeRole, connectWithWallet, signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
