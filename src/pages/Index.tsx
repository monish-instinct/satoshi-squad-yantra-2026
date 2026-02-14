import { useAuth } from '@/contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import {
  Shield, Package, ScanLine, ArrowRight,
  Lock, CheckCircle, Globe, BarChart3,
  ArrowUpRight,
  QrCode, Boxes, ShieldCheck, Brain
} from 'lucide-react';

/* ───── Animation helpers ───── */

function useScrollFadeIn() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  return { ref, isInView };
}

function FadeInSection({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, isInView } = useScrollFadeIn();
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.8, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ───── Floating particles ───── */

function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-primary/[0.04]"
          style={{
            width: 120 + i * 60,
            height: 120 + i * 60,
            left: `${15 + i * 14}%`,
            top: `${10 + (i % 3) * 25}%`,
          }}
          animate={{
            y: [0, -20 - i * 5, 0],
            x: [0, 10 + i * 3, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 8 + i * 2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.8,
          }}
        />
      ))}
    </div>
  );
}

/* ───── Animated hero visual ───── */

function HeroVisual() {
  return (
    <motion.div
      className="relative w-[340px] h-[340px] md:w-[420px] md:h-[420px] mx-auto mt-16"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.2, delay: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Outer glow ring */}
      <motion.div
        className="absolute inset-0 rounded-full border border-primary/[0.08]"
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
      />

      {/* Middle ring */}
      <motion.div
        className="absolute inset-8 rounded-full border border-primary/[0.06]"
        animate={{ rotate: -360 }}
        transition={{ duration: 45, repeat: Infinity, ease: 'linear' }}
      />

      {/* Inner ring */}
      <motion.div
        className="absolute inset-16 rounded-full border border-primary/[0.1]"
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
      />

      {/* Center shield */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="flex h-24 w-24 items-center justify-center rounded-3xl bg-card apple-shadow-xl border border-border/60"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Shield className="h-10 w-10 text-primary" />
        </motion.div>
      </div>

      {/* Orbiting nodes */}
      {[
        { icon: QrCode, angle: 0, delay: 0 },
        { icon: Boxes, angle: 90, delay: 0.5 },
        { icon: ShieldCheck, angle: 180, delay: 1 },
        { icon: Brain, angle: 270, delay: 1.5 },
      ].map(({ icon: Icon, angle, delay }, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            left: '50%',
            top: '50%',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 + delay, duration: 0.6 }}
        >
          <motion.div
            animate={{
              x: [
                Math.cos(((angle) * Math.PI) / 180) * 140 - 20,
                Math.cos(((angle + 360) * Math.PI) / 180) * 140 - 20,
              ],
              y: [
                Math.sin(((angle) * Math.PI) / 180) * 140 - 20,
                Math.sin(((angle + 360) * Math.PI) / 180) * 140 - 20,
              ],
            }}
            transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-card/90 backdrop-blur-sm border border-border/60 apple-shadow">
              <Icon className="h-4.5 w-4.5 text-primary/70" />
            </div>
          </motion.div>
        </motion.div>
      ))}
    </motion.div>
  );
}

/* ───── Flow animation ───── */

function FlowStep({ icon: Icon, label, index, total }: { icon: React.ElementType; label: string; index: number; total: number }) {
  const { ref, isInView } = useScrollFadeIn();
  return (
    <motion.div
      ref={ref}
      className="flex flex-col items-center text-center relative"
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.15 }}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-card border border-border/60 apple-shadow-lg mb-4 relative z-10">
        <Icon className="h-7 w-7 text-primary" />
      </div>
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-[12px] font-bold mb-3">
        {index + 1}
      </div>
      <p className="text-[14px] font-semibold text-foreground">{label}</p>
      {index < total - 1 && (
        <div className="hidden md:block absolute top-8 left-[calc(50%+44px)] w-[calc(100%-88px)] h-px bg-gradient-to-r from-border to-border/30" />
      )}
    </motion.div>
  );
}

/* ───── Glass feature card ───── */

