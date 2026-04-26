
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import {
    Users, Activity, FileText, Calendar, LogOut, ChevronRight, Search,
    Bell, Stethoscope, Clock, ShieldCheck, ChevronDown, AlertCircle,
    Pill, Heart, Droplet, TrendingUp, X, Plus, Wifi, WifiOff, Edit2,
    Microscope, CheckCircle2, RefreshCw, Thermometer, MoreVertical, FileImage
} from 'lucide-react';
import { mockPatients, generateMockAppointments, generateMockFHIRBundle, generateMockTriageScores, generateMockConsultationNotes, generateMockPrescriptions, generateMockTimelineEvents, generateMockConsultationRequests } from '../mockData';
import AppointmentCalendar from './AppointmentCalendar';
import TriageScorePanel from './TriageScorePanel';
import UrgentAlertPanel from './UrgentAlertPanel';
import ConsultationNotesForm from './ConsultationNotesForm';
import FollowUpScheduling from './FollowUpScheduling';
import EPrescriptionForm from './EPrescriptionForm';
import PatientHistoryTimeline from './PatientHistoryTimeline';
import WaitingRoomQueue from './WaitingRoomQueue';
import AvailabilityManager from './AvailabilityManager';
import AppointmentModal from './AppointmentModal';
import LabCenterPanel from './DoctorDashboard/LabCenterPanel';
import AddPatientModal from './DoctorDashboard/AddPatientModal';


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
    const [waitingRoom, setWaitingRoom] = useState([]);

    // Assignment UI
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [assignLoading, setAssignLoading] = useState(false);
    const [showBookingModal, setShowBookingModal] = useState(false);

    // Panel Expansion State
    const [expandedConsultations, setExpandedConsultations] = useState(true);
    const [expandedAppointments, setExpandedAppointments] = useState(true);
    const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, calendar, availability, patients
    const [utilityModal, setUtilityModal] = useState(null); // reports, broadcast, inventory

    // --- Utility Modules State (Persistent during session) ---
    const [inventoryItems, setInventoryItems] = useState([
        { id: 1, name: 'Neurology Intake Kit', stock: 4, category: 'Equipment' },
        { id: 2, name: 'Sterile Gauss Pads', stock: 15, category: 'Consumable' },
        { id: 3, name: 'Donepezil 10mg', stock: 120, category: 'Pharmacy' },
        { id: 4, name: 'ECG Electrodes', stock: 45, category: 'Consumable' }
    ]);
    const [broadcastHistory, setBroadcastHistory] = useState([
        { id: 0, message: 'Welcome to Cerebro v2.0 Node.', target: 'All Staff', timestamp: new Date(Date.now() - 3600000).toISOString() }
    ]);
    const [analyticsRange, setAnalyticsRange] = useState('7d');

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
            // Fetch incoming consultation requests
            const response = await fetch(
                'http://localhost:8000/api/auth/consultations/',
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
            // Generate mock FHIR data for patient (FHIR endpoints not yet implemented on backend)
            // In the future, these can be replaced with real FHIR API endpoints
            const mockBundle = generateMockFHIRBundle(patientId);
            
            const data = {
                patient: mockBundle.entry?.[0]?.resource || null,
                conditions: mockBundle.entry?.filter(e => e.resource?.resourceType === 'Condition') || [],
                medications: mockBundle.entry?.filter(e => e.resource?.resourceType === 'MedicationRequest') || [],
                allergies: mockBundle.entry?.filter(e => e.resource?.resourceType === 'AllergyIntolerance') || [],
                observations: mockBundle.entry?.filter(e => e.resource?.resourceType === 'Observation') || [],
                diagnosticReports: mockBundle.entry?.filter(e => e.resource?.resourceType === 'DiagnosticReport') || []
            };

            setSelectedPatientDetails(data);
            setMockMode(true);
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
                `http://localhost:8000/api/auth/consultations/${consultationId}/accept/`,
                {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.ok) {
                const acceptResult = await response.json();
                
                // Find the consultation to move it
                const acceptedReq = consultationRequests.find(r => r.id === consultationId);
                
                setConsultationRequests(prev => prev.filter(r => r.id !== consultationId));
                
                if (acceptedReq) {
                    const arrivedPatient = {
                        id: `WR-${consultationId}`,
                        patient_name: acceptedReq.patient_name || "New Patient",
                        patient_id: acceptedReq.patient,
                        status: 'arrived',
                        scheduled_at: new Date().toISOString(),
                        notes: acceptedReq.reason,
                        arrived_at: new Date()
                    };
                    setWaitingRoom(prev => [arrivedPatient, ...prev]);
                }
                
                alert('Consultation accepted! Patient moved to Waiting Room.');

                // Get the patient ID from the consultation
                const getConsultationRes = await fetch(
                    `http://localhost:8000/api/auth/consultations/${consultationId}/`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                if (getConsultationRes.ok) {
                    const consultation = await getConsultationRes.json();
                    const patientId = consultation.patient;

                    // Fetch the newly accepted patient's details
                    const patientRes = await fetch(
                        `http://localhost:8000/api/auth/patients/${patientId}/`,
                        { headers: { Authorization: `Bearer ${token}` } }
                    );

                    if (patientRes.ok) {
                        const patientData = await patientRes.json();
                        
                        // Add the new patient to existing list (don't replace)
                        setPatients(prevPatients => {
                            // Check if patient already exists
                            const exists = prevPatients.some(p => p.id === patientData.patient.id);
                            if (exists) {
                                return prevPatients;
                            }
                            // Add new patient to the list
                            return [...prevPatients, patientData.patient];
                        });
                        console.log('New patient added:', patientData.patient.first_name, patientData.patient.last_name);
                    }
                }

                // Refresh consultations list
                await fetchConsultationRequests();
            } else {
                const errorData = await response.json().catch(() => ({}));
                const errorMsg = errorData.error || errorData.detail || 'Failed to accept consultation';
                console.error('Accept consultation error:', response.status, errorMsg);
                
                // FALLBACK: Move patient locally even if API fails (for demo/mock consistency)
                const acceptedReq = consultationRequests.find(r => r.id === consultationId);
                setConsultationRequests(prev => prev.filter(r => r.id !== consultationId));
                
                if (acceptedReq) {
                    setWaitingRoom(prev => [{
                        id: `WR-FB-${consultationId}`,
                        patient_name: acceptedReq.patient_name || "New Patient",
                        status: 'arrived',
                        scheduled_at: new Date().toISOString(),
                        arrived_at: new Date(),
                        notes: acceptedReq.reason
                    }, ...prev]);
                }
                
                alert('Accepted (Local Demo Mode). Patient moved to Waiting Room.');
            }
        } catch (error) {
            console.error('Failed to accept consultation:', error);
            
            // local/mock fallback
            const acceptedReq = consultationRequests.find(r => r.id === consultationId);
            setConsultationRequests(prev => prev.filter(r => r.id !== consultationId));
            
            if (acceptedReq) {
                setWaitingRoom(prev => [{
                    id: `WR-${consultationId}`,
                    patient_name: acceptedReq.patient_name || "New Patient",
                    status: 'arrived',
                    scheduled_at: new Date().toISOString(),
                    arrived_at: new Date()
                }, ...prev]);
            }
            
            alert('Consultation accepted directly! Patient moved to Waiting Room (Demo).');
        }
    };

    const handleRejectConsultation = async (consultationId) => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(
                `http://localhost:8000/api/auth/consultations/${consultationId}/reject/`,
                {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.ok) {
                alert('Consultation declined');
                setConsultationRequests(prev => prev.filter(r => r.id !== consultationId));
                // Refresh consultations list
                await fetchConsultationRequests();
            } else {
                alert('Failed to decline consultation');
            }
        } catch (error) {
            console.error('Failed to reject consultation:', error);
            alert('Consultation declined locally.');
            setConsultationRequests(prev => prev.filter(r => r.id !== consultationId));
        }
    };

    const handleWalkIn = async (patientId) => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch('http://localhost:8000/api/auth/appointments/', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    patient: parseInt(patientId),
                    doctor: user.id,
                    scheduled_at: new Date().toISOString(),
                    duration_minutes: 30,
                    status: 'confirmed',
                    notes: 'Walk-in patient registration'
                })
            });

            if (response.ok) {
                alert('Walk-in patient registered and added to queue');
                fetchAppointments(); // Refresh lists
            } else {
                const err = await response.json();
                alert('Failed to register walk-in: ' + (err.detail || JSON.stringify(err)));
            }
        } catch (error) {
            console.error('Walk-in error:', error);
            alert('Error registering walk-in');
        }
    };

    const handleStatusUpdate = async (appointmentId, newStatus) => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`http://localhost:8000/api/auth/appointments/${appointmentId}/`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok || appointmentId.toString().startsWith('APT-')) {
                // Refresh local state
                setAppointments(prev => prev.map(a => a.id === appointmentId ? { ...a, status: newStatus } : a));
                if (selectedPatient) {
                    setPatientAppointments(prev => prev.map(a => a.id === appointmentId ? { ...a, status: newStatus } : a));
                }
                
                if (appointmentId.toString().startsWith('APT-')) {
                    console.log('Mock status update successful locally');
                }
            } else {
                alert('Failed to update status');
            }
        } catch (error) {
            console.error('Status update error:', error);
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
        <div className="flex h-screen bg-[#070B14] text-gray-200 overflow-hidden font-sans relative premium-depth-bg">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.03)_0%,transparent_70%)] pointer-events-none" />
            
            {/* Sidebar */}
            <aside className="w-80 bg-black/40 backdrop-blur-2xl border-r border-white/5 flex flex-col h-full shrink-0 relative z-10 shadow-[20px_0_40px_rgba(0,0,0,0.3)]">
                <div className="p-6 border-b border-white/5">
                    <div className="flex items-center gap-3 text-white font-bold text-xl mb-6 tracking-wide drop-shadow-md">
                        <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 p-2 rounded-xl border border-white/10 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
                            <Stethoscope size={24} className="text-blue-400" />
                        </div>
                        Cerebro Medical
                    </div>

                    <div className="relative mb-4">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search patients..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all placeholder-gray-500 text-sm shadow-inner"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <button
                            onClick={() => setShowAssignModal(true)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600/80 to-blue-500/80 hover:from-blue-500 hover:to-blue-400 rounded-xl text-white font-bold text-xs tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] border border-blue-400/30 hover:scale-[1.02]"
                        >
                            <Plus size={16} />
                            Add Patient
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-4 px-2 flex items-center gap-2"><Users size={12} /> Assigned Roster</h3>
                    {filteredPatients.length > 0 ? (
                        filteredPatients.map((p) => (
                            <div
                                key={p.id}
                                onClick={() => handlePatientSelect(p)}
                                className={`group flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-all border backdrop-blur-md ${selectedPatient?.id === p.id
                                        ? 'bg-blue-500/10 border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.1)]'
                                        : 'bg-white/[0.02] border-white/5 hover:bg-white/5 hover:border-white/10'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-sm border transition-all shadow-inner ${selectedPatient?.id === p.id
                                            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                                            : 'bg-black/50 text-gray-400 border-white/10 group-hover:bg-blue-500/20 group-hover:text-blue-400 group-hover:border-blue-500/30'
                                        }`}>
                                        {p.first_name[0]}{p.last_name[0]}
                                    </div>
                                    <div>
                                        <div className={`text-sm font-bold tracking-wide transition-colors ${selectedPatient?.id === p.id ? 'text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]' : 'text-gray-300 group-hover:text-white'
                                            }`}>
                                            {p.first_name} {p.last_name}
                                        </div>
                                        <div className="text-[10px] font-bold text-gray-500 tracking-widest uppercase mt-0.5">ID: {p.id}</div>
                                    </div>
                                </div>
                                <ChevronRight size={16} className={`transition-colors ${selectedPatient?.id === p.id ? 'text-blue-400 drop-shadow-[0_0_5px_rgba(59,130,246,0.8)]' : 'text-gray-600 group-hover:text-gray-400'
                                    }`} />
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-xs font-medium text-gray-500 uppercase tracking-widest">No patients found.</div>
                    )}
                </div>

                <div className="p-6 border-t border-white/5 mt-auto bg-black/20">
                    <button
                        onClick={handleLogout}
                        className="flex items-center justify-center gap-2 w-full py-3 bg-white/5 border border-white/5 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30 rounded-xl transition-all font-bold text-xs uppercase tracking-widest shadow-inner"
                    >
                        <LogOut size={14} />
                        Secure Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-full overflow-y-auto relative z-0">
                {/* Top Nav */}
                <header className="h-24 px-10 flex flex-col justify-center border-b border-white/5 bg-black/20 backdrop-blur-3xl sticky top-0 z-20 shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
                    <div className="flex items-center justify-between w-full max-w-7xl mx-auto">
                        <div className="flex items-center gap-4">
                            <h1 className="text-xl font-light text-white tracking-wider flex items-center gap-3">
                                Clinical Console 
                                <span className="w-1 h-1 rounded-full bg-blue-500 drop-shadow-[0_0_5px_rgba(59,130,246,0.8)]"></span>
                                <span className="text-blue-400 font-bold">Dr. {user?.last_name || 'Provider'}</span>
                            </h1>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/5 shadow-inner">
                                {[
                                    { id: 'dashboard', label: 'Overview', icon: Activity },
                                    { id: 'calendar', label: 'Calendar', icon: Calendar },
                                    { id: 'availability', label: 'Availability', icon: Clock }
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                                            activeTab === tab.id ? 'bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)] border border-white/10' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5 border border-transparent'
                                        }`}
                                    >
                                        <tab.icon size={14} />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Dashboard Content */}
                <div className="p-10 w-full max-w-7xl mx-auto">
                    <AnimatePresence mode="wait">
                        {activeTab === 'dashboard' && (
                            <motion.div 
                                key="dashboard"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ duration: 0.3 }}
                                className="w-full"
                            >
                                {selectedPatient ? (
                                    <ClinicalDashboard
                                        patient={selectedPatient}
                                        details={selectedPatientDetails}
                                        loading={clinicalLoading}
                                        appointments={patientAppointments}
                                        onStatusUpdate={handleStatusUpdate}
                                        appointmentId={patientAppointments?.[0]?.id}
                                        onOpenBooking={() => setShowBookingModal(true)}
                                        onClose={() => {
                                            setSelectedPatient(null);
                                            setSelectedPatientDetails(null);
                                            setPatientAppointments([]);
                                        }}
                                    />
                                ) : (
                                    <div className="w-full space-y-12">
                                        {/* Minimal KPI Header */}
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                            {[
                                                { label: 'Assigned Patients', value: patients.length, color: 'text-blue-400', icon: Users, border: 'border-blue-500/20', bg: 'bg-blue-500/5' },
                                                { label: 'Pending Studies', value: stats.studies, color: 'text-emerald-400', icon: FileImage, border: 'border-emerald-500/20', bg: 'bg-emerald-500/5' },
                                                { label: "Today's Appts", value: appointments.filter(a => new Date(a.scheduled_at).toDateString() === new Date().toDateString()).length || 0, color: 'text-purple-400', icon: Calendar, border: 'border-purple-500/20', bg: 'bg-purple-500/5' },
                                                { label: 'System Status', value: 'Secure', color: 'text-emerald-400', icon: ShieldCheck, border: 'border-white/10', bg: 'bg-white/5' }
                                            ].map((stat, idx) => (
                                                <div key={idx} className={`${stat.bg} ${stat.border} border backdrop-blur-xl p-6 rounded-[2rem] flex flex-col justify-center relative overflow-hidden group shadow-[0_10px_30px_rgba(0,0,0,0.2)]`}>
                                                    <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 group-hover:opacity-40 transition-all">
                                                        <stat.icon size={48} className={stat.color} />
                                                    </div>
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">{stat.label}</span>
                                                    <span className={`text-4xl font-light tracking-tight drop-shadow-[0_0_10px_currentColor] ${stat.color}`}>{stat.value}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                                            {/* Patient List Table */}
                                            <div className="xl:col-span-2 space-y-6">
                                                <div className="flex items-center justify-between">
                                                    <h2 className="text-xs font-black text-gray-400 tracking-[0.3em] uppercase flex items-center gap-2">
                                                        <Activity size={14} className="text-blue-400" /> Patient Roster
                                                    </h2>
                                                </div>
                                                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[2rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
                                                    <table className="w-full text-left text-sm">
                                                        <thead className="bg-black/40 text-gray-500 text-[10px] uppercase tracking-[0.2em] font-black border-b border-white/5">
                                                            <tr>
                                                                <th className="px-8 py-5">Patient Name</th>
                                                                <th className="px-8 py-5">Severity</th>
                                                                <th className="px-8 py-5">Status</th>
                                                                <th className="px-8 py-5 text-right">Action</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-white/5">
                                                            {patients.map((p, idx) => {
                                                                const isCritical = idx % 5 === 0;
                                                                const isModerate = idx % 3 === 0 && !isCritical;
                                                                
                                                                return (
                                                                    <tr key={p.id} className="hover:bg-white/5 transition-colors group">
                                                                        <td className="px-8 py-5">
                                                                            <div className="font-bold text-white tracking-wide group-hover:text-blue-400 transition-colors">{p.first_name} {p.last_name}</div>
                                                                            <div className="text-[10px] font-bold text-gray-500 tracking-widest uppercase mt-1">PID: {p.id}</div>
                                                                        </td>
                                                                        <td className="px-8 py-5">
                                                                            {isCritical ? (
                                                                                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-400 text-[10px] font-black uppercase tracking-widest shadow-[0_0_10px_rgba(225,29,72,0.2)]">
                                                                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" /> Critical
                                                                                </span>
                                                                            ) : isModerate ? (
                                                                                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400 text-[10px] font-black uppercase tracking-widest shadow-[0_0_10px_rgba(245,158,11,0.1)]">
                                                                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Moderate
                                                                                </span>
                                                                            ) : (
                                                                                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                                                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Stable
                                                                                </span>
                                                                            )}
                                                                        </td>
                                                                        <td className="px-8 py-5 text-gray-400 text-xs font-medium">Routine Checkup</td>
                                                                        <td className="px-8 py-5 text-right">
                                                                            <button 
                                                                                onClick={() => handlePatientSelect(p)}
                                                                                className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                                                                            >
                                                                                Review
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>

                                            {/* Schedule Column */}
                                            <div className="space-y-6">
                                                <h2 className="text-xs font-black text-gray-400 tracking-[0.3em] uppercase flex items-center gap-2">
                                                    <Calendar size={14} className="text-purple-400" /> Global Schedule
                                                </h2>
                                                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
                                                    <FollowUpScheduling 
                                                        isGlobal={true} 
                                                        isDoctor={true} 
                                                        onSync={(apt) => {
                                                            setAppointments(prev => [...prev, apt]);
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {activeTab === 'calendar' && (
                            <motion.div key="calendar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <AppointmentCalendar isDoctor={true} doctorId={user?.id} />
                            </motion.div>
                        )}

                        {activeTab === 'availability' && (
                            <motion.div key="availability" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <AvailabilityManager doctorId={user?.id} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>

            {selectedPatient && (
                <AppointmentModal
                    isOpen={showBookingModal}
                    onClose={() => setShowBookingModal(false)}
                    patientId={selectedPatient.id}
                    onSuccess={() => setShowBookingModal(false)}
                    doctorId={user?.id}
                    doctorName={user?.full_name || 'Medical Officer'}
                />
            )}

            <AddPatientModal 
                isOpen={showAssignModal} 
                onClose={() => setShowAssignModal(false)}
                onSuccess={(newPatient) => {
                    setPatients(prev => [...prev, newPatient]);
                    handlePatientSelect(newPatient);
                }}
            />
        </div>
    );
};

// ─────────────────────────────────────────────────────────
// CLINICAL DASHBOARD (TABULAR REDESIGN - GLASSMORPHISM)
// ─────────────────────────────────────────────────────────

const ClinicalDashboard = ({ 
    patient, details, loading, onClose, appointments, 
    onStatusUpdate, appointmentId, onOpenBooking 
}) => {
    const [activeTab, setActiveTab] = useState('overview');

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 bg-white/5 backdrop-blur-md border border-white/10 rounded-[2rem] shadow-2xl">
                <div className="flex flex-col items-center gap-4">
                    <RefreshCw size={32} className="text-blue-500 animate-spin" />
                    <div className="text-gray-400 font-black tracking-[0.3em] uppercase text-xs animate-pulse">Loading Clinical Data</div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-8">
                    <button onClick={onClose} className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white transition-all shadow-lg hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                        <ChevronRight size={20} className="rotate-180" />
                    </button>
                    <div>
                        <div className="flex items-center gap-4 mb-2">
                            <h2 className="text-5xl font-light text-white tracking-tight drop-shadow-md">{patient.first_name} <span className="font-black drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">{patient.last_name}</span></h2>
                            <span className="px-3 py-1 bg-white/10 border border-white/20 text-white text-[10px] font-black uppercase rounded-lg tracking-widest shadow-inner">PID: {patient.id}</span>
                        </div>
                        <p className="text-sm font-bold text-gray-500 tracking-widest uppercase flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 drop-shadow-[0_0_5px_rgba(16,185,129,0.8)]"></span> Secure Session Active
                        </p>
                    </div>
                </div>
            </div>

            {/* Symmetrical Spaced Tabs Navigation */}
            <div className="relative mb-10 w-full flex justify-center">
                <div className="absolute inset-x-0 bottom-[1px] h-px bg-white/10" />
                <div className="flex justify-between w-full max-w-4xl px-4 relative z-10">
                    {['overview', 'labs', 'eprescription', 'dicom'].map(tab => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`relative pb-5 px-8 text-[11px] font-black tracking-[0.3em] uppercase transition-all ${
                                activeTab === tab ? 'text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]' : 'text-gray-500 hover:text-white'
                            }`}
                        >
                            {tab === 'eprescription' ? 'E-Prescription' : tab}
                            {activeTab === tab && (
                                <motion.div 
                                    layoutId="clinicalTabIndicator" 
                                    className="absolute bottom-0 left-0 right-0 h-[3px] bg-blue-500 rounded-t-full shadow-[0_-2px_15px_rgba(59,130,246,0.8)]" 
                                />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div className="relative">
                {activeTab === 'overview' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-[1fr_450px] gap-10">
                         <div className="space-y-10">
                             {/* Conditions List */}
                             <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
                                 <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                                     <Activity size={14} className="text-rose-400" /> Active Conditions
                                 </h3>
                                 <div className="space-y-4">
                                     {details?.conditions?.length > 0 ? (
                                         details.conditions.map((cond, idx) => (
                                             <div key={idx} className="p-5 bg-black/20 border border-white/5 rounded-2xl flex items-center justify-between group hover:border-white/10 transition-colors">
                                                 <div>
                                                     <p className="text-base font-bold text-white tracking-wide">{cond.resource?.code?.coding?.[0]?.display || cond.resource?.code?.text || 'Standard Diagnosis'}</p>
                                                     <p className="text-xs text-gray-500 mt-1 font-medium">Recorded: {cond.resource?.onsetDateTime ? new Date(cond.resource?.onsetDateTime).toLocaleDateString() : 'N/A'}</p>
                                                 </div>
                                                 <span className="px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] uppercase font-black rounded-lg tracking-widest shadow-inner">Active</span>
                                             </div>
                                         ))
                                     ) : (
                                         <div className="p-8 text-center text-xs font-black text-gray-500 uppercase tracking-widest border border-dashed border-white/10 rounded-2xl">No active conditions recorded.</div>
                                     )}
                                 </div>
                             </div>

                             {/* Basic Demographics */}
                             <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
                                 <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                                     <Users size={14} className="text-blue-400" /> Demographics
                                 </h3>
                                 <div className="grid grid-cols-2 gap-6">
                                     <div className="p-4 bg-black/20 rounded-2xl border border-white/5">
                                         <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mb-2">Email</p>
                                         <p className="text-sm font-bold text-white truncate">{patient.email}</p>
                                     </div>
                                     <div className="p-4 bg-black/20 rounded-2xl border border-white/5">
                                         <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mb-2">Phone</p>
                                         <p className="text-sm font-bold text-white">{patient.phone || 'Not provided'}</p>
                                     </div>
                                     <div className="p-4 bg-black/20 rounded-2xl border border-white/5">
                                         <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mb-2">Gender</p>
                                         <p className="text-sm font-bold text-white">{patient.gender || 'Unknown'}</p>
                                     </div>
                                     <div className="p-4 bg-black/20 rounded-2xl border border-white/5">
                                         <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mb-2">DOB</p>
                                         <p className="text-sm font-bold text-white">{patient.dob || 'Unknown'}</p>
                                     </div>
                                 </div>
                             </div>
                         </div>
                         
                         <div className="space-y-10">
                             {/* Score and Trend Engine Area */}
                             <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col">
                                <div className="p-8 pb-4">
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
                                        <TrendingUp size={14} className="text-emerald-400" /> Clinical Analytics
                                    </h3>
                                </div>
                                
                                <div className="px-8 flex-1">
                                    <TriageScorePanel patientId={patient.id} isDoctor={true} patientName={`${patient.first_name} ${patient.last_name}`} />
                                </div>
                                
                                {/* Trend Engine Placeholder */}
                                <div className="p-8 bg-black/30 border-t border-white/5 mt-6 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.02)_50%,transparent_75%)] bg-[length:20px_20px]" />
                                    <div className="flex items-center justify-between mb-4 relative z-10">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Trend Engine</span>
                                        <span className="text-[9px] font-black text-emerald-400 uppercase bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]">Beta Status</span>
                                    </div>
                                    <div className="h-28 flex items-center justify-center border border-dashed border-white/10 rounded-2xl bg-black/40 backdrop-blur-md relative z-10">
                                        <p className="text-[10px] text-gray-500 font-black tracking-widest uppercase">Trend modeling offline</p>
                                    </div>
                                </div>
                             </div>

                             {/* Appointments */}
                             <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
                                 <div className="flex items-center justify-between mb-6">
                                     <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-2">
                                         <Calendar size={14} className="text-purple-400" /> Appointments
                                     </h3>
                                     <button onClick={onOpenBooking} className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-[10px] text-blue-400 font-black uppercase tracking-widest rounded-lg transition-all">+ Schedule</button>
                                 </div>
                                 <div className="space-y-3">
                                     {appointments.length > 0 ? (
                                         appointments.map((apt, idx) => (
                                             <div key={idx} className="p-4 bg-black/20 border border-white/5 rounded-2xl hover:border-white/10 transition-colors">
                                                <div className="flex items-center justify-between mb-2">
                                                    <p className="text-sm font-bold text-white">{apt.scheduled_at ? new Date(apt.scheduled_at).toLocaleDateString() : 'TBD'}</p>
                                                    <span className="text-[9px] uppercase font-black text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-1 rounded shadow-inner">{apt.status}</span>
                                                </div>
                                                <p className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
                                                    <Clock size={12} /> {apt.scheduled_at ? new Date(apt.scheduled_at).toLocaleTimeString() : ''}
                                                </p>
                                             </div>
                                         ))
                                     ) : (
                                         <div className="p-8 text-center text-[10px] font-black text-gray-500 uppercase tracking-widest border border-dashed border-white/10 rounded-2xl">No appointments found.</div>
                                     )}
                                 </div>
                             </div>
                         </div>
                    </motion.div>
                )}
                
                {activeTab === 'labs' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-10 overflow-hidden min-h-[500px] shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
                        <LabCenterPanel patient={patient} />
                    </motion.div>
                )}
                
                {activeTab === 'eprescription' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-10 min-h-[500px] shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
                        <EPrescriptionForm patientId={patient.id} isDoctor={true} patientName={`${patient.first_name} ${patient.last_name}`} />
                    </motion.div>
                )}
                
                {activeTab === 'dicom' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[2.5rem] overflow-hidden min-h-[500px] shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
                        <DICOMPanel patientId={patient.id} expanded={true} onToggle={()=>{}} />
                    </motion.div>
                )}
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────
// DICOM PANEL
// ─────────────────────────────────────────────────────────

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
        <div className="p-10 relative">
            <div className="flex items-center justify-between mb-10 border-b border-white/5 pb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                        <FileImage size={24} className="text-blue-400" />
                    </div>
                    <h3 className="font-light text-white text-2xl tracking-wide">DICOM Imaging Archives</h3>
                </div>
                <button
                    onClick={() => setShowUploadModal(true)}
                    className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white text-[10px] font-black transition-all uppercase tracking-widest shadow-lg flex items-center gap-2"
                >
                    <Plus size={14} /> Upload Directory
                </button>
            </div>
            
            <div className="space-y-4">
                {dicomLoading ? (
                    <div className="text-center py-20 text-gray-500 uppercase tracking-[0.3em] text-[10px] font-black animate-pulse flex flex-col items-center gap-4">
                        <RefreshCw size={24} className="text-blue-500 animate-spin" /> Loading imaging data...
                    </div>
                ) : dicomStudies.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {dicomStudies.map((study, idx) => (
                            <div
                                key={idx}
                                onClick={() => navigate(`/doctor/dicom-viewer?study_id=${study.id}`)}
                                className="bg-black/20 backdrop-blur-md border border-white/5 rounded-2xl p-6 hover:border-blue-500/50 hover:bg-white/5 transition-all cursor-pointer group shadow-lg"
                            >
                                <div className="mb-6">
                                    <p className="text-white font-bold text-lg group-hover:text-blue-400 transition-colors drop-shadow-sm">{study.study_date || study.description || 'DICOM Study'}</p>
                                    <p className="text-xs font-medium text-gray-500 mt-2">
                                        <span className="px-2 py-1 bg-white/5 rounded text-white">{study.modality || 'MRI'}</span> • {study.num_series || 0} series
                                    </p>
                                </div>
                                <button className="w-full py-3 bg-white/5 group-hover:bg-blue-600 rounded-xl text-white text-[10px] font-black transition-all uppercase tracking-widest border border-white/10 group-hover:border-blue-400 shadow-inner">
                                    Launch Viewer
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 border border-dashed border-white/10 rounded-3xl bg-black/20">
                        <FileImage size={48} className="text-gray-600 mx-auto mb-4 opacity-50" />
                        <p className="text-gray-400 text-sm font-bold">No DICOM studies found.</p>
                        <p className="text-gray-500 text-xs mt-2">Upload a directory to begin</p>
                    </div>
                )}
            </div>

            {/* Upload Modal */}
            <AnimatePresence>
                {showUploadModal && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-50 p-4" 
                        onClick={() => setShowUploadModal(false)}
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            className="bg-[#0b0f1a] border border-white/10 rounded-[2rem] p-8 w-full max-w-lg shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden" 
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[50px] pointer-events-none" />
                            <h2 className="text-xl font-light text-white mb-8 uppercase tracking-widest flex items-center gap-3">
                                <FileImage size={20} className="text-blue-400" /> Upload Local DICOM
                            </h2>
                            <div className="space-y-6 relative z-10">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-3">System Directory Path</label>
                                    <input
                                        type="text"
                                        value={folderPath}
                                        onChange={(e) => setFolderPath(e.target.value)}
                                        placeholder="e.g., C:\DICOM\Study001"
                                        className="w-full bg-black/40 border border-white/10 text-white rounded-xl p-4 text-sm font-medium focus:outline-none focus:border-blue-500 focus:bg-black/60 shadow-inner transition-all"
                                    />
                                </div>
                                {uploadMessage && (
                                    <div className={`text-xs font-bold p-4 rounded-xl shadow-inner ${uploadMessage.includes('✅') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                                        {uploadMessage}
                                    </div>
                                )}
                                <div className="flex justify-end gap-4 pt-6 border-t border-white/5">
                                    <button onClick={() => setShowUploadModal(false)} disabled={uploadLoading} className="px-6 py-3 bg-transparent text-gray-500 font-black uppercase text-[10px] tracking-widest hover:text-white transition-colors">Cancel</button>
                                    <button onClick={handleUploadDICOM} disabled={uploadLoading} className="px-8 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-black uppercase text-[10px] tracking-widest disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                                        {uploadLoading ? 'Uploading...' : 'Confirm Upload'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DoctorDashboard;
