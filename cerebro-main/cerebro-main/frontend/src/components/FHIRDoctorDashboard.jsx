import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../AuthContext';
import { motion } from 'framer-motion';
import { Calendar, Clock, User, AlertCircle, RefreshCw } from 'lucide-react';

const FHIRDoctorDashboard = () => {
    const { user } = useContext(AuthContext);
    const [appointments, setAppointments] = useState({
        today: [],
        upcoming: [],
        past: []
    });
    const [summary, setSummary] = useState({
        total_appointments: 0,
        today_count: 0,
        upcoming_count: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [source, setSource] = useState('fhir'); // 'fhir' or 'fallback'
    const [lastRefresh, setLastRefresh] = useState(null);

    useEffect(() => {
        if (user?.role === 'doctor') {
            fetchAppointments();
        }
    }, [user]);

    const fetchAppointments = async () => {
        setLoading(true);
        setError('');
        const token = localStorage.getItem('access_token');
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        try {
            // Try to fetch from FHIR server first
            const response = await fetch('http://localhost:8000/api/auth/fhir/doctor-dashboard/', {
                method: 'GET',
                headers
            });

            if (response.ok) {
                const data = await response.json();
                setAppointments(data.appointments);
                setSummary(data.summary);
                setSource(data.source); // 'fhir_server' or 'fallback'
                setLastRefresh(new Date());
            } else if (response.status === 503) {
                // FHIR server unavailable, fallback to local data
                const data = await response.json();
                setAppointments(data.appointments);
                setSource('fallback');
                setError(data.message || 'FHIR server unavailable, showing local data');
                setLastRefresh(new Date());
            } else {
                setError('Failed to fetch appointments');
            }
        } catch (err) {
            console.error('Error fetching appointments:', err);
            setError('Network error: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => {
        fetchAppointments();
    };

    const handleManualSync = async () => {
        const token = localStorage.getItem('access_token');
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        try {
            const response = await fetch('http://localhost:8000/api/auth/fhir-appointments/fetch_and_sync/', {
                method: 'POST',
                headers
            });

            if (response.ok) {
                const data = await response.json();
                alert(data.message);
                fetchAppointments(); // Refresh dashboard
            } else {
                alert('Sync failed');
            }
        } catch (err) {
            alert('Error: ' + err.message);
        }
    };

    const formatTime = (datetime) => {
        try {
            const date = new Date(datetime);
            return date.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return datetime;
        }
    };

    if (!user || user.role !== 'doctor') {
        return (
            <div style={{ padding: '20px', color: '#888' }}>
                Only doctors can view this dashboard.
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ padding: '20px' }}
        >
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
                flexWrap: 'wrap',
                gap: '12px'
            }}>
                <div>
                    <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 700, margin: 0 }}>
                        Doctor Dashboard
                    </h1>
                    <p style={{ color: '#888', fontSize: '14px', margin: '4px 0 0 0' }}>
                        {source === 'fhir' ? '📡 Live FHIR Data' : '💾 Local Fallback Data'}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={handleRefresh}
                        disabled={loading}
                        style={{
                            background: '#3b82f6',
                            color: '#fff',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        <RefreshCw size={16} />
                        Refresh
                    </button>
                    {source === 'fallback' && (
                        <button
                            onClick={handleManualSync}
                            style={{
                                background: '#10b981',
                                color: '#fff',
                                border: 'none',
                                padding: '8px 16px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: 500
                            }}
                        >
                            Sync with FHIR
                        </button>
                    )}
                </div>
            </div>

            {/* Status Info */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        background: 'rgba(59,130,246,0.1)',
                        border: '1px solid rgba(59,130,246,0.3)',
                        color: '#93c5fd',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        marginBottom: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '14px'
                    }}
                >
                    <AlertCircle size={18} />
                    {error}
                </motion.div>
            )}

            {lastRefresh && (
                <div style={{
                    color: '#888',
                    fontSize: '12px',
                    marginBottom: '16px'
                }}>
                    Last updated: {lastRefresh.toLocaleTimeString()}
                </div>
            )}

            {/* Summary Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '24px'
            }}>
                <motion.div
                    whileHover={{ y: -4 }}
                    style={{
                        background: 'rgba(59,130,246,0.1)',
                        border: '1px solid rgba(59,130,246,0.2)',
                        padding: '16px',
                        borderRadius: '8px'
                    }}
                >
                    <p style={{ color: '#888', fontSize: '13px', margin: '0 0 8px 0' }}>Total Appointments</p>
                    <h3 style={{ color: '#fff', fontSize: '32px', fontWeight: 700, margin: 0 }}>
                        {summary.total_appointments || 0}
                    </h3>
                </motion.div>

                <motion.div
                    whileHover={{ y: -4 }}
                    style={{
                        background: 'rgba(34,197,94,0.1)',
                        border: '1px solid rgba(34,197,94,0.2)',
                        padding: '16px',
                        borderRadius: '8px'
                    }}
                >
                    <p style={{ color: '#888', fontSize: '13px', margin: '0 0 8px 0' }}>Today</p>
                    <h3 style={{ color: '#86efac', fontSize: '32px', fontWeight: 700, margin: 0 }}>
                        {summary.today_count || 0}
                    </h3>
                </motion.div>

                <motion.div
                    whileHover={{ y: -4 }}
                    style={{
                        background: 'rgba(251,146,60,0.1)',
                        border: '1px solid rgba(251,146,60,0.2)',
                        padding: '16px',
                        borderRadius: '8px'
                    }}
                >
                    <p style={{ color: '#888', fontSize: '13px', margin: '0 0 8px 0' }}>Upcoming (7 days)</p>
                    <h3 style={{ color: '#fed7aa', fontSize: '32px', fontWeight: 700, margin: 0 }}>
                        {summary.upcoming_count || 0}
                    </h3>
                </motion.div>
            </div>

            {/* Appointments Section */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#888' }}>
                    <p>Loading appointments...</p>
                </div>
            ) : (
                <>
                    {/* Today's Appointments */}
                    {appointments.today && appointments.today.length > 0 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: '24px' }}>
                            <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>
                                Today's Appointments
                            </h2>
                            <div style={{ display: 'grid', gap: '12px' }}>
                                {appointments.today.map((appt, idx) => (
                                    <AppointmentCard key={idx} appointment={appt} />
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Upcoming Appointments */}
                    {appointments.upcoming && appointments.upcoming.length > 0 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>
                                Upcoming Appointments
                            </h2>
                            <div style={{ display: 'grid', gap: '12px' }}>
                                {appointments.upcoming.map((appt, idx) => (
                                    <AppointmentCard key={idx} appointment={appt} />
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* No appointments */}
                    {(!appointments.today || appointments.today.length === 0) &&
                        (!appointments.upcoming || appointments.upcoming.length === 0) && (
                        <div style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px dashed rgba(255,255,255,0.1)',
                            padding: '40px 20px',
                            borderRadius: '8px',
                            textAlign: 'center',
                            color: '#888'
                        }}>
                            <Calendar size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                            <p>No appointments scheduled</p>
                        </div>
                    )}
                </>
            )}
        </motion.div>
    );
};

