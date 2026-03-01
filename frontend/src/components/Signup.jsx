import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Check } from 'lucide-react';

const PERKS = [
    'Access to the full DICOM viewer',
    'Structured radiology reporting',
    'HIPAA-compliant data storage',
];

export default function Signup() {
    const [role, setRole] = useState('doctor');
    const [showPass, setShowPass] = useState(false);

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '100vh' }}>

            {/* ── Left — Image panel ── */}
            <div style={{ position: 'relative', overflow: 'hidden', background: '#0a0a0f' }}>
                <img
                    src="/auth-bg.png"
                    alt="MRI scan"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }}
                />
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(135deg, rgba(9,9,11,0.7) 0%, rgba(9,9,11,0.25) 100%)',
                    display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                    padding: '48px',
                }}>
                    <div>
                        <p style={{ fontSize: '0.78rem', fontWeight: 600, color: '#71717a', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 20 }}>
                            Included with every account
                        </p>
                        {PERKS.map(p => (
                            <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                                <div style={{
                                    width: 20, height: 20, borderRadius: '50%',
                                    background: 'rgba(59,130,246,0.15)',
                                    border: '1px solid rgba(59,130,246,0.4)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0,
                                }}>
                                    <Check size={11} color="#3b82f6" />
                                </div>
                                <span style={{ fontSize: '0.9rem', color: '#d4d4d8' }}>{p}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Right — Form panel ── */}
            <div style={{
                display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                padding: '48px 64px',
                background: 'var(--c-bg)',
            }}>
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45 }}
                    style={{ width: '100%', maxWidth: 400 }}
                >
                    {/* Logo */}
                    <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48 }}>
                        <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
                            <rect width="28" height="28" rx="7" fill="#3b82f6" />
                            <path d="M8 14c0-3.314 2.686-6 6-6s6 2.686 6 6-2.686 6-6 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                            <circle cx="14" cy="14" r="2.5" fill="#fff" />
                        </svg>
                        <span style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Cerebro</span>
                    </Link>

                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 6 }}>Create your account</h1>
                    <p style={{ fontSize: '0.875rem', color: 'var(--c-text-2)', marginBottom: 36 }}>
                        Get started with Cerebro in under 2 minutes.
                    </p>

                    {/* Role toggle */}
                    <div style={{
                        display: 'flex',
                        background: 'var(--c-surface-2)',
                        border: '1px solid var(--c-border)',
                        borderRadius: 'var(--radius-sm)',
                        padding: 4, marginBottom: 28, gap: 4,
                    }}>
                        {['doctor', 'patient'].map(r => (
                            <button key={r} onClick={() => setRole(r)} style={{
                                flex: 1, padding: '7px 0', border: 'none', borderRadius: 4,
                                background: role === r ? 'var(--c-surface)' : 'transparent',
                                boxShadow: role === r ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
                                color: role === r ? 'var(--c-text)' : 'var(--c-text-3)',
                                fontFamily: 'inherit', fontSize: '0.83rem',
                                fontWeight: role === r ? 500 : 400,
                                cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.15s',
                            }}>{r}</button>
                        ))}
                    </div>

                    {/* Fields */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div>
                                <label>First name</label>
                                <input className="input" type="text" placeholder="John" />
                            </div>
                            <div>
                                <label>Last name</label>
                                <input className="input" type="text" placeholder="Doe" />
                            </div>
                        </div>
                        <div>
                            <label>Email address</label>
                            <input className="input" type="email" placeholder={role === 'doctor' ? 'doctor@hospital.org' : 'patient@email.com'} />
                        </div>
                        {role === 'doctor' && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ duration: 0.2 }}>
                                <label>Medical license / specialty</label>
                                <input className="input" type="text" placeholder="Radiology · LIC-00000" />
                            </motion.div>
                        )}
                        <div>
                            <label>Password</label>
                            <div style={{ position: 'relative' }}>
                                <input className="input" type={showPass ? 'text' : 'password'} placeholder="Min. 8 characters" style={{ paddingRight: 40 }} />
                                <button
                                    onClick={() => setShowPass(v => !v)}
                                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-text-3)', display: 'flex' }}
                                >
                                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <button className="btn btn-primary" style={{ width: '100%', padding: '11px', fontSize: '0.92rem' }}>
                        Create account
                    </button>

                    <p style={{ marginTop: 14, textAlign: 'center', fontSize: '0.78rem', color: 'var(--c-text-3)', lineHeight: 1.6 }}>
                        By creating an account you agree to our{' '}
                        <span style={{ color: 'var(--c-text-2)' }}>Terms of Service</span> and{' '}
                        <span style={{ color: 'var(--c-text-2)' }}>Privacy Policy</span>.
                    </p>

                    <p style={{ marginTop: 20, textAlign: 'center', fontSize: '0.84rem', color: 'var(--c-text-3)' }}>
                        Already have an account?{' '}
                        <Link to="/login" style={{ color: 'var(--c-accent)', fontWeight: 500 }}>Sign in</Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
