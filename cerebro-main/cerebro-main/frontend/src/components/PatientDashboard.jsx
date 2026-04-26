import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquare, Calendar, FileText, Zap, Heart, AlertCircle,
    Plus, ChevronRight, Clock, CheckCircle, TrendingUp, LogOut, X, Bell
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';

// Modular Components
import ProfileCard from './PatientDashboard/ProfileCard';
import HealthSummary from './PatientDashboard/HealthSummary';
import VitalsChart from './PatientDashboard/VitalsChart';
import MedicationList from './PatientDashboard/MedicationList';
import LabResultsTable from './PatientDashboard/LabResultsTable';
import ImagingGrid from './PatientDashboard/ImagingGrid';
import AppointmentSection from './PatientDashboard/AppointmentSection';
import VisitSummarySection from './PatientDashboard/VisitSummarySection';
import NotificationPanel from './PatientDashboard/NotificationPanel';
import EditProfileModal from './PatientDashboard/EditProfileModal';

const PatientDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    
    // Data States
    const [messages, setMessages] = useState([]);
    const [consultations, setConsultations] = useState([]);
    const [prescriptions, setPrescriptions] = useState([]);
    const [labResults, setLabResults] = useState([]);
    const [vitalSigns, setVitalSigns] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [dicomStudies, setDicomStudies] = useState([]);
    const [medicalHistory, setMedicalHistory] = useState(null);
    const [allergies, setAllergies] = useState([]);
    const [encounters, setEncounters] = useState([]);
    const [notifications, setNotifications] = useState([]);

    // UI States
    const [showConsultationModal, setShowConsultationModal] = useState(false);
    const [showMessageModal, setShowMessageModal] = useState(false);
    const [showEditProfileModal, setShowEditProfileModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [doctors, setDoctors] = useState([]);

    // Form States
    const [consultationForm, setConsultationForm] = useState({ doctor_id: '', consultation_type: 'video', reason: '' });
    const [messageForm, setMessageForm] = useState({ recipient_id: '', subject: '', content: '' });

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
            const [
                messagesRes, consultationsRes, prescriptionsRes, 
                labResultsRes, vitalsRes, trendsRes, appointmentsRes, 
                dicomRes, historyRes, allergiesRes, encountersRes, notificationsRes
            ] = await Promise.all([
                fetch('http://localhost:8000/api/auth/messages/', { headers }).catch(() => ({ ok: false })),
                fetch('http://localhost:8000/api/auth/appointments/my_pending_requests/', { headers }).catch(() => ({ ok: false })),
                fetch('http://localhost:8000/api/auth/prescriptions/active/', { headers }).catch(() => ({ ok: false })),
                fetch('http://localhost:8000/api/auth/lab-results/', { headers }).catch(() => ({ ok: false })),
                fetch('http://localhost:8000/api/auth/vital-signs/latest/', { headers }).catch(() => ({ ok: false })),
                fetch('http://localhost:8000/api/auth/vital-signs/trends/', { headers }).catch(() => ({ ok: false })),
                fetch('http://localhost:8000/api/auth/appointments/', { headers }).catch(() => ({ ok: false })),
                fetch('http://localhost:8000/api/auth/dicom-studies/', { headers }).catch(() => ({ ok: false })),
                fetch('http://localhost:8000/api/auth/medical-history/', { headers }).catch(() => ({ ok: false })),
                fetch('http://localhost:8000/api/auth/allergies/', { headers }).catch(() => ({ ok: false })),
                fetch('http://localhost:8000/api/auth/encounters/', { headers }).catch(() => ({ ok: false })),
                fetch('http://localhost:8000/api/auth/notifications/', { headers }).catch(() => ({ ok: false }))
            ]);

            if (messagesRes.ok) setMessages(await messagesRes.json());
            if (consultationsRes.ok) setConsultations(await consultationsRes.json());
            if (prescriptionsRes.ok) setPrescriptions(await prescriptionsRes.json());
            if (labResultsRes.ok) setLabResults(await labResultsRes.json());
            if (vitalsRes.ok) setVitalSigns(await vitalsRes.json());
            // We use trends for the chart
            if (trendsRes.ok) {
                const trendsData = await trendsRes.json();
                setVitalSigns(trendsData); 
            }
            if (appointmentsRes.ok) setAppointments(await appointmentsRes.json());
            if (dicomRes.ok) {
                const data = await dicomRes.json();
                setDicomStudies(data.results || data);
            }
            if (historyRes.ok) setMedicalHistory(await historyRes.json());
            if (allergiesRes.ok) setAllergies(await allergiesRes.json());
            if (encountersRes.ok) setEncounters(await encountersRes.json());
            if (notificationsRes.ok) setNotifications(await notificationsRes.json());
            
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        }
    };

    const handleMarkAsRead = async (id) => {
        const token = localStorage.getItem('access_token');
        try {
            await fetch(`http://localhost:8000/api/auth/notifications/${id}/mark_as_read/`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchDashboardData();
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        const token = localStorage.getItem('access_token');
        try {
            await fetch(`http://localhost:8000/api/auth/notifications/mark_all_as_read/`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchDashboardData();
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const tabs = [
        { id: 'overview', label: 'Overview', icon: Calendar },
        { id: 'vitals', label: 'Health Trends', icon: TrendingUp },
        { id: 'appointments', label: 'Appointments', icon: Calendar },
        { id: 'visits', label: 'Visit History', icon: FileText },
        { id: 'prescriptions', label: 'Medications', icon: Zap },
        { id: 'labs', label: 'Lab Results', icon: CheckCircle },
        { id: 'imaging', label: 'Imaging', icon: Zap },
        { id: 'notifications', label: 'Notifications', icon: Bell, badge: notifications.filter(n => !n.is_read).length },
    ];

    const handleCreateConsultation = async (e) => {
        e.preventDefault();
        setLoading(true);
        const token = localStorage.getItem('access_token');
        try {
            const res = await fetch('http://localhost:8000/api/auth/appointments/', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    doctor: parseInt(consultationForm.doctor_id),
                    consultation_type: consultationForm.consultation_type,
                    reason: consultationForm.reason,
                    status: 'proposed'
                })
            });
            if (res.ok) {
                setShowConsultationModal(false);
                fetchDashboardData();
            }
        } catch (error) { console.error(error); } finally { setLoading(false); }
    };

    return (
        <div style={{ minHeight: '100vh', background: '#0f1419', color: '#fff' }}>
            {/* Header */}
            <header style={{
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                padding: '20px 40px',
                background: 'rgba(15,20,25,0.8)',
                backdropFilter: 'blur(12px)',
                position: 'sticky',
                top: 0,
                zIndex: 100
            }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Zap size={24} color="#fff" fill="#fff" />
                        </div>
                        <div>
                            <h1 style={{ fontSize: '20px', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>CEREBRO</h1>
                            <p style={{ color: '#666', fontSize: '12px', margin: 0, fontWeight: 600 }}>PATIENT PORTAL</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>{user?.first_name} {user?.last_name}</p>
                            <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>ID: #PAT-{user?.id}</p>
                        </div>
                        <button onClick={handleLogout} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#ef4444', padding: '10px 16px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700 }}>
                            <LogOut size={16} /> Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Edit Profile Action Bar */}
            <div style={{ background: 'rgba(15,20,25,0.3)', padding: '12px 40px', display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                    onClick={() => setShowEditProfileModal(true)}
                    style={{ 
                        background: 'rgba(59,130,246,0.1)', 
                        color: '#3b82f6', 
                        border: '1px solid rgba(59,130,246,0.3)', 
                        padding: '8px 20px', 
                        borderRadius: '20px', 
                        fontSize: '13px', 
                        fontWeight: 700, 
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    <Plus size={16} /> Edit Health Profile
                </button>
            </div>

            {/* Navigation Tabs */}
            <nav style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(15,20,25,0.5)', padding: '0 40px' }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', gap: '8px' }}>
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: isActive ? '#3b82f6' : '#666',
                                    padding: '16px 20px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: 700,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    position: 'relative',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <Icon size={18} />
                                {tab.label}
                                {tab.badge > 0 && (
                                    <span style={{ background: '#ef4444', color: '#fff', borderRadius: '10px', padding: '2px 6px', fontSize: '10px', position: 'absolute', top: '10px', right: '4px' }}>
                                        {tab.badge}
                                    </span>
                                )}
                                {isActive && (
                                    <motion.div layoutId="activeTab" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: '#3b82f6', borderRadius: '3px 3px 0 0' }} />
                                )}
                            </button>
                        );
                    })}
                </div>
            </nav>

            {/* Main Content */}
            <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px' }}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeTab === 'overview' && (
                            <>
                                <ProfileCard user={user} />
                                <HealthSummary medicalHistory={medicalHistory} allergies={allergies} />
                                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                            <h3 style={{ margin: 0, fontSize: '18px' }}>Upcoming Appointments</h3>
                                            <button 
                                                onClick={() => setShowConsultationModal(true)}
                                                style={{ background: '#3b82f6', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}
                                            >
                                                <Plus size={16} /> New Request
                                            </button>
                                        </div>
                                        <AppointmentSection appointments={appointments.filter(a => new Date(a.scheduled_at) >= new Date())} />
                                    </div>
                                    <div>
                                        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>Active Medications</h3>
                                        <MedicationList prescriptions={prescriptions.slice(0, 3)} />
                                        <button onClick={() => setActiveTab('prescriptions')} style={{ width: '100%', marginTop: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#888', padding: '12px', borderRadius: '12px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                                            View All Medications
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}

                        {activeTab === 'vitals' && <VitalsChart vitalsData={vitalSigns} />}
                        {activeTab === 'appointments' && <AppointmentSection appointments={appointments} />}
                        {activeTab === 'visits' && <VisitSummarySection encounters={encounters} />}
                        {activeTab === 'prescriptions' && <MedicationList prescriptions={prescriptions} />}
                        {activeTab === 'labs' && <LabResultsTable labs={labResults} />}
                        {activeTab === 'imaging' && <ImagingGrid studies={dicomStudies} />}
                        {activeTab === 'notifications' && (
                            <NotificationPanel 
                                notifications={notifications} 
                                onMarkAsRead={handleMarkAsRead}
                                onClearAll={handleMarkAllAsRead}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Consultation Modal (Kept simple within the main dashboard) */}
            {showConsultationModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ background: '#161b22', borderRadius: '24px', padding: '32px', maxWidth: '500px', width: '90%', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ margin: 0 }}>Request Consultation</h3>
                            <button onClick={() => setShowConsultationModal(false)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleCreateConsultation}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#888' }}>Select Doctor</label>
                                <select value={consultationForm.doctor_id} onChange={(e) => setConsultationForm({...consultationForm, doctor_id: e.target.value})} style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}>
                                    <option value="">Choose a doctor...</option>
                                    {doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.first_name} {d.last_name} ({d.profile?.specialty})</option>)}
                                </select>
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#888' }}>Reason</label>
                                <textarea 
                                    value={consultationForm.reason} 
                                    onChange={(e) => setConsultationForm({...consultationForm, reason: e.target.value})} 
                                    placeholder="Briefly describe your concern..."
                                    style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', minHeight: '100px', fontFamily: 'inherit' }}
                                />
                            </div>
                            <button type="submit" disabled={loading} style={{ width: '100%', background: '#3b82f6', color: '#fff', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
                                {loading ? 'Processing...' : 'Send Request'}
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}

            {showEditProfileModal && (
                <EditProfileModal 
                    user={user}
                    medicalHistory={medicalHistory}
                    allergies={allergies}
                    onClose={() => setShowEditProfileModal(false)}
                    onUpdate={fetchDashboardData}
                />
            )}
        </div>
    );
};

export default PatientDashboard;