function GlassCard({ icon: Icon, title, description, index }: { icon: React.ElementType; title: string; description: string; index: number }) {
  const { ref, isInView } = useScrollFadeIn();
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.12 }}
      whileHover={{ y: -6, transition: { duration: 0.3 } }}
      className="group relative rounded-2xl bg-card/70 backdrop-blur-xl border border-border/50 p-8 transition-shadow duration-500 hover:apple-shadow-xl hover:border-primary/15"
    >
      {/* Subtle hover glow */}
      <div className="absolute inset-0 rounded-2xl bg-primary/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative z-10">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/[0.06] transition-colors duration-300 group-hover:bg-primary/[0.10]">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <h3 className="mt-6 text-[18px] font-semibold tracking-tight text-foreground">{title}</h3>
        <p className="mt-2.5 text-[14px] leading-[1.7] text-muted-foreground">{description}</p>
      </div>
    </motion.div>
  );
}

/* ───── Dashboard preview ───── */

function DashboardPreview() {
  const { ref, isInView } = useScrollFadeIn();
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 60 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative"
    >
      <div className="rounded-2xl bg-card border border-border/60 apple-shadow-xl overflow-hidden">
        {/* Window chrome */}
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border/60 bg-muted/30">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
            <div className="h-2.5 w-2.5 rounded-full bg-warning/60" />
            <div className="h-2.5 w-2.5 rounded-full bg-success/60" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="px-4 py-1 rounded-md bg-muted/50 text-[11px] text-muted-foreground font-medium">
              pharmashield.app/dashboard
            </div>
          </div>
        </div>
        {/* Dashboard mock content */}
        <div className="p-6 md:p-8">
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Batches Verified', value: '2,847', change: '+12.3%' },
              { label: 'Active Alerts', value: '3', change: '-40%' },
              { label: 'Trust Score', value: '98.7', change: '+0.4%' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl bg-muted/30 border border-border/40 p-4">
                <p className="text-[11px] text-muted-foreground font-medium">{stat.label}</p>
                <p className="text-[22px] font-bold text-foreground mt-1 tracking-tight">{stat.value}</p>
                <p className="text-[11px] text-success font-medium mt-0.5">{stat.change}</p>
              </div>
            ))}
          </div>
          {/* Activity chart mock */}
          <div className="rounded-xl bg-muted/20 border border-border/30 p-5 h-40 flex items-end gap-1.5">
            {[35, 45, 30, 55, 40, 65, 50, 70, 45, 80, 60, 75, 55, 85, 65, 72, 58, 90, 68, 78].map((h, i) => (
              <motion.div
                key={i}
                className="flex-1 rounded-t-sm bg-primary/20"
                initial={{ height: 0 }}
                animate={isInView ? { height: `${h}%` } : {}}
                transition={{ duration: 0.6, delay: 0.8 + i * 0.03 }}
              />
            ))}
          </div>
        </div>
      </div>
      {/* Reflection glow */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-2/3 h-16 bg-primary/[0.04] rounded-full blur-2xl" />
    </motion.div>
  );
}

/* ───── Phone mockup ───── */

