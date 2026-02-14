import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { getContractAddress, setContractAddress, isBlockchainConfigured } from '@/lib/blockchain';
import { shortenAddress } from '@/lib/wallet';
import { generateDemoData } from '@/lib/demo';
import { supabase } from '@/integrations/supabase/client';
import {
  Settings2, Link as LinkIcon, FlaskConical, CheckCircle, AlertCircle, Wallet, Copy, Loader2, Database,
  User, Bell, Shield, Palette, Key, HardDrive, Globe, Monitor, Moon, Sun, Smartphone,
  Download, Upload, Trash2, Eye, EyeOff, Lock, Fingerprint, Clock, RefreshCw, Zap,
  ChevronRight, ExternalLink, Info, AlertTriangle, CheckCircle2, XCircle
} from 'lucide-react';
import { toast } from 'sonner';

type SettingsTab = 'profile' | 'notifications' | 'security' | 'appearance' | 'blockchain' | 'data' | 'advanced';

const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { id: 'profile', label: 'Profile', icon: <User className="h-4 w-4" /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell className="h-4 w-4" /> },
  { id: 'security', label: 'Security', icon: <Shield className="h-4 w-4" /> },
  { id: 'appearance', label: 'Appearance', icon: <Palette className="h-4 w-4" /> },
  { id: 'blockchain', label: 'Blockchain', icon: <LinkIcon className="h-4 w-4" /> },
  { id: 'data', label: 'Data', icon: <HardDrive className="h-4 w-4" /> },
  { id: 'advanced', label: 'Advanced', icon: <Zap className="h-4 w-4" /> },
];

