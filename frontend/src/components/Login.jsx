import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../AuthContext';

export default function Login() {
    const [role, setRole] = useState('doctor');
    const [showPass, setShowPass] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);
        try {
            const user = await login(email, password);
            // Redirect based on user's actual role
            navigate(user.role === 'doctor' ? '/doctor-dashboard' : '/patient-dashboard');
        } catch (err) {
            const msg =
                err.response?.data?.non_field_errors?.[0] ||
                err.response?.data?.detail ||
                'Invalid email or password.';
            setError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '100vh' }}>

            {/* ── Left — Image panel ── */}
            <div style={{ position: 'relative', overflow: 'hidden', background: '#0a0a0f' }}>
                <img
                    src="/auth-bg.png"
                    alt="MRI scan"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }}
                />
                {/* Overlay content */}
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(135deg, rgba(9,9,11,0.65) 0%, rgba(9,9,11,0.2) 100%)',
                    display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                    padding: '48px',
                }}>
                    <blockquote style={{ borderLeft: '2px solid #3b82f6', paddingLeft: 20, maxWidth: 420 }}>
                        <p style={{ fontSize: '1.1rem', color: '#e4e4e7', lineHeight: 1.65, fontStyle: 'italic', marginBottom: 14 }}>
                            "Cerebro has transformed how our radiology department handles study distribution. Reports that took hours now take minutes."
                        </p>
                        <footer style={{ fontSize: '0.82rem', color: '#71717a' }}>
                            Dr. N. Benali · Chief Radiologist, University Hospital
                        </footer>
                    </blockquote>
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
                    style={{ width: '100%', maxWidth: 380 }}
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

                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 6 }}>Welcome back</h1>
                    <p style={{ fontSize: '0.875rem', color: 'var(--c-text-2)', marginBottom: 36 }}>
                        Sign in to your account to continue.
                    </p>

                    {/* Role toggle */}
                    <div style={{
                        display: 'flex',
                        background: 'var(--c-surface-2)',
                        border: '1px solid var(--c-border)',
                        borderRadius: 'var(--radius-sm)',
                        padding: 4,
                        marginBottom: 28,
                        gap: 4,
                    }}>
                        {['doctor', 'patient'].map(r => (
                            <button
                                key={r}
                                onClick={() => setRole(r)}
                                style={{
                                    flex: 1, padding: '7px 0',
                                    border: 'none',
                                    borderRadius: 4,
                                    background: role === r ? 'var(--c-surface)' : 'transparent',
                                    boxShadow: role === r ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
                                    color: role === r ? 'var(--c-text)' : 'var(--c-text-3)',
                                    fontFamily: 'inherit',
                                    fontSize: '0.83rem',
                                    fontWeight: role === r ? 500 : 400,
                                    cursor: 'pointer',
                                    textTransform: 'capitalize',
                                    transition: 'all 0.15s',
                                }}
                            >{r}</button>
                        ))}
                    </div>

                    {/* Error message */}
                    {error && (
                        <div style={{
                            background: 'rgba(239,68,68,0.1)',
                            border: '1px solid rgba(239,68,68,0.3)',
                            borderRadius: 6,
                            padding: '10px 14px',
                            marginBottom: 16,
                            fontSize: '0.84rem',
                            color: '#ef4444',
                        }}>
                            {error}
                        </div>
                    )}

                    {/* Fields */}
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
                            <div>
                                <label>Email address</label>
                                <input
                                    className="input"
                                    type="email"
                                    placeholder={role === 'doctor' ? 'doctor@hospital.org' : 'patient@email.com'}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                    <label style={{ margin: 0 }}>Password</label>
                                    <span style={{ fontSize: '0.78rem', color: 'var(--c-text-3)', cursor: 'pointer' }}>Forgot password?</span>
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        className="input"
                                        type={showPass ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        style={{ paddingRight: 40 }}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPass(v => !v)}
                                        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-text-3)', display: 'flex' }}
                                    >
                                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={submitting}
                            style={{ width: '100%', padding: '11px', fontSize: '0.92rem', opacity: submitting ? 0.7 : 1 }}
                        >
                            {submitting ? 'Signing in…' : 'Sign in'}
                        </button>
                    </form>

                    <p style={{ marginTop: 24, textAlign: 'center', fontSize: '0.84rem', color: 'var(--c-text-3)' }}>
                        Don't have an account?{' '}
                        <Link to="/signup" style={{ color: 'var(--c-accent)', fontWeight: 500 }}>Create one</Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