// Appointment Card Component
const AppointmentCard = ({ appointment }) => {
    const statusColors = {
        'booked': '#3b82f6',
        'scheduled': '#3b82f6',
        'fulfilled': '#34c759',
        'completed': '#34c759',
        'cancelled': '#ef4444',
        'noshow': '#f59e0b'
    };

    const statusColor = statusColors[appointment.status] || '#888';

    return (
        <motion.div
            whileHover={{ x: 4 }}
            style={{
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid rgba(255,255,255,0.1)`,
                borderLeft: `4px solid ${statusColor}`,
                padding: '16px',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}
        >
            <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <User size={18} style={{ color: '#888' }} />
                    <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: 500, margin: 0 }}>
                        {appointment.patient || 'Unknown Patient'}
                    </h3>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#888', fontSize: '13px' }}>
                    <Clock size={16} />
                    {appointment.scheduled_at ? new Date(appointment.scheduled_at).toLocaleString() : 'TBD'}
                </div>
                {appointment.notes && (
                    <p style={{ color: '#aaa', fontSize: '13px', margin: '8px 0 0 0' }}>
                        {appointment.notes}
                    </p>
                )}
            </div>
            <div style={{
                background: statusColor + '20',
                color: statusColor,
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 500,
                whiteSpace: 'nowrap',
                marginLeft: '12px'
            }}>
                {appointment.status || 'pending'}
            </div>
        </motion.div>
    );
};

export default FHIRDoctorDashboard;
