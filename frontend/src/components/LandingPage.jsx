import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ScanLine, LayoutDashboard, Users, ShieldCheck, ArrowRight, ChevronRight } from 'lucide-react';

const NAV_LINKS = ['Platform', 'For Doctors', 'For Patients', 'Security'];

const FEATURES = [
    {
        icon: ScanLine,
        title: 'DICOM Viewer',
        desc: 'Render and interact with DICOM medical images directly in the browser. Multi-planar reconstruction, windowing, and AI overlay support.',
    },
    {
        icon: LayoutDashboard,
        title: 'Doctor Workspace',
        desc: 'A dedicated clinical workspace for radiologists and physicians to manage referrals, annotate scans, and deliver structured reports.',
    },
    {
        icon: Users,
        title: 'Patient Portal',
        desc: 'Give patients secure, on-demand access to their imaging history, reports, and appointment scheduling in one place.',
    },
    {
        icon: ShieldCheck,
        title: 'Enterprise Security',
        desc: 'End-to-end encryption, HIPAA-compliant data storage, and fine-grained role-based access control built in by default.',
    },
];

const STATS = [
    { value: '99.9%', label: 'Uptime SLA' },
    { value: '<1.2s', label: 'Avg. load time' },
    { value: 'HIPAA', label: 'Compliant' },
    { value: '150+', label: 'Institutions' },
];

function FadeUp({ children, delay = 0 }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut', delay }}
        >
            {children}
        </motion.div>
    );
}