function SettingRow({ label, description, children, danger }: { label: string; description?: string; children: React.ReactNode; danger?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="flex-1 min-w-0">
        <p className={`text-[14px] font-medium ${danger ? 'text-destructive' : 'text-foreground'}`}>{label}</p>
        {description && <p className="text-[12px] text-muted-foreground mt-0.5 leading-relaxed">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function SettingSection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="apple-card p-6">
      <div className="mb-4">
        <h3 className="text-[15px] font-semibold text-foreground">{title}</h3>
        {description && <p className="text-[12px] text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="divide-y divide-border">{children}</div>
    </div>
  );
}

function StatusBadge({ status, label }: { status: 'success' | 'warning' | 'error' | 'info'; label: string }) {
  const styles = {
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    error: 'bg-destructive/10 text-destructive',
    info: 'bg-primary/10 text-primary',
  };
  const icons = {
    success: <CheckCircle2 className="h-3 w-3" />,
    warning: <AlertTriangle className="h-3 w-3" />,
    error: <XCircle className="h-3 w-3" />,
    info: <Info className="h-3 w-3" />,
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${styles[status]}`}>
      {icons[status]} {label}
    </span>
  );
}

// ── Profile Tab ──
function ProfileTab() {
  const { user, profile, walletAddress, roles } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [organization, setOrganization] = useState(profile?.organization || '');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setOrganization(profile.organization || '');
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({
        display_name: displayName,
        organization: organization,
      }).eq('user_id', user.id);
      if (error) throw error;
      toast.success('Profile updated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      toast.success('Address copied');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Wallet Identity */}
      <SettingSection title="Wallet Identity" description="Your blockchain identity and authentication details">
        <SettingRow label="Wallet Address" description={walletAddress || 'No wallet connected'}>
          {walletAddress ? (
            <div className="flex items-center gap-2">
              <code className="text-[12px] text-muted-foreground font-mono bg-muted px-2 py-1 rounded-lg">
                {shortenAddress(walletAddress)}
              </code>
              <Button variant="ghost" size="icon" onClick={copyAddress} className="h-7 w-7 rounded-lg">
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <StatusBadge status="warning" label="Not connected" />
          )}
        </SettingRow>
        <SettingRow label="Active Roles" description="Your assigned roles in the system">
          <div className="flex gap-1.5">
            {roles.length > 0 ? roles.map(r => (
              <span key={r} className="bg-primary/10 text-primary text-[11px] font-medium px-2 py-0.5 rounded-full capitalize">{r}</span>
            )) : <StatusBadge status="info" label="No roles" />}
          </div>
        </SettingRow>
        <SettingRow label="User ID" description="Internal system identifier">
          <code className="text-[11px] text-muted-foreground font-mono bg-muted px-2 py-1 rounded-lg">
            {user?.id ? `${user.id.slice(0, 8)}...` : '—'}
          </code>
        </SettingRow>
      </SettingSection>

      {/* Profile Information */}
      <SettingSection title="Profile Information" description="Manage your public profile details">
        <div className="py-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-medium">Display Name</Label>
            <Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Enter your name" className="h-10 rounded-xl text-[13px]" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-medium">Organization</Label>
            <Input value={organization} onChange={e => setOrganization(e.target.value)} placeholder="Company or institution" className="h-10 rounded-xl text-[13px]" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-medium">Bio</Label>
            <Textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Brief description about you or your organization..." className="rounded-xl text-[13px] min-h-[80px] resize-none" />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} className="h-9 px-5 rounded-lg text-[13px] font-medium">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </div>
        </div>
      </SettingSection>
    </div>
  );
}

// ── Notifications Tab ──
function NotificationsTab() {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(false);
  const [scanAlerts, setScanAlerts] = useState(true);
  const [recallAlerts, setRecallAlerts] = useState(true);
  const [trustAlerts, setTrustAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  const [alertThreshold, setAlertThreshold] = useState([70]);
  const [soundEnabled, setSoundEnabled] = useState(true);

  return (
    <div className="flex flex-col gap-4">
      <SettingSection title="Alert Channels" description="Choose how you receive notifications">
        <SettingRow label="Email Notifications" description="Receive alerts via email for critical events">
          <Switch checked={emailAlerts} onCheckedChange={setEmailAlerts} />
        </SettingRow>
        <SettingRow label="Push Notifications" description="Browser push notifications for real-time alerts">
          <Switch checked={pushNotifs} onCheckedChange={setPushNotifs} />
        </SettingRow>
        <SettingRow label="Notification Sound" description="Play a sound when a new alert arrives">
          <Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} />
        </SettingRow>
      </SettingSection>

      <SettingSection title="Alert Types" description="Configure which events trigger notifications">
        <SettingRow label="Scan Anomalies" description="When a verification scan detects suspicious activity">
          <Switch checked={scanAlerts} onCheckedChange={setScanAlerts} />
        </SettingRow>
        <SettingRow label="Batch Recalls" description="When a batch is recalled by manufacturer or regulator">
          <Switch checked={recallAlerts} onCheckedChange={setRecallAlerts} />
        </SettingRow>
        <SettingRow label="Trust Score Changes" description="When a manufacturer's trust score drops significantly">
          <Switch checked={trustAlerts} onCheckedChange={setTrustAlerts} />
        </SettingRow>
        <SettingRow label="Weekly Digest" description="Summary of all activity sent every Monday">
          <Switch checked={weeklyDigest} onCheckedChange={setWeeklyDigest} />
        </SettingRow>
      </SettingSection>

      <SettingSection title="Risk Threshold" description="Set the minimum risk score that triggers an alert">
        <div className="py-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] text-muted-foreground">Alert when risk score exceeds</span>
            <span className="text-[14px] font-semibold text-primary">{alertThreshold[0]}%</span>
          </div>
          <Slider value={alertThreshold} onValueChange={setAlertThreshold} max={100} min={10} step={5} className="w-full" />
          <div className="flex justify-between mt-2">
            <span className="text-[11px] text-muted-foreground">Low (10%)</span>
            <span className="text-[11px] text-muted-foreground">High (100%)</span>
          </div>
        </div>
      </SettingSection>
    </div>
  );
}

// ── Security Tab ──
function SecurityTab() {
  const { walletAddress, session } = useAuth();
  const [twoFactor, setTwoFactor] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState('30');
  const [ipWhitelist, setIpWhitelist] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  const sessionAge = session?.expires_at
    ? Math.max(0, Math.round((new Date(session.expires_at * 1000).getTime() - Date.now()) / 60000))
    : 0;

  return (
    <div className="flex flex-col gap-4">
      <SettingSection title="Authentication" description="Manage your authentication and security settings">
        <SettingRow label="Authentication Method" description="Currently using Web3 wallet signature verification">
          <StatusBadge status="success" label="Wallet Auth" />
        </SettingRow>
        <SettingRow label="Two-Factor Authentication" description="Add an extra layer of security with TOTP codes">
          <div className="flex items-center gap-2">
            <Switch checked={twoFactor} onCheckedChange={setTwoFactor} />
            <StatusBadge status={twoFactor ? 'success' : 'warning'} label={twoFactor ? 'Enabled' : 'Disabled'} />
          </div>
        </SettingRow>
        <SettingRow label="Biometric Login" description="Use fingerprint or Face ID when available">
          <div className="flex items-center gap-2">
            <Fingerprint className="h-4 w-4 text-muted-foreground" />
            <StatusBadge status="info" label="Not available" />
          </div>
        </SettingRow>
      </SettingSection>

      <SettingSection title="Session Management" description="Control session behavior and timeouts">
        <SettingRow label="Session Timeout" description="Automatically log out after inactivity">
          <Select value={sessionTimeout} onValueChange={setSessionTimeout}>
            <SelectTrigger className="w-[140px] h-9 rounded-lg text-[13px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15">15 minutes</SelectItem>
              <SelectItem value="30">30 minutes</SelectItem>
              <SelectItem value="60">1 hour</SelectItem>
              <SelectItem value="240">4 hours</SelectItem>
              <SelectItem value="1440">24 hours</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
        <SettingRow label="Current Session" description={`Session expires in ${sessionAge} minutes`}>
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <Progress value={Math.min(100, (sessionAge / 60) * 100)} className="w-[100px] h-1.5" />
          </div>
        </SettingRow>
        <SettingRow label="Active Sessions" description="You have 1 active session">
          <Button variant="outline" size="sm" className="h-8 rounded-lg text-[12px]">
            <RefreshCw className="h-3 w-3 mr-1.5" /> Revoke All
          </Button>
        </SettingRow>
      </SettingSection>

      <SettingSection title="API Access" description="Manage API keys for programmatic access">
        <SettingRow label="API Key" description="Use this key for external integrations">
          <div className="flex items-center gap-2">
            <code className="text-[11px] font-mono bg-muted px-2 py-1 rounded-lg text-muted-foreground">
              {showApiKey ? 'ps_live_xxxxxxxxxxxxxxxx' : '••••••••••••••••'}
            </code>
            <Button variant="ghost" size="icon" onClick={() => setShowApiKey(!showApiKey)} className="h-7 w-7 rounded-lg">
              {showApiKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </SettingRow>
        <SettingRow label="IP Whitelist" description="Restrict API access to specific IP addresses">
          <Input value={ipWhitelist} onChange={e => setIpWhitelist(e.target.value)} placeholder="e.g. 192.168.1.1" className="w-[180px] h-9 rounded-lg text-[12px]" />
        </SettingRow>
      </SettingSection>
    </div>
  );
}

// ── Appearance Tab ──
function AppearanceTab() {
  const [theme, setTheme] = useState('light');
  const [compactMode, setCompactMode] = useState(false);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [fontSize, setFontSize] = useState([14]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [accentColor, setAccentColor] = useState('blue');

  return (
    <div className="flex flex-col gap-4">
      <SettingSection title="Theme" description="Customize the look and feel of the interface">
        <div className="py-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'light', icon: <Sun className="h-5 w-5" />, label: 'Light' },
              { id: 'dark', icon: <Moon className="h-5 w-5" />, label: 'Dark' },
              { id: 'system', icon: <Monitor className="h-5 w-5" />, label: 'System' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 ${
                  theme === t.id
                    ? 'border-primary bg-primary/5 text-primary shadow-sm'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:bg-muted/50'
                }`}
              >
                {t.icon}
                <span className="text-[12px] font-medium">{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </SettingSection>

      <SettingSection title="Accent Color" description="Choose your preferred accent color">
        <div className="py-4">
          <div className="flex gap-3">
            {[
              { id: 'blue', color: 'bg-[hsl(211,100%,50%)]' },
              { id: 'purple', color: 'bg-[hsl(270,70%,55%)]' },
              { id: 'green', color: 'bg-[hsl(142,71%,45%)]' },
              { id: 'orange', color: 'bg-[hsl(36,100%,50%)]' },
              { id: 'pink', color: 'bg-[hsl(340,80%,55%)]' },
              { id: 'teal', color: 'bg-[hsl(180,60%,45%)]' },
            ].map(c => (
              <button
                key={c.id}
                onClick={() => setAccentColor(c.id)}
                className={`h-8 w-8 rounded-full ${c.color} transition-all duration-200 ${
                  accentColor === c.id ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'opacity-60 hover:opacity-100'
                }`}
              />
            ))}
          </div>
        </div>
      </SettingSection>

      <SettingSection title="Display" description="Adjust display preferences">
        <SettingRow label="Compact Mode" description="Reduce spacing and padding for denser layouts">
          <Switch checked={compactMode} onCheckedChange={setCompactMode} />
        </SettingRow>
        <SettingRow label="Animations" description="Enable smooth transitions and motion effects">
          <Switch checked={animationsEnabled} onCheckedChange={setAnimationsEnabled} />
        </SettingRow>
        <SettingRow label="Sidebar Collapsed" description="Start with sidebar in collapsed state">
          <Switch checked={sidebarCollapsed} onCheckedChange={setSidebarCollapsed} />
        </SettingRow>
        <div className="py-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] text-muted-foreground">Font Size</span>
            <span className="text-[14px] font-semibold text-foreground">{fontSize[0]}px</span>
          </div>
          <Slider value={fontSize} onValueChange={setFontSize} max={20} min={11} step={1} className="w-full" />
        </div>
      </SettingSection>
    </div>
  );
}

// ── Blockchain Tab ──
function BlockchainTab() {
  const { demoMode, setDemoMode, user } = useAuth();
  const [address, setAddress] = useState(getContractAddress() || '');
  const [generatingDemo, setGeneratingDemo] = useState(false);
  const [rpcUrl, setRpcUrl] = useState('https://ethereum-sepolia-rpc.publicnode.com');
  const [gasLimit, setGasLimit] = useState('300000');
  const [autoVerify, setAutoVerify] = useState(true);
  const [ipfsGateway, setIpfsGateway] = useState('pinata');

  const blockchainReady = isBlockchainConfigured();

  const saveContract = () => {
    setContractAddress(address);
    toast.success(address ? 'Contract address saved' : 'Contract address cleared');
  };

  const handleGenerateDemo = async () => {
    if (!user) return;
    setGeneratingDemo(true);
    try {
      await generateDemoData(user.id);
      toast.success('Demo data generated! Check Dashboard and other pages.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate demo data');
    } finally {
      setGeneratingDemo(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <SettingSection title="Smart Contract" description="Configure the deployed PharmaShield contract on Ethereum Sepolia">
        <div className="py-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-medium">Contract Address</Label>
            <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="0x..." className="h-10 rounded-xl font-mono text-[13px]" />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {blockchainReady ? (
                <StatusBadge status="success" label="Connected" />
              ) : (
                <StatusBadge status="warning" label="Not configured — Supabase fallback" />
              )}
            </div>
            <Button onClick={saveContract} className="h-9 px-5 rounded-lg text-[13px] font-medium">Save</Button>
          </div>
        </div>
      </SettingSection>

      <SettingSection title="Network Configuration" description="Ethereum network and RPC settings">
        <SettingRow label="Network" description="Current blockchain network">
          <StatusBadge status="info" label="Sepolia Testnet" />
        </SettingRow>
        <div className="py-4 flex flex-col gap-1.5">
          <Label className="text-[13px] font-medium">Custom RPC URL</Label>
          <Input value={rpcUrl} onChange={e => setRpcUrl(e.target.value)} className="h-10 rounded-xl font-mono text-[12px]" />
        </div>
        <div className="py-4 flex flex-col gap-1.5">
          <Label className="text-[13px] font-medium">Gas Limit</Label>
          <Input value={gasLimit} onChange={e => setGasLimit(e.target.value)} className="h-10 rounded-xl font-mono text-[13px]" />
        </div>
        <SettingRow label="Auto-Verify on Chain" description="Automatically verify batches on-chain after registration">
          <Switch checked={autoVerify} onCheckedChange={setAutoVerify} />
        </SettingRow>
      </SettingSection>

      <SettingSection title="IPFS Configuration" description="Decentralized storage for batch metadata">
        <SettingRow label="IPFS Gateway" description="Select your preferred IPFS gateway provider">
          <Select value={ipfsGateway} onValueChange={setIpfsGateway}>
            <SelectTrigger className="w-[140px] h-9 rounded-lg text-[13px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pinata">Pinata</SelectItem>
              <SelectItem value="infura">Infura</SelectItem>
              <SelectItem value="web3storage">web3.storage</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
      </SettingSection>

      <SettingSection title="Demo & Testing" description="Tools for development and demonstrations">
        <SettingRow label="Demo Mode" description="Switch between roles without wallet authentication">
          <Switch checked={demoMode} onCheckedChange={setDemoMode} />
        </SettingRow>
        {user && (
          <SettingRow label="Generate Demo Data" description="Populate system with sample batches, scans, alerts">
            <Button onClick={handleGenerateDemo} disabled={generatingDemo} variant="outline" className="h-8 rounded-lg text-[12px]">
              {generatingDemo ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Database className="h-3.5 w-3.5 mr-1.5" />}
              Generate
            </Button>
          </SettingRow>
        )}
      </SettingSection>
    </div>
  );
}

// ── Data Tab ──
function DataTab() {
  const { user } = useAuth();
  const [batchCount, setBatchCount] = useState<number | null>(null);
  const [scanCount, setScanCount] = useState<number | null>(null);
  const [alertCount, setAlertCount] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from('batches').select('id', { count: 'exact', head: true }).eq('registered_by', user.id),
      supabase.from('scan_logs').select('id', { count: 'exact', head: true }).eq('scanner_user_id', user.id),
      supabase.from('alerts').select('id', { count: 'exact', head: true }),
    ]).then(([b, s, a]) => {
      setBatchCount(b.count ?? 0);
      setScanCount(s.count ?? 0);
      setAlertCount(a.count ?? 0);
    });
  }, [user]);

  return (
    <div className="flex flex-col gap-4">
      <SettingSection title="Data Overview" description="Summary of your data in the system">
        <SettingRow label="Registered Batches" description="Total batches you've registered">
          <span className="text-[15px] font-semibold text-foreground tabular-nums">{batchCount ?? '—'}</span>
        </SettingRow>
        <SettingRow label="Scan Logs" description="Total verification scans you've performed">
          <span className="text-[15px] font-semibold text-foreground tabular-nums">{scanCount ?? '—'}</span>
        </SettingRow>
        <SettingRow label="System Alerts" description="Total alerts in the system">
          <span className="text-[15px] font-semibold text-foreground tabular-nums">{alertCount ?? '—'}</span>
        </SettingRow>
      </SettingSection>

      <SettingSection title="Export" description="Download your data for backup or analysis">
        <SettingRow label="Export Batches" description="Download all your batch records as CSV">
          <Button variant="outline" size="sm" className="h-8 rounded-lg text-[12px]">
            <Download className="h-3.5 w-3.5 mr-1.5" /> Export CSV
          </Button>
        </SettingRow>
        <SettingRow label="Export Scan Logs" description="Download your verification history">
          <Button variant="outline" size="sm" className="h-8 rounded-lg text-[12px]">
            <Download className="h-3.5 w-3.5 mr-1.5" /> Export CSV
          </Button>
        </SettingRow>
        <SettingRow label="Export Audit Trail" description="Download full audit log as JSON">
          <Button variant="outline" size="sm" className="h-8 rounded-lg text-[12px]">
            <Download className="h-3.5 w-3.5 mr-1.5" /> Export JSON
          </Button>
        </SettingRow>
      </SettingSection>

      <SettingSection title="Storage" description="Manage uploaded files and media">
        <SettingRow label="Medicine Images" description="Photos uploaded for batch registration">
          <div className="flex items-center gap-2">
            <Progress value={35} className="w-[80px] h-1.5" />
            <span className="text-[12px] text-muted-foreground">35%</span>
          </div>
        </SettingRow>
        <SettingRow label="IPFS Pinned Files" description="Metadata pinned to decentralized storage">
          <StatusBadge status="success" label="Synced" />
        </SettingRow>
      </SettingSection>
    </div>
  );
}

