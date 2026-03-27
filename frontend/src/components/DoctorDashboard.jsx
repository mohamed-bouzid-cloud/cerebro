import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
<<<<<<< HEAD
import {
    MessageSquare, FileText, Plus, ChevronRight, Clock, CheckCircle, Zap,
    AlertCircle, Users, TrendingUp, LogOut, Send, ImageIcon
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import DicomViewer from './DicomViewer';
=======
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import {
    Users, Activity, FileText, Calendar, LogOut, ChevronRight, Search, 
    Bell, Stethoscope, Clock, ShieldCheck
} from 'lucide-react';
>>>>>>> dcc8718832808e12203694ff91ad11bc675c1868

const DoctorDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
<<<<<<< HEAD
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
=======
    const [patients, setPatients] = useState([]);
    const [stats, setStats] = useState({ studies: 0, appointments: 0 });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
>>>>>>> dcc8718832808e12203694ff91ad11bc675c1868

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
<<<<<<< HEAD
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

=======
        setLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const headers = { Authorization: `Bearer ${token}` };

            const [patientsRes, dicomRes] = await Promise.all([
                fetch('http://localhost:8000/api/auth/patients/', { headers }),
                fetch('http://localhost:8000/api/auth/dicom-studies/', { headers })
            ]);

            if (patientsRes.ok) {
                const pData = await patientsRes.json();
                // If the backend returns all patients, we'll pretend these are our assigned ones
                // Ideally backend only returns doctors assigned patients
                setPatients(pData);
            }
            if (dicomRes.ok) {
                const dData = await dicomRes.json();
                const dicomCount = dData.count || (dData.results ? dData.results.length : dData.length);
                setStats(s => ({ ...s, studies: dicomCount }));
            }
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

>>>>>>> dcc8718832808e12203694ff91ad11bc675c1868
    const handleLogout = () => {
        logout();
        navigate('/');
    };

<<<<<<< HEAD
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
                                                <div style={{ display: 'flex', gap: '8px' }}>
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
                                                        border: 'nnone',
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
                        <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 600, margin: '0 0 16px 0' }}>
                            DICOM Studies
                        </h2>
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
                            <p style={{ color: '#888', textAlign: 'center', padding: '40px' }}>No DICOM studies available</p>
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
=======
    const filteredPatients = patients.filter(p => 
        (p.first_name + " " + p.last_name).toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return <div className="min-h-screen bg-[#0a0f14] flex items-center justify-center text-blue-500 font-medium">Loading Dashboard Data...</div>;
    }

    return (
        <div className="flex h-screen bg-[#0a0f14] text-gray-200 overflow-hidden font-sans">
            
            {/* Sidebar / Patient List */}
            <aside className="w-80 bg-[#121820] border-r border-[#1f2937] flex flex-col h-full shrink-0">
                <div className="p-6 border-b border-[#1f2937]">
                    <div className="flex items-center gap-3 text-white font-bold text-xl mb-6">
                        <div className="bg-blue-600 p-2 rounded-lg">
                            <Stethoscope size={24} className="text-white" />
                        </div>
                        Cerebro Medical
                    </div>
                    
                    <div className="relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input 
                            type="text" 
                            placeholder="Search patients..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[#0a0f14] border border-[#1f2937] text-white rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors placeholder-gray-600"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 px-2">Assigned Patients ({patients.length})</h3>
                    {filteredPatients.length > 0 ? (
                        filteredPatients.map((patient) => (
                            <div 
                                key={patient.id}
                                onClick={() => navigate(`/doctor/patient/${patient.id}`)}
                                className="group flex items-center justify-between p-3 rounded-xl hover:bg-[#1a2332] cursor-pointer transition-all border border-transparent hover:border-[#2a364a]"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-sm border border-blue-500/20 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                        {patient.first_name[0]}{patient.last_name[0]}
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">
                                            {patient.first_name} {patient.last_name}
                                        </div>
                                        <div className="text-xs text-gray-500">{patient.email}</div>
                                    </div>
                                </div>
                                <ChevronRight size={16} className="text-gray-600 group-hover:text-blue-500 transition-colors" />
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-sm text-gray-500">No patients found.</div>
                    )}
                </div>

                <div className="p-4 border-t border-[#1f2937] mt-auto">
                    <button 
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full p-2.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors font-medium"
                    >
                        <LogOut size={18} />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-full overflow-y-auto">
                {/* Top Nav */}
                <header className="h-20 px-8 flex items-center justify-between border-b border-[#1f2937] bg-[#0a0f14]/80 backdrop-blur-md sticky top-0 z-10">
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Welcome, Dr. {user?.last_name || 'Doctor'}</h1>
                        <p className="text-sm text-gray-400 mt-1">Here is the summary of your clinical practice.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="relative p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-[#1a2332]">
                            <Bell size={20} />
                            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-blue-500 border-2 border-[#0a0f14] rounded-full"></span>
                        </button>
                        <div className="flex items-center gap-3 pl-4 border-l border-[#1f2937]">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 shadow-lg" />
                            <div className="hidden md:block">
                                <div className="text-sm font-semibold text-white">Dr. {user?.first_name} {user?.last_name}</div>
                                <div className="text-xs text-blue-400">{user?.role || 'Neurologist'}</div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Dashboard Content */}
                <div className="p-8 max-w-6xl w-full">
                    
                    {/* Insights Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {[
                            { label: 'Assigned Patients', value: patients.length, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
                            { label: 'Pending Studies', value: stats.studies, icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
                            { label: 'Appointments Today', value: '4', icon: Calendar, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
                            { label: 'Security Status', value: 'Secure', icon: ShieldCheck, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' }
                        ].map((stat, idx) => (
                            <motion.div 
                                key={idx}
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className={`bg-[#121820] border ${stat.border} rounded-2xl p-6 relative overflow-hidden group`}
                            >
                                <div className="flex justify-between items-start relative z-10">
                                    <div>
                                        <p className="text-gray-400 font-medium text-sm mb-1">{stat.label}</p>
                                        <h3 className="text-3xl font-bold text-white tracking-tight">{stat.value}</h3>
                                    </div>
                                    <div className={`${stat.bg} ${stat.color} p-3 rounded-xl`}>
                                        <stat.icon size={24} />
                                    </div>
                                </div>
                                <div className={`absolute -right-6 -bottom-6 opacity-5 group-hover:scale-110 transition-transform ${stat.color}`}>
                                    <stat.icon size={100} />
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Main Split Area */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Quick Start Card */}
                        <div className="lg:col-span-2 bg-gradient-to-br from-[#121820] to-[#1a2332] border border-[#2a364a] rounded-2xl p-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
                            
                            <h2 className="text-2xl font-bold text-white mb-2 relative z-10">Select a patient to begin</h2>
                            <p className="text-gray-400 mb-8 max-w-lg relative z-10">
                                Click on any patient from the left sidebar to access their secure portal. From there, you can view their medical history, upload new DICOM imaging series, and analyze volumes in our new integrated viewer.
                            </p>
                            
                            <div className="grid sm:grid-cols-2 gap-4 relative z-10">
                                <div className="bg-black/30 border border-white/5 rounded-xl p-5 flex items-start gap-4">
                                    <div className="bg-blue-500/20 p-2.5 rounded-lg text-blue-400">
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-medium mb-1">Upload Scans</h4>
                                        <p className="text-xs text-gray-500 leading-relaxed">Directly assign robust DICOM volumetric series to client records securely.</p>
                                    </div>
                                </div>
                                <div className="bg-black/30 border border-white/5 rounded-xl p-5 flex items-start gap-4">
                                    <div className="bg-emerald-500/20 p-2.5 rounded-lg text-emerald-400">
                                        <Activity size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-medium mb-1">Volumetric Analysis</h4>
                                        <p className="text-xs text-gray-500 leading-relaxed">Fast scrolling over stacked DICOM files via our integrated clinical viewer.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity Mini-Feed */}
                        <div className="bg-[#121820] border border-[#1f2937] rounded-2xl p-6">
                            <h3 className="font-bold text-white mb-6">Recent System Activity</h3>
                            <div className="space-y-6">
                                {[
                                    { time: '10 mins ago', desc: 'Secure connection established to Cerebro Server', type: 'system' },
                                    { time: '2 hours ago', desc: 'DICOM parser updated to latest protocol', type: 'update' },
                                    { time: 'Yesterday', desc: 'Session expired, automatic forced logout executed', type: 'security' }
                                ].map((item, idx) => (
                                    <div key={idx} className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className="w-2 h-2 rounded-full bg-blue-500 ring-4 ring-[#0a0f14]" />
                                            {idx !== 2 && <div className="w-px h-full bg-[#1f2937] my-1" />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-200">{item.desc}</p>
                                            <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                                                <Clock size={12} />
                                                {item.time}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
>>>>>>> dcc8718832808e12203694ff91ad11bc675c1868
        </div>
    );
};

export default DoctorDashboard;
