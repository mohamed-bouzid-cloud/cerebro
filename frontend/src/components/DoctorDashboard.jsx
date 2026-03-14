import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    MessageSquare, FileText, Plus, ChevronRight, Clock, CheckCircle, Zap,
    AlertCircle, Users, TrendingUp, LogOut, Send, ImageIcon
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import DicomViewer from './DicomViewer';

const DoctorDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [myPatients, setMyPatients] = useState([]);
    const [messages, setMessages] = useState([]);
    const [consultations, setConsultations] = useState([]);
    const [prescriptions, setPrescriptions] = useState([]);
    const [referrals, setReferrals] = useState([]);
    const [labOrders, setLabOrders] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [dicomStudies, setDicomStudies] = useState([]);
    const [selectedDicomStudy, setSelectedDicomStudy] = useState(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        console.clear();
        console.log('===== DOCTOR DASHBOARD LOADING =====');
        console.log('User:', user?.first_name, user?.last_name, `(${user?.role})`);

        const token = localStorage.getItem('access_token');
        const headers = { Authorization: `Bearer ${token}` };

        try {
            console.log('📊 Fetching dashboard data...');
            const [patientsRes, messagesRes, consultationsRes, prescriptionsRes, referralsRes, labOrdersRes, appointmentsRes, dicomRes, fhirRes] = await Promise.all([
                fetch('http://localhost:8000/api/auth/patients/', { headers }),
                fetch('http://localhost:8000/api/auth/messages/', { headers }),
                fetch('http://localhost:8000/api/auth/consultations/', { headers }),
                fetch('http://localhost:8000/api/auth/prescriptions/', { headers }),
                fetch('http://localhost:8000/api/auth/referrals/', { headers }),
                fetch('http://localhost:8000/api/auth/lab-results/', { headers }),
                fetch('http://localhost:8000/api/auth/appointments/today/', { headers }),
                fetch('http://localhost:8000/api/auth/dicom-studies/', { headers }),
                fetch('http://localhost:8000/api/auth/fhir/servicerequests/', { headers })
            ]);

            if (patientsRes.ok) setMyPatients(await patientsRes.json());
            if (messagesRes.ok) setMessages(await messagesRes.json());

            // Fetch consultations
            let apiConsultations = [];
            if (consultationsRes.ok) {
                apiConsultations = await consultationsRes.json();
                console.log('✓ Loaded', apiConsultations.length, 'consultations from API');
            }

            // Fetch FHIR ServiceRequests
            let fhirConsultations = [];
            if (fhirRes.ok) {
                const fhirData = await fhirRes.json();
                console.log('✓ Loaded', fhirData.length, 'FHIR ServiceRequests');
                // Transform FHIR to consultation format
                fhirConsultations = fhirData.map(sr => ({
                    id: sr.id,
                    patient_name: sr.subject?.display || 'Unknown Patient',
                    doctor_name: sr.performer?.[0]?.display,
                    consultation_type: sr.code?.text || 'Consultation',
                    reason: sr.reasonCode?.[0]?.text || 'No reason',
                    status: sr.status || 'requested',
                    _fhir: true
                }));
            }

            // Merge both sources
            const mergedConsultations = [...apiConsultations, ...fhirConsultations];
            setConsultations(mergedConsultations);
            console.log('✓ Total consultations to display:', mergedConsultations.length);

            if (prescriptionsRes.ok) setPrescriptions(await prescriptionsRes.json());
            if (referralsRes.ok) setReferrals(await referralsRes.json());
            if (labOrdersRes.ok) setLabOrders(await labOrdersRes.json());
            if (appointmentsRes.ok) setAppointments(await appointmentsRes.json());
            if (dicomRes.ok) {
                const data = await dicomRes.json();
                setDicomStudies(data.results || data);
            }
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        }
    };

    const unreadMessages = messages.filter(m => !m.read && m.recipient === user?.id).length;
    const pendingConsultations = consultations.filter(c => c.status === 'requested').length;
    const pendingReferrals = referrals.filter(r => r.status === 'pending').length;

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const tabs = [
        { id: 'overview', label: 'Overview', icon: Zap },
        { id: 'patients', label: 'My Patients', icon: Users },
        { id: 'consultations', label: 'Consultations', icon: FileText, badge: pendingConsultations },
        { id: 'messages', label: 'Messages', icon: MessageSquare, badge: unreadMessages },
        { id: 'prescriptions', label: 'Prescriptions', icon: FileText },
        { id: 'labs', label: 'Lab Orders', icon: Zap },
        { id: 'referrals', label: 'Referrals', icon: Send, badge: pendingReferrals },
        { id: 'imaging', label: 'DICOM Imaging', icon: ImageIcon }
    ];

    return (
        <div style={{ minHeight: '100vh', background: '#0f1419' }}>
            {/* Header */}
            <header style={{
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                padding: '16px 32px',
                background: 'rgba(15,20,25,0.8)',
                backdropFilter: 'blur(10px)'
            }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', margin: 0 }}>
                            Dr. {user?.last_name}
                        </h1>
                        <p style={{ color: '#888', margin: '4px 0 0 0', fontSize: '14px' }}>
                            {user?.profile?.specialty} | Doctor Dashboard
                        </p>
                    </div>
                    <button
                        onClick={handleLogout}
                        style={{
                            background: 'transparent',
                            border: '1px solid #333',
                            color: '#888',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '14px'
                        }}
                    >
                        <LogOut size={16} />
                        Logout
                    </button>
                </div>
            </header>

            {/* Tabs */}
            <div style={{
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(15,20,25,0.5)',
                overflowX: 'auto',
                padding: '0 32px'
            }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', gap: '2px' }}>
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    background: isActive ? 'rgba(59,130,246,0.2)' : 'transparent',
                                    border: 'none',
                                    color: isActive ? '#3b82f6' : '#888',
                                    padding: '12px 16px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    position: 'relative',
                                    borderBottom: isActive ? '2px solid #3b82f6' : 'none'
                                }}
                            >
                                <Icon size={16} />
                                {tab.label}
                                {tab.badge > 0 && (
                                    <span style={{
                                        background: '#ef4444',
                                        color: '#fff',
                                        borderRadius: '12px',
                                        padding: '0 6px',
                                        fontSize: '12px',
                                        fontWeight: 600
                                    }}>
                                        {tab.badge}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content */}
            <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px' }}>

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div>
                        {/* Quick Stats */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '32px' }}>
                            {[
                                { label: 'My Patients', value: myPatients.length, icon: Users, color: '#3b82f6' },
                                { label: 'Todays Appointments', value: appointments.length, icon: Clock, color: '#10b981' },
                                { label: 'Pending Consultations', value: pendingConsultations, icon: FileText, color: '#f59e0b' },
                                { label: 'Unread Messages', value: unreadMessages, icon: MessageSquare, color: '#8b5cf6' },
                                { label: 'Open Referrals', value: pendingReferrals, icon: Send, color: '#ef4444' }
                            ].map((stat, idx) => {
                                const Icon = stat.icon;
                                return (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        style={{
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '12px',
                                            padding: '20px',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s'
                                        }}
                                        whileHover={{ background: 'rgba(255,255,255,0.08)' }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <p style={{ color: '#888', fontSize: '14px', margin: 0 }}>{stat.label}</p>
                                                <p style={{ color: '#fff', fontSize: '36px', fontWeight: 800, margin: '8px 0 0 0', letterSpacing: '-1px' }}>{stat.value}</p>
                                            </div>
                                            <div style={{ background: `rgba(${stat.color === '#3b82f6' ? '59,130,246' : stat.color === '#10b981' ? '16,185,129' : stat.color === '#f59e0b' ? '245,158,11' : stat.color === '#8b5cf6' ? '139,92,246' : '239,68,68'}, 0.2)`, padding: '12px', borderRadius: '12px' }}>
                                                <Icon size={24} style={{ color: stat.color }} />
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Today's Appointments */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                padding: '20px',
                                marginBottom: '20px'
                            }}
                        >
                            <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: 600, margin: '0 0 16px 0' }}>Today's Appointments</h2>
                            {appointments.length > 0 ? (
                                <div style={{ display: 'grid', gap: '12px' }}>
                                    {appointments.slice(0, 4).map((apt, idx) => (
                                        <div key={idx} style={{
                                            background: 'rgba(255,255,255,0.02)',
                                            border: '1px solid rgba(255,255,255,0.05)',
                                            borderRadius: '8px',
                                            padding: '12px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <div>
                                                <p style={{ color: '#fff', fontWeight: 500, margin: 0 }}>{apt.patient_name}</p>
                                                <p style={{ color: '#888', fontSize: '14px', margin: '4px 0 0 0' }}>
                                                    <Clock size={14} style={{ display: 'inline', marginRight: '4px' }} />
                                                    {new Date(apt.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                            <span style={{
                                                background: '#10b981',
                                                color: '#fff',
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontSize: '12px'
                                            }}>
                                                On Schedule
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p style={{ color: '#888', margin: 0 }}>No appointments today</p>
                            )}
                        </motion.div>

                        {/* Pending Actions */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                padding: '20px'
                            }}
                        >
                            <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: 600, margin: '0 0 16px 0' }}>Pending Actions</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                                {[
                                    { label: 'Pending Consultations', count: pendingConsultations, color: '#f59e0b' },
                                    { label: 'Pending Referrals', count: pendingReferrals, color: '#ef4444' },
                                    { label: 'Unread Messages', count: unreadMessages, color: '#8b5cf6' }
                                ].map((action, idx) => (
                                    <div key={idx} style={{
                                        background: 'rgba(255,255,255,0.02)',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        borderRadius: '8px',
                                        padding: '16px',
                                        textAlign: 'center'
                                    }}>
                                        <p style={{ color: '#888', fontSize: '14px', margin: 0 }}>{action.label}</p>
                                        <p style={{ color: action.color, fontSize: '32px', fontWeight: 700, margin: '8px 0 0 0' }}>
                                            {action.count}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* My Patients Tab */}
                {activeTab === 'patients' && (
                    <div>
                        <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 600, margin: '0 0 16px 0' }}>My Patients ({myPatients.length})</h2>
                        {myPatients.length > 0 ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                                {myPatients.map((patient, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        style={{
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '16px',
                                            padding: '24px',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}
                                        whileHover={{ background: 'rgba(255,255,255,0.08)' }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                            <div style={{
                                                width: '48px',
                                                height: '48px',
                                                borderRadius: '24px',
                                                background: 'rgba(59,130,246,0.1)',
                                                color: '#3b82f6',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '18px',
                                                fontWeight: 700
                                            }}>
                                                {patient.first_name[0]}{patient.last_name[0]}
                                            </div>
                                            <div>
                                                <p style={{ color: '#fff', fontSize: '18px', fontWeight: 600, margin: 0 }}>{patient.first_name} {patient.last_name}</p>
                                                <p style={{ color: '#888', fontSize: '14px', margin: '4px 0 0 0' }}>
                                                    {patient.email}
                                                </p>
                                                <p style={{ color: '#888', fontSize: '14px', margin: '4px 0 0 0' }}>
                                                    {patient.phone || 'No phone provided'}
                                                </p>
                                            </div>
                                        </div>
                                        <ChevronRight size={24} style={{ color: '#888' }} />
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ color: '#888', textAlign: 'center', padding: '40px' }}>No patients linked yet</p>
                        )}
                    </div>
                )}

                {/* Consultations Tab */}
                {activeTab === 'consultations' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 600, margin: 0 }}>Consultations</h2>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button style={{
                                    background: '#3b82f6',
                                    color: '#fff',
                                    border: 'none',
                                    padding: '8px 16px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: 500
                                }}>
                                    View All
                                </button>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gap: '12px' }}>
                            {/* Pending */}
                            <div>
                                <h3 style={{ color: '#f59e0b', fontSize: '14px', fontWeight: 600, margin: '0 0 12px 0' }}>Pending ({pendingConsultations})</h3>
                                {consultations.filter(c => c.status === 'requested').length > 0 ? (
                                    consultations.filter(c => c.status === 'requested').map((consultation, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            style={{
                                                background: 'rgba(255,255,255,0.05)',
                                                border: '1px solid rgba(245,158,11,0.3)',
                                                borderRadius: '16px',
                                                padding: '24px',
                                                marginBottom: '12px'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                                <div style={{ display: 'flex', gap: '16px' }}>
                                                    <div style={{
                                                        background: 'rgba(245,158,11,0.1)',
                                                        padding: '16px',
                                                        borderRadius: '16px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}>
                                                        <FileText size={28} style={{ color: '#f59e0b' }} />
                                                    </div>
                                                    <div>
                                                        <p style={{ color: '#fff', fontSize: '18px', fontWeight: 600, margin: 0 }}>{consultation.patient_name}</p>
                                                        <p style={{ color: '#888', fontSize: '14px', margin: '4px 0 0 0', textTransform: 'capitalize' }}>
                                                            {consultation.consultation_type} Consultation
                                                        </p>
                                                        <p style={{ color: '#888', fontSize: '13px', margin: '8px 0 0 0', fontStyle: 'italic' }}>
                                                            "{consultation.reason}"
                                                        </p>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                    <button
                                                        onClick={() => navigate('/doctor/dicom-viewer')}
                                                        style={{
                                                            background: 'rgba(59,130,246,0.15)',
                                                            color: '#60a5fa',
                                                            border: '1px solid rgba(59,130,246,0.4)',
                                                            padding: '8px 14px',
                                                            borderRadius: '8px',
                                                            cursor: 'pointer',
                                                            fontSize: '13px',
                                                            fontWeight: 600
                                                        }}
                                                    >
                                                        Voir DICOM
                                                    </button>
                                                    <button style={{
                                                        background: '#10b981',
                                                        color: '#fff',
                                                        border: 'none',
                                                        padding: '8px 16px',
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                        fontSize: '13px',
                                                        fontWeight: 600
                                                    }}>
                                                        Accept
                                                    </button>
                                                    <button style={{
                                                        background: 'rgba(239,68,68,0.1)',
                                                        color: '#ef4444',
                                                        border: '1px solid rgba(239,68,68,0.3)',
                                                        padding: '8px 16px',
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                        fontSize: '13px',
                                                        fontWeight: 600
                                                    }}>
                                                        Reject
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <p style={{ color: '#888', margin: 0 }}>No pending consultations</p>
                                )}
                            </div>

                            {/* Accepted */}
                            <div style={{ marginTop: '24px' }}>
                                <h3 style={{ color: '#10b981', fontSize: '14px', fontWeight: 600, margin: '0 0 12px 0' }}>Scheduled ({consultations.filter(c => c.status === 'scheduled').length})</h3>
                                {consultations.filter(c => c.status === 'scheduled').length > 0 ? (
                                    consultations.filter(c => c.status === 'scheduled').map((consultation, idx) => (
                                        <div key={idx} style={{
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(16,185,129,0.3)',
                                            borderRadius: '16px',
                                            padding: '24px',
                                            marginBottom: '12px'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ display: 'flex', gap: '16px' }}>
                                                    <div style={{
                                                        background: 'rgba(16,185,129,0.1)',
                                                        padding: '16px',
                                                        borderRadius: '16px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}>
                                                        <CheckCircle size={28} style={{ color: '#10b981' }} />
                                                    </div>
                                                    <div>
                                                        <p style={{ color: '#fff', fontSize: '18px', fontWeight: 600, margin: 0 }}>{consultation.patient_name}</p>
                                                        <p style={{ color: '#888', fontSize: '14px', margin: '4px 0 0 0', textTransform: 'capitalize' }}>
                                                            {consultation.consultation_type} Consultation
                                                        </p>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                    <button
                                                        onClick={() => navigate('/doctor/dicom-viewer')}
                                                        style={{
                                                            background: 'rgba(59,130,246,0.15)',
                                                            color: '#60a5fa',
                                                            border: '1px solid rgba(59,130,246,0.4)',
                                                            padding: '8px 14px',
                                                            borderRadius: '8px',
                                                            cursor: 'pointer',
                                                            fontSize: '13px',
                                                            fontWeight: 600
                                                        }}
                                                    >
                                                        Voir DICOM
                                                    </button>
                                                    <button style={{
                                                        background: '#3b82f6',
                                                        color: '#fff',
                                                        border: 'none',
                                                        padding: '8px 16px',
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                        fontSize: '13px',
                                                        fontWeight: 600
                                                    }}>
                                                        Complete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p style={{ color: '#888', margin: 0 }}>No accepted consultations</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Messages Tab */}
                {activeTab === 'messages' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 600, margin: 0 }}>Messages</h2>
                            <button style={{
                                background: '#3b82f6',
                                color: '#fff',
                                border: 'none',
                                padding: '8px 16px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: 500,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <Plus size={16} />
                                New Message
                            </button>
                        </div>
                        {messages.length > 0 ? (
                            <div style={{ display: 'grid', gap: '12px' }}>
                                {messages.slice(0, 8).map((msg, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        style={{
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '12px',
                                            padding: '16px',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s'
                                        }}
                                        whileHover={{ background: 'rgba(255,255,255,0.08)' }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                    <p style={{ color: '#fff', fontWeight: 600, margin: 0 }}>{msg.sender_name}</p>
                                                    {!msg.read && <span style={{ width: '8px', height: '8px', background: '#3b82f6', borderRadius: '50%' }} />}
                                                </div>
                                                <p style={{ color: '#fff', fontWeight: 500, margin: 0 }}>{msg.subject}</p>
                                                <p style={{ color: '#888', fontSize: '14px', margin: '4px 0 0 0' }}>
                                                    {msg.content.substring(0, 80)}...
                                                </p>
                                            </div>
                                            <p style={{ color: '#888', fontSize: '12px', margin: 0, whiteSpace: 'nowrap' }}>
                                                {new Date(msg.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ color: '#888', textAlign: 'center', padding: '40px' }}>No messages yet</p>
                        )}
                    </div>
                )}

                {/* Prescriptions Tab */}
                {activeTab === 'prescriptions' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 600, margin: 0 }}>Prescriptions</h2>
                            <button style={{
                                background: '#3b82f6',
                                color: '#fff',
                                border: 'none',
                                padding: '8px 16px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: 500,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <Plus size={16} />
                                New Prescription
                            </button>
                        </div>
                        {prescriptions.length > 0 ? (
                            <div style={{ display: 'grid', gap: '12px' }}>
                                {prescriptions.map((prescription, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        style={{
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '16px',
                                            padding: '24px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between'
                                        }}
                                    >
                                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                            <div style={{
                                                background: 'rgba(16,185,129,0.1)',
                                                padding: '16px',
                                                borderRadius: '16px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                <FileText size={28} style={{ color: '#10b981' }} />
                                            </div>
                                            <div>
                                                <p style={{ color: '#fff', fontSize: '18px', fontWeight: 600, margin: '0 0 4px 0' }}>{prescription.medication_name}</p>
                                                <p style={{ color: '#888', fontSize: '14px', margin: 0, fontWeight: 500 }}>
                                                    {prescription.patient_name} &bull; {prescription.dosage} &bull; {prescription.frequency}
                                                </p>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
                                                <span style={{ color: '#888', fontSize: '13px' }}>Refills:</span>
                                                <span style={{
                                                    background: prescription.refills_remaining > 0 ? 'rgba(59,130,246,0.2)' : 'rgba(239,68,68,0.2)',
                                                    color: prescription.refills_remaining > 0 ? '#3b82f6' : '#ef4444',
                                                    padding: '4px 12px',
                                                    borderRadius: '12px',
                                                    fontSize: '14px',
                                                    fontWeight: 700
                                                }}>
                                                    {prescription.refills_remaining}
                                                </span>
                                            </div>
                                            <span style={{
                                                background: prescription.status === 'active' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
                                                color: prescription.status === 'active' ? '#10b981' : '#ef4444',
                                                padding: '4px 12px',
                                                borderRadius: '12px',
                                                fontSize: '13px',
                                                fontWeight: 700,
                                                letterSpacing: '0.5px'
                                            }}>
                                                {prescription.status.toUpperCase()}
                                            </span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ color: '#888', textAlign: 'center', padding: '40px' }}>No prescriptions yet</p>
                        )}
                    </div>
                )}

                {/* Lab Orders Tab */}
                {activeTab === 'labs' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 600, margin: 0 }}>Lab Orders</h2>
                            <button style={{
                                background: '#3b82f6',
                                color: '#fff',
                                border: 'none',
                                padding: '8px 16px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: 500,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <Plus size={16} />
                                Order Lab Test
                            </button>
                        </div>
                        {labOrders.length > 0 ? (
                            <div style={{ display: 'grid', gap: '12px' }}>
                                {labOrders.map((result, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        style={{
                                            background: 'rgba(255,255,255,0.05)',
                                            border: result.is_abnormal ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '12px',
                                            padding: '16px'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <p style={{ color: '#fff', fontWeight: 600, margin: 0 }}>{result.test_name}</p>
                                                    {result.is_abnormal && <AlertCircle size={16} style={{ color: '#ef4444' }} />}
                                                </div>
                                                <p style={{ color: '#888', fontSize: '14px', margin: '4px 0 0 0' }}>
                                                    Patient: {result.patient_name}
                                                </p>
                                                <p style={{ color: '#888', fontSize: '14px', margin: '4px 0 0 0' }}>
                                                    {new Date(result.test_date).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <span style={{
                                                background: result.status === 'completed' ? '#10b981' : '#f59e0b',
                                                color: '#fff',
                                                padding: '6px 12px',
                                                borderRadius: '4px',
                                                fontSize: '12px'
                                            }}>
                                                {result.status}
                                            </span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ color: '#888', textAlign: 'center', padding: '40px' }}>No lab orders yet</p>
                        )}
                    </div>
                )}

                {/* Referrals Tab */}
                {activeTab === 'referrals' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 600, margin: 0 }}>Referrals</h2>
                            <button style={{
                                background: '#3b82f6',
                                color: '#fff',
                                border: 'none',
                                padding: '8px 16px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: 500,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <Plus size={16} />
                                New Referral
                            </button>
                        </div>
                        <div style={{ display: 'grid', gap: '12px' }}>
                            {/* Sent Referrals */}
                            <div>
                                <h3 style={{ color: '#fff', fontSize: '14px', fontWeight: 600, margin: '0 0 12px 0' }}>Sent Referrals</h3>
                                {referrals.filter(r => r.referred_by === user?.id).length > 0 ? (
                                    referrals.filter(r => r.referred_by === user?.id).map((referral, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            style={{
                                                background: 'rgba(255,255,255,0.05)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '12px',
                                                padding: '16px',
                                                marginBottom: '8px'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                                <div style={{ flex: 1 }}>
                                                    <p style={{ color: '#fff', fontWeight: 600, margin: 0 }}>{referral.patient_name}</p>
                                                    <p style={{ color: '#888', fontSize: '14px', margin: '4px 0 0 0' }}>
                                                        To: Dr. {referral.to_doctor_name}
                                                    </p>
                                                    <p style={{ color: '#888', fontSize: '14px', margin: '4px 0 0 0' }}>
                                                        Specialty: {referral.specialty_requested}
                                                    </p>
                                                </div>
                                                <span style={{
                                                    background: referral.status === 'pending' ? '#f59e0b' : referral.status === 'accepted' ? '#10b981' : '#ef4444',
                                                    color: '#fff',
                                                    padding: '6px 12px',
                                                    borderRadius: '4px',
                                                    fontSize: '12px'
                                                }}>
                                                    {referral.status}
                                                </span>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <p style={{ color: '#888', margin: 0 }}>No sent referrals</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* DICOM Imaging Tab */}
                {activeTab === 'imaging' && (
                    <div>
                        {/* ── Hero card — toujours visible ── */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{
                                background: 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(139,92,246,0.15) 100%)',
                                border: '1px solid rgba(59,130,246,0.35)',
                                borderRadius: '16px',
                                padding: '32px',
                                marginBottom: '28px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: '24px',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                <div style={{
                                    background: 'rgba(59,130,246,0.2)',
                                    border: '1px solid rgba(59,130,246,0.4)',
                                    borderRadius: '16px',
                                    padding: '18px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                    <ImageIcon size={36} style={{ color: '#60a5fa' }} />
                                </div>
                                <div>
                                    <h2 style={{ color: '#fff', fontSize: '22px', fontWeight: 700, margin: '0 0 6px 0' }}>
                                        Viewer DICOM — Cerebro
                                    </h2>
                                    <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>
                                        Visualisez les fichiers .IMA de vos patients avec zoom interactif et segmentation.
                                    </p>
                                    <p style={{ color: '#6b7280', fontSize: '12px', margin: '6px 0 0 0' }}>
                                        26 fichiers disponibles dans media/s/
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => navigate('/doctor/dicom-viewer')}
                                style={{
                                    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                                    color: '#fff',
                                    border: 'none',
                                    padding: '14px 28px',
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    fontSize: '15px',
                                    fontWeight: 700,
                                    whiteSpace: 'nowrap',
                                    boxShadow: '0 4px 20px rgba(59,130,246,0.4)',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                }}
                            >
                                <ImageIcon size={18} />
                                Ouvrir le Viewer DICOM
                            </button>
                        </motion.div>

                        {/* ── Études depuis la BDD ── */}
                        <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: 600, margin: '0 0 16px 0' }}>
                            DICOM Studies ({dicomStudies.length})
                        </h3>
                        {dicomStudies.length > 0 ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                                {dicomStudies.map((study, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        onClick={() => setSelectedDicomStudy(study.id)}
                                        style={{
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '12px',
                                            padding: '16px',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s'
                                        }}
                                        whileHover={{ background: 'rgba(255,255,255,0.08)' }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <ImageIcon size={24} style={{ color: '#3b82f6' }} />
                                                <div>
                                                    <p style={{ color: '#fff', fontWeight: 600, margin: 0 }}>{study.modality}</p>
                                                    <p style={{ color: '#888', fontSize: '12px', margin: '4px 0 0 0' }}>{study.body_part}</p>
                                                </div>
                                            </div>
                                            <span style={{
                                                background: study.status === 'completed' ? '#10b981' : study.status === 'processing' ? '#f59e0b' : '#6b7280',
                                                color: '#fff',
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontSize: '11px',
                                                fontWeight: 600
                                            }}>
                                                {study.status}
                                            </span>
                                        </div>
                                        <p style={{ color: '#888', fontSize: '12px', margin: 0 }}>
                                            Patient: {study.patient_name || 'Unknown'}
                                        </p>
                                        <p style={{ color: '#888', fontSize: '12px', margin: '4px 0 0 0' }}>
                                            Date: {new Date(study.study_date).toLocaleDateString()}
                                        </p>
                                        {study.findings && (
                                            <p style={{ color: '#888', fontSize: '11px', margin: '8px 0 0 0' }}>
                                                Findings: {study.findings.substring(0, 60)}...
                                            </p>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedDicomStudy(study.id);
                                            }}
                                            style={{
                                                marginTop: '12px',
                                                width: '100%',
                                                background: '#3b82f6',
                                                color: '#fff',
                                                border: 'none',
                                                padding: '8px 12px',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontSize: '12px',
                                                fontWeight: 500
                                            }}
                                        >
                                            View Study
                                        </button>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ color: '#4b5563', textAlign: 'center', padding: '24px', fontSize: '14px' }}>
                                Aucune étude enregistrée en base — utilisez le bouton ci-dessus pour ouvrir les fichiers .IMA directement.
                            </p>
                        )}
                    </div>
                )}

            </main>

            {/* DICOM Viewer Modal */}
            {selectedDicomStudy && (
                <DicomViewer
                    studyId={selectedDicomStudy}
                    onClose={() => setSelectedDicomStudy(null)}
                />
            )}
        </div>
    );
};

export default DoctorDashboard;
