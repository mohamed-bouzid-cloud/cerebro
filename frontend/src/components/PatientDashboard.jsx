import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    MessageSquare, Calendar, FileText, Zap, Heart, AlertCircle,
    Plus, ChevronRight, Clock, CheckCircle, TrendingUp, LogOut, X
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import DicomViewer from './DicomViewer';

const PatientDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [messages, setMessages] = useState([]);
    const [consultations, setConsultations] = useState([]);
    const [prescriptions, setPrescriptions] = useState([]);
    const [labResults, setLabResults] = useState([]);
    const [vitalSigns, setVitalSigns] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [dicomStudies, setDicomStudies] = useState([]);

    // Modal states
    const [showConsultationModal, setShowConsultationModal] = useState(false);
    const [showMessageModal, setShowMessageModal] = useState(false);
    const [selectedDicomStudy, setSelectedDicomStudy] = useState(null);

    // Form states
    const [consultationForm, setConsultationForm] = useState({
        doctor_id: '',
        consultation_type: 'video',
        reason: ''
    });
    const [messageForm, setMessageForm] = useState({
        recipient_id: '',
        subject: '',
        content: ''
    });
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchDashboardData();
        fetchDoctors();
    }, []);

    const fetchDoctors = async () => {
        const token = localStorage.getItem('access_token');
        const headers = { Authorization: `Bearer ${token}` };

        try {
            const res = await fetch('http://localhost:8000/api/auth/doctors/', { headers });
            if (res.ok) {
                const data = await res.json();
                setDoctors(data.results || data);
            }
        } catch (error) {
            console.error('Failed to fetch doctors:', error);
        }
    };

    const fetchDashboardData = async () => {
        const token = localStorage.getItem('access_token');
        const headers = { Authorization: `Bearer ${token}` };

        try {
            const [messagesRes, consultationsRes, prescriptionsRes, labResultsRes, vitalsRes, appointmentsRes, dicomRes] = await Promise.all([
                fetch('http://localhost:8000/api/auth/messages/', { headers }),
                fetch('http://localhost:8000/api/auth/consultations/', { headers }),
                fetch('http://localhost:8000/api/auth/prescriptions/active/', { headers }),
                fetch('http://localhost:8000/api/auth/lab-results/', { headers }),
                fetch('http://localhost:8000/api/auth/vital-signs/latest/', { headers }),
                fetch('http://localhost:8000/api/auth/appointments/upcoming/', { headers }),
                fetch('http://localhost:8000/api/auth/dicom-studies/', { headers })
            ]);

            if (messagesRes.ok) setMessages(await messagesRes.json());
            if (consultationsRes.ok) setConsultations(await consultationsRes.json());
            if (prescriptionsRes.ok) setPrescriptions(await prescriptionsRes.json());
            if (labResultsRes.ok) setLabResults(await labResultsRes.json());
            if (vitalsRes.ok) setVitalSigns(await vitalsRes.json());
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

    const handleCreateConsultation = async (e) => {
        e.preventDefault();
        if (!consultationForm.doctor_id || !consultationForm.reason) {
            alert('Please fill in all fields');
            return;
        }

        setLoading(true);
        const token = localStorage.getItem('access_token');
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        try {
            const res = await fetch('http://localhost:8000/api/auth/consultations/', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    doctor: parseInt(consultationForm.doctor_id),
                    consultation_type: consultationForm.consultation_type,
                    reason: consultationForm.reason
                })
            });

            if (res.ok) {
                alert('Consultation request sent successfully!');
                setShowConsultationModal(false);
                setConsultationForm({ doctor_id: '', consultation_type: 'video', reason: '' });
                fetchDashboardData();
            } else {
                const error = await res.json();
                alert(`Error: ${error.detail || JSON.stringify(error)}`);
            }
        } catch (error) {
            alert(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateMessage = async (e) => {
        e.preventDefault();
        if (!messageForm.recipient_id || !messageForm.subject || !messageForm.content) {
            alert('Please fill in all fields');
            return;
        }

        setLoading(true);
        const token = localStorage.getItem('access_token');
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        try {
            const res = await fetch('http://localhost:8000/api/auth/messages/', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    recipient: parseInt(messageForm.recipient_id),
                    subject: messageForm.subject,
                    content: messageForm.content
                })
            });

            if (res.ok) {
                alert('Message sent successfully!');
                setShowMessageModal(false);
                setMessageForm({ recipient_id: '', subject: '', content: '' });
                fetchDashboardData();
            } else {
                const error = await res.json();
                alert(`Error: ${error.detail || JSON.stringify(error)}`);
            }
        } catch (error) {
            alert(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const tabs = [
        { id: 'overview', label: 'Overview', icon: Calendar },
        { id: 'messages', label: 'Messages', icon: MessageSquare, badge: unreadMessages },
        { id: 'consultations', label: 'Consultations', icon: Calendar },
        { id: 'prescriptions', label: 'Prescriptions', icon: FileText },
        { id: 'labs', label: 'Lab Results', icon: Zap },
        { id: 'vitals', label: 'Vital Signs', icon: Heart },
        { id: 'imaging', label: 'Imaging', icon: Heart } // Recycling Heart icon for now, ideally an image icon
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
                            Welcome, {user?.first_name}
                        </h1>
                        <p style={{ color: '#888', margin: '4px 0 0 0', fontSize: '14px' }}>
                            Patient Dashboard
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
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
                            {[
                                { label: 'Upcoming Appointments', value: appointments.length, icon: Calendar, color: '#3b82f6' },
                                { label: 'Active Prescriptions', value: prescriptions.length, icon: FileText, color: '#10b981' },
                                { label: 'Unread Messages', value: unreadMessages, icon: MessageSquare, color: '#f59e0b' },
                                { label: 'Pending Consultations', value: consultations.filter(c => c.status === 'pending').length, icon: AlertCircle, color: '#ef4444' }
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

                        {/* Recent Appointments */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                padding: '20px',
                                marginBottom: '20px'
                            }}
                        >
                            <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: 600, margin: '0 0 16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                Upcoming Appointments
                                {appointments.length > 0 && <ChevronRight size={20} />}
                            </h2>
                            {appointments.length > 0 ? (
                                <div style={{ display: 'grid', gap: '12px' }}>
                                    {appointments.slice(0, 3).map((apt, idx) => (
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
                                                <p style={{ color: '#fff', fontWeight: 500, margin: 0 }}>{apt.title}</p>
                                                <p style={{ color: '#888', fontSize: '14px', margin: '4px 0 0 0' }}>
                                                    <Clock size={14} style={{ display: 'inline', marginRight: '4px' }} />
                                                    {new Date(apt.scheduled_at).toLocaleString()}
                                                </p>
                                            </div>
                                            <span style={{
                                                background: '#3b82f6',
                                                color: '#fff',
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontSize: '12px'
                                            }}>
                                                {apt.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p style={{ color: '#888', margin: 0 }}>No upcoming appointments</p>
                            )}
                        </motion.div>

                        {/* Recent Messages */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                padding: '20px'
                            }}
                        >
                            <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: 600, margin: '0 0 16px 0' }}>Recent Messages</h2>
                            {messages.length > 0 ? (
                                <div style={{ display: 'grid', gap: '12px' }}>
                                    {messages.slice(0, 3).map((msg, idx) => (
                                        <div key={idx} style={{
                                            background: 'rgba(255,255,255,0.02)',
                                            border: '1px solid rgba(255,255,255,0.05)',
                                            borderRadius: '8px',
                                            padding: '12px',
                                            opacity: msg.read ? 0.6 : 1
                                        }}>
                                            <p style={{ color: '#fff', fontWeight: 500, margin: 0 }}>{msg.subject}</p>
                                            <p style={{ color: '#888', fontSize: '14px', margin: '4px 0 0 0' }}>
                                                From: {msg.sender_name}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p style={{ color: '#888', margin: 0 }}>No messages yet</p>
                            )}
                        </motion.div>
                    </div>
                )}

                {/* Messages Tab */}
                {activeTab === 'messages' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 600, margin: 0 }}>Messages</h2>
                            <button
                                onClick={() => setShowMessageModal(true)}
                                style={{
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
                                }}
                            >
                                <Plus size={16} />
                                New Message
                            </button>
                        </div>
                        {messages.length > 0 ? (
                            <div style={{ display: 'grid', gap: '12px' }}>
                                {messages.map((msg, idx) => (
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
                                                <p style={{ color: '#888', fontSize: '14px', margin: '4px 0 0 0' }}>{msg.content.substring(0, 100)}...</p>
                                            </div>
                                            <p style={{ color: '#888', fontSize: '12px', margin: 0, whiteSpace: 'nowrap', marginLeft: '12px' }}>
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

                {/* Consultations Tab */}
                {activeTab === 'consultations' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 600, margin: 0 }}>Consultations</h2>
                            <button
                                onClick={() => setShowConsultationModal(true)}
                                style={{
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
                                }}
                            >
                                <Plus size={16} />
                                Request Consultation
                            </button>
                        </div>
                        {consultations.length > 0 ? (
                            <div style={{ display: 'grid', gap: '12px' }}>
                                {consultations.map((consultation, idx) => (
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
                                            flexDirection: 'column',
                                            justifyContent: 'space-between',
                                            minHeight: '160px'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div style={{ display: 'flex', gap: '16px' }}>
                                                <div style={{
                                                    background: consultation.status === 'scheduled' || consultation.status === 'accepted' ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)',
                                                    padding: '16px',
                                                    borderRadius: '16px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}>
                                                    <Calendar size={28} style={{ color: consultation.status === 'scheduled' || consultation.status === 'accepted' ? '#10b981' : '#3b82f6' }} />
                                                </div>
                                                <div>
                                                    <p style={{ color: '#fff', fontSize: '18px', fontWeight: 600, margin: '0 0 4px 0' }}>Dr. {consultation.doctor_name}</p>
                                                    <p style={{ color: '#888', fontSize: '14px', margin: 0, fontWeight: 500, textTransform: 'capitalize' }}>
                                                        {consultation.consultation_type} Consultation
                                                    </p>
                                                    <p style={{ color: '#666', fontSize: '13px', margin: '8px 0 0 0', fontStyle: 'italic' }}>
                                                        "{consultation.reason}"
                                                    </p>
                                                </div>
                                            </div>
                                            <span style={{
                                                background: consultation.status === 'pending' || consultation.status === 'requested' ? 'rgba(245,158,11,0.2)' : (consultation.status === 'accepted' || consultation.status === 'scheduled') ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
                                                color: consultation.status === 'pending' || consultation.status === 'requested' ? '#f59e0b' : (consultation.status === 'accepted' || consultation.status === 'scheduled') ? '#10b981' : '#ef4444',
                                                padding: '6px 16px',
                                                borderRadius: '20px',
                                                fontSize: '13px',
                                                fontWeight: 700,
                                                letterSpacing: '0.5px'
                                            }}>
                                                {consultation.status.toUpperCase()}
                                            </span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ color: '#888', textAlign: 'center', padding: '40px' }}>No consultations yet</p>
                        )}
                    </div>
                )}

                {/* Prescriptions Tab */}
                {activeTab === 'prescriptions' && (
                    <div>
                        <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 600, margin: '0 0 16px 0' }}>Active Prescriptions</h2>
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
                                                    {prescription.dosage} &bull; {prescription.frequency}
                                                </p>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
                                                <span style={{ color: '#888', fontSize: '13px' }}>Refills Left:</span>
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
                                            <p style={{ color: '#666', fontSize: '13px', margin: 0 }}>
                                                Expires: <span style={{ color: '#aaa', fontWeight: 500 }}>{new Date(prescription.expiry_date).toLocaleDateString()}</span>
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ color: '#888', textAlign: 'center', padding: '40px' }}>No active prescriptions</p>
                        )}
                    </div>
                )}

                {/* Lab Results Tab */}
                {activeTab === 'labs' && (
                    <div>
                        <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 600, margin: '0 0 16px 0' }}>Lab Results</h2>
                        {labResults.length > 0 ? (
                            <div style={{ display: 'grid', gap: '12px' }}>
                                {labResults.map((result, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        style={{
                                            background: 'rgba(255,255,255,0.05)',
                                            border: result.is_abnormal ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '16px',
                                            padding: '24px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'space-between'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <p style={{ color: '#fff', fontSize: '18px', fontWeight: 600, margin: 0 }}>{result.test_name}</p>
                                                    {result.is_abnormal && <AlertCircle size={18} style={{ color: '#ef4444' }} />}
                                                </div>
                                                <p style={{ color: '#888', fontSize: '14px', margin: '4px 0 0 0' }}>
                                                    {new Date(result.test_date).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <span style={{
                                                background: result.status === 'completed' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)',
                                                color: result.status === 'completed' ? '#10b981' : '#f59e0b',
                                                padding: '6px 12px',
                                                borderRadius: '8px',
                                                fontSize: '12px',
                                                fontWeight: 600,
                                                border: `1px solid ${result.status === 'completed' ? 'rgba(16,185,129,0.5)' : 'rgba(245,158,11,0.5)'}`
                                            }}>
                                                {result.status.toUpperCase()}
                                            </span>
                                        </div>
                                        {result.status === 'completed' && (
                                            <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                                <p style={{ color: '#ccc', fontSize: '14px', margin: '0 0 4px 0' }}>Result Value</p>
                                                <p style={{ color: result.is_abnormal ? '#ef4444' : '#fff', fontSize: '24px', fontWeight: 700, margin: 0 }}>
                                                    {result.result_value || 'View Report'}
                                                </p>
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ color: '#888', textAlign: 'center', padding: '40px' }}>No lab results yet</p>
                        )}
                    </div>
                )}

                {/* Vital Signs Tab */}
                {activeTab === 'vitals' && (
                    <div>
                        <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 600, margin: '0 0 16px 0' }}>Vital Signs</h2>
                        {Object.keys(vitalSigns).length > 0 ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                                {[
                                    { label: 'Blood Pressure', value: `${vitalSigns.systolic_bp}/${vitalSigns.diastolic_bp} mmHg`, icon: Heart },
                                    { label: 'Heart Rate', value: `${vitalSigns.heart_rate} bpm`, icon: Heart },
                                    { label: 'Temperature', value: `${vitalSigns.temperature}°C`, icon: Zap },
                                    { label: 'O2 Saturation', value: `${vitalSigns.oxygen_saturation}%`, icon: Zap }
                                ].map((vital, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        style={{
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '16px',
                                            padding: '24px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '20px'
                                        }}
                                    >
                                        <div style={{
                                            background: 'rgba(239,68,68,0.1)',
                                            padding: '16px',
                                            borderRadius: '16px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <Heart size={32} style={{ color: '#ef4444' }} />
                                        </div>
                                        <div>
                                            <p style={{ color: '#888', fontSize: '14px', margin: '0 0 4px 0', fontWeight: 500 }}>{vital.label}</p>
                                            <p style={{ color: '#fff', fontSize: '32px', fontWeight: 800, margin: 0, letterSpacing: '-1px' }}>{vital.value}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ color: '#888', textAlign: 'center', padding: '40px' }}>No vital signs recorded yet</p>
                        )}
                    </div>
                )}

                {/* Imaging Tab */}
                {activeTab === 'imaging' && (
                    <div>
                        <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 600, margin: '0 0 16px 0' }}>DICOM Imaging</h2>
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
                                                <div style={{ background: 'rgba(59,130,246,0.2)', padding: '8px', borderRadius: '8px' }}>
                                                    <Zap size={24} style={{ color: '#3b82f6' }} />
                                                </div>
                                                <div>
                                                    <p style={{ color: '#fff', fontWeight: 600, margin: 0 }}>{study.modality}</p>
                                                    <p style={{ color: '#888', fontSize: '12px', margin: '4px 0 0 0' }}>{study.body_part}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <p style={{ color: '#888', fontSize: '12px', margin: 0 }}>
                                            Date: {new Date(study.study_date).toLocaleDateString()}
                                        </p>
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
                                            View Image
                                        </button>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ color: '#888', textAlign: 'center', padding: '40px' }}>No imaging studies available</p>
                        )}
                    </div>
                )}

            </main>

            {/* Dicom Viewer Modal */}
            {selectedDicomStudy && (
                <DicomViewer
                    studyId={selectedDicomStudy}
                    onClose={() => setSelectedDicomStudy(null)}
                />
            )}

            {/* Consultation Modal */}
            {showConsultationModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{
                            background: '#1a1f26',
                            borderRadius: '12px',
                            padding: '28px',
                            maxWidth: '500px',
                            width: '90%',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: 600, margin: 0 }}>Request Consultation</h3>
                            <button
                                onClick={() => setShowConsultationModal(false)}
                                style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateConsultation}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ color: '#fff', fontSize: '14px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>
                                    Select Doctor
                                </label>
                                <select
                                    value={consultationForm.doctor_id}
                                    onChange={(e) => setConsultationForm({ ...consultationForm, doctor_id: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '6px',
                                        color: '#fff',
                                        fontSize: '14px'
                                    }}
                                >
                                    <option value="" style={{ background: '#1a1f26' }}>Choose a doctor...</option>
                                    {doctors.map(doctor => (
                                        <option key={doctor.id} value={doctor.id} style={{ background: '#1a1f26' }}>
                                            Dr. {doctor.first_name} {doctor.last_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ color: '#fff', fontSize: '14px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>
                                    Consultation Type
                                </label>
                                <select
                                    value={consultationForm.consultation_type}
                                    onChange={(e) => setConsultationForm({ ...consultationForm, consultation_type: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '6px',
                                        color: '#fff',
                                        fontSize: '14px'
                                    }}
                                >
                                    <option value="video" style={{ background: '#1a1f26' }}>Video Call</option>
                                    <option value="audio" style={{ background: '#1a1f26' }}>Audio Call</option>
                                    <option value="in-person" style={{ background: '#1a1f26' }}>In-Person</option>
                                    <option value="follow-up" style={{ background: '#1a1f26' }}>Follow-up</option>
                                </select>
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ color: '#fff', fontSize: '14px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>
                                    Reason
                                </label>
                                <textarea
                                    value={consultationForm.reason}
                                    onChange={(e) => setConsultationForm({ ...consultationForm, reason: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '6px',
                                        color: '#fff',
                                        fontSize: '14px',
                                        minHeight: '100px',
                                        fontFamily: 'inherit',
                                        boxSizing: 'border-box'
                                    }}
                                    placeholder="Describe your reason for consultation..."
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    style={{
                                        flex: 1,
                                        background: '#3b82f6',
                                        color: '#fff',
                                        border: 'none',
                                        padding: '10px 16px',
                                        borderRadius: '6px',
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                        fontSize: '14px',
                                        fontWeight: 500,
                                        opacity: loading ? 0.7 : 1
                                    }}
                                >
                                    {loading ? 'Sending...' : 'Request Consultation'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowConsultationModal(false)}
                                    style={{
                                        flex: 1,
                                        background: 'transparent',
                                        color: '#888',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        padding: '10px 16px',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '14px'
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* Message Modal */}
            {showMessageModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{
                            background: '#1a1f26',
                            borderRadius: '12px',
                            padding: '28px',
                            maxWidth: '500px',
                            width: '90%',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: 600, margin: 0 }}>Send Message</h3>
                            <button
                                onClick={() => setShowMessageModal(false)}
                                style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateMessage}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ color: '#fff', fontSize: '14px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>
                                    Recipient (Doctor)
                                </label>
                                <select
                                    value={messageForm.recipient_id}
                                    onChange={(e) => setMessageForm({ ...messageForm, recipient_id: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '6px',
                                        color: '#fff',
                                        fontSize: '14px'
                                    }}
                                >
                                    <option value="" style={{ background: '#1a1f26' }}>Choose a doctor...</option>
                                    {doctors.map(doctor => (
                                        <option key={doctor.id} value={doctor.id} style={{ background: '#1a1f26' }}>
                                            Dr. {doctor.first_name} {doctor.last_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ color: '#fff', fontSize: '14px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>
                                    Subject
                                </label>
                                <input
                                    type="text"
                                    value={messageForm.subject}
                                    onChange={(e) => setMessageForm({ ...messageForm, subject: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '6px',
                                        color: '#fff',
                                        fontSize: '14px',
                                        boxSizing: 'border-box'
                                    }}
                                    placeholder="Message subject..."
                                />
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ color: '#fff', fontSize: '14px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>
                                    Message
                                </label>
                                <textarea
                                    value={messageForm.content}
                                    onChange={(e) => setMessageForm({ ...messageForm, content: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '6px',
                                        color: '#fff',
                                        fontSize: '14px',
                                        minHeight: '120px',
                                        fontFamily: 'inherit',
                                        boxSizing: 'border-box'
                                    }}
                                    placeholder="Write your message..."
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    style={{
                                        flex: 1,
                                        background: '#3b82f6',
                                        color: '#fff',
                                        border: 'none',
                                        padding: '10px 16px',
                                        borderRadius: '6px',
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                        fontSize: '14px',
                                        fontWeight: 500,
                                        opacity: loading ? 0.7 : 1
                                    }}
                                >
                                    {loading ? 'Sending...' : 'Send Message'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowMessageModal(false)}
                                    style={{
                                        flex: 1,
                                        background: 'transparent',
                                        color: '#888',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        padding: '10px 16px',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '14px'
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default PatientDashboard;
