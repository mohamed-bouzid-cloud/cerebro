import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, User, CheckCircle, XCircle } from 'lucide-react';

const AppointmentSection = ({ appointments }) => {
    const [view, setView] = useState('upcoming');
    const now = new Date();

    const upcoming = appointments.filter(a => new Date(a.scheduled_at) >= now).sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
    const past = appointments.filter(a => new Date(a.scheduled_at) < now).sort((a, b) => new Date(b.scheduled_at) - new Date(a.scheduled_at));

    const AppointmentCard = ({ apt, isPast }) => (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '16px',
                padding: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                opacity: isPast ? 0.7 : 1
            }}
        >
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <div style={{
                    width: '64px',
                    height: '64px',
                    background: isPast ? 'rgba(255,255,255,0.05)' : 'rgba(59,130,246,0.1)',
                    borderRadius: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isPast ? '#888' : '#3b82f6'
                }}>
                    <span style={{ fontSize: '18px', fontWeight: 800 }}>{new Date(apt.scheduled_at).getDate()}</span>
                    <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}>
                        {new Date(apt.scheduled_at).toLocaleString('default', { month: 'short' })}
                    </span>
                </div>
                <div>
                    <h4 style={{ color: '#fff', fontSize: '17px', fontWeight: 600, margin: 0 }}>Dr. {apt.doctor_name}</h4>
                    <p style={{ color: '#3b82f6', fontSize: '13px', margin: '2px 0 0 0', fontWeight: 500 }}>{apt.doctor_specialty || 'General Practitioner'}</p>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                        <span style={{ color: '#888', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} /> {new Date(apt.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span style={{ color: '#888', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={12} /> Main Clinic, Suite 402
                        </span>
                    </div>
                </div>
            </div>

            <div style={{ textAlign: 'right' }}>
                <span style={{
                    background: apt.status === 'scheduled' ? 'rgba(59,130,246,0.1)' : apt.status === 'completed' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                    color: apt.status === 'scheduled' ? '#3b82f6' : apt.status === 'completed' ? '#10b981' : '#ef4444',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                }}>
                    {apt.status}
                </span>
                {isPast && apt.status === 'completed' && (
                    <p style={{ color: '#666', fontSize: '11px', margin: '8px 0 0 0', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                        <CheckCircle size={12} /> Summary Available
                    </p>
                )}
            </div>
        </motion.div>
    );

    return (
        <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '12px', width: 'fit-content' }}>
                {['upcoming', 'past'].map(t => (
                    <button
                        key={t}
                        onClick={() => setView(t)}
                        style={{
                            background: view === t ? '#3b82f6' : 'transparent',
                            color: view === t ? '#fff' : '#888',
                            border: 'none',
                            padding: '8px 20px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 600,
                            transition: 'all 0.2s',
                            textTransform: 'capitalize'
                        }}
                    >
                        {t}
                    </button>
                ))}
            </div>

            <div style={{ display: 'grid', gap: '16px' }}>
                {view === 'upcoming' ? (
                    upcoming.length > 0 ? upcoming.map((a, i) => <AppointmentCard key={i} apt={a} isPast={false} />) : <p style={{ color: '#888', textAlign: 'center', padding: '40px' }}>No upcoming appointments found.</p>
                ) : (
                    past.length > 0 ? past.map((a, i) => <AppointmentCard key={i} apt={a} isPast={true} />) : <p style={{ color: '#888', textAlign: 'center', padding: '40px' }}>No past appointments recorded.</p>
                )}
            </div>
        </div>
    );
};

export default AppointmentSection;
