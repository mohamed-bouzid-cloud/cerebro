import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import API from '../api';
import { motion } from 'framer-motion';
import { 
    LogOut, Menu, X, Calendar, Users, FileText, AlertCircle, 
    Plus, Clock, CheckCircle, Heart, Home, Settings, Bell
} from 'lucide-react';
import ConsultationModal from '../components/ConsultationModal';
import '../layouts/Dashboard.css';

export default function PatientDashboard() {
    const { user, logout } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [appointments, setAppointments] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [allergies, setAllergies] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [medicalHistory, setMedicalHistory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showConsultationModal, setShowConsultationModal] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [appts, notifs, allergs, docs, history] = await Promise.all([
                API.get('/api/auth/appointments/').then(r => r.data),
                API.get('/api/auth/appointments/notifications/').then(r => r.data),
                API.get('/api/auth/allergies/').then(r => r.data),
                API.get('/api/auth/doctors/').then(r => r.data),
                API.get('/api/auth/medical-history/').catch(() => null),
            ]);
            
            setAppointments(Array.isArray(appts) ? appts : []);
            setNotifications(notifs);
            setAllergies(allergs);
            setDoctors(Array.isArray(docs) ? docs : docs?.value || []);
            setMedicalHistory(history?.data);
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
    };

    const upcomingAppointments = appointments.filter(a => a.status === 'scheduled').slice(0, 3);

    return (
        <div className="dashboard-container">
            {/* Sidebar */}
            <motion.div 
                className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}
                initial={false}
            >
                <div className="sidebar-header">
                    <div className="logo">
                        <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
                            <rect width="28" height="28" rx="7" fill="#3b82f6" />
                            <path d="M8 14c0-3.314 2.686-6 6-6s6 2.686 6 6-2.686 6-6 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                            <circle cx="14" cy="14" r="2.5" fill="#fff" />
                        </svg>
                        <span>Cerebro</span>
                    </div>
                    <button 
                        className="close-btn"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <X size={20} />
                    </button>
                </div>

                <nav className="sidebar-nav">
                    <button 
                        className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        <Home size={18} />
                        <span>Overview</span>
                    </button>
                    <button 
                        className={`nav-item ${activeTab === 'appointments' ? 'active' : ''}`}
                        onClick={() => setActiveTab('appointments')}
                    >
                        <Calendar size={18} />
                        <span>Appointments</span>
                    </button>
                    <button 
                        className={`nav-item ${activeTab === 'doctors' ? 'active' : ''}`}
                        onClick={() => setActiveTab('doctors')}
                    >
                        <Users size={18} />
                        <span>My Doctors</span>
                    </button>
                    <button 
                        className={`nav-item ${activeTab === 'medical' ? 'active' : ''}`}
                        onClick={() => setActiveTab('medical')}
                    >
                        <FileText size={18} />
                        <span>Medical Records</span>
                    </button>
                </nav>

                <div className="sidebar-footer">
                    <button 
                        className="nav-item"
                        onClick={() => setActiveTab('settings')}
                    >
                        <Settings size={18} />
                        <span>Settings</span>
                    </button>
                    <button 
                        className="nav-item logout"
                        onClick={handleLogout}
                    >
                        <LogOut size={18} />
                        <span>Sign out</span>
                    </button>
                </div>
            </motion.div>

            {/* Main Content */}
            <div className="main-content">
                <header className="topbar">
                    <button 
                        className="menu-btn"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Menu size={20} />
                    </button>
                    <div className="topbar-right">
                        <button className="icon-btn">
                            <Bell size={18} />
                        </button>
                        <div className="user-avatar">
                            {user?.first_name?.[0]}{user?.last_name?.[0]}
                        </div>
                    </div>
                </header>

                <div className="content-area">
                    {loading ? (
                        <div className="loading">Loading your dashboard...</div>
                    ) : (
                        <>
                            {/* Overview Tab */}
                            {activeTab === 'overview' && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="tab-content"
                                >
                                    <h2>Welcome, {user?.first_name}!</h2>
                                    
                                    {/* Profile Card */}
                                    <div className="card profile-card">
                                        <div className="card-header">Profile Information</div>
                                        <div className="profile-grid">
                                            <div className="profile-item">
                                                <span className="label">Name</span>
                                                <span className="value">{user?.first_name} {user?.last_name}</span>
                                            </div>
                                            <div className="profile-item">
                                                <span className="label">Email</span>
                                                <span className="value">{user?.email}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quick Stats */}
                                    <div className="stats-grid">
                                        <div className="stat-card">
                                            <Calendar size={24} />
                                            <div>
                                                <div className="stat-value">{upcomingAppointments.length}</div>
                                                <div className="stat-label">Upcoming Appointments</div>
                                            </div>
                                        </div>
                                        <div className="stat-card">
                                            <Users size={24} />
                                            <div>
                                                <div className="stat-value">{doctors.length}</div>
                                                <div className="stat-label">My Doctors</div>
                                            </div>
                                        </div>
                                        <div className="stat-card">
                                            <AlertCircle size={24} />
                                            <div>
                                                <div className="stat-value">{allergies.length}</div>
                                                <div className="stat-label">Allergies</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Upcoming Appointments */}
                                    <div className="card">
                                        <div className="card-header">
                                            <span>Upcoming Appointments</span>
                                            <button 
                                                className="btn btn-sm"
                                                onClick={() => {
                                                    if (doctors.length > 0) {
                                                        setSelectedDoctor(doctors[0]);
                                                        setShowConsultationModal(true);
                                                    }
                                                }}
                                            >
                                                <Plus size={16} /> Request Consultation
                                            </button>
                                        </div>
                                        {upcomingAppointments.length > 0 ? (
                                            <div className="appointment-list">
                                                {upcomingAppointments.map(apt => (
                                                    <div key={apt.id} className="appointment-item">
                                                        <Clock size={18} />
                                                        <div className="appointment-info">
                                                            <div className="appointment-doctor">Dr. {apt.doctor_name}</div>
                                                            <div className="appointment-time">
                                                                {new Date(apt.scheduled_at).toLocaleString()}
                                                            </div>
                                                        </div>
                                                        <span className={`status ${apt.status}`}>{apt.status}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="empty-state">
                                                <Calendar size={32} />
                                                <p>No upcoming appointments</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Notifications */}
                                    {notifications.length > 0 && (
                                        <div className="card">
                                            <div className="card-header">Upcoming Notifications</div>
                                            <div className="notifications-list">
                                                {notifications.map(notif => (
                                                    <div key={notif.id} className="notification-item">
                                                        <AlertCircle size={18} />
                                                        <div>
                                                            <div className="notification-title">Appointment in 2 days</div>
                                                            <div className="notification-text">
                                                                with Dr. {notif.doctor_name} on {new Date(notif.scheduled_at).toLocaleString()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* Appointments Tab */}
                            {activeTab === 'appointments' && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="tab-content"
                                >
                                    <div className="section-header">
                                        <h2>Appointments</h2>
                                        <button 
                                            className="btn btn-primary"
                                            onClick={() => {
                                                if (doctors.length > 0) {
                                                    setSelectedDoctor(doctors[0]);
                                                    setShowConsultationModal(true);
                                                }
                                            }}
                                        >
                                            <Plus size={16} /> Request Consultation
                                        </button>
                                    </div>

                                    <div className="card">
                                        {appointments.length > 0 ? (
                                            <div className="appointment-list">
                                                {appointments.map(apt => (
                                                    <div key={apt.id} className="appointment-item full">
                                                        <div className="appointment-header">
                                                            <div>
                                                                <div className="appointment-doctor">Dr. {apt.doctor_name}</div>
                                                                <div className="appointment-specialty">{apt.doctor_specialty}</div>
                                                            </div>
                                                            <span className={`status ${apt.status}`}>{apt.status}</span>
                                                        </div>
                                                        <div className="appointment-details">
                                                            <div>
                                                                <Clock size={16} />
                                                                {new Date(apt.scheduled_at).toLocaleString()}
                                                            </div>
                                                            <div>Duration: {apt.duration_minutes} minutes</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="empty-state">
                                                <Calendar size={48} />
                                                <p>No appointments yet</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {/* Doctors Tab */}
                            {activeTab === 'doctors' && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="tab-content"
                                >
                                    <div className="section-header">
                                        <h2>My Doctors</h2>
                                        <button 
                                            className="btn btn-primary"
                                            onClick={() => setActiveTab('medical')}
                                        >
                                            <Plus size={16} /> Add Doctor
                                        </button>
                                    </div>

                                    <div className="doctors-grid">
                                        {doctors.length > 0 ? (
                                            doctors.map(doc => (
                                                <motion.div 
                                                    key={doc.id}
                                                    className="card doctor-card"
                                                    whileHover={{ y: -2 }}
                                                >
                                                    <div className="doctor-avatar">
                                                        {doc.first_name?.[0]}{doc.last_name?.[0]}
                                                    </div>
                                                    <div className="doctor-info">
                                                        <div className="doctor-name">Dr. {doc.first_name} {doc.last_name}</div>
                                                        <div className="doctor-specialty">{doc.profile?.specialty || 'Specialist'}</div>
                                                    </div>
                                                    <button className="btn btn-sm">
                                                        <Calendar size={14} /> Schedule
                                                    </button>
                                                </motion.div>
                                            ))
                                        ) : (
                                            <div className="empty-state full-width">
                                                <Users size={48} />
                                                <p>No doctors added yet</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {/* Medical Records Tab */}
                            {activeTab === 'medical' && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="tab-content"
                                >
                                    <h2>Medical Records</h2>

                                    {/* Allergies */}
                                    <div className="card">
                                        <div className="card-header">Allergies</div>
                                        {allergies.length > 0 ? (
                                            <div className="allergies-list">
                                                {allergies.map(allergy => (
                                                    <div key={allergy.id} className="allergy-item">
                                                        <AlertCircle size={18} />
                                                        <div>
                                                            <div className="allergy-name">{allergy.allergen}</div>
                                                            <div className="allergy-reaction">{allergy.reaction}</div>
                                                        </div>
                                                        <span className={`severity ${allergy.severity}`}>
                                                            {allergy.severity}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="empty-state">
                                                <Heart size={32} />
                                                <p>No allergies recorded</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Medical History */}
                                    {medicalHistory && (
                                        <div className="card">
                                            <div className="card-header">Medical History</div>
                                            <div className="medical-info">
                                                {medicalHistory.chronic_conditions && (
                                                    <div className="medical-section">
                                                        <div className="section-title">Chronic Conditions</div>
                                                        <p>{medicalHistory.chronic_conditions}</p>
                                                    </div>
                                                )}
                                                {medicalHistory.surgeries && (
                                                    <div className="medical-section">
                                                        <div className="section-title">Surgeries</div>
                                                        <p>{medicalHistory.surgeries}</p>
                                                    </div>
                                                )}
                                                {medicalHistory.medications && (
                                                    <div className="medical-section">
                                                        <div className="section-title">Current Medications</div>
                                                        <p>{medicalHistory.medications}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Consultation Modal */}
            {showConsultationModal && selectedDoctor && (
                <ConsultationModal
                    isOpen={showConsultationModal}
                    onClose={() => {
                        setShowConsultationModal(false);
                        setSelectedDoctor(null);
                    }}
                    doctorId={selectedDoctor.id}
                    doctorName={selectedDoctor.first_name || selectedDoctor.email}
                    onSuccess={() => {
                        fetchDashboardData();
                    }}
                />
            )}
        </div>
    );
}