// ── Advanced Tab ──
function AdvancedTab() {
  const { signOut } = useAuth();
  const [debugMode, setDebugMode] = useState(false);
  const [logLevel, setLogLevel] = useState('info');
  const [cacheEnabled, setCacheEnabled] = useState(true);
  const [telemetry, setTelemetry] = useState(true);
  const [language, setLanguage] = useState('en');
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);

  const handleClearCache = () => {
    localStorage.clear();
    toast.success('Local cache cleared');
  };

  return (
    <div className="flex flex-col gap-4">
      <SettingSection title="Localization" description="Language and timezone preferences">
        <SettingRow label="Language" description="Interface language">
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-[140px] h-9 rounded-lg text-[13px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="es">Español</SelectItem>
              <SelectItem value="fr">Français</SelectItem>
              <SelectItem value="de">Deutsch</SelectItem>
              <SelectItem value="ja">日本語</SelectItem>
              <SelectItem value="zh">中文</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
        <SettingRow label="Timezone" description="Used for timestamps and scheduling">
          <code className="text-[11px] font-mono bg-muted px-2 py-1 rounded-lg text-muted-foreground">{timezone}</code>
        </SettingRow>
      </SettingSection>

      <SettingSection title="Developer" description="Advanced debugging and performance tools">
        <SettingRow label="Debug Mode" description="Show verbose logging and debug overlays">
          <Switch checked={debugMode} onCheckedChange={setDebugMode} />
        </SettingRow>
        <SettingRow label="Log Level" description="Control console output verbosity">
          <Select value={logLevel} onValueChange={setLogLevel}>
            <SelectTrigger className="w-[120px] h-9 rounded-lg text-[13px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="error">Error</SelectItem>
              <SelectItem value="warn">Warning</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="debug">Debug</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
        <SettingRow label="Response Caching" description="Cache API responses for faster navigation">
          <Switch checked={cacheEnabled} onCheckedChange={setCacheEnabled} />
        </SettingRow>
        <SettingRow label="Telemetry" description="Share anonymous usage data to improve the platform">
          <Switch checked={telemetry} onCheckedChange={setTelemetry} />
        </SettingRow>
      </SettingSection>

      <SettingSection title="Cache & Storage" description="Manage local browser storage">
        <SettingRow label="Clear Local Cache" description="Remove all cached data from this browser">
          <Button variant="outline" size="sm" onClick={handleClearCache} className="h-8 rounded-lg text-[12px]">
            <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Clear Cache
          </Button>
        </SettingRow>
        <SettingRow label="LocalStorage Usage" description="Browser storage used by this app">
          <div className="flex items-center gap-2">
            <Progress value={12} className="w-[80px] h-1.5" />
            <span className="text-[12px] text-muted-foreground">12 KB</span>
          </div>
        </SettingRow>
      </SettingSection>

      <SettingSection title="Danger Zone" description="Irreversible actions — proceed with caution">
        <SettingRow label="Sign Out" description="Log out from all devices" danger>
          <Button variant="destructive" size="sm" onClick={() => signOut()} className="h-8 rounded-lg text-[12px]">
            Sign Out
          </Button>
        </SettingRow>
        <SettingRow label="Delete Account" description="Permanently delete your account and all data" danger>
          <Button variant="destructive" size="sm" className="h-8 rounded-lg text-[12px]">
            <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete Account
          </Button>
        </SettingRow>
      </SettingSection>
    </div>
  );
}

// ── Main Settings Page ──
export default function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  const tabContent: Record<SettingsTab, React.ReactNode> = {
    profile: <ProfileTab />,
    notifications: <NotificationsTab />,
    security: <SecurityTab />,
    appearance: <AppearanceTab />,
    blockchain: <BlockchainTab />,
    data: <DataTab />,
    advanced: <AdvancedTab />,
  };

  return (
    <main className="container max-w-4xl py-10 animate-fade-in">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 glow-primary">
          <Settings2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
          <p className="text-[13px] text-muted-foreground">Manage your account, preferences, and integrations</p>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Navigation */}
        <nav className="w-[200px] shrink-0 hidden md:block">
          <div className="apple-card p-2 sticky top-24">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Mobile Tab Bar */}
        <div className="md:hidden w-full mb-4 -mt-4">
          <div className="apple-card p-1.5 flex gap-1 overflow-x-auto custom-scrollbar">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {tabContent[activeTab]}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
