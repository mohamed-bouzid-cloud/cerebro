import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import {
    Users, Activity, FileText, Calendar, LogOut, ChevronRight, Search,
    Bell, Stethoscope, Clock, ShieldCheck, ChevronDown, AlertCircle,
    Pill, Heart, Droplet, TrendingUp, X, Plus, Wifi, WifiOff
} from 'lucide-react';
import { mockPatients, generateMockAppointments, generateMockFHIRBundle, generateMockTriageScores, generateMockConsultationNotes, generateMockPrescriptions, generateMockTimelineEvents, generateMockConsultationRequests } from '../mockData';
import AppointmentCalendar from './AppointmentCalendar';
import TriageScorePanel from './TriageScorePanel';
import UrgentAlertPanel from './UrgentAlertPanel';
import ConsultationNotesForm from './ConsultationNotesForm';
import FollowUpScheduling from './FollowUpScheduling';
import EPrescriptionForm from './EPrescriptionForm';
import PatientHistoryTimeline from './PatientHistoryTimeline';

const DoctorDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [patients, setPatients] = useState(mockPatients);
    const [availablePatients, setAvailablePatients] = useState([]);
    const [stats, setStats] = useState({ studies: 0, appointments: 0 });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // FHIR Clinical State
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [selectedPatientDetails, setSelectedPatientDetails] = useState(null);
    const [clinicalLoading, setClinicalLoading] = useState(false);
    const [appointments, setAppointments] = useState(generateMockAppointments());
    const [patientAppointments, setPatientAppointments] = useState([]);
    const [consultationRequests, setConsultationRequests] = useState(generateMockConsultationRequests());

    // Assignment UI
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [assignLoading, setAssignLoading] = useState(false);

    // Panel Expansion State
    const [expandedConsultations, setExpandedConsultations] = useState(true);
    const [expandedAppointments, setExpandedAppointments] = useState(true);

    // Mock Data Mode - default to true, will be set to false if real API responds
    const [mockMode, setMockMode] = useState(true);
    const [backendReachable, setBackendReachable] = useState(false);
    const [mockAppointments] = useState(generateMockAppointments());
    const [mockConsultationRequestsData] = useState(generateMockConsultationRequests());
    const [mockTriageScores] = useState(generateMockTriageScores());
    const [mockConsultationNotes] = useState(generateMockConsultationNotes());
    const [mockPrescriptions] = useState(generateMockPrescriptions());
    const [mockTimelineEvents] = useState(generateMockTimelineEvents());

    useEffect(() => {
        const initDashboard = async () => {
            // Try to load real data; mock data is already set as default
            await fetchDashboardData();
            await fetchAppointments();
            fetchConsultationRequests();
            fetchAvailablePatients();
        };
        initDashboard();
    }, []);

    // Only poll if backend is reachable to avoid spamming console with errors
    useEffect(() => {
        if (!backendReachable) return;
        const appointmentInterval = setInterval(() => {
            fetchAppointments();
            fetchConsultationRequests();
        }, 10000);
        return () => clearInterval(appointmentInterval);
    }, [backendReachable]);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const headers = { Authorization: `Bearer ${token}` };

            const [patientsRes, dicomRes] = await Promise.all([
                fetch('http://localhost:8000/api/auth/patients/', { headers }),
                fetch('http://localhost:8000/api/auth/dicom-studies/', { headers })
            ]);

            setBackendReachable(true); // If we get here, backend is up
            if (patientsRes.ok) {
                const pData = await patientsRes.json();
                const realPatients = Array.isArray(pData) ? pData : [];
                if (realPatients.length > 0) {
                    // Merge: keep all mock patients + add any real patients that aren't duplicates
                    const mockIds = mockPatients.map(p => p.id);
                    const uniqueRealPatients = realPatients.filter(p => !mockIds.includes(p.id));
                    setPatients([...mockPatients, ...uniqueRealPatients]);
                    setMockMode(false);
                }
                // If empty list, keep the mock patients that are already set
            }

            if (dicomRes.ok) {
                const dData = await dicomRes.json();
                const dicomCount = dData.count || (dData.results ? dData.results.length : dData.length);
                setStats(s => ({ ...s, studies: dicomCount }));
            }
        } catch (error) {
            console.warn('Backend not reachable, using mock data for demo mode.');
            // Mock data is already set as default, nothing to do
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailablePatients = async () => {
        try {
            const token = localStorage.getItem('access_token');
            // Get all patients from the patients endpoint
            const allPatientsRes = await fetch('http://localhost:8000/api/auth/patients/', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (allPatientsRes.ok) {
                const allPatients = await allPatientsRes.json();
                setAvailablePatients(Array.isArray(allPatients) ? allPatients : []);
            }
        } catch (error) {
            console.error('Failed to load available patients:', error);
        }
    };

    const fetchAppointments = async () => {
        try {
            const token = localStorage.getItem('access_token');
            // Fetch appointments where doctor is the current user
            const response = await fetch(
                'http://localhost:8000/api/auth/appointments/',
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.ok) {
                const data = await response.json();
                // Handle both array and paginated responses
                const appointmentData = Array.isArray(data) ? data : (data.results ? data.results : []);

                if (appointmentData.length > 0) {
                    // Real data found - merge with mock appointments
                    const mockIds = mockAppointments.map(a => a.id);
                    const uniqueRealApts = appointmentData.filter(a => !mockIds.includes(a.id));
                    setAppointments([...mockAppointments, ...uniqueRealApts]);
                    setMockMode(false);
                    setBackendReachable(true);

                    // AUTO-ASSIGN: Extract unique patients from appointments and add to assigned patients
                    const appointmentPatients = appointmentData
                        .filter(apt => apt.patient && apt.patient.id)
                        .map(apt => apt.patient)
                        .filter((patient, index, self) =>
                            index === self.findIndex((p) => p.id === patient.id)
                        );

                    if (appointmentPatients.length > 0) {
                        setPatients(prevPatients => {
                            // Merge appointment patients with existing assigned patients
                            const existingIds = prevPatients.map(p => p.id);
                            const newPatients = appointmentPatients.filter(p => !existingIds.includes(p.id));
                            return [...prevPatients, ...newPatients];
                        });
                    }
                }
                // If empty, keep mock appointments that are already set as default
                setStats(s => ({ ...s, appointments: appointmentData.length || mockAppointments.length }));
            } else {
                // API error, keep mock appointments already set as default
                setStats(s => ({ ...s, appointments: mockAppointments.length }));
            }
        } catch (error) {
            // Backend not reachable, mock data already set as default
            setStats(s => ({ ...s, appointments: mockAppointments.length }));
        }
    };

    const fetchConsultationRequests = async () => {
        try {
            const token = localStorage.getItem('access_token');
            // Fetch incoming consultation requests (status: proposed, requested)
            const response = await fetch(
                'http://localhost:8000/api/auth/appointments/incoming_consultations/',
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.ok) {
                const data = await response.json();
                const realConsultations = Array.isArray(data) ? data : (data.results ? data.results : []);
                // Merge mock + real consultation requests
                const mockIds = mockConsultationRequestsData.map(c => c.id);
                const uniqueReal = realConsultations.filter(c => !mockIds.includes(c.id));
                setConsultationRequests([...mockConsultationRequestsData, ...uniqueReal]);
            } else {
                // Keep mock consultation requests
                setConsultationRequests(mockConsultationRequestsData);
            }
        } catch (error) {
            // Backend not reachable, mock data already set
            // Keep the mock consultation requests that were set as initial state
        }
    };

    const fetchPatientClinicalData = async (patientId) => {
        setClinicalLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const headers = { Authorization: `Bearer ${token}` };

            // Fetch FHIR clinical bundle for patient
            const clinicalEndpoints = [
                `http://localhost:8000/api/fhir/Patient/${patientId}/`,
                `http://localhost:8000/api/fhir/Condition/?patient=${patientId}`,
                `http://localhost:8000/api/fhir/MedicationRequest/?patient=${patientId}`,
                `http://localhost:8000/api/fhir/AllergyIntolerance/?patient=${patientId}`,
                `http://localhost:8000/api/fhir/Observation/?patient=${patientId}`,
                `http://localhost:8000/api/fhir/DiagnosticReport/?patient=${patientId}`
            ];

            const responses = await Promise.allSettled(
                clinicalEndpoints.map(url => fetch(url, { headers }))
            );

            let hasRealData = false;
            const data = {
                patient: null,
                conditions: [],
                medications: [],
                allergies: [],
                observations: [],
                diagnosticReports: []
            };

            for (let i = 0; i < responses.length; i++) {
                if (responses[i].status === 'fulfilled' && responses[i].value.ok) {
                    const json = await responses[i].value.json();
                    hasRealData = true;
                    if (i === 0) data.patient = json;
                    else if (i === 1) data.conditions = json.entry || json.results || [];
                    else if (i === 2) data.medications = json.entry || json.results || [];
                    else if (i === 3) data.allergies = json.entry || json.results || [];
                    else if (i === 4) data.observations = json.entry || json.results || [];
                    else if (i === 5) data.diagnosticReports = json.entry || json.results || [];
                }
            }

            // If no real FHIR data, use mock data
            if (!hasRealData) {
                const mockBundle = generateMockFHIRBundle(patientId);
                data.patient = mockBundle.entry?.[0]?.resource || null;
                data.conditions = mockBundle.entry?.filter(e => e.resource?.resourceType === 'Condition') || [];
                data.medications = mockBundle.entry?.filter(e => e.resource?.resourceType === 'MedicationRequest') || [];
                data.allergies = mockBundle.entry?.filter(e => e.resource?.resourceType === 'AllergyIntolerance') || [];
                data.observations = mockBundle.entry?.filter(e => e.resource?.resourceType === 'Observation') || [];
                setMockMode(true);
            }

            setSelectedPatientDetails(data);

            // Filter appointments for this specific patient from doctor's appointments
            // Use appointments that were already fetched by fetchAppointments()
            const patientApts = appointments.filter(apt =>
                apt.patient === patientId ||
                apt.patient_id === patientId ||
                apt.patient?.id === patientId
            );

            if (patientApts.length > 0) {
                setPatientAppointments(patientApts);
            } else {
                // Fallback to mock appointments for this patient
                const patientMockApts = mockAppointments.filter(apt => apt.patient === patientId);
                setPatientAppointments(patientMockApts);
            }
        } catch (error) {
            console.error('Failed to load clinical data, using mock data:', error);
            // Fallback: use mock FHIR bundle
            const mockBundle = generateMockFHIRBundle(patientId);
            setSelectedPatientDetails({
                patient: mockBundle.entry?.[0]?.resource || null,
                conditions: mockBundle.entry?.filter(e => e.resource?.resourceType === 'Condition') || [],
                medications: mockBundle.entry?.filter(e => e.resource?.resourceType === 'MedicationRequest') || [],
                allergies: mockBundle.entry?.filter(e => e.resource?.resourceType === 'AllergyIntolerance') || [],
                observations: mockBundle.entry?.filter(e => e.resource?.resourceType === 'Observation') || [],
                diagnosticReports: mockBundle.entry?.filter(e => e.resource?.resourceType === 'DiagnosticReport') || []
            });

            // Fallback to mock appointments for this patient
            const patientMockApts = mockAppointments.filter(apt => apt.patient === patientId);
            setPatientAppointments(patientMockApts);
            setMockMode(true);
        } finally {
            setClinicalLoading(false);
        }
    };

    const handlePatientSelect = (patient) => {
        setSelectedPatient(patient);
        fetchPatientClinicalData(patient.id);
    };

    const handleAssignPatient = async (patientId) => {
        setAssignLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch('http://localhost:8000/api/auth/patients/', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ patient_id: patientId })
            });

            if (response.ok) {
                // Refresh patients list
                await fetchDashboardData();
                setShowAssignModal(false);
            } else {
                console.error('Failed to assign patient');
            }
        } catch (error) {
            console.error('Failed to assign patient:', error);
        } finally {
            setAssignLoading(false);
        }
    };

    const handleAcceptConsultation = async (consultationId) => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(
                `http://localhost:8000/api/auth/appointments/${consultationId}/accept_consultation/`,
                {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.ok) {
                alert('Consultation accepted!');

                // Wait a moment for backend to process
                await new Promise(resolve => setTimeout(resolve, 300));

                // Fetch ALL updated patients (including manually assigned + appointment-linked)
                const patientsRes = await fetch('http://localhost:8000/api/auth/patients/', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (patientsRes.ok) {
                    const updatedPatients = await patientsRes.json();
                    const patientList = Array.isArray(updatedPatients) ? updatedPatients : [];
                    // Replace with complete list from backend
                    setPatients(patientList);
                    console.log('Patients updated:', patientList.length, 'patients');
                } else {
                    console.error('Failed to fetch updated patients');
                }

                // Refresh consultations list
                await fetchConsultationRequests();
            } else {
                const errorData = await response.json().catch(() => ({}));
                const errorMsg = errorData.error || errorData.detail || 'Failed to accept consultation';
                console.error('Accept consultation error:', response.status, errorMsg);
                alert(`Error: ${errorMsg}`);
            }
        } catch (error) {
            console.error('Failed to accept consultation:', error);
            alert('Error accepting consultation: ' + error.message);
        }
    };

    const handleRejectConsultation = async (consultationId) => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(
                `http://localhost:8000/api/auth/appointments/${consultationId}/reject_consultation/`,
                {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.ok) {
                alert('Consultation declined');
                // Refresh consultations list
                await fetchConsultationRequests();
            } else {
                alert('Failed to decline consultation');
            }
        } catch (error) {
            console.error('Failed to reject consultation:', error);
            alert('Error declining consultation');
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

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

                    <div className="relative mb-4">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search patients..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[#0a0f14] border border-[#1f2937] text-white rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors placeholder-gray-600"
                        />
                    </div>

                    <button
                        onClick={() => setShowAssignModal(true)}
                        className="w-full flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium text-sm transition-colors"
                    >
                        <Plus size={16} />
                        Add Patient
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 px-2">Assigned Patients ({patients.length})</h3>
                    {filteredPatients.length > 0 ? (
                        filteredPatients.map((patient) => (
                            <div
                                key={patient.id}
                                onClick={() => handlePatientSelect(patient)}
                                className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${selectedPatient?.id === patient.id
                                        ? 'bg-[#1a2332] border-[#2a364a]'
                                        : 'hover:bg-[#1a2332] border-transparent hover:border-[#2a364a]'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border transition-colors ${selectedPatient?.id === patient.id
                                            ? 'bg-blue-500 text-white border-blue-500'
                                            : 'bg-blue-500/10 text-blue-400 border-blue-500/20 group-hover:bg-blue-500 group-hover:text-white'
                                        }`}>
                                        {patient.first_name[0]}{patient.last_name[0]}
                                    </div>
                                    <div>
                                        <div className={`text-sm font-semibold transition-colors ${selectedPatient?.id === patient.id ? 'text-blue-400' : 'text-white group-hover:text-blue-400'
                                            }`}>
                                            {patient.first_name} {patient.last_name}
                                        </div>
                                        <div className="text-xs text-gray-500">{patient.email}</div>
                                    </div>
                                </div>
                                <ChevronRight size={16} className={`transition-colors ${selectedPatient?.id === patient.id ? 'text-blue-500' : 'text-gray-600 group-hover:text-blue-500'
                                    }`} />
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
                    <div className="flex items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Welcome, Dr. {user?.last_name || 'Doctor'}</h1>
                            <p className="text-sm text-gray-400 mt-1">Here is the summary of your clinical practice.</p>
                        </div>
                        {mockMode && (
                            <div className="ml-4 flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-full">
                                <WifiOff size={14} className="text-yellow-500" />
                                <span className="text-xs font-medium text-yellow-500">Demo Mode</span>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={fetchAppointments}
                            className="relative p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-[#1a2332]"
                        >
                            <Bell size={20} />
                            {appointments.length > 0 && (
                                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-blue-500 border-2 border-[#0a0f14] rounded-full animate-pulse"></span>
                            )}
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
                            { label: 'Appointments Today', value: appointments.length || '4', icon: Calendar, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
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

                    {/* Clinical Dashboard or Welcome */}
                    {selectedPatient ? (
                        <>
                            <ClinicalDashboard
                                patient={selectedPatient}
                                details={selectedPatientDetails}
                                loading={clinicalLoading}
                                appointments={patientAppointments}
                                consultationRequests={consultationRequests}
                                onAcceptConsultation={handleAcceptConsultation}
                                onRejectConsultation={handleRejectConsultation}
                                mockTriageScores={mockTriageScores}
                                mockConsultationNotes={mockConsultationNotes}
                                mockPrescriptions={mockPrescriptions}
                                mockTimelineEvents={mockTimelineEvents}
                                mockAppointments={mockAppointments}
                                onClose={() => {
                                    setSelectedPatient(null);
                                    setSelectedPatientDetails(null);
                                    setPatientAppointments([]);
                                }}
                            />
                            {/* Assignment Modal */}
                            {showAssignModal && (
                                <AssignPatientModal
                                    availablePatients={availablePatients}
                                    assignedPatients={patients}
                                    onAssign={handleAssignPatient}
                                    onClose={() => setShowAssignModal(false)}
                                    loading={assignLoading}
                                />
                            )}
                        </>
                    ) : (
                        <>
                            {/* Incoming Consultations Section */}
                            <div className="mb-8">
                                <IncomingConsultationsPanel
                                    requests={consultationRequests || []}
                                    expanded={expandedConsultations}
                                    onToggle={() => setExpandedConsultations(!expandedConsultations)}
                                    onAccept={handleAcceptConsultation}
                                    onReject={handleRejectConsultation}
                                />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Quick Start Card */}
                                <div className="lg:col-span-2 bg-gradient-to-br from-[#121820] to-[#1a2332] border border-[#2a364a] rounded-2xl p-8 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />

                                    <h2 className="text-2xl font-bold text-white mb-2 relative z-10">Select a patient to begin</h2>
                                    <p className="text-gray-400 mb-8 max-w-lg relative z-10">
                                        Click on any patient from the left sidebar to access their secure clinical portal. From there, you can view their medical history, conditions, medications, allergies, and lab results powered by FHIR clinical data.
                                    </p>

                                    <div className="grid sm:grid-cols-2 gap-4 relative z-10">
                                        <div className="bg-black/30 border border-white/5 rounded-xl p-5 flex items-start gap-4">
                                            <div className="bg-blue-500/20 p-2.5 rounded-lg text-blue-400">
                                                <FileText size={20} />
                                            </div>
                                            <div>
                                                <h4 className="text-white font-medium mb-1">Clinical Records</h4>
                                                <p className="text-xs text-gray-500 leading-relaxed">Access FHIR-powered patient conditions, medications, and allergies.</p>
                                            </div>
                                        </div>
                                        <div className="bg-black/30 border border-white/5 rounded-xl p-5 flex items-start gap-4">
                                            <div className="bg-emerald-500/20 p-2.5 rounded-lg text-emerald-400">
                                                <Activity size={20} />
                                            </div>
                                            <div>
                                                <h4 className="text-white font-medium mb-1">Vital Signs & Labs</h4>
                                                <p className="text-xs text-gray-500 leading-relaxed">View latest observations and diagnostic results in real-time.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Appointments Mini-Feed */}
                                <div className="bg-[#121820] border border-[#1f2937] rounded-2xl p-6">
                                    <h3 className="font-bold text-white mb-6">Upcoming Appointments</h3>
                                    <div className="space-y-4">
                                        {appointments.length > 0 ? (
                                            appointments.slice(0, 4).map((apt, idx) => (
                                                <div key={idx} className="flex gap-3 pb-4 border-b border-[#1f2937] last:border-0">
                                                    <div className="flex flex-col items-center">
                                                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium text-gray-200">Appointment {idx + 1}</p>
                                                        <p className="text-xs text-gray-500 mt-1">Status: {apt?.status || 'Scheduled'}</p>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-gray-500 text-center py-8">No appointments scheduled</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {/* Assignment Modal */}
                            {showAssignModal && (
                                <AssignPatientModal
                                    availablePatients={availablePatients}
                                    assignedPatients={patients}
                                    onAssign={handleAssignPatient}
                                    onClose={() => setShowAssignModal(false)}
                                    loading={assignLoading}
                                />
                            )}
                        </>
                    )}
                </div>
            </main>
        </div>
    );
};

const IncomingConsultationsPanel = ({ requests, expanded, onToggle, onAccept, onReject }) => {
    const requestArray = Array.isArray(requests) ? requests : [];

    const handleAccept = async (consultationId) => {
        if (onAccept) await onAccept(consultationId);
    };

    const handleReject = async (consultationId) => {
        if (onReject) await onReject(consultationId);
    };

    return (
        <div className="bg-[#121820] border border-[#1f2937] rounded-2xl overflow-hidden">
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between p-6 hover:bg-[#1a2332] transition-colors border-b border-[#1f2937]"
            >
                <div className="flex items-center gap-3">
                    <AlertCircle size={20} className="text-amber-400" />
                    <h3 className="font-bold text-white text-lg">Incoming Consultation Requests ({requestArray.length})</h3>
                </div>
                <ChevronDown size={20} className={`text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
            {expanded && (
                <div className="p-6 space-y-4">
                    {requestArray.length > 0 ? (
                        requestArray.slice(0, 5).map((req, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/30 rounded-lg p-4"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <p className="text-white font-medium text-sm">
                                            {req.patient_name || 'Patient Request'}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Requested: {req.created_at ? new Date(req.created_at).toLocaleString() : 'Date unknown'}
                                        </p>
                                    </div>
                                    <span className="text-xs font-medium px-2 py-1 rounded bg-amber-500/20 text-amber-400">
                                        {req.status || 'Pending'}
                                    </span>
                                </div>

                                {req.reason && (
                                    <div className="bg-[#0a0f14]/50 rounded p-2 mb-3">
                                        <p className="text-xs text-gray-300">{req.reason}</p>
                                    </div>
                                )}

                                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                                    <span>
                                        Type: <span className="text-amber-300">{req.consultation_type || 'General'}</span>
                                    </span>
                                    {req.duration_minutes && (
                                        <span>Duration: {req.duration_minutes} min</span>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleAccept(req.id)}
                                        className="flex-1 px-3 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/50 rounded-lg text-emerald-300 text-xs font-medium transition-colors"
                                    >
                                        Accept
                                    </button>
                                    <button
                                        onClick={() => handleReject(req.id)}
                                        className="flex-1 px-3 py-1.5 bg-red-600/30 hover:bg-red-600/50 border border-red-500/50 rounded-lg text-red-300 text-xs font-medium transition-colors"
                                    >
                                        Decline
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="text-center py-8">
                            <AlertCircle size={32} className="text-gray-600 mx-auto mb-2 opacity-50" />
                            <p className="text-gray-500 text-sm">No consultation requests</p>
                            <p className="text-gray-600 text-xs mt-2">Patients can request consultations from their dashboard</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const AppointmentsPanel = ({ appointments, expanded, onToggle }) => {
    const appointmentArray = Array.isArray(appointments) ? appointments : [];

    return (
        <div className="bg-[#121820] border border-[#1f2937] rounded-2xl overflow-hidden">
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between p-6 hover:bg-[#1a2332] transition-colors border-b border-[#1f2937]"
            >
                <div className="flex items-center gap-3">
                    <Calendar size={20} className="text-cyan-400" />
                    <h3 className="font-bold text-white text-lg">Appointments ({appointmentArray.length})</h3>
                </div>
                <ChevronDown size={20} className={`text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
            {expanded && (
                <div className="p-6 space-y-3">
                    {appointmentArray.length > 0 ? (
                        appointmentArray.slice(0, 5).map((apt, idx) => (
                            <div key={idx} className="bg-[#0a0f14] border border-cyan-500/20 rounded-lg p-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-white font-medium text-sm">Appointment {idx + 1}</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {apt.scheduled_at ? new Date(apt.scheduled_at).toLocaleString() : 'Date TBD'}
                                        </p>
                                    </div>
                                    <span className={`text-xs font-medium px-2 py-1 rounded ${apt.status === 'scheduled' ? 'bg-cyan-500/20 text-cyan-400' :
                                            apt.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                                                'bg-red-500/20 text-red-400'
                                        }`}>
                                        {apt.status || 'Pending'}
                                    </span>
                                </div>
                                {apt.notes && (
                                    <p className="text-xs text-gray-400 mt-2">{apt.notes}</p>
                                )}
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500 text-sm">No appointments scheduled</p>
                    )}
                </div>
            )}
        </div>
    );
};

const AssignPatientModal = ({ availablePatients, assignedPatients, onAssign, onClose, loading }) => {
    const [searchAssign, setSearchAssign] = useState("");
    const assignedIds = assignedPatients.map(p => p.id);

    const unassignedPatients = availablePatients.filter(p => !assignedIds.includes(p.id) &&
        ((p.first_name.toLowerCase() + " " + p.last_name.toLowerCase()).includes(searchAssign.toLowerCase()) ||
            p.email.toLowerCase().includes(searchAssign.toLowerCase()))
    );

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#121820] border border-[#2a364a] rounded-2xl max-w-md w-full p-8 max-h-96 flex flex-col"
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">Add Patient</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <input
                    type="text"
                    placeholder="Search patients..."
                    value={searchAssign}
                    onChange={(e) => setSearchAssign(e.target.value)}
                    className="w-full bg-[#0a0f14] border border-[#1f2937] text-white rounded-lg px-4 py-2.5 mb-4 focus:outline-none focus:border-blue-500 placeholder-gray-600"
                />

                <div className="flex-1 overflow-y-auto space-y-2">
                    {unassignedPatients.length > 0 ? (
                        unassignedPatients.map((patient) => (
                            <div
                                key={patient.id}
                                className="bg-[#0a0f14] border border-[#1f2937] rounded-lg p-3 flex items-center justify-between hover:border-blue-500/30 transition-colors"
                            >
                                <div>
                                    <p className="text-white font-medium text-sm">{patient.first_name} {patient.last_name}</p>
                                    <p className="text-xs text-gray-500">{patient.email}</p>
                                </div>
                                <button
                                    onClick={() => onAssign(patient.id)}
                                    disabled={loading}
                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg text-white text-xs font-medium transition-colors"
                                >
                                    Add
                                </button>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500 text-center py-8">No unassigned patients found</p>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

const DICOMPanel = ({ patientId, expanded, onToggle }) => {
    const navigate = useNavigate();
    const [dicomStudies, setDicomStudies] = useState([]);
    const [dicomLoading, setDicomLoading] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadLoading, setUploadLoading] = useState(false);
    const [folderPath, setFolderPath] = useState('');
    const [uploadMessage, setUploadMessage] = useState('');

    useEffect(() => {
        if (expanded && dicomStudies.length === 0) {
            fetchDICOMStudies();
        }
    }, [expanded, patientId]);

    const fetchDICOMStudies = async () => {
        setDicomLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(
                `http://localhost:8000/api/auth/dicom-studies/?patient=${patientId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.ok) {
                const data = await response.json();
                const studies = Array.isArray(data) ? data : (data.results ? data.results : []);
                setDicomStudies(studies);
            }
        } catch (error) {
            console.error('Failed to load DICOM studies:', error);
        } finally {
            setDicomLoading(false);
        }
    };

    const handleUploadDICOM = async () => {
        if (!folderPath.trim()) {
            setUploadMessage('Please enter a valid folder path');
            return;
        }

        setUploadLoading(true);
        setUploadMessage('');
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(
                'http://localhost:8000/api/auth/dicom-studies/upload-local/',
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        folder_path: folderPath,
                        patient_id: patientId
                    })
                }
            );

            if (response.ok) {
                const data = await response.json();
                setUploadMessage('✅ DICOM images uploaded successfully!');
                setFolderPath('');

                // Refresh DICOM studies list
                await fetchDICOMStudies();

                // Close modal after success
                setTimeout(() => {
                    setShowUploadModal(false);
                    setUploadMessage('');
                }, 2000);
            } else {
                const error = await response.json();
                setUploadMessage(`❌ Error: ${error.error || 'Upload failed'}`);
            }
        } catch (error) {
            console.error('Failed to upload DICOM:', error);
            setUploadMessage(`❌ Upload failed: ${error.message}`);
        } finally {
            setUploadLoading(false);
        }
    };

    return (
        <>
            <div className="bg-[#121820] border border-[#1f2937] rounded-2xl overflow-hidden col-span-1 lg:col-span-2">
                <button
                    onClick={onToggle}
                    className="w-full flex items-center justify-between p-6 hover:bg-[#1a2332] transition-colors border-b border-[#1f2937]"
                >
                    <div className="flex items-center gap-3">
                        <FileText size={20} className="text-cyan-400" />
                        <h3 className="font-bold text-white text-lg">DICOM Imaging ({dicomStudies.length})</h3>
                    </div>
                    <div className="flex items-center gap-3">
                        {expanded && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowUploadModal(true);
                                }}
                                className="px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/40 rounded-lg text-cyan-400 text-xs font-medium transition-colors border border-cyan-500/30"
                            >
                                + Upload
                            </button>
                        )}
                        <ChevronDown size={20} className={`text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                    </div>
                </button>
                {expanded && (
                    <div className="p-6 space-y-3">
                        {dicomLoading ? (
                            <div className="text-center py-8 text-gray-500">Loading DICOM studies...</div>
                        ) : dicomStudies.length > 0 ? (
                            dicomStudies.slice(0, 5).map((study, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    onClick={() => navigate(`/doctor/dicom-viewer?study_id=${study.id}`)}
                                    className="bg-[#0a0f14] border border-cyan-500/20 rounded-lg p-4 hover:border-cyan-500/60 hover:bg-[#0f1419] transition-all cursor-pointer group"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <p className="text-white font-medium text-sm group-hover:text-cyan-300 transition-colors">{study.study_date || study.description || 'DICOM Study'}</p>
                                            <p className="text-xs text-gray-500 mt-1 group-hover:text-gray-400 transition-colors">
                                                {study.modality || 'MRI'} • {study.num_series || 0} series
                                            </p>
                                            {study.description && (
                                                <p className="text-xs text-cyan-400 mt-2">{study.description}</p>
                                            )}
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/doctor/dicom-viewer?study_id=${study.id}`);
                                            }}
                                            className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-white text-xs font-medium transition-all shadow-lg group-hover:shadow-cyan-500/50"
                                        >
                                            View Series
                                        </button>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="text-center py-8">
                                <FileText size={32} className="text-gray-600 mx-auto mb-2 opacity-50" />
                                <p className="text-gray-500 text-sm">No DICOM studies available for this patient</p>
                                <p className="text-gray-600 text-xs mt-2">Click "Upload" to add DICOM images</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Upload DICOM Modal */}
            {showUploadModal && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                    onClick={() => setShowUploadModal(false)}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-[#121820] border border-[#2a364a] rounded-2xl p-6 w-full max-w-md shadow-2xl"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <FileText size={20} className="text-cyan-400" />
                                Upload DICOM Images
                            </h2>
                            <button
                                onClick={() => setShowUploadModal(false)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Folder Path to DICOM Files
                                </label>
                                <p className="text-xs text-gray-500 mb-2">
                                    Enter the local folder path containing .dcm or .ima DICOM files
                                </p>
                                <input
                                    type="text"
                                    value={folderPath}
                                    onChange={(e) => setFolderPath(e.target.value)}
                                    placeholder="e.g., C:\Users\Doctor\DICOM\Study001"
                                    className="w-full bg-[#0a0f14] border border-[#1f2937] text-white rounded-lg px-4 py-3 focus:outline-none focus:border-cyan-500 transition-colors placeholder-gray-600"
                                />
                            </div>

                            {uploadMessage && (
                                <div className={`text-sm p-3 rounded-lg ${uploadMessage.includes('✅')
                                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                    }`}>
                                    {uploadMessage}
                                </div>
                            )}

                            <div className="bg-[#0a0f14] border border-[#1f2937] rounded-lg p-3">
                                <p className="text-xs text-gray-400">
                                    💡 <strong>Tip:</strong> Navigate to your DICOM folder in Windows Explorer, click the address bar, and copy the path. Then paste it here.
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowUploadModal(false)}
                                    disabled={uploadLoading}
                                    className="flex-1 px-4 py-2.5 bg-[#1f2937] hover:bg-[#2a364a] disabled:opacity-50 rounded-lg text-white font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUploadDICOM}
                                    disabled={uploadLoading}
                                    className="flex-1 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 rounded-lg text-white font-medium transition-colors"
                                >
                                    {uploadLoading ? 'Uploading...' : 'Upload DICOM'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </>
    );
};

export default DoctorDashboard;

// ─────────────────────────────────────────────────────────
// CLINICAL DASHBOARD COMPONENTS
// ─────────────────────────────────────────────────────────

const ClinicalDashboard = ({ patient, details, loading, onClose, appointments, consultationRequests, onAcceptConsultation, onRejectConsultation, mockTriageScores, mockConsultationNotes, mockPrescriptions, mockTimelineEvents, mockAppointments }) => {
    const [expandedSections, setExpandedSections] = useState({
        conditions: true,
        medications: true,
        allergies: true,
        vitals: true,
        dicom: true,
        labs: false,
        appointments: true,
        consultations: true,
        urgentAlerts: true,
        appointmentCalendar: true,
        triageScore: true,
        consultationNotes: true,
        prescriptions: true,
        followUp: true,
        timeline: true
    });

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    if (loading) {
        return (
            <div className="bg-[#121820] border border-[#1f2937] rounded-2xl p-8 text-center">
                <div className="text-gray-400">Loading clinical data...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Patient Header Card */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-[#121820] to-[#1a2332] border border-[#2a364a] rounded-2xl p-6"
            >
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center text-2xl font-bold border border-blue-500/30">
                            {patient.first_name[0]}{patient.last_name[0]}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-1">{patient.first_name} {patient.last_name}</h2>
                            <p className="text-gray-400">{patient.email}</p>
                            <div className="flex items-center gap-3 mt-3">
                                <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-medium rounded-full border border-blue-500/30">
                                    Active Patient
                                </span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-[#1f2937] rounded-lg"
                    >
                        <X size={20} />
                    </button>
                </div>
            </motion.div>

            {/* Clinical Panels */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Conditions Panel */}
                <ConditionsPanel
                    conditions={details?.conditions || []}
                    expanded={expandedSections.conditions}
                    onToggle={() => toggleSection('conditions')}
                />

                {/* Medications Panel */}
                <MedicationsPanel
                    medications={details?.medications || []}
                    expanded={expandedSections.medications}
                    onToggle={() => toggleSection('medications')}
                />

                {/* Allergies Panel */}
                <AllergiesPanel
                    allergies={details?.allergies || []}
                    expanded={expandedSections.allergies}
                    onToggle={() => toggleSection('allergies')}
                />

                {/* Vital Signs Panel */}
                <VitalsPanel
                    observations={details?.observations || []}
                    expanded={expandedSections.vitals}
                    onToggle={() => toggleSection('vitals')}
                />

                {/* DICOM Imaging Panel */}
                <DICOMPanel
                    patientId={patient.id}
                    expanded={expandedSections.dicom}
                    onToggle={() => toggleSection('dicom')}
                />

                {/* Incoming Consultation Requests Panel */}
                <IncomingConsultationsPanel
                    requests={consultationRequests || []}
                    expanded={expandedSections.consultations}
                    onToggle={() => toggleSection('consultations')}
                    onAccept={onAcceptConsultation}
                    onReject={onRejectConsultation}
                />

                {/* Appointments Panel */}
                <AppointmentsPanel
                    appointments={appointments || []}
                    expanded={expandedSections.appointments}
                    onToggle={() => toggleSection('appointments')}
                />
            </div>

            {/* Full-width Labs Panel */}
            <LabsPanel
                reports={details?.diagnosticReports || []}
                expanded={expandedSections.labs}
                onToggle={() => toggleSection('labs')}
            />

            {/* NEW FEATURES SECTION */}
            <div className="mt-8 pt-8 border-t border-[#1f2937]">
                <h3 className="text-xl font-bold text-white mb-6">Clinical Management Tools</h3>

                {/* Urgent Alert Panel - Top Priority */}
                {mockTriageScores && mockTriageScores.length > 0 && (
                    <div className="mb-6">
                        <UrgentAlertPanel
                            patientId={patient.id}
                            isDoctor={true}
                        />
                    </div>
                )}

                {/* 2-Column Grid for Calendar and Triage */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Appointment Calendar */}
                    <AppointmentCalendar
                        patientId={patient.id}
                        isDoctor={true}
                    />

                    {/* Triage Score Panel */}
                    <TriageScorePanel
                        patientId={patient.id}
                        isDoctor={true}
                        patientName={`${patient.first_name} ${patient.last_name}`}
                    />
                </div>

                {/* 2-Column Grid for Follow-up and Prescriptions */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Follow-up Scheduling */}
                    <FollowUpScheduling
                        patientId={patient.id}
                        isDoctor={true}
                        patientName={`${patient.first_name} ${patient.last_name}`}
                    />

                    {/* E-Prescription Form */}
                    <EPrescriptionForm
                        patientId={patient.id}
                        isDoctor={true}
                        patientName={`${patient.first_name} ${patient.last_name}`}
                    />
                </div>

                {/* Consultation Notes Form */}
                <div className="mb-6">
                    <ConsultationNotesForm
                        patientId={patient.id}
                        appointmentId={appointments?.[0]?.id || null}
                        isDoctor={true}
                        patientName={`${patient.first_name} ${patient.last_name}`}
                    />
                </div>

                {/* Patient History Timeline - Full Width */}
                <div>
                    <PatientHistoryTimeline
                        patientId={patient.id}
                        isDoctor={true}
                        patientName={`${patient.first_name} ${patient.last_name}`}
                    />
                </div>
            </div>
        </div>
    );
};

const ConditionsPanel = ({ conditions, expanded, onToggle }) => {
    const conditionArray = Array.isArray(conditions)
        ? conditions.map(c => c.resource || c)
        : [];

    return (
        <div className="bg-[#121820] border border-[#1f2937] rounded-2xl overflow-hidden">
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between p-6 hover:bg-[#1a2332] transition-colors border-b border-[#1f2937]"
            >
                <div className="flex items-center gap-3">
                    <AlertCircle size={20} className="text-blue-400" />
                    <h3 className="font-bold text-white text-lg">Conditions ({conditionArray.length})</h3>
                </div>
                <ChevronDown size={20} className={`text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
            {expanded && (
                <div className="p-6 space-y-3">
                    {conditionArray.length > 0 ? (
                        conditionArray.slice(0, 5).map((cond, idx) => (
                            <div key={idx} className="bg-[#0a0f14] border border-[#1f2937] rounded-lg p-3">
                                <p className="text-white font-medium text-sm">{cond.code?.coding?.[0]?.display || cond.code?.text || 'Condition'}</p>
                                <p className="text-xs text-gray-500 mt-1">Status: {cond.clinicalStatus?.coding?.[0]?.code || 'unknown'}</p>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500 text-sm">No conditions recorded</p>
                    )}
                </div>
            )}
        </div>
    );
};

const MedicationsPanel = ({ medications, expanded, onToggle }) => {
    const medArray = Array.isArray(medications)
        ? medications.map(m => m.resource || m)
        : [];

    return (
        <div className="bg-[#121820] border border-[#1f2937] rounded-2xl overflow-hidden">
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between p-6 hover:bg-[#1a2332] transition-colors border-b border-[#1f2937]"
            >
                <div className="flex items-center gap-3">
                    <Pill size={20} className="text-emerald-400" />
                    <h3 className="font-bold text-white text-lg">Active Medications ({medArray.filter(m => m.status === 'active').length})</h3>
                </div>
                <ChevronDown size={20} className={`text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
            {expanded && (
                <div className="p-6 space-y-3">
                    {medArray.filter(m => m.status === 'active').length > 0 ? (
                        medArray.filter(m => m.status === 'active').slice(0, 5).map((med, idx) => (
                            <div key={idx} className="bg-[#0a0f14] border border-emerald-500/20 rounded-lg p-3">
                                <p className="text-white font-medium text-sm">
                                    {med.medicationCodeableConcept?.coding?.[0]?.display || med.medicationReference?.display || 'Medication'}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {med.dosageInstruction?.[0]?.text || med.dosageInstruction?.[0]?.doseAndRate?.[0]?.doseQuantity?.value + ' ' + med.dosageInstruction?.[0]?.doseAndRate?.[0]?.doseQuantity?.unit || 'Dosage not specified'}
                                </p>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500 text-sm">No active medications</p>
                    )}
                </div>
            )}
        </div>
    );
};

const AllergiesPanel = ({ allergies, expanded, onToggle }) => {
    const allergyArray = Array.isArray(allergies)
        ? allergies.map(a => a.resource || a)
        : [];

    return (
        <div className="bg-[#121820] border border-[#1f2937] rounded-2xl overflow-hidden">
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between p-6 hover:bg-[#1a2332] transition-colors border-b border-[#1f2937]"
            >
                <div className="flex items-center gap-3">
                    <AlertCircle size={20} className={allergyArray.some(a => a.criticality === 'high') ? 'text-red-400' : 'text-yellow-400'} />
                    <h3 className="font-bold text-white text-lg">Allergies ({allergyArray.length})</h3>
                </div>
                <ChevronDown size={20} className={`text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
            {expanded && (
                <div className="p-6 space-y-3">
                    {allergyArray.length > 0 ? (
                        allergyArray.map((allergy, idx) => (
                            <div key={idx} className={`border rounded-lg p-3 ${allergy.criticality === 'high'
                                    ? 'bg-red-500/10 border-red-500/30'
                                    : 'bg-[#0a0f14] border-[#1f2937]'
                                }`}>
                                <p className={`font-medium text-sm ${allergy.criticality === 'high' ? 'text-red-400' : 'text-white'
                                    }`}>
                                    {allergy.code?.coding?.[0]?.display || allergy.code?.text || 'Allergen'}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    Reaction: {allergy.reaction?.[0]?.manifestation?.[0]?.coding?.[0]?.display || allergy.reaction?.[0]?.manifestation?.[0]?.text || 'Not specified'}
                                </p>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500 text-sm">No known allergies</p>
                    )}
                </div>
            )}
        </div>
    );
};

const VitalsPanel = ({ observations, expanded, onToggle }) => {
    const obsArray = Array.isArray(observations)
        ? observations.map(o => o.resource || o)
        : [];

    const vitalTypes = {
        'heart-rate': { label: 'Heart Rate', unit: 'bpm', icon: Heart, color: 'text-red-400' },
        'blood-pressure': { label: 'Blood Pressure', unit: 'mmHg', icon: Heart, color: 'text-blue-400' },
        'body-temperature': { label: 'Temperature', unit: '°C', icon: Droplet, color: 'text-orange-400' },
        'oxygen-saturation': { label: 'SpO2', unit: '%', icon: Droplet, color: 'text-emerald-400' }
    };

    const vitals = obsArray.filter(o =>
        o.code?.coding?.some(c => Object.keys(vitalTypes).some(k => c.code?.includes(k)))
    ).slice(0, 5);

    return (
        <div className="bg-[#121820] border border-[#1f2937] rounded-2xl overflow-hidden">
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between p-6 hover:bg-[#1a2332] transition-colors border-b border-[#1f2937]"
            >
                <div className="flex items-center gap-3">
                    <Heart size={20} className="text-red-400" />
                    <h3 className="font-bold text-white text-lg">Vital Signs ({vitals.length})</h3>
                </div>
                <ChevronDown size={20} className={`text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
            {expanded && (
                <div className="p-6 space-y-3">
                    {vitals.length > 0 ? (
                        vitals.map((vital, idx) => (
                            <div key={idx} className="bg-[#0a0f14] border border-[#1f2937] rounded-lg p-3 flex items-center justify-between">
                                <div>
                                    <p className="text-white font-medium text-sm">{vital.code?.coding?.[0]?.display || 'Observation'}</p>
                                    <p className="text-xs text-gray-500 mt-1">{new Date(vital.effectiveDateTime).toLocaleString()}</p>
                                </div>
                                <p className="text-right">
                                    <span className="text-lg font-bold text-white">{vital.valueQuantity?.value}</span>
                                    <span className="text-xs text-gray-500 ml-1">{vital.valueQuantity?.unit}</span>
                                </p>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500 text-sm">No vital signs recorded</p>
                    )}
                </div>
            )}
        </div>
    );
};

const LabsPanel = ({ reports, expanded, onToggle }) => {
    const reportArray = Array.isArray(reports)
        ? reports.map(r => r.resource || r)
        : [];

    return (
        <div className="bg-[#121820] border border-[#1f2937] rounded-2xl overflow-hidden">
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between p-6 hover:bg-[#1a2332] transition-colors border-b border-[#1f2937]"
            >
                <div className="flex items-center gap-3">
                    <TrendingUp size={20} className="text-purple-400" />
                    <h3 className="font-bold text-white text-lg">Lab Results ({reportArray.length})</h3>
                </div>
                <ChevronDown size={20} className={`text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
            {expanded && (
                <div className="p-6 space-y-3">
                    {reportArray.length > 0 ? (
                        reportArray.slice(0, 5).map((report, idx) => (
                            <div key={idx} className="bg-[#0a0f14] border border-purple-500/20 rounded-lg p-3">
                                <p className="text-white font-medium text-sm">{report.code?.coding?.[0]?.display || 'Lab Report'}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                    Issued: {new Date(report.issued).toLocaleDateString()}
                                </p>
                                <p className="text-xs text-purple-400 mt-2">
                                    {report.result?.length || 0} results
                                </p>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500 text-sm">No lab results available</p>
                    )}
                </div>
            )}
        </div>
    );
};
