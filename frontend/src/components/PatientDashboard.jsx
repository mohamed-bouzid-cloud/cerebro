import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquare, Calendar, FileText, Zap, Heart, AlertCircle,
    Plus, ChevronRight, Clock, CheckCircle, TrendingUp, LogOut, X, Bell,
    ArrowRight
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import API from '../api';

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
        try {
            const { data } = await API.get('/api/auth/doctors/');
            setDoctors(data.results || data);
        } catch (error) {
            console.error('Failed to fetch doctors:', error);
        }
    };

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // Helper to prevent a single 404 from crashing the entire Promise.all
            const safeGet = (url) => API.get(url).catch(err => ({ data: [] }));

            const [
                messagesRes, consultationsRes, prescriptionsRes, 
                labResultsRes, vitalsRes, trendsRes, appointmentsRes, 
                dicomRes, historyRes, allergiesRes, encountersRes, notificationsRes
            ] = await Promise.all([
                safeGet('/api/auth/messages/'),
                safeGet('/api/auth/consultations/'),
                safeGet('/api/auth/prescriptions/active/'),
                safeGet('/api/auth/lab-results/'),
                safeGet('/api/auth/vital-signs/latest/'),
                safeGet('/api/auth/vital-signs/trends/'),
                safeGet('/api/auth/appointments/'),
                safeGet('/api/auth/dicom-studies/'),
                safeGet('/api/auth/medical-history/'),
                safeGet('/api/auth/allergies/'),
                safeGet('/api/auth/encounters/'),
                safeGet('/api/auth/notifications/')
            ]);

            setMessages(messagesRes.data?.results || messagesRes.data || []);
            setConsultations(consultationsRes.data?.results || consultationsRes.data || []);
            setPrescriptions(prescriptionsRes.data?.results || prescriptionsRes.data || []);
            setLabResults(labResultsRes.data?.results || labResultsRes.data || []);
            setVitalSigns(vitalsRes.data || {}); 
            setAppointments(appointmentsRes.data?.results || appointmentsRes.data || []);
            setDicomStudies(dicomRes.data?.results || dicomRes.data || []);
            setMedicalHistory(historyRes.data?.results || historyRes.data || {});
            setAllergies(allergiesRes.data?.results || allergiesRes.data || []);
            setEncounters(encountersRes.data?.results || encountersRes.data || []);
            setNotifications(notificationsRes.data?.results || notificationsRes.data || []);
            
            if (trendsRes.data && !Array.isArray(trendsRes.data)) {
                setVitalSigns(trendsRes.data); 
            }
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        }
        setLoading(false);
    };

    const handleMarkAsRead = async (id) => {
        try {
            await API.post(`/api/auth/notifications/${id}/mark_as_read/`);
            fetchDashboardData();
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await API.post(`/api/auth/notifications/mark_all_as_read/`);
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
        try {
            await API.post('/api/auth/consultations/', {
                doctor: parseInt(consultationForm.doctor_id),
                consultation_type: consultationForm.consultation_type,
                reason: consultationForm.reason
            });
            setShowConsultationModal(false);
            fetchDashboardData();
        } catch (error) { 
            console.error(error); 
        } finally { 
            setLoading(false); 
        }
    };

    return (
        <div className="min-h-screen premium-depth-bg text-white overflow-x-hidden relative">
            {/* Background Ambient Lights (Aura Blobs) */}
            <div className="aura-blob w-[600px] h-[600px] bg-blue-600/20 top-[-200px] left-[-200px]" />
            <div className="aura-blob w-[500px] h-[500px] bg-emerald-500/10 top-[20%] right-[-100px]" style={{ animationDelay: '-5s' }} />
            <div className="aura-blob w-[700px] h-[700px] bg-purple-600/10 bottom-[-300px] left-[10%]" style={{ animationDelay: '-10s' }} />
            {/* Header */}
            <header className="glass-card !rounded-none border-x-0 border-t-0 border-b border-white/10 sticky top-0 z-[100] px-10 py-5">
                <div className="max-w-[1400px] mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)]">
                            <Zap size={24} color="#fff" fill="#fff" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black m-0 tracking-tight">CEREBRO</h1>
                            <p className="text-[10px] text-blue-400 font-bold m-0 uppercase tracking-[0.2em] opacity-60">Patient Command Terminal</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-8">
                        <div className="text-right">
                            <p className="m-0 text-sm font-black whitespace-nowrap">{user?.first_name} {user?.last_name}</p>
                            <p className="m-0 text-[10px] font-bold text-gray-500 tracking-wider">SECURE ID: #PAT-{user?.id}</p>
                        </div>
                        <button 
                            onClick={handleLogout} 
                            className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 px-4 py-2.5 rounded-xl transition-all font-black text-xs uppercase tracking-widest flex items-center gap-2 group"
                        >
                            <LogOut size={16} className="group-hover:rotate-12 transition-transform" /> Sign Out
                        </button>
                    </div>
                </div>
            </header>

            {/* Action Bar */}
            <div className="px-10 py-4 flex justify-end gap-3">
                <button 
                    onClick={() => setShowEditProfileModal(true)}
                    className="glass-card rim-light hover:!bg-blue-600/10 text-blue-400 !px-5 !py-2.5 !rounded-full text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2"
                >
                    <Plus size={16} /> Update Bio-Profile
                </button>
            </div>

            {/* Navigation Tabs */}
            <nav className="border-b border-white/5 bg-black/10 backdrop-blur-md px-10 sticky top-[81px] z-[90]">
                <div className="max-w-[1400px] mx-auto flex gap-4 overflow-x-auto no-scrollbar">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    relative px-6 py-4 transition-all duration-300 flex items-center gap-2.5 whitespace-nowrap
                                    ${isActive ? 'text-blue-400 font-black' : 'text-gray-500 hover:text-gray-300 font-bold'}
                                `}
                            >
                                <Icon size={18} className={`${isActive ? 'text-blue-400' : 'text-gray-500'}`} />
                                <span className="text-xs uppercase tracking-widest">{tab.label}</span>
                                {tab.badge > 0 && (
                                    <span className="bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full absolute top-2 right-1.5 animate-pulse">
                                        {tab.badge}
                                    </span>
                                )}
                                {isActive && (
                                    <motion.div 
                                        layoutId="activeTabPatient" 
                                        className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-t-full shadow-[0_-4px_10px_rgba(59,130,246,0.5)]" 
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-[1400px] mx-auto px-10 py-10 min-h-[calc(100vh-250px)]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeTab === 'overview' && (
                            <div className="space-y-10">
                                <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    <div className="lg:col-span-2">
                                        <ProfileCard user={user} />
                                    </div>
                                    <div className="lg:col-span-1">
                                        <div className="glass-card rim-light p-6 h-full flex flex-col justify-between overflow-hidden relative group">
                                            <div className="absolute -right-4 -top-4 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all" />
                                            <div>
                                                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Health Quick Actions</h3>
                                                <div className="space-y-3">
                                                    <button 
                                                        onClick={() => setShowConsultationModal(true)}
                                                        className="w-full flex items-center justify-between p-4 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-600/20 rounded-2xl transition-all"
                                                    >
                                                        <span className="font-bold text-sm text-blue-400">Request Consult</span>
                                                        <Plus size={18} className="text-blue-400" />
                                                    </button>

                                                </div>
                                            </div>
                                            <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between text-[11px] font-bold text-gray-500">
                                                <span>Emergency: 911</span>
                                                <span className="text-rose-500">Clinic Offline</span>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <HealthSummary medicalHistory={medicalHistory} allergies={allergies} />
                                
                                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                                    <div className="xl:col-span-2 space-y-4">
                                        <div className="flex justify-between items-center px-1">
                                            <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                                                <Calendar size={16} className="text-blue-500" /> Upcoming Sessions
                                            </h3>
                                            <button 
                                                onClick={() => setActiveTab('appointments')}
                                                className="text-[10px] font-black text-blue-500 uppercase hover:text-blue-400 transition-colors"
                                            >
                                                Manage All <ArrowRight size={12} className="inline ml-1" />
                                            </button>
                                        </div>
                                        <AppointmentSection 
                                            appointments={appointments} 
                                            patientId={user?.id}
                                            onRefresh={fetchDashboardData}
                                            compact={true}
                                        />
                                    </div>
                                    <div className="xl:col-span-1 space-y-4">
                                        <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-2 px-1">
                                            <Zap size={16} className="text-rose-500" /> Active Prescriptions
                                        </h3>
                                        <div className="glass-card rim-light p-1">
                                            <MedicationList prescriptions={prescriptions.slice(0, 3)} />
                                            {prescriptions.length > 3 && (
                                                <button 
                                                    onClick={() => setActiveTab('prescriptions')} 
                                                    className="w-full mt-2 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-white transition-colors"
                                                >
                                                    + {prescriptions.length - 3} More Medications
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'vitals' && <VitalsChart vitalsData={vitalSigns} />}
                        {activeTab === 'appointments' && (
                            <AppointmentSection 
                                appointments={appointments} 
                                patientId={user?.id} 
                                onRefresh={fetchDashboardData}
                            />
                        )}
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
