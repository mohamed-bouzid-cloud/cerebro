import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    LayoutDashboard, ScanLine, FileText, Calendar,
    Settings, LogOut, Bell, Search, ChevronDown,
    TrendingUp, Clock, CheckCircle, AlertCircle
} from 'lucide-react';
import { useAuth } from '../AuthContext';

const NAV = [
    { icon: LayoutDashboard, label: 'Dashboard', active: true },
    { icon: ScanLine, label: 'DICOM Viewer' },
    { icon: FileText, label: 'Reports' },
    { icon: Calendar, label: 'Appointments' },
    { icon: Settings, label: 'Settings' },
];

const STATS = [
    { label: 'Total Scans', value: '1,284', delta: '+12%', icon: ScanLine, positive: true },
    { label: 'Pending Reports', value: '47', delta: '-8%', icon: Clock, positive: false },
    { label: 'Completed Today', value: '23', delta: '+5%', icon: CheckCircle, positive: true },
    { label: 'Critical Flags', value: '3', delta: '+2', icon: AlertCircle, positive: false },
];

const SCANS = [
    { patient: 'K. Martinez', id: '#PT-1021', type: 'CT Chest', date: 'Today, 09:14', status: 'Pending' },
    { patient: 'A. Dupont', id: '#PT-0987', type: 'MRI Brain', date: 'Today, 08:45', status: 'In Review' },
    { patient: 'L. Chen', id: '#PT-1103', type: 'X-Ray Lumbar', date: 'Yesterday', status: 'Completed' },
    { patient: 'M. Rossi', id: '#PT-1089', type: 'PET Scan', date: 'Yesterday', status: 'Completed' },
    { patient: 'S. Okafor', id: '#PT-1055', type: 'CT Abdomen', date: 'Mar 28', status: 'Flagged' },
];

const STATUS_COLORS = {
    Pending: { bg: 'rgba(234,179,8,0.1)', color: '#eab308', border: 'rgba(234,179,8,0.25)' },
    'In Review': { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: 'rgba(59,130,246,0.25)' },
    Completed: { bg: 'rgba(34,197,94,0.1)', color: '#22c55e', border: 'rgba(34,197,94,0.25)' },
    Flagged: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'rgba(239,68,68,0.25)' },
};