function PhoneMockup() {
  const { ref, isInView } = useScrollFadeIn();
  const [scanLine, setScanLine] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const interval = setInterval(() => {
      setScanLine((prev) => (prev >= 100 ? 0 : prev + 0.5));
    }, 30);
    return () => clearInterval(interval);
  }, [isInView]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8 }}
      className="mx-auto w-[240px] md:w-[280px]"
    >
      <div className="rounded-[32px] bg-foreground/[0.04] border border-border/60 p-2.5 apple-shadow-xl">
        <div className="rounded-[24px] bg-card overflow-hidden border border-border/40">
          {/* Notch */}
          <div className="flex justify-center pt-2 pb-3">
            <div className="w-20 h-5 rounded-full bg-foreground/[0.06]" />
          </div>
          {/* Camera viewfinder */}
          <div className="mx-4 rounded-xl bg-muted/40 border border-border/30 aspect-square relative overflow-hidden">
            <div className="absolute inset-4 border-2 border-primary/30 rounded-lg" />
            {/* Corner marks */}
            <div className="absolute top-3 left-3 w-5 h-5 border-l-2 border-t-2 border-primary rounded-tl-md" />
            <div className="absolute top-3 right-3 w-5 h-5 border-r-2 border-t-2 border-primary rounded-tr-md" />
            <div className="absolute bottom-3 left-3 w-5 h-5 border-l-2 border-b-2 border-primary rounded-bl-md" />
            <div className="absolute bottom-3 right-3 w-5 h-5 border-r-2 border-b-2 border-primary rounded-br-md" />
            {/* Scan line */}
            <motion.div
              className="absolute left-3 right-3 h-0.5 bg-gradient-to-r from-transparent via-primary/60 to-transparent"
              style={{ top: `${scanLine}%` }}
            />
            {/* QR placeholder */}
            <div className="absolute inset-0 flex items-center justify-center">
              <QrCode className="h-12 w-12 text-muted-foreground/20" />
            </div>
          </div>
          {/* Result */}
          <div className="p-4 flex flex-col items-center gap-2">
            <div className="flex items-center gap-1.5 text-success">
              <CheckCircle className="h-4 w-4" />
              <span className="text-[13px] font-semibold">Verified Authentic</span>
            </div>
            <p className="text-[11px] text-muted-foreground">BATCH-2026-001</p>
          </div>
          {/* Bottom bar */}
          <div className="flex justify-center pb-3">
            <div className="w-28 h-1 rounded-full bg-foreground/[0.08]" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════ */
/* ═══ LANDING PAGE ═══ */
/* ═══════════════════════════════════════════════ */