export default function LandingPage() {
    return (
        <div style={{ minHeight: '100vh', background: 'var(--c-bg)', color: 'var(--c-text)' }}>

            {/* ── NAV ── */}
            <header style={{
                position: 'sticky', top: 0, zIndex: 50,
                borderBottom: '1px solid var(--c-border)',
                background: 'rgba(9,9,11,0.85)',
                backdropFilter: 'blur(16px)',
            }}>
                <div style={{
                    maxWidth: 1160, margin: '0 auto',
                    padding: '0 32px',
                    height: 60,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    {/* Logo */}
                    <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                            <rect width="28" height="28" rx="7" fill="#3b82f6" />
                            <path d="M8 14c0-3.314 2.686-6 6-6s6 2.686 6 6-2.686 6-6 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                            <circle cx="14" cy="14" r="2.5" fill="#fff" />
                        </svg>
                        <span style={{ fontSize: '1.05rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--c-text)' }}>
                            Cerebro
                        </span>
                    </Link>

                    {/* Nav links */}
                    <nav style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
                        {NAV_LINKS.map(l => (
                            <span key={l} style={{ fontSize: '0.875rem', color: 'var(--c-text-2)', cursor: 'pointer', transition: 'color 0.15s' }}
                                onMouseEnter={e => e.currentTarget.style.color = 'var(--c-text)'}
                                onMouseLeave={e => e.currentTarget.style.color = 'var(--c-text-2)'}
                            >{l}</span>
                        ))}
                    </nav>

                    {/* CTA */}
                    <div style={{ display: 'flex', gap: 10 }}>
                        <Link to="/login"><button className="btn btn-ghost" style={{ padding: '8px 16px' }}>Sign in</button></Link>
                        <Link to="/signup"><button className="btn btn-primary" style={{ padding: '8px 16px' }}>Get started <ChevronRight size={15} /></button></Link>
                    </div>
                </div>
            </header>

            {/* ── HERO ── */}
            <section style={{ maxWidth: 1160, margin: '0 auto', padding: '96px 32px 72px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
                    {/* Left */}
                    <div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: 8,
                                padding: '5px 12px',
                                border: '1px solid var(--c-accent-border)',
                                borderRadius: 999,
                                background: 'var(--c-accent-dim)',
                                fontSize: '0.78rem', fontWeight: 500, color: '#93c5fd',
                                marginBottom: 28,
                                letterSpacing: '0.04em',
                            }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--c-accent)' }} />
                                RADIOLOGY INTELLIGENCE PLATFORM
                            </div>

                            <h1 style={{
                                fontSize: 'clamp(2.2rem, 4vw, 3.4rem)',
                                fontWeight: 700, lineHeight: 1.12,
                                letterSpacing: '-0.03em',
                                color: 'var(--c-text)',
                                marginBottom: 24,
                            }}>
                                Clinical imaging<br />
                                <span style={{ color: 'var(--c-text-3)' }}>built for precision.</span>
                            </h1>

                            <p style={{
                                fontSize: '1.05rem', color: 'var(--c-text-2)', lineHeight: 1.75,
                                marginBottom: 40, maxWidth: 440,
                            }}>
                                Cerebro is an enterprise-grade radiology platform connecting physicians and patients through a unified DICOM workspace, structured reporting, and AI-assisted diagnostics.
                            </p>

                            <div style={{ display: 'flex', gap: 12 }}>
                                <Link to="/signup">
                                    <button className="btn btn-primary" style={{ padding: '12px 24px', fontSize: '0.95rem' }}>
                                        Request access <ArrowRight size={16} />
                                    </button>
                                </Link>
                                <Link to="/login">
                                    <button className="btn btn-ghost" style={{ padding: '12px 24px', fontSize: '0.95rem' }}>
                                        Sign in
                                    </button>
                                </Link>
                            </div>
                        </motion.div>

                        {/* Stats row */}
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.6 }}
                            style={{
                                display: 'flex', gap: 0, marginTop: 56,
                                borderTop: '1px solid var(--c-border)',
                                paddingTop: 32,
                            }}
                        >
                            {STATS.map((s, i) => (
                                <div key={s.label} style={{
                                    flex: 1,
                                    paddingRight: 24,
                                    borderRight: i < STATS.length - 1 ? '1px solid var(--c-border)' : 'none',
                                    marginRight: i < STATS.length - 1 ? 24 : 0,
                                }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--c-text)', letterSpacing: '-0.02em' }}>{s.value}</div>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--c-text-3)', marginTop: 2 }}>{s.label}</div>
                                </div>
                            ))}
                        </motion.div>
                    </div>

                    {/* Right — Hero image */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.65, ease: 'easeOut' }}
                        style={{
                            borderRadius: 16, overflow: 'hidden',
                            border: '1px solid var(--c-border)',
                            boxShadow: '0 40px 100px rgba(0,0,0,0.6)',
                            aspectRatio: '16/10',
                            background: 'var(--c-surface)',
                        }}
                    >
                        <img src="/hero.png" alt="Radiology workstation" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </motion.div>
                </div>
            </section>

            {/* ── DIVIDER ── */}
            <div style={{ borderTop: '1px solid var(--c-border)', maxWidth: 1160, margin: '0 auto' }} />

            {/* ── FEATURES ── */}
            <section style={{ maxWidth: 1160, margin: '0 auto', padding: '96px 32px' }}>
                <FadeUp>
                    <div style={{ textAlign: 'center', marginBottom: 64 }}>
                        <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--c-text-3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>Capabilities</p>
                        <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--c-text)' }}>
                            Everything a radiology team needs
                        </h2>
                    </div>
                </FadeUp>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, border: '1px solid var(--c-border)', borderRadius: 14, overflow: 'hidden' }}>
                    {FEATURES.map((f, i) => {
                        const Icon = f.icon;
                        return (
                            <FadeUp key={f.title} delay={i * 0.08}>
                                <div style={{
                                    padding: '40px 40px',
                                    background: 'var(--c-surface)',
                                    borderRight: i % 2 === 0 ? '1px solid var(--c-border)' : 'none',
                                    borderBottom: i < 2 ? '1px solid var(--c-border)' : 'none',
                                    transition: 'background 0.2s',
                                }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--c-surface-2)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'var(--c-surface)'}
                                >
                                    <div style={{
                                        width: 42, height: 42, borderRadius: 10,
                                        background: 'var(--c-accent-dim)',
                                        border: '1px solid var(--c-accent-border)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        marginBottom: 20,
                                    }}>
                                        <Icon size={19} color="#3b82f6" />
                                    </div>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--c-text)', marginBottom: 10 }}>{f.title}</h3>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--c-text-2)', lineHeight: 1.7 }}>{f.desc}</p>
                                </div>
                            </FadeUp>
                        );
                    })}
                </div>
            </section>

            {/* ── PHOTO CTA ── */}
            <section style={{ maxWidth: 1160, margin: '0 auto', padding: '0 32px 96px' }}>
                <FadeUp>
                    <div style={{
                        borderRadius: 16, overflow: 'hidden',
                        border: '1px solid var(--c-border)',
                        display: 'grid', gridTemplateColumns: '1fr 1fr',
                        minHeight: 420,
                    }}>
                        {/* Image side */}
                        <div style={{ position: 'relative', overflow: 'hidden', background: 'var(--c-surface)' }}>
                            <img src="/doctor.png" alt="Radiologist at workstation" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, transparent 60%, var(--c-surface) 100%)' }} />
                        </div>
                        {/* Text side */}
                        <div style={{
                            background: 'var(--c-surface)',
                            padding: '56px 48px',
                            display: 'flex', flexDirection: 'column', justifyContent: 'center',
                            borderLeft: '1px solid var(--c-border)',
                        }}>
                            <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--c-text-3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>For Clinicians</p>
                            <h2 style={{ fontSize: '1.9rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--c-text)', lineHeight: 1.2, marginBottom: 18 }}>
                                Built for the way radiologists actually work.
                            </h2>
                            <p style={{ fontSize: '0.92rem', color: 'var(--c-text-2)', lineHeight: 1.75, marginBottom: 36 }}>
                                Cerebro integrates directly into your clinical workflow. Instant access to prior studies, structured report templates, and real-time collaboration with referring physicians — all from one interface.
                            </p>
                            <Link to="/signup">
                                <button className="btn btn-primary" style={{ width: 'fit-content', padding: '11px 22px' }}>
                                    Talk to sales <ArrowRight size={15} />
                                </button>
                            </Link>
                        </div>
                    </div>
                </FadeUp>
            </section>

            {/* ── FOOTER ── */}
            <footer style={{ borderTop: '1px solid var(--c-border)', padding: '32px', textAlign: 'center' }}>
                <p style={{ fontSize: '0.82rem', color: 'var(--c-text-3)' }}>
                    © 2026 Cerebro Technologies, Inc. · HIPAA Compliant · All rights reserved.
                </p>
            </footer>
        </div>
    );
}