export default function Dashboard() {
    const [activeNav, setActiveNav] = useState('Dashboard');
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // Derive display values from the authenticated user
    const fullName = user ? `${user.first_name} ${user.last_name}` : 'User';
    const initials = user ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase() : 'U';
    const roleLabel = user?.role === 'doctor'
        ? (user.profile?.specialty || 'Doctor')
        : 'Patient';
    const displayTitle = user?.role === 'doctor' ? `Dr. ${user.last_name}` : fullName;

    const handleSignOut = () => {
        logout();
        navigate('/');
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--c-bg)' }}>

            {/* ── Sidebar ── */}
            <aside style={{
                width: 228, flexShrink: 0,
                background: 'var(--c-surface)',
                borderRight: '1px solid var(--c-border)',
                display: 'flex', flexDirection: 'column',
                padding: '0',
            }}>
                {/* Logo */}
                <div style={{ padding: '20px 20px', borderBottom: '1px solid var(--c-border)' }}>
                    <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
                            <rect width="28" height="28" rx="7" fill="#3b82f6" />
                            <path d="M8 14c0-3.314 2.686-6 6-6s6 2.686 6 6-2.686 6-6 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                            <circle cx="14" cy="14" r="2.5" fill="#fff" />
                        </svg>
                        <span style={{ fontSize: '0.98rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--c-text)' }}>Cerebro</span>
                    </Link>
                </div>

                {/* Nav items */}
                <nav style={{ flex: 1, padding: '12px 10px' }}>
                    <p style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--c-text-3)', letterSpacing: '0.09em', textTransform: 'uppercase', padding: '8px 10px', marginBottom: 4 }}>Workspace</p>
                    {NAV.map(({ icon: Icon, label }) => {
                        const isActive = activeNav === label;
                        return (
                            <button
                                key={label}
                                onClick={() => setActiveNav(label)}
                                style={{
                                    width: '100%', display: 'flex', alignItems: 'center', gap: 11,
                                    padding: '9px 10px', borderRadius: 6, border: 'none',
                                    background: isActive ? 'var(--c-surface-2)' : 'transparent',
                                    color: isActive ? 'var(--c-text)' : 'var(--c-text-3)',
                                    fontFamily: 'inherit', fontSize: '0.875rem',
                                    fontWeight: isActive ? 500 : 400,
                                    cursor: 'pointer', transition: 'all 0.12s',
                                    marginBottom: 2, textAlign: 'left',
                                }}
                                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--c-surface-2)'; e.currentTarget.style.color = 'var(--c-text)'; }}
                                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--c-text-3)'; } }}
                            >
                                <Icon size={16} />
                                {label}
                            </button>
                        );
                    })}
                </nav>

                {/* User */}
                <div style={{ padding: '16px 10px', borderTop: '1px solid var(--c-border)' }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 10px', borderRadius: 6,
                        background: 'var(--c-surface-2)', marginBottom: 4,
                    }}>
                        <div style={{
                            width: 32, height: 32, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.75rem', fontWeight: 700, color: '#fff', flexShrink: 0,
                        }}>{initials}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.83rem', fontWeight: 500, color: 'var(--c-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {user?.role === 'doctor' ? `Dr. ${user.first_name} ${user.last_name}` : fullName}
                            </div>
                            <div style={{ fontSize: '0.73rem', color: 'var(--c-text-3)' }}>{roleLabel}</div>
                        </div>
                        <ChevronDown size={14} color="var(--c-text-3)" />
                    </div>
                    <button
                        onClick={handleSignOut}
                        style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                            padding: '8px 10px', border: 'none', borderRadius: 6,
                            background: 'transparent', color: 'var(--c-text-3)',
                            fontFamily: 'inherit', fontSize: '0.82rem',
                            cursor: 'pointer', transition: 'all 0.12s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--c-surface-2)'; e.currentTarget.style.color = 'var(--c-text)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--c-text-3)'; }}
                    >
                        <LogOut size={14} /> Sign out
                    </button>
                </div>
            </aside>

            {/* ── Main content ── */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

                {/* Top bar */}
                <header style={{
                    height: 57, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0 32px',
                    borderBottom: '1px solid var(--c-border)',
                    background: 'var(--c-surface)',
                    flexShrink: 0,
                }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        background: 'var(--c-surface-2)', border: '1px solid var(--c-border)',
                        borderRadius: 'var(--radius-sm)', padding: '7px 14px', width: 280,
                    }}>
                        <Search size={14} color="var(--c-text-3)" />
                        <input style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--c-text)', fontFamily: 'inherit', fontSize: '0.85rem', width: '100%' }} placeholder="Search patients, studies..." />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button style={{ background: 'none', border: '1px solid var(--c-border)', borderRadius: 'var(--radius-sm)', padding: '7px', display: 'flex', cursor: 'pointer', color: 'var(--c-text-2)' }}>
                            <Bell size={16} />
                        </button>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#fff' }}>{initials}</div>
                    </div>
                </header>

                {/* Page content */}
                <main style={{ flex: 1, overflow: 'auto', padding: '32px' }}>
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>

                        {/* Page header */}
                        <div style={{ marginBottom: 28 }}>
                            <h1 style={{ fontSize: '1.35rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 }}>Dashboard</h1>
                            <p style={{ fontSize: '0.875rem', color: 'var(--c-text-2)' }}>
                                {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} — Welcome back, {displayTitle}.
                            </p>
                        </div>

                        {/* Stats grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
                            {STATS.map(s => {
                                const Icon = s.icon;
                                return (
                                    <div key={s.label} style={{
                                        background: 'var(--c-surface)',
                                        border: '1px solid var(--c-border)',
                                        borderRadius: 'var(--radius-md)',
                                        padding: '20px 20px',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--c-text-2)', fontWeight: 500 }}>{s.label}</span>
                                            <Icon size={15} color="var(--c-text-3)" />
                                        </div>
                                        <div style={{ fontSize: '1.7rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 6 }}>{s.value}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem' }}>
                                            <TrendingUp size={12} color={s.positive ? '#22c55e' : '#ef4444'} />
                                            <span style={{ color: s.positive ? '#22c55e' : '#ef4444', fontWeight: 500 }}>{s.delta}</span>
                                            <span style={{ color: 'var(--c-text-3)' }}>this week</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Studies table */}
                        <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 'var(--radius-md)' }}>
                            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--c-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <h2 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 2 }}>Recent Studies</h2>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--c-text-3)' }}>All imaging studies assigned to you</p>
                                </div>
                                <button className="btn btn-ghost" style={{ fontSize: '0.82rem', padding: '7px 14px' }}>View all</button>
                            </div>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--c-border)' }}>
                                        {['Patient', 'Study Type', 'Date', 'Status', ''].map(h => (
                                            <th key={h} style={{ padding: '10px 24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: 'var(--c-text-3)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {SCANS.map((s, i) => {
                                        const sc = STATUS_COLORS[s.status];
                                        return (
                                            <tr key={i} style={{ borderBottom: i < SCANS.length - 1 ? '1px solid var(--c-border)' : 'none', transition: 'background 0.1s' }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'var(--c-surface-2)'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <td style={{ padding: '14px 24px' }}>
                                                    <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{s.patient}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--c-text-3)' }}>{s.id}</div>
                                                </td>
                                                <td style={{ padding: '14px 24px', fontSize: '0.875rem', color: 'var(--c-text-2)' }}>{s.type}</td>
                                                <td style={{ padding: '14px 24px', fontSize: '0.82rem', color: 'var(--c-text-3)' }}>{s.date}</td>
                                                <td style={{ padding: '14px 24px' }}>
                                                    <span style={{
                                                        display: 'inline-block', padding: '3px 10px', borderRadius: 999,
                                                        fontSize: '0.75rem', fontWeight: 500,
                                                        background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`,
                                                    }}>{s.status}</span>
                                                </td>
                                                <td style={{ padding: '14px 24px' }}>
                                                    <button className="btn btn-ghost" style={{ fontSize: '0.78rem', padding: '5px 12px' }}>Open</button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                    </motion.div>
                </main>
            </div>
        </div>
    );
}
