import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import API from '../api';
import { motion } from 'framer-motion';
import { 
    LogOut, Menu, X, Calendar, Users, FileText, Clock, 
    CheckCircle, Home, Settings, Bell, ChevronRight
} from 'lucide-react';
import '../layouts/Dashboard.css';

export default function DoctorDashboard() {
    const { user, logout } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [todayAppointments, setTodayAppointments] = useState([]);
    const [upcomingAppointments, setUpcomingAppointments] = useState([]);
    const [consultations, setConsultations] = useState([]);
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPatient, setSelectedPatient] = useState(null);

    useEffect(() => {
        console.clear();
        console.log('===== DOCTOR DASHBOARD LOADED =====');
        console.log('User:', user?.first_name, user?.last_name, `(${user?.role})`);
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            console.log('📊 Fetching dashboard data...');
            setLoading(true);
            
            // Fetch each endpoint independently with better error handling
            let today = [], upcoming = [], cons = [], fhirSR = [], pats = [];
            
            try {
                today = (await API.get('/api/auth/appointments/today/')).data;
                today = Array.isArray(today) ? today : [];
            } catch (err) {
                console.warn('Could not fetch today appointments:', err.message);
            }
            
            try {
                upcoming = (await API.get('/api/auth/appointments/upcoming/')).data;
                upcoming = Array.isArray(upcoming) ? upcoming : [];
            } catch (err) {
                console.warn('Could not fetch upcoming appointments:', err.message);
            }
            
            try {
                cons = (await API.get('/api/auth/consultations/')).data;
                cons = Array.isArray(cons) ? cons : [];
                console.log('✓ Loaded', cons.length, 'consultations from API');
            } catch (err) {
                console.error('Error fetching consultations:', err.message);
            }
            
            try {
                fhirSR = (await API.get('/api/auth/fhir/servicerequests/')).data;
                fhirSR = Array.isArray(fhirSR) ? fhirSR : [];
                console.log('✓ Loaded', fhirSR.length, 'FHIR ServiceRequests');
            } catch (err) {
                console.warn('Could not fetch FHIR ServiceRequests:', err.message);
            }
            
            try {
                pats = (await API.get('/api/auth/patients/')).data;
                pats = Array.isArray(pats) ? pats : [];
            } catch (err) {
                console.warn('Could not fetch patients:', err.message);
            }
            
            setTodayAppointments(today);
            setUpcomingAppointments(upcoming);
            
            // Merge consultations from both regular API and FHIR ServiceRequests
            const fhirConsultations = (Array.isArray(fhirSR) ? fhirSR : []).map(sr => ({
                id: sr?.id || Math.random(),
                patient_name: sr?.subject?.display || sr?.requester?.display || 'Unknown Patient',
                doctor_name: sr?.performer?.[0]?.display || 'Unknown Doctor',
                consultation_type: sr?.code?.text || 'Consultation',
                reason: sr?.reasonCode?.[0]?.text || sr?.code?.text || 'No reason specified',
                status: sr?.status || 'requested',
                _fhir: true  // Mark as FHIR resource
            }));
            
            const allConsultations = [...cons, ...fhirConsultations];
            console.log('✓ Total consultations to display:', allConsultations.length);
            setConsultations(allConsultations);
            setPatients(pats);
        } catch (err) {
            console.error('Unexpected error fetching dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
    };

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
                        className={`nav-item ${activeTab === 'consultations' ? 'active' : ''}`}
                        onClick={() => setActiveTab('consultations')}
                    >
                        <FileText size={18} />
                        <span>Consultations</span>
                    </button>
                    <button 
                        className={`nav-item ${activeTab === 'patients' ? 'active' : ''}`}
                        onClick={() => setActiveTab('patients')}
                    >
                        <Users size={18} />
                        <span>My Patients</span>
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
                                    <h2>Welcome, Dr. {user?.last_name}!</h2>

                                    {/* Profile Card */}
                                    <div className="card profile-card">
                                        <div className="card-header">Profile Information</div>
                                        <div className="profile-grid">
                                            <div className="profile-item">
                                                <span className="label">Name</span>
                                                <span className="value">Dr. {user?.first_name} {user?.last_name}</span>
                                            </div>
                                            <div className="profile-item">
                                                <span className="label">Specialty</span>
                                                <span className="value">{user?.profile?.specialty || 'Not specified'}</span>
                                            </div>
                                            <div className="profile-item">
                                                <span className="label">Email</span>
                                                <span className="value">{user?.email}</span>
                                            </div>
                                            <div className="profile-item">
                                                <span className="label">License</span>
                                                <span className="value">{user?.profile?.license_number || 'Not provided'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quick Stats */}
                                    <div className="stats-grid">
                                        <div className="stat-card">
                                            <Calendar size={24} />
                                            <div>
                                                <div className="stat-value">{todayAppointments.length}</div>
                                                <div className="stat-label">Today's Appointments</div>
                                            </div>
                                        </div>
                                        <div className="stat-card">
                                            <Clock size={24} />
                                            <div>
                                                <div className="stat-value">{upcomingAppointments.length}</div>
                                                <div className="stat-label">Upcoming</div>
                                            </div>
                                        </div>
                                        <div className="stat-card">
                                            <Users size={24} />
                                            <div>
                                                <div className="stat-value">{patients.length}</div>
                                                <div className="stat-label">Patients</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Today's Schedule */}
                                    <div className="card">
                                        <div className="card-header">Today's Schedule</div>
                                        {todayAppointments.length > 0 ? (
                                            <div className="appointment-list">
                                                {todayAppointments.map(apt => (
                                                    <div key={apt.id} className="appointment-item">
                                                        <Clock size={18} />
                                                        <div className="appointment-info">
                                                            <div className="appointment-doctor">{apt.patient_name}</div>
                                                            <div className="appointment-time">
                                                                {new Date(apt.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                        </div>
                                                        <CheckCircle size={18} />
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="empty-state">
                                                <Calendar size={32} />
                                                <p>No appointments scheduled for today</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Upcoming Consultations */}
                                    {upcomingAppointments.length > 0 && (
                                        <div className="card">
                                            <div className="card-header">Upcoming Consultations</div>
                                            <div className="appointment-list">
                                                {upcomingAppointments.slice(0, 5).map(apt => (
                                                    <div key={apt.id} className="appointment-item">
                                                        <Calendar size={18} />
                                                        <div className="appointment-info">
                                                            <div className="appointment-doctor">{apt.patient_name}</div>
                                                            <div className="appointment-time">
                                                                {new Date(apt.scheduled_at).toLocaleString()}
                                                            </div>
                                                        </div>
                                                        <ChevronRight size={18} />
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
                                    <h2>Appointments</h2>

                                    <div className="appointments-section">
                                        <div className="card">
                                            <div className="card-header">Today</div>
                                            {todayAppointments.length > 0 ? (
                                                <div className="appointment-list">
                                                    {todayAppointments.map(apt => (
                                                        <div key={apt.id} className="appointment-item full">
                                                            <div className="appointment-header">
                                                                <div>
                                                                    <div className="appointment-doctor">{apt.patient_name}</div>
                                                                    <div className="appointment-time">
                                                                        {new Date(apt.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                    </div>
                                                                </div>
                                                                <span className="status scheduled">Scheduled</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="empty-state">
                                                    <Calendar size={32} />
                                                    <p>No appointments today</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="card">
                                            <div className="card-header">Upcoming</div>
                                            {upcomingAppointments.length > 0 ? (
                                                <div className="appointment-list">
                                                    {upcomingAppointments.map(apt => (
                                                        <div key={apt.id} className="appointment-item full">
                                                            <div className="appointment-header">
                                                                <div>
                                                                    <div className="appointment-doctor">{apt.patient_name}</div>
                                                                    <div className="appointment-time">
                                                                        {new Date(apt.scheduled_at).toLocaleString()}
                                                                    </div>
                                                                </div>
                                                                <span className="status scheduled">Scheduled</span>
                                                            </div>
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
                                    </div>
                                </motion.div>
                            )}

                            {/* Consultations Tab */}
                            {activeTab === 'consultations' && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="tab-content"
                                >
                                    <h2>Consultation Requests</h2>

                                    <div className="card">
                                        {consultations.length > 0 ? (
                                            <div className="consultation-list">
                                                {consultations.map(cons => (
                                                    <div key={cons.id} className="consultation-item">
                                                        <div className="consultation-header">
                                                            <div>
                                                                <div className="consultation-patient">{cons.patient_name || 'Unknown Patient'}</div>
                                                                <div className="consultation-type">
                                                                    {cons.consultation_type || 'Consultation'} • {(cons.reason || 'No reason provided').substring(0, 60)}...
                                                                </div>
                                                            </div>
                                                            <span className={`status ${cons.status}`}>{cons.status}</span>
                                                        </div>
                                                        <div className="consultation-actions">
                                                            {cons.status === 'requested' && (
                                                                <>
                                                                    <button style={{ background: '#10b981', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Accept</button>
                                                                    <button style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', marginLeft: '6px' }}>Decline</button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="empty-state">
                                                <FileText size={32} />
                                                <p>No consultation requests</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {/* Patients Tab */}
                            {activeTab === 'patients' && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="tab-content"
                                >
                                    <h2>My Patients</h2>

                                    <div className="patients-grid">
                                        {patients.length > 0 ? (
                                            patients.map(patient => (
                                                <motion.div 
                                                    key={patient.id}
                                                    className="card patient-card"
                                                    whileHover={{ y: -2 }}
                                                    onClick={() => setSelectedPatient(patient)}
                                                >
                                                    <div className="patient-avatar">
                                                        {patient.first_name?.[0]}{patient.last_name?.[0]}
                                                    </div>
                                                    <div className="patient-info">
                                                        <div className="patient-name">{patient.first_name} {patient.last_name}</div>
                                                        <div className="patient-email">{patient.email}</div>
                                                    </div>
                                                    <button className="btn btn-sm">
                                                        <FileText size={14} /> View Records
                                                    </button>
                                                </motion.div>
                                            ))
                                        ) : (
                                            <div className="empty-state full-width">
                                                <Users size={48} />
                                                <p>No patients yet</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Patient Details Panel */}
                                    {selectedPatient && (
                                        <motion.div 
                                            className="card patient-details"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                        >
                                            <div className="card-header">
                                                <h3>{selectedPatient.first_name} {selectedPatient.last_name}</h3>
                                                <button 
                                                    className="close-btn"
                                                    onClick={() => setSelectedPatient(null)}
                                                >
                                                    <X size={18} />
                                                </button>
                                            </div>
                                            <div className="details-grid">
                                                <div className="detail-item">
                                                    <span className="label">Email</span>
                                                    <span className="value">{selectedPatient.email}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <span className="label">Contact</span>
                                                    <span className="value">{selectedPatient.profile?.phone_number || 'Not provided'}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <span className="label">DOB</span>
                                                    <span className="value">{selectedPatient.profile?.date_of_birth || 'Not provided'}</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </motion.div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