function LandingPage() {
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.97]);

  return (
    <main className="min-h-screen overflow-hidden bg-background">
      {/* ═══ HERO ═══ */}
      <motion.section
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative flex flex-col items-center justify-center px-4 pt-28 pb-8 text-center min-h-[100vh]"
      >
        {/* Ambient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/20 pointer-events-none" />
        <FloatingParticles />

        {/* Moving glow */}
        <motion.div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-primary/[0.03] rounded-full blur-[120px] pointer-events-none"
          animate={{
            x: ['-50%', '-45%', '-55%', '-50%'],
            y: [0, -30, 20, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="relative z-10 max-w-3xl mx-auto">
          {/* Pill badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-card border border-border/60 apple-shadow mb-10"
          >
            <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-[12px] font-medium text-muted-foreground tracking-wide">Blockchain-Verified Pharmaceutical Security</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-[48px] md:text-[72px] lg:text-[80px] font-bold tracking-[-0.04em] text-foreground leading-[1.0]"
          >
            Trust Every
            <br />
            Medicine.
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45 }}
            className="mt-7 text-[18px] md:text-[20px] text-muted-foreground max-w-xl mx-auto leading-[1.65] font-light"
          >
            Blockchain-verified pharmaceutical authenticity
            <br className="hidden md:block" />
            powered by AI risk intelligence.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.65 }}
            className="flex flex-col sm:flex-row gap-3.5 justify-center mt-11"
          >
            <Link to="/login">
              <Button size="lg" className="rounded-full px-9 h-[52px] text-[15px] font-semibold glow-primary gap-2.5 w-full sm:w-auto transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
                Connect Wallet
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="#technology">
              <Button size="lg" variant="outline" className="rounded-full px-9 h-[52px] text-[15px] font-medium border-border/70 bg-card/80 backdrop-blur-sm hover:bg-accent text-foreground gap-2.5 w-full sm:w-auto transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] apple-shadow">
                Explore Technology
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </a>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="flex items-center justify-center gap-8 mt-16 text-muted-foreground/40"
          >
            {[
              { icon: Lock, label: 'End-to-End Encrypted' },
              { icon: Shield, label: 'Tamper-Proof Records' },
              { icon: Globe, label: 'Ethereum Sepolia' },
            ].map(({ icon: Icon, label }, i) => (
              <div key={label} className="flex items-center gap-2 text-[12px] font-medium">
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Hero visual */}
        <HeroVisual />
      </motion.section>

      {/* ═══ PROBLEM STATEMENT ═══ */}
      <section className="py-32 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <FadeInSection>
            <p className="text-[13px] font-semibold text-primary/60 uppercase tracking-[0.15em] mb-5">The Problem</p>
          </FadeInSection>
          <FadeInSection delay={0.1}>
            <h2 className="text-[32px] md:text-[44px] font-bold tracking-[-0.03em] text-foreground leading-[1.1]">
              Counterfeit medicines break trust
              <span className="text-muted-foreground"> and endanger lives.</span>
            </h2>
          </FadeInSection>
          <FadeInSection delay={0.2}>
            <p className="mt-6 text-[16px] md:text-[18px] text-muted-foreground leading-[1.7] max-w-lg mx-auto font-light">
              Every year, millions of patients receive unverified pharmaceuticals. Without a transparent chain of custody, authenticity is impossible to guarantee.
            </p>
          </FadeInSection>
        </div>
      </section>

      {/* ═══ SOLUTION FLOW ═══ */}
      <section id="technology" className="py-28 px-4 bg-muted/20 border-y border-border/50">
        <div className="container max-w-5xl">
          <FadeInSection>
            <div className="text-center mb-20">
              <p className="text-[13px] font-semibold text-primary/60 uppercase tracking-[0.15em] mb-4">How It Works</p>
              <h2 className="text-[32px] md:text-[44px] font-bold tracking-[-0.03em] text-foreground">
                From Factory to Patient
              </h2>
              <p className="mt-4 text-[16px] text-muted-foreground max-w-md mx-auto font-light">
                A seamless, immutable chain of verification.
              </p>
            </div>
          </FadeInSection>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-6">
            {[
              { icon: Package, label: 'Manufacturer Registers' },
              { icon: Globe, label: 'Pinned to IPFS' },
              { icon: Shield, label: 'Stored On-Chain' },
              { icon: ScanLine, label: 'Consumer Verifies' },
            ].map((step, i) => (
              <FlowStep key={step.label} icon={step.icon} label={step.label} index={i} total={4} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FEATURE SHOWCASE ═══ */}
      <section className="py-28 px-4">
        <div className="container max-w-5xl">
          <FadeInSection>
            <div className="text-center mb-16">
              <p className="text-[13px] font-semibold text-primary/60 uppercase tracking-[0.15em] mb-4">Core Technology</p>
              <h2 className="text-[32px] md:text-[44px] font-bold tracking-[-0.03em] text-foreground">
                Built for Trust
              </h2>
            </div>
          </FadeInSection>

          <div className="grid gap-5 md:grid-cols-3">
            <GlassCard
              icon={Lock}
              title="Blockchain Verification"
              description="Every batch is cryptographically registered on Ethereum. Immutable records ensure tamper-proof authenticity across the entire supply chain."
              index={0}
            />
            <GlassCard
              icon={Boxes}
              title="Supply Chain Tracking"
              description="End-to-end visibility from manufacturer to patient. Every ownership transfer is timestamped and permanently recorded on-chain."
              index={1}
            />
            <GlassCard
              icon={Brain}
              title="AI Risk Intelligence"
              description="Real-time anomaly detection monitors scan patterns, geographic velocity, and frequency thresholds to flag suspicious activity instantly."
              index={2}
            />
          </div>
        </div>
      </section>

      {/* ═══ STATS ═══ */}
      <section className="border-y border-border/50 bg-muted/20">
        <div className="container py-16 max-w-4xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '100%', label: 'On-Chain Verified' },
              { value: '<2s', label: 'Scan Response' },
              { value: '24/7', label: 'Live Monitoring' },
              { value: '0', label: 'Tolerance' },
            ].map(({ value, label }, i) => (
              <FadeInSection key={label} delay={i * 0.1} className="text-center">
                <p className="text-[36px] md:text-[44px] font-bold tracking-tight text-foreground">{value}</p>
                <p className="text-[13px] text-muted-foreground mt-1 font-medium">{label}</p>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ DASHBOARD PREVIEW ═══ */}
      <section className="py-28 px-4">
        <div className="container max-w-4xl">
          <FadeInSection>
            <div className="text-center mb-14">
              <p className="text-[13px] font-semibold text-primary/60 uppercase tracking-[0.15em] mb-4">Regulator Dashboard</p>
              <h2 className="text-[32px] md:text-[44px] font-bold tracking-[-0.03em] text-foreground">
                Real-Time Intelligence
              </h2>
              <p className="mt-4 text-[16px] text-muted-foreground max-w-md mx-auto font-light">
                Monitor the entire pharmaceutical network from a single, unified view.
              </p>
            </div>
          </FadeInSection>
          <DashboardPreview />
        </div>
      </section>

      {/* ═══ CONSUMER EXPERIENCE ═══ */}
      <section className="py-28 px-4 bg-muted/20 border-y border-border/50">
        <div className="container max-w-5xl">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <FadeInSection>
              <p className="text-[13px] font-semibold text-primary/60 uppercase tracking-[0.15em] mb-4">Consumer Experience</p>
              <h2 className="text-[32px] md:text-[40px] font-bold tracking-[-0.03em] text-foreground leading-[1.1]">
                Scan. Verify.
                <br />
                <span className="text-muted-foreground">Peace of Mind.</span>
              </h2>
              <p className="mt-5 text-[16px] text-muted-foreground leading-[1.7] font-light max-w-sm">
                Point your camera at any medicine QR code. In under two seconds, know if your medicine is authentic, see its full journey, and access manufacturer details.
              </p>
              <Link to="/consumer" className="inline-block mt-8">
                <Button variant="outline" className="rounded-full h-11 px-7 text-[14px] font-medium gap-2 border-border/70 apple-shadow transition-all duration-300 hover:scale-[1.02]">
                  Try Consumer Verify
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </FadeInSection>
            <FadeInSection delay={0.2}>
              <PhoneMockup />
            </FadeInSection>
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="py-32 px-4">
        <div className="container max-w-3xl">
          <FadeInSection>
            <div className="rounded-3xl bg-card border border-border/60 p-14 md:p-20 text-center relative overflow-hidden apple-shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-transparent pointer-events-none" />
              <div className="relative z-10">
                <motion.div
                  className="mx-auto mb-7 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary glow-primary"
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <Shield className="h-8 w-8 text-primary-foreground" />
                </motion.div>
                <h2 className="text-[28px] md:text-[40px] font-bold tracking-[-0.03em] text-foreground mb-5 leading-[1.1]">
                  Ready to Secure Your
                  <br />
                  Supply Chain?
                </h2>
                <p className="text-[16px] text-muted-foreground max-w-sm mx-auto mb-10 leading-[1.65] font-light">
                  Connect your wallet and start registering or verifying batches in under a minute.
                </p>
                <Link to="/login">
                  <Button size="lg" className="rounded-full px-10 h-[52px] text-[15px] font-semibold glow-primary gap-2.5 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
                    Get Started Now
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-border/50 bg-muted/10 py-12">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
              <Shield className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-[14px] text-foreground tracking-tight">PharmaShield</span>
          </div>
          <div className="flex gap-8 text-[13px] text-muted-foreground font-medium">
            <a href="#technology" className="hover:text-foreground transition-colors duration-200">Technology</a>
            <Link to="/consumer" className="hover:text-foreground transition-colors duration-200">Verify</Link>
            <Link to="/login" className="hover:text-foreground transition-colors duration-200">Connect</Link>
          </div>
          <p className="text-[12px] text-muted-foreground/60">
            &copy; {new Date().getFullYear()} PharmaShield
          </p>
        </div>
      </footer>
    </main>
  );
}

/* ───── Main Export ───── */

export default function Index() {
  const { activeRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (activeRole) {
      navigate('/home', { replace: true });
    }
  }, [activeRole, navigate]);

  return <LandingPage />;
}
