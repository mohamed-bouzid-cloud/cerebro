import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import {
    Users, Activity, FileText, Calendar, LogOut, ChevronRight, Search,
    Bell, Stethoscope, Clock, ShieldCheck, ChevronDown, AlertCircle,
    Pill, Heart, Droplet, TrendingUp, X, Plus, Wifi, WifiOff, Edit2,
    Microscope, CheckCircle2, RefreshCw, Thermometer, MoreVertical
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
        <div className="flex h-screen text-gray-200 overflow-hidden font-sans relative premium-depth-bg">


            {/* Sidebar / Patient List */}
            <aside className="w-80 bg-[#070b14]/95 backdrop-blur-xl border-r border-white/5 flex flex-col h-full shrink-0 relative z-10 shadow-[20px_0_40px_rgba(0,0,0,0.5)]">
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

                    <div className="flex flex-col gap-2">
                        <button
                            onClick={() => setShowAssignModal(true)}
                            className="w-full flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium text-sm transition-colors"
                        >
                            <Plus size={16} />
                            Add Patient
                        </button>
                        <button
                            onClick={() => {
                                const patientId = prompt("Enter Patient ID for Walk-in:");
                                if (patientId) handleWalkIn(patientId);
                            }}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-blue-400 font-bold text-xs py-2.5 transition-all"
                        >
                            <Clock size={14} />
                            REGISTER WALK-IN
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 px-2">Assigned Patients ({patients.length})</h3>
                    {filteredPatients.length > 0 ? (
                        filteredPatients.map((patient) => (
                            <div
                                key={patient.id}
                                onClick={() => handlePatientSelect(patient)}
                                className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${selectedPatient?.id === patient.id
                                        ? 'bg-blue-500/10 border-blue-500/30'
                                        : 'hover:bg-white/5 border-transparent hover:border-white/10'
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
                <header className="h-24 px-8 flex flex-col justify-center border-b border-[#1f2937] bg-[#0a0f14]/80 backdrop-blur-md sticky top-0 z-20">
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-4">
                            <div>
                                <h1 className="text-xl font-bold text-white tracking-tight">Clinical Practice: Dr. {user?.last_name || 'Doctor'}</h1>
                            </div>
                            {mockMode && (
                                <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded-full">
                                    <WifiOff size={10} className="text-yellow-500" />
                                    <span className="text-[10px] font-bold text-yellow-500 uppercase">Demo</span>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10">
                                {[
                                    { id: 'dashboard', label: 'Overview', icon: Activity },
                                    { id: 'calendar', label: 'Calendar', icon: Calendar },
                                    { id: 'availability', label: 'Availability', icon: Clock },
                                    { id: 'labs', label: 'Lab Results', icon: Microscope },
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                            activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                                        }`}
                                    >
                                        <tab.icon size={14} />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-3 pl-4 border-l border-[#1f2937]">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400" />
                                <div className="hidden lg:block text-xs">
                                    <div className="font-bold text-white">Dr. {user?.first_name}</div>
                                    <div className="text-blue-400 opacity-70">Neurologist</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Dashboard Content */}
                <div className="p-8 w-full">
                    <AnimatePresence mode="wait">
                        {activeTab === 'dashboard' && (
                            <motion.div 
                                key="dashboard"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                            >
                                {selectedPatient ? (
                                    <ClinicalDashboard
                                        patient={selectedPatient}
                                        details={selectedPatientDetails}
                                        loading={clinicalLoading}
                                        appointments={patientAppointments}
                                        consultationRequests={consultationRequests}
                                        onAcceptConsultation={handleAcceptConsultation}
                                        onRejectConsultation={handleRejectConsultation}
                                        onStatusUpdate={handleStatusUpdate}
                                        appointmentId={patientAppointments?.[0]?.id}
                                        mockTriageScores={mockTriageScores}
                                        mockConsultationNotes={mockConsultationNotes}
                                        mockPrescriptions={mockPrescriptions}
                                        mockTimelineEvents={mockTimelineEvents}
                                        mockAppointments={mockAppointments}
                                        onOpenBooking={() => setShowBookingModal(true)}
                                        onClose={() => {
                                            setSelectedPatient(null);
                                            setSelectedPatientDetails(null);
                                            setPatientAppointments([]);
                                        }}
                                    />
                                ) : (
                                    <div className="w-full grid grid-cols-1 xl:grid-cols-[65%_minmax(0,1fr)] gap-8">
                                        {/* Main Column */}
                                        <div className="flex-1 flex flex-col space-y-8 min-w-0">
                                            {/* KPI Pulse Bar */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                                {[
                                                    { 
                                                      label: 'Assigned Patients', 
                                                      value: patients.length, 
                                                      icon: Users, 
                                                      color: 'text-blue-400', 
                                                      bg: 'bg-blue-500/20', 
                                                      border: 'border-blue-500/30',
                                                      extra: <div className="h-1 w-full bg-blue-900/30 rounded mt-2 overflow-hidden"><div className="h-full bg-blue-500 w-[60%]"></div></div>
                                                    },
                                                    { 
                                                      label: 'Pending Studies', 
                                                      value: stats.studies, 
                                                      icon: Activity, 
                                                      color: 'text-emerald-400', 
                                                      bg: 'bg-emerald-500/20', 
                                                      border: 'border-emerald-500/30',
                                                      extra: <div className="mt-2 text-[10px] text-emerald-400 font-medium tracking-wide">3 UNREAD LABS</div>
                                                    },
                                                    { 
                                                      label: "Today's Schedule", 
                                                      value: appointments.filter(a => new Date(a.scheduled_at).toDateString() === new Date().toDateString()).length || '4', 
                                                      icon: Calendar, 
                                                      color: 'text-purple-400', 
                                                      bg: 'bg-purple-500/20', 
                                                      border: 'border-purple-500/30',
                                                      extra: <div className="h-1 w-full bg-purple-900/30 rounded mt-2 overflow-hidden"><div className="h-full bg-purple-500 w-[45%]"></div></div>
                                                    },
                                                    { 
                                                      label: 'Security Status', 
                                                      value: 'Secure', 
                                                      icon: ShieldCheck, 
                                                      color: 'text-cyan-400', 
                                                      bg: 'bg-cyan-500/20', 
                                                      border: 'border-cyan-500/30',
                                                      extra: <div className="mt-2 text-[10px] text-cyan-400 font-medium tracking-wide cursor-pointer hover:underline">VIEW AUDIT LOG</div>
                                                    }
                                                ].map((stat, idx) => (
                                                    <motion.div
                                                        key={stat.label}
                                                        layoutId={stat.label}
                                                        className="glass-card rim-light p-6 relative group cursor-pointer"
                                                        whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                                                    >
                                                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                                                        <div className="flex justify-between items-start relative z-10 w-full">
                                                            <div className="w-full">
                                                                <p className="text-gray-400 font-medium text-xs mb-1 uppercase tracking-wider">{stat.label}</p>
                                                                <h3 className="text-3xl font-bold text-white tracking-tight drop-shadow-md">{stat.value}</h3>
                                                                {stat.extra}
                                                            </div>
                                                            <div className={`${stat.bg} ${stat.color} p-2.5 rounded-lg border ${stat.border} shadow-inner shrink-0 ml-4`}>
                                                                <stat.icon size={20} />
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>

                                            {/* Center-Main: The Triage Hub (Incoming Consultations) */}
                                            <div className="mb-4">
                                                <IncomingConsultationsPanel
                                                    requests={consultationRequests || []}
                                                    expanded={expandedConsultations}
                                                    onToggle={() => setExpandedConsultations(!expandedConsultations)}
                                                    onAccept={handleAcceptConsultation}
                                                    onReject={handleRejectConsultation}
                                                />
                                            </div>

                                            {/* Global Scheduling Feed (Today) */}
                                            <div className="mb-4">
                                                <FollowUpScheduling 
                                                    isGlobal={true} 
                                                    isDoctor={true} 
                                                    onSync={(apt) => {
                                                        // Sync manually back up to calendar if needed, but fetch usually does the trick
                                                        setAppointments(prev => [...prev, apt]);
                                                    }}
                                                />
                                            </div>

                                            {/* Utility Footer (Floating row of quick-action buttons) */}
                                            <div className="flex gap-4 pt-4 mt-auto">
                                                <button 
                                                    onClick={() => setUtilityModal('reports')}
                                                    className="flex-1 group glass-card rim-light relative flex flex-col items-center justify-center gap-2 px-4 py-4 !border-white/5 hover:!border-blue-500/30 !rounded-2xl text-sm font-bold transition-all overflow-hidden"
                                                >
                                                    <div className="absolute top-2 right-2 flex h-2 w-2">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                                    </div>
                                                    <FileText size={20} className="text-blue-400 group-hover:scale-110 transition-transform" />
                                                    <div className="text-center">
                                                        <span className="block text-[10px] uppercase tracking-[0.2em] opacity-50">Analytics</span>
                                                        <span>Reports</span>
                                                    </div>
                                                </button>
                                                
                                                <button 
                                                    onClick={() => setUtilityModal('broadcast')}
                                                    className="flex-1 group glass-card rim-light relative flex flex-col items-center justify-center gap-2 px-4 py-4 !border-white/5 hover:!border-purple-500/30 !rounded-2xl text-sm font-bold transition-all overflow-hidden"
                                                >
                                                    <Users size={20} className="text-purple-400 group-hover:scale-110 transition-transform" />
                                                    <div className="text-center">
                                                        <span className="block text-[10px] uppercase tracking-[0.2em] opacity-50">Intranet</span>
                                                        <span>Broadcast</span>
                                                    </div>
                                                </button>
                                                
                                                <button 
                                                    onClick={() => setUtilityModal('inventory')}
                                                    className="flex-1 group glass-card rim-light relative flex flex-col items-center justify-center gap-2 px-4 py-4 !border-white/5 hover:!border-amber-500/30 !rounded-2xl text-sm font-bold transition-all overflow-hidden"
                                                >
                                                    <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-amber-500/20 rounded border border-amber-500/30">
                                                        <span className="text-[8px] font-black text-amber-500 uppercase">Alert</span>
                                                    </div>
                                                    <AlertCircle size={20} className="text-amber-400 group-hover:scale-110 transition-transform" />
                                                    <div className="text-center">
                                                        <span className="block text-[10px] uppercase tracking-[0.2em] opacity-50">Stock Control</span>
                                                        <span>Inventory</span>
                                                    </div>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Right Sidebar: Live Waiting Room & Scratchpad */}
                                        <div className="w-full shrink-0 flex flex-col gap-8">
                                            <WaitingRoomQueue queue={waitingRoom} setQueue={setWaitingRoom} />
                                            
                                            {/* Doctor's Digital Scratchpad (Placeholder) */}
                                            <div className="glass-card p-6 border-white/5 relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                                    <Edit2 size={40} className="text-blue-400" />
                                                </div>
                                                <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                                                    <Edit2 size={18} className="text-blue-400" /> Clinical Scratchpad
                                                </h3>
                                                <textarea 
                                                    defaultValue={`// AI CLINICAL BRIEFING - APRIL 18, 2026\n\n1. Review MRI for Robert Johnson (Conf. 10:30)\n2. Post-Op handover for Miller, Sarah\n3. Verify inventory for Neurology Intake Kits\n4. Update Lab Results: #DICOM-Studies-42`}
                                                    className="w-full h-40 bg-black/20 border border-white/5 rounded-2xl p-4 text-[13px] font-medium leading-relaxed text-blue-100/70 focus:outline-none focus:border-blue-500/50 transition-all resize-none custom-scrollbar"
                                                />
                                                <div className="mt-4 flex justify-between items-center text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                                                    <span>Auto-saving...</span>
                                                    <span className="text-blue-400/50 hover:text-blue-400 cursor-pointer">Clear Canvas</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {activeTab === 'calendar' && (
                            <motion.div 
                                key="calendar"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <AppointmentCalendar isDoctor={true} doctorId={user?.id} />
                            </motion.div>
                        )}

                        {activeTab === 'availability' && (
                            <motion.div 
                                key="availability"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <AvailabilityManager doctorId={user?.id} />
                            </motion.div>
                        )}

                        {activeTab === 'labs' && (
                            <motion.div 
                                key="labs"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <LabCenterPanel patient={selectedPatient} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>

            <AnimatePresence>
                {utilityModal && (
                    <UtilityDashboardOverlay 
                        type={utilityModal} 
                        isOpen={!!utilityModal} 
                        onClose={() => setUtilityModal(null)} 
                        inventoryItems={inventoryItems}
                        setInventoryItems={setInventoryItems}
                        broadcastHistory={broadcastHistory}
                        setBroadcastHistory={setBroadcastHistory}
                        analyticsRange={analyticsRange}
                        setAnalyticsRange={setAnalyticsRange}
                    />
                )}
            </AnimatePresence>

            {/* Global Appointment Booking Modal - Root Render for Z-Index Priority */}
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

const UtilityDashboardOverlay = ({ 
    type, isOpen, onClose, 
    inventoryItems, setInventoryItems, 
    broadcastHistory, setBroadcastHistory, 
    analyticsRange, setAnalyticsRange 
}) => {
    const [isSending, setIsSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [broadcastMsg, setBroadcastMsg] = useState('');
    const [selectedNode, setSelectedNode] = useState('All Staff');
    const [ordering, setOrdering] = useState(false);

    if (!isOpen) return null;

    const handleUpdateStock = (id, delta) => {
        setInventoryItems(prev => prev.map(item => 
            item.id === id ? { ...item, stock: Math.max(0, item.stock + delta) } : item
        ));
    };

    const handleOrderMore = () => {
        setOrdering(true);
        setTimeout(() => {
            setInventoryItems(prev => prev.map(item => ({ ...item, stock: item.stock + 20 })));
            setOrdering(false);
        }, 3000);
    };

    const handleSendBroadcast = () => {
        if (!broadcastMsg.trim()) return;
        setIsSending(true);
        setTimeout(() => {
            const newBroadcast = {
                id: Date.now(),
                message: broadcastMsg,
                target: selectedNode,
                timestamp: new Date().toISOString()
            };
            setBroadcastHistory(prev => [newBroadcast, ...prev]);
            setIsSending(false);
            setSent(true);
            setBroadcastMsg('');
            setTimeout(() => setSent(false), 2000);
        }, 1500);
    };

    const getInventoryStatus = (stock) => {
        if (stock < 5) return { label: 'CRITICAL', color: 'text-rose-400', pip: 'bg-rose-500', glow: 'shadow-[0_0_15px_rgba(225,29,72,0.4)]' };
        if (stock < 20) return { label: 'LOW', color: 'text-amber-400', pip: 'bg-amber-500', glow: '' };
        return { label: 'STABLE', color: 'text-emerald-400', pip: 'bg-emerald-500', glow: '' };
    };

    const getAnalyticsData = () => {
        switch (analyticsRange) {
            case '24h': return {
                stats: [
                    { label: 'Patient Volume', value: '24', trend: '+4%', color: 'text-blue-400' },
                    { label: 'Avg. Wait Time', value: '8.5m', trend: '-2m', color: 'text-emerald-400' },
                    { label: 'Revenue Pulse', value: '$2.1k', trend: '+12%', color: 'text-purple-400' },
                    { label: 'Satisfaction', value: '98%', trend: '+1%', color: 'text-amber-400' }
                ],
                points: [80, 60, 40, 55, 75, 50, 45]
            };
            case '30d': return {
                stats: [
                    { label: 'Patient Volume', value: '648', trend: '+18%', color: 'text-blue-400' },
                    { label: 'Avg. Wait Time', value: '18.4m', trend: '+2m', color: 'text-rose-400' },
                    { label: 'Revenue Pulse', value: '$54.2k', trend: '+5%', color: 'text-purple-400' },
                    { label: 'Satisfaction', value: '91%', trend: '-2%', color: 'text-rose-400' }
                ],
                points: [20, 15, 30, 45, 10, 5, 25]
            };
            default: return { // 7d
                stats: [
                    { label: 'Patient Volume', value: '142', trend: '+12%', color: 'text-blue-400' },
                    { label: 'Avg. Wait Time', value: '14.2m', trend: '-4m', color: 'text-emerald-400' },
                    { label: 'Revenue Pulse', value: '$12.4k', trend: '+8%', color: 'text-purple-400' },
                    { label: 'Satisfaction', value: '94%', trend: '+2%', color: 'text-amber-400' }
                ],
                points: [60, 30, 55, 10, 35, 20, 50]
            };
        }
    };

    const renderPulseChart = (points) => {
        const width = 460;
        const height = 100;
        const spacing = width / (points.length - 1);
        
        let areaPath = "M 0," + height + " ";
        points.forEach((p, i) => {
            areaPath += "L " + (i * spacing) + "," + p + " ";
        });
        areaPath += "L " + width + "," + height + " Z";

        let linePath = "M 0," + points[0] + " ";
        points.forEach((p, i) => {
            if (i === 0) return;
            const prevX = (i - 1) * spacing;
            const prevY = points[i-1];
            const currX = i * spacing;
            const currY = p;
            const cp1x = prevX + spacing / 2;
            const cp2x = currX - spacing / 2;
            linePath += "C " + cp1x + "," + prevY + " " + cp2x + "," + currY + " " + currX + "," + currY + " ";
        });

        return (
            <div className="relative h-28 w-full mt-2 overflow-hidden bg-blue-500/5 rounded-2xl border border-blue-500/10">
                <svg viewBox={"0 0 " + width + " " + height} className="w-full h-full preserve-3d">
                    <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    <motion.path initial={{ opacity: 0 }} animate={{ opacity: 1 }} d={areaPath} fill="url(#chartGradient)" />
                    <motion.path 
                        initial={{ pathLength: 0, opacity: 0 }} 
                        animate={{ pathLength: 1, opacity: 1 }} 
                        transition={{ duration: 1.5, ease: "easeInOut" }} 
                        d={linePath} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" className="drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]" 
                    />
                    {points.map((p, i) => (
                        <motion.circle key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.1 }} cx={i * spacing} cy={p} r="3" fill="#3b82f6" />
                    ))}
                </svg>
                <div className="absolute inset-x-0 bottom-2 px-4 flex justify-between text-[8px] font-black text-blue-500/40 uppercase tracking-[0.2em] pointer-events-none">
                    <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
                </div>
            </div>
        );
    };

    const renderContent = () => {
        switch (type) {
            case 'reports':
                const data = getAnalyticsData();
                return (
                    <div className="space-y-6">
                        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 mb-2">
                            {['24h', '7d', '30d'].map((range) => (
                                <button key={range} onClick={() => setAnalyticsRange(range)} className={"flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all " + (analyticsRange === range ? "bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-lg" : "text-gray-500 hover:text-white")}>{range}</button>
                            ))}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {data.stats.map((stat, i) => (
                                <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-all group overflow-hidden relative">
                                    <div className={"absolute top-0 left-0 w-1 h-full " + (stat.trend.startsWith('+') ? stat.color.replace('text-', 'bg-') : 'bg-rose-500') + " opacity-20"} />
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">{stat.label}</p>
                                    <div className="flex items-end justify-between">
                                        <h4 className="text-2xl font-black text-white group-hover:scale-105 transition-transform origin-left">{stat.value}</h4>
                                        <span className={"text-[10px] font-extrabold px-2 py-0.5 rounded-full " + (stat.trend.startsWith('+') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400') + " border border-current opacity-70"}>{stat.trend}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 relative overflow-hidden">
                            <h4 className="text-white font-black text-[10px] mb-4 uppercase tracking-[0.3em] opacity-40 flex items-center gap-2"><TrendingUp size={12} className="text-blue-500" /> Pulse Density Monitor</h4>
                            {renderPulseChart(data.points)}
                        </div>
                    </div>
                );
            case 'broadcast':
                return (
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black uppercase text-gray-500 mb-2 block tracking-widest pl-1">Target Personnel Node</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[{ id: 'All Staff', icon: Users, color: 'text-purple-400' }, { id: 'Nursing Node', icon: Activity, color: 'text-blue-400' }, { id: 'Diagnostic Lab', icon: Microscope, color: 'text-emerald-400' }].map(node => (
                                        <button key={node.id} onClick={() => setSelectedNode(node.id)} className={"p-3 border rounded-2xl text-[10px] font-black transition-all flex flex-col items-center gap-2 " + (selectedNode === node.id ? "bg-white/10 border-purple-500/50 " + node.color + " shadow-[0_0_20px_rgba(168,85,247,0.15)]" : "bg-white/5 border-white/5 text-gray-500 hover:border-white/10")}><node.icon size={16} />{node.id}</button>
                                    ))}
                                </div>
                            </div>
                            <div className="relative">
                                <label className="text-[10px] font-black uppercase text-gray-500 mb-2 block tracking-widest pl-1">Secure Terminal Header</label>
                                <textarea value={broadcastMsg} onChange={(e) => setBroadcastMsg(e.target.value)} placeholder="Enter encrypted clinic-wide broadcast..." className="w-full h-32 bg-black/40 border border-white/10 rounded-[2rem] p-5 text-sm font-medium text-blue-100 placeholder-blue-900/30 focus:outline-none focus:border-purple-500/50 transition-all resize-none custom-scrollbar shadow-inner" />
                                <div className="absolute bottom-4 right-4 text-[10px] font-black text-purple-500/30 uppercase tracking-widest">AES-256 Secured</div>
                            </div>
                        </div>
                        <button onClick={handleSendBroadcast} disabled={isSending || sent || !broadcastMsg.trim()} className={"w-full py-5 rounded-[2rem] font-black text-[13px] uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 " + (sent ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : isSending ? 'bg-white/5 text-gray-600 border border-white/10' : 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_10px_30px_rgba(168,85,247,0.3)] hover:scale-[1.02] active:scale-95')}>
                            {sent ? <><CheckCircle2 size={20} /> DISPATCH SUCCESSFUL</> : isSending ? <>SYNCING WITH NODES...</> : <><Plus size={20} /> SEND BROADCAST</>}
                        </button>
                        {broadcastHistory.length > 0 && (
                            <div className="pt-6 border-t border-white/5 mt-4">
                                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] mb-6 flex items-center gap-2 justify-center"><Clock size={12} /> SECURE BROADCAST LOG</h4>
                                <div className="space-y-4 max-h-60 overflow-y-auto custom-scrollbar pr-3">
                                    <AnimatePresence>
                                        {broadcastHistory.map((log) => (
                                            <motion.div key={log.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="group relative pl-4 border-l-2 border-purple-500/20 py-1">
                                                <div className="absolute left-[-5px] top-2 w-2 h-2 rounded-full bg-purple-500 group-hover:animate-ping" />
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="flex items-center gap-2 px-2 py-0.5 bg-purple-500/10 border border-purple-500/30 rounded-md text-[9px] font-black text-purple-400 uppercase tracking-widest shadow-sm">{log.target}</span>
                                                    <span className="text-[10px] font-bold text-gray-600 whitespace-nowrap">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                                <p className="text-[13px] text-gray-300 leading-relaxed font-medium pl-1">{log.message}</p>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </div>
                        )}
                    </div>
                );
            case 'inventory':
                return (
                    <div className="space-y-4 pt-2">
                        {inventoryItems.map((item) => {
                            const status = getInventoryStatus(item.stock);
                            return (
                                <div key={item.id} className="relative group">
                                    <div className="flex items-center justify-between p-5 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 transition-all overflow-hidden">
                                        <div className="absolute left-0 top-0 w-1.5 h-full bg-blue-500 opacity-10" />
                                        <div className="flex items-center gap-5">
                                            <div className={"w-3 h-3 rounded-full " + status.pip + " " + status.glow} />
                                            <div>
                                                <p className="text-white font-extrabold text-sm tracking-tight">{item.name}</p>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5 opacity-60">{item.category}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="bg-black/40 p-1 rounded-2xl border border-white/10 flex items-center gap-1">
                                                <button onClick={() => handleUpdateStock(item.id, -1)} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 text-white rounded-xl transition-all font-black">-</button>
                                                <span className="w-10 text-center text-sm font-black text-white">{item.stock}</span>
                                                <button onClick={() => handleUpdateStock(item.id, 1)} className="w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all font-black">+</button>
                                            </div>
                                            <div className="w-24 text-right"><span className={"text-[10px] font-black uppercase tracking-[0.2em] " + status.color}>{status.label}</span></div>
                                        </div>
                                    </div>
                                    {ordering && item.stock < 20 && (
                                        <div className="absolute inset-0 bg-blue-500/10 backdrop-blur-[2px] rounded-3xl z-10 flex items-center justify-center border border-blue-500/30">
                                            <div className="flex items-center gap-3"><RefreshCw size={14} className="text-blue-400 animate-spin" /><span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">Syncing Supply...</span></div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        <button onClick={handleOrderMore} disabled={ordering} className={"w-full mt-6 py-5 rounded-[2rem] font-black text-[11px] transition-all uppercase tracking-[0.3em] flex items-center justify-center gap-3 relative overflow-hidden " + (ordering ? 'bg-white/5 text-gray-600 border border-white/5' : 'bg-white/5 border border-white/10 text-white hover:bg-white/10')}>
                            {ordering ? <><div className="absolute inset-0 bg-blue-600/5" /><div className="relative z-10 flex items-center gap-3"><div className="h-1.5 w-24 bg-white/5 rounded-full overflow-hidden"><motion.div initial={{ x: '-100%' }} animate={{ x: '100%' }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} className="h-full w-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]" /></div><span>PROCUREMENT ACTIVE</span></div></> : <><RefreshCw size={16} className="text-blue-500" /> Dispatch Restock Order</>}
                        </button>
                    </div>
                );
            default: return null;
        }
    };

    const getHeaderDetails = () => {
        switch (type) {
            case 'reports': return { title: 'PRACTICE ANALYTICS', status: 'LIVE SYNC', icon: FileText, color: 'text-blue-400' };
            case 'broadcast': return { title: 'CLINIC BROADCAST', status: 'SECURE NODE', icon: Users, color: 'text-purple-400' };
            case 'inventory': return { title: 'STOCK CONTROL', status: (inventoryItems.filter(i => i.stock < 20).length) + ' ALERTS', icon: AlertCircle, color: 'text-amber-400' };
            default: return {};
        }
    };

    const header = getHeaderDetails();

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-2xl" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-xl bg-[#0b0f1a] border border-white/10 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col p-10 max-h-[90vh]">
                <div className="flex items-center justify-between mb-8 shrink-0">
                    <div className="flex items-center gap-5">
                        <div className={"p-4 bg-white/5 rounded-2xl border border-white/10 " + header.color + " shadow-inner"}><header.icon size={28} /></div>
                        <div>
                            <h3 className="text-2xl font-black text-white tracking-tighter">{header.title}</h3>
                            <div className="flex items-center gap-2"><span className={"flex h-1.5 w-1.5 rounded-full animate-pulse " + header.color.replace('text-', 'bg-')} /><span className={"text-[10px] font-black uppercase tracking-[0.2em] " + header.color}>{header.status}</span></div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 bg-white/5 hover:bg-rose-500/10 rounded-full border border-white/10 hover:border-rose-500/30 transition-all group"><X size={20} className="text-gray-500 group-hover:text-rose-500 transition-colors" /></button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 -mr-2">{renderContent()}</div>
                <div className="mt-10 pt-8 border-t border-white/5 flex justify-between items-center bg-gradient-to-t from-white/5 to-transparent -mx-10 -mb-10 px-10 pb-10 shrink-0">
                    <div className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest opacity-50">Node: CEREBRO-UTILITY-01</div>
                    <button onClick={onClose} className="px-8 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-white hover:bg-white/10 transition-all uppercase tracking-[0.2em] shadow-lg">Close Module</button>
                </div>
            </motion.div>
        </div>
    );
};

const IncomingConsultationsPanel = ({ requests, expanded, onToggle, onAccept, onReject }) => {
    const [declineModalOpen, setDeclineModalOpen] = useState(null);
    const requestArray = Array.isArray(requests) ? requests : [];

    const getPriorityDetails = (req, idx) => {
        // Diversified variety: Emergency (Red), Urgent (Orange), Routine (Blue)
        if (idx === 0 || req.priority === 'emergency') {
            return { 
                label: 'Emergency', 
                text: 'text-rose-400', 
                border: 'border-rose-500/50', 
                bg: 'bg-rose-500/10', 
                glow: 'animate-pulse-critical shadow-[0_0_30px_rgba(225,29,72,0.2)]' 
            };
        }
        if (idx === 1 || req.priority === 'urgent') {
            return { 
                label: 'Urgent', 
                text: 'text-amber-400', 
                border: 'border-amber-500/50', 
                bg: 'bg-amber-500/10', 
                glow: 'animate-pulse-urgent shadow-[0_0_20px_rgba(245,158,11,0.15)]' 
            };
        }
        return { 
            label: 'Routine', 
            text: 'text-blue-400', 
            border: 'border-blue-500/30', 
            bg: 'bg-blue-500/5', 
            glow: '' 
        };
    };

    const handleAccept = async (consultationId) => {
        if (onAccept) await onAccept(consultationId);
    };

    const handleReject = async (consultationId, reason) => {
        // Assume onReject can take a reason, or at least we record it visually.
        if (onReject) await onReject(consultationId);
        setDeclineModalOpen(null);
    };

    return (
        <div className="glass-card overflow-hidden">
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors border-b border-white/5 cursor-pointer relative z-10"
            >
                <div className="flex items-center gap-3">
                    <Activity size={20} className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
                    <h3 className="font-bold text-white text-lg tracking-wide uppercase">Triage Hub - Incoming ({requestArray.length})</h3>
                </div>
                <ChevronDown size={20} className={`text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
            {expanded && (
                <div className="p-6 space-y-4">
                    <AnimatePresence>
                        {requestArray.length > 0 ? (
                            requestArray.slice(0, 5).map((req, idx) => {
                                const priority = getPriorityDetails(req, idx);
                                return (
                                    <motion.div
                                        key={req.id || idx}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 50, scale: 0.95 }}
                                        className={`relative rounded-xl border ${priority.border} ${priority.bg} p-5 transition-all duration-300 hover:scale-[1.01] ${priority.glow}`}
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <div className="flex gap-2 items-center">
                                                    <p className="text-white font-bold text-lg">
                                                        {req.patient_name || 'Patient Request'}
                                                    </p>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${priority.border} ${priority.text}`}>
                                                        {priority.label}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    Requested: {req.created_at ? new Date(req.created_at).toLocaleString() : 'Date unknown'}
                                                </p>
                                            </div>
                                        </div>

                                        {req.reason && (
                                            <div className="bg-black/30 backdrop-blur-sm rounded-lg p-3 mb-4 border border-white/5">
                                                <p className="text-sm text-gray-300">"{req.reason}"</p>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                                            <span>
                                                Type: <span className="text-white font-medium">{req.consultation_type || 'General'}</span>
                                            </span>
                                            {req.duration_minutes && (
                                                <span>Duration: {req.duration_minutes} min</span>
                                            )}
                                        </div>

                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => handleAccept(req.id)}
                                                className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)] border border-emerald-500 rounded-lg text-white font-bold tracking-wide transition-all"
                                            >
                                                ACCEPT
                                            </button>
                                            <button
                                                onClick={() => setDeclineModalOpen(req.id)}
                                                className="flex-[0.5] px-4 py-2.5 bg-transparent hover:bg-rose-500/10 border-2 border-rose-500/50 hover:border-rose-500 rounded-lg text-rose-400 font-bold tracking-wide transition-all"
                                            >
                                                DECLINE
                                            </button>
                                        </div>
                                    </motion.div>
                                );
                            })
                        ) : (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center p-8 text-center"
                            >
                                <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-emerald-500/20 mb-4 drop-shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                    <path d="M9 12l2 2 4-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400" />
                                </svg>
                                <h4 className="text-lg font-bold text-white tracking-widest uppercase">All Clear</h4>
                                <p className="text-gray-500 text-sm mt-1">No pending triage requests</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Decline Modal overlay inside the panel */}
                    <AnimatePresence>
                        {declineModalOpen && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 z-50 bg-[#0b0f1a]/80 backdrop-blur-md flex flex-col items-center justify-center p-6"
                            >
                                <motion.div
                                    initial={{ scale: 0.9, y: 20 }}
                                    animate={{ scale: 1, y: 0 }}
                                    exit={{ scale: 0.9, y: 20 }}
                                    className="bg-[#121820] border border-rose-500/30 rounded-2xl p-6 w-full max-w-sm shadow-2xl flex flex-col gap-4 relative"
                                >
                                    <button 
                                        onClick={() => setDeclineModalOpen(null)}
                                        className="absolute top-4 right-4 text-gray-500 hover:text-white"
                                    >
                                        <X size={18} />
                                    </button>
                                    
                                    <div className="flex items-center gap-3 text-rose-500">
                                        <AlertCircle size={24} />
                                        <h4 className="font-extrabold text-lg tracking-tight text-white">Decline Request</h4>
                                    </div>
                                    <p className="text-gray-400 text-sm">Select a reason for declining this consultation.</p>

                                    <div className="grid grid-cols-1 gap-2 mt-2">
                                        {["Outside Specialty", "Schedule Full", "Incomplete Data", "No Show Risk"].map((reason) => (
                                            <button
                                                key={reason}
                                                onClick={() => handleReject(declineModalOpen, reason)}
                                                className="p-3 text-left border border-white/5 bg-white/5 hover:bg-rose-500/20 hover:border-rose-500/50 rounded-xl transition-all text-sm font-medium text-gray-300 hover:text-white"
                                            >
                                                {reason}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

const AppointmentsPanel = ({ patientId, appointments, expanded, onToggle, onStatusUpdate, onOpenBooking }) => {
    const appointmentArray = Array.isArray(appointments) ? appointments : [];

    const getStatusColor = (status) => {
        switch (status) {
            case 'scheduled': return 'bg-cyan-500/20 text-cyan-400';
            case 'confirmed': return 'bg-blue-500/20 text-blue-400';
            case 'completed': return 'bg-emerald-500/20 text-emerald-400';
            case 'no-show': return 'bg-yellow-500/20 text-yellow-400';
            case 'cancelled': return 'bg-red-500/20 text-red-400';
            default: return 'bg-gray-500/20 text-gray-400';
        }
    };

    return (
        <div className="glass-card relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-transparent opacity-50 pointer-events-none rounded-2xl" />
            <div
                onClick={onToggle}
                className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors border-b border-white/5 cursor-pointer relative z-10"
            >
                <div className="flex items-center gap-3">
                    <Calendar size={20} className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                    <h3 className="font-bold text-white text-lg tracking-wide drop-shadow-md">Appointments ({appointmentArray.length})</h3>
                </div>
                <div className="flex items-center gap-3">
                    {expanded && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onOpenBooking();
                            }}
                            className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 rounded-lg text-blue-400 text-xs font-medium transition-colors border border-blue-500/30"
                        >
                            + Schedule
                        </button>
                    )}
                    <ChevronDown size={20} className={`text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                </div>
            </div>
            {expanded && (
                <div className="p-6 space-y-4">
                    {appointmentArray.length > 0 ? (
                        appointmentArray.slice(0, 10).map((apt, idx) => (
                            <div key={idx} className="bg-black/20 border border-white/5 rounded-xl p-4 hover:border-blue-500/30 transition-all">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="text-white font-bold text-sm">{apt.patient_name || (apt.patient ? `${apt.patient.first_name} ${apt.patient.last_name}` : `Apt #${apt.id}`)}</p>
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${getStatusColor(apt.status)}`}>
                                                {apt.status || 'Scheduled'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 flex items-center gap-1.5">
                                            <Clock size={12} />
                                            {apt.scheduled_at ? new Date(apt.scheduled_at).toLocaleString() : 'Date TBD'}
                                        </p>
                                        {apt.notes && (
                                            <p className="text-xs text-gray-400 mt-2 bg-white/5 p-2 rounded italic">"{apt.notes}"</p>
                                        )}
                                    </div>
                                    
                                    {/* Status Actions */}
                                    <div className="flex flex-col gap-2 ml-4">
                                        {apt.status === 'scheduled' && (
                                            <button 
                                                onClick={() => onStatusUpdate(apt.id, 'confirmed')}
                                                className="px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-[10px] font-bold rounded border border-blue-500/30 transition-all"
                                            >
                                                CONFIRM ARRIVAL
                                            </button>
                                        )}
                                        {(apt.status === 'scheduled' || apt.status === 'confirmed') && (
                                            <div className="flex gap-1.5">
                                                <button 
                                                    onClick={() => onStatusUpdate(apt.id, 'completed')}
                                                    className="p-1 px-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-[10px] font-bold rounded border border-emerald-500/30 transition-all"
                                                >
                                                    DONE
                                                </button>
                                                <button 
                                                    onClick={() => onStatusUpdate(apt.id, 'no-show')}
                                                    className="p-1 px-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-500 text-[10px] font-bold rounded border border-yellow-500/30 transition-all"
                                                >
                                                    NO-SHOW
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500 text-sm text-center py-4">No appointments scheduled</p>
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
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[250] p-4">
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
            <div className="glass-card col-span-1 lg:col-span-2 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-transparent opacity-50 pointer-events-none rounded-2xl" />
                <div
                    onClick={onToggle}
                    className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors border-b border-white/5 cursor-pointer relative z-10"
                >
                    <div className="flex items-center gap-3">
                        <FileText size={20} className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                        <h3 className="font-bold text-white text-lg tracking-wide drop-shadow-md">DICOM Imaging ({dicomStudies.length})</h3>
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
                </div>
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
                                    className="bg-black/20 border border-cyan-500/20 rounded-lg p-4 hover:border-cyan-500/60 hover:bg-white/5 transition-all cursor-pointer group"
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

const ClinicalDashboard = ({ 
    patient, details, loading, onClose, appointments, 
    consultationRequests, onAcceptConsultation, onRejectConsultation, 
    onStatusUpdate, appointmentId, mockTriageScores, 
    mockConsultationNotes, onOpenBooking, ...rest 
}) => {
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

    const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);

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
            {/* Wide-Span Hero Card */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="glass-card mt-4 overflow-hidden"
            >
                <div className="flex bg-[#121820]/80 p-6 items-center justify-between border-b border-white/5 relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-white flex items-center justify-center text-3xl font-extrabold border border-white/10 shadow-[0_0_30px_rgba(59,130,246,0.3)] relative">
                            {patient.first_name[0]}{patient.last_name[0]}
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#121820]"></div>
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h2 className="text-3xl font-extrabold text-white tracking-tight">{patient.first_name} {patient.last_name}</h2>
                                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase rounded-full border border-emerald-500/30 tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.3)]">Stable Overview</span>
                            </div>
                            <p className="text-gray-400 font-medium">#{patient.id || 'PID-X001'} • {patient.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 flex items-center justify-center bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all border border-white/10 hover:border-white/20 text-sm font-bold tracking-widest uppercase"
                    >
                        <ChevronRight size={16} className="rotate-180 mr-2" /> Back to Overview
                    </button>
                </div>
            </motion.div>

            {/* War Room: 3-Column Command Center (BENTO GRID MODE) */}
            <div className="grid grid-cols-1 xl:grid-cols-[380px_minmax(0,1fr)_350px] gap-6 items-start mt-6">
                
                {/* Column 1: Reference & Intelligence Grid (Left) */}
                <div className="flex flex-col space-y-6 min-w-0">
                    <BentoVitalGrid observations={details?.observations || []} />
                    
                    <div className="grid grid-cols-2 gap-4">
                        <RiskAssessmentGauge />
                        <QuickActionsWheel />
                    </div>

                    <ClinicalScratchpad />

                    <ConditionsPanel
                        conditions={details?.conditions || []}
                        expanded={expandedSections.conditions}
                        onToggle={() => toggleSection('conditions')}
                    />
                    <MedicationsPanel
                        medications={details?.medications || []}
                        expanded={expandedSections.medications}
                        onToggle={() => toggleSection('medications')}
                        onAdd={() => setShowPrescriptionModal(true)}
                    />
                    <AllergiesPanel
                        allergies={details?.allergies || []}
                        expanded={expandedSections.allergies}
                        onToggle={() => toggleSection('allergies')}
                    />
                    <LabsPanel
                        reports={details?.diagnosticReports || []}
                        expanded={expandedSections.labs}
                        onToggle={() => toggleSection('labs')}
                    />
                </div>

                {/* Column 2: Action Center (Center) */}
                <div className="flex flex-col space-y-6 min-w-0">
                    {mockTriageScores && mockTriageScores.length > 0 && (
                        <UrgentAlertPanel
                            patientId={patient.id}
                            isDoctor={true}
                        />
                    )}
                    <TriageScorePanel
                        patientId={patient.id}
                        isDoctor={true}
                        patientName={`${patient.first_name} ${patient.last_name}`}
                    />

                    <ConsultationNotesForm
                        patientId={patient.id}
                        appointmentId={appointments?.[0]?.id || null}
                        isDoctor={true}
                        patientName={`${patient.first_name} ${patient.last_name}`}
                    />
                </div>

                {/* Column 3: Logistics & Action (Right) */}
                <div className="flex flex-col space-y-6 min-w-0">
                    <AppointmentsPanel
                        patientId={patient.id}
                        appointments={appointments || []}
                        expanded={expandedSections.appointments}
                        onToggle={() => toggleSection('appointments')}
                        onStatusUpdate={onStatusUpdate}
                        onOpenBooking={onOpenBooking}
                    />
                    <DICOMPanel
                        patientId={patient.id}
                        expanded={expandedSections.dicom}
                        onToggle={() => toggleSection('dicom')}
                    />
                    <EPrescriptionForm
                        patientId={patient.id}
                        isDoctor={true}
                        patientName={`${patient.first_name} ${patient.last_name}`}
                    />
                    <FollowUpScheduling
                        patientId={patient.id}
                        appointmentId={appointmentId}
                        isDoctor={true}
                        patientName={`${patient.first_name} ${patient.last_name}`}
                    />
                </div>
            </div>

            {/* Bottom Section: Full-Width Event Stream */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
            >
                <PatientHistoryTimeline
                    patientId={patient.id}
                    isDoctor={true}
                    patientName={`${patient.first_name} ${patient.last_name}`}
                />
            </motion.div>

            {/* E-Prescription Modal Overlay */}
            <AnimatePresence>
                {showPrescriptionModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowPrescriptionModal(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-hide rounded-[2rem] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]"
                        >
                            <div className="absolute top-6 right-6 z-20">
                                <button 
                                    onClick={() => setShowPrescriptionModal(false)}
                                    className="p-3 bg-white/5 hover:bg-rose-500/20 text-white/50 hover:text-rose-400 rounded-2xl border border-white/10 transition-all"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                            <EPrescriptionForm 
                                patientId={patient.id} 
                                patientName={`${patient.first_name} ${patient.last_name}`}
                                isDoctor={true}
                                onClose={() => setShowPrescriptionModal(false)} // Pass close handler if supported
                            />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

const ConditionsPanel = ({ conditions, expanded, onToggle }) => {
    const [showAddQuick, setShowAddQuick] = useState(false);
    const conditionArray = Array.isArray(conditions)
        ? conditions.map(c => c.resource || c)
        : [];

    const getSeverityDetails = (status) => {
        const severities = {
            'active': { label: 'Active', color: 'text-amber-400', bg: 'bg-amber-500/10', glow: 'shadow-[0_0_10px_rgba(245,158,11,0.3)]' },
            'recurrence': { label: 'Recurrent', color: 'text-rose-400', bg: 'bg-rose-500/10', glow: 'shadow-[0_0_10px_rgba(244,63,94,0.3)]' },
            'resolved': { label: 'Resolved', color: 'text-emerald-400', bg: 'bg-emerald-500/10', glow: 'shadow-[0_0_10px_rgba(16,185,129,0.3)]' },
            'remission': { label: 'Remission', color: 'text-blue-400', bg: 'bg-blue-500/10', glow: 'shadow-[0_0_10px_rgba(59,130,246,0.3)]' },
        };
        return severities[status] || { label: status || 'Unknown', color: 'text-gray-400', bg: 'bg-gray-500/10', glow: '' };
    };

    return (
        <div className="glass-card relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-30 pointer-events-none" />
            
            <div className="w-full flex items-center justify-between p-5 border-b border-white/5 relative z-10 bg-white/2">
                <div className="flex items-center gap-3 cursor-pointer" onClick={onToggle}>
                    <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
                        <AlertCircle size={18} className="text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.4)]" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-md tracking-tight text-glow">Conditions</h3>
                        <p className="text-[10px] font-black text-blue-500/50 uppercase tracking-widest">Recorded Pathology Stream</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setShowAddQuick(!showAddQuick)}
                        className="p-2 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg border border-blue-500/20 text-blue-400 transition-all hover:scale-110 active:scale-95"
                    >
                        <Plus size={16} />
                    </button>
                    <button onClick={onToggle} className={`p-2 hover:bg-white/5 rounded-lg transition-transform ${expanded ? 'rotate-180' : ''}`}>
                        <ChevronDown size={18} className="text-gray-500" />
                    </button>
                </div>
            </div>

            {expanded && (
                <div className="p-4 space-y-3 relative z-10 max-h-[400px] overflow-y-auto scrollbar-hide">
                    {showAddQuick && (
                        <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-3 mb-4 space-y-2"
                        >
                            <input type="text" placeholder="Diagnosis name..." className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500" />
                            <div className="flex gap-2">
                                <select className="flex-1 bg-black/40 border border-white/10 rounded-lg px-2 py-2 text-[10px] text-gray-400 outline-none">
                                    <option>Chronic</option>
                                    <option>Acute</option>
                                </select>
                                <button className="px-4 py-2 bg-blue-600 rounded-lg text-white text-[10px] font-bold uppercase tracking-widest">Add</button>
                            </div>
                        </motion.div>
                    )}

                    {conditionArray.length > 0 ? (
                        conditionArray.map((cond, idx) => {
                            const status = cond.clinicalStatus?.coding?.[0]?.code || 'active';
                            const style = getSeverityDetails(status);
                            
                            return (
                                <motion.div 
                                    key={idx} 
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="bg-[#121822]/40 border border-white/5 rounded-2xl p-4 hover:border-blue-500/30 transition-all group/item"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="space-y-1">
                                            <h4 className="text-white font-bold text-sm tracking-tight leading-none">
                                                {cond.code?.coding?.[0]?.display || cond.code?.text || 'Standard Diagnosis'}
                                            </h4>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter ${style.bg} ${style.color} border border-current/20 ${style.glow}`}>
                                                    {style.label}
                                                </span>
                                                <span className="text-[9px] font-bold text-gray-600 uppercase">On: {cond.onsetDateTime ? new Date(cond.onsetDateTime).toLocaleDateString() : 'Dec 12, 2025'}</span>
                                            </div>
                                        </div>
                                        <button className="opacity-0 group-hover/item:opacity-100 p-1.5 hover:bg-white/5 rounded-lg text-gray-500 transition-all">
                                            <MoreVertical size={14} />
                                        </button>
                                    </div>
                                    
                                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/5">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1 h-1 rounded-full bg-blue-500" />
                                            <span className="text-[9px] font-black text-white/40 uppercase">Chronic Care</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 opacity-40 hover:opacity-100 transition-opacity cursor-pointer">
                                            <span className="text-[9px] font-black text-blue-400 uppercase">Audit Log</span>
                                            <ChevronRight size={10} className="text-blue-400" />
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })
                    ) : (
                        <div className="text-center py-10 opacity-30 flex flex-col items-center">
                            <Activity size={32} className="mb-2" />
                            <p className="text-xs font-black uppercase tracking-widest">No Active Conditions</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const MedicationsPanel = ({ medications, expanded, onToggle, onAdd }) => {
    const medArray = Array.isArray(medications)
        ? medications.map(m => m.resource || m)
        : [];
    const activeMeds = medArray.filter(m => m.status === 'active');

    return (
        <div className="glass-card relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent opacity-30 pointer-events-none" />
            
            <div className="w-full flex items-center justify-between p-5 border-b border-white/5 relative z-10 bg-white/2">
                <div className="flex items-center gap-3 cursor-pointer" onClick={onToggle}>
                    <div className="p-2 bg-emerald-500/20 rounded-lg border border-emerald-500/30">
                        <Pill size={18} className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-md tracking-tight text-glow">Active Medications</h3>
                        <p className="text-[10px] font-black text-emerald-500/50 uppercase tracking-widest">Current Pharmaceutical Protocols</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onAdd();
                        }}
                        className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg border border-emerald-500/20 text-emerald-400 transition-all hover:scale-110"
                        title="New Prescription"
                    >
                        <Plus size={16} />
                    </button>
                    <button onClick={onToggle} className={`p-2 hover:bg-white/5 rounded-lg transition-transform ${expanded ? 'rotate-180' : ''}`}>
                        <ChevronDown size={18} className="text-gray-500" />
                    </button>
                </div>
            </div>

            {expanded && (
                <div className="p-4 space-y-3 relative z-10 max-h-[400px] overflow-y-auto scrollbar-hide">
                    {activeMeds.length > 0 ? (
                        activeMeds.map((med, idx) => (
                            <motion.div 
                                key={idx} 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                className="bg-[#121822]/60 border border-white/5 rounded-2xl p-5 hover:border-emerald-500/40 transition-all group/med"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h4 className="text-white font-black text-md tracking-tight group-hover:text-emerald-300 transition-colors">
                                            {med.medicationCodeableConcept?.coding?.[0]?.display || med.medicationReference?.display || 'System Medication'}
                                        </h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[9px] font-black text-emerald-400/60 uppercase tracking-widest">PHARM-ID: #{Math.floor(Math.random() * 9000) + 1000}</span>
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] font-black text-white bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30 uppercase">Active</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-black/30 p-2 rounded-xl border border-white/5">
                                        <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Dosage</p>
                                        <p className="text-xs font-bold text-white leading-none">
                                            {med.dosageInstruction?.[0]?.text || med.dosageInstruction?.[0]?.doseAndRate?.[0]?.doseQuantity?.value + ' ' + med.dosageInstruction?.[0]?.doseAndRate?.[0]?.doseQuantity?.unit || 'Unspecified'}
                                        </p>
                                    </div>
                                    <div className="bg-black/30 p-2 rounded-xl border border-white/5">
                                        <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Frequency</p>
                                        <p className="text-xs font-bold text-white leading-none">Standard Regimen</p>
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center justify-between pt-3 border-t border-white/5">
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 rounded-md bg-white/5 flex items-center justify-center text-[10px] font-bold text-gray-500">RX</div>
                                        <span className="text-[9px] font-bold text-gray-400">Oral Administration</span>
                                    </div>
                                    <button className="text-[9px] font-black text-emerald-400 uppercase tracking-widest hover:text-white transition-colors">
                                        Refill Request
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="text-center py-10 opacity-30 flex flex-col items-center">
                            <Pill size={32} className="mb-2" />
                            <p className="text-xs font-black uppercase tracking-widest">No Active Prescriptions</p>
                        </div>
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

    const hasHighRisk = allergyArray.some(a => a.criticality === 'high');

    return (
        <div className={`glass-card relative overflow-hidden ${hasHighRisk ? 'border-red-500/50 shadow-[0_0_15px_rgba(225,29,72,0.3)] animate-pulse-critical' : ''}`}>
            <div className={`absolute inset-0 bg-gradient-to-r ${hasHighRisk ? 'from-red-500/20' : 'from-yellow-500/5'} to-transparent opacity-50 pointer-events-none`} />
            
            <button
                onClick={hasHighRisk ? undefined : onToggle}
                className={`w-full flex items-center justify-between p-5 transition-colors border-b border-white/5 relative z-10 ${hasHighRisk ? 'cursor-default' : 'hover:bg-white/5 cursor-pointer'}`}
            >
                <div className="flex items-center gap-3">
                    <AlertCircle size={20} className={hasHighRisk ? 'text-rose-400 drop-shadow-[0_0_12px_rgba(244,63,94,0.6)]' : 'text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]'} />
                    <h3 className={`font-black text-lg tracking-tight text-glow ${hasHighRisk ? 'text-rose-400 uppercase italic' : 'text-white'}`}>
                        {hasHighRisk ? 'SYSTEM CRITICAL: SEVERE ALLERGY' : 'Allergy Profiles'}
                    </h3>
                </div>
                {!hasHighRisk && (
                    <ChevronDown size={20} className={`text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                )}
            </button>

            {(expanded || hasHighRisk) && (
                <div className="p-6 space-y-3 relative z-10">
                    {allergyArray.length > 0 ? (
                        allergyArray.map((allergy, idx) => (
                            <div key={idx} className={`rounded-xl p-4 shadow-md backdrop-blur-md transition-all ${allergy.criticality === 'high'
                                    ? 'bg-red-500/10 border border-red-500/40'
                                    : 'bg-[#121822]/80 border border-white/5 hover:border-yellow-400/30'
                                }`}>
                                <p className={`font-bold text-base ${allergy.criticality === 'high' ? 'text-red-400' : 'text-white'}`}>
                                    {allergy.code?.coding?.[0]?.display || allergy.code?.text || 'Allergen'}
                                </p>
                                <p className="text-sm text-gray-400 mt-1">
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

const BentoVitalGrid = ({ observations }) => {
    const obsArray = Array.isArray(observations)
        ? observations.map(o => o.resource || o)
        : [];

    const vitalTypes = [
        { key: 'heart-rate', codes: ['heart-rate', 'HR', '8867-4'], label: 'Heart Rate', unit: 'BPM', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30', icon: Heart, iconColor: 'text-rose-400', wave: 'ekg', glow: 'shadow-[0_0_20px_rgba(244,63,94,0.3)]' },
        { key: 'blood-pressure', codes: ['blood-pressure', 'BP', '8480-6', '8462-4'], label: 'Blood Pressure', unit: 'mmHg', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: Activity, iconColor: 'text-blue-400', wave: 'pulse', glow: 'shadow-[0_0_20px_rgba(59,130,246,0.3)]' },
        { key: 'body-temperature', codes: ['body-temperature', 'TEMP', '8310-5'], label: 'Temperature', unit: '°C', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', icon: Thermometer, iconColor: 'text-amber-400', wave: 'flat', glow: 'shadow-[0_0_20px_rgba(245,158,11,0.3)]' },
        { key: 'oxygen-saturation', codes: ['oxygen-saturation', 'SPO2', '2708-6', '59408-5'], label: 'SpO2', unit: '%', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: Droplet, iconColor: 'text-emerald-400', wave: 'pleth', glow: 'shadow-[0_0_20px_rgba(16,185,129,0.3)]' }
    ];

    const VitalWave = ({ color, type }) => {
        let path = "";
        let duration = 2;
        
        switch (type) {
            case 'ekg':
                path = "M 0 25 L 20 25 L 25 10 L 30 40 L 35 25 L 50 25 L 55 5 L 60 45 L 65 25 L 80 25 L 85 15 L 90 25 L 110 25";
                duration = 1.2;
                break;
            case 'pleth':
                path = "M 0 25 C 10 25, 15 5, 25 5 C 35 5, 40 25, 50 25 C 60 25, 65 5, 75 5 C 85 5, 90 25, 100 25";
                duration = 2.5;
                break;
            case 'pulse':
                path = "M 0 25 L 10 25 L 15 10 L 25 35 L 30 25 L 45 25 L 50 15 L 60 40 L 65 25 L 110 25";
                duration = 1.5;
                break;
            case 'flat':
                path = "M 0 25 L 20 25 L 25 24 L 30 26 L 35 25 L 110 25";
                duration = 4;
                break;
            default:
                path = "M 0 25 L 110 25";
        }

        return (
            <svg className="absolute inset-x-0 bottom-0 w-full h-16 opacity-30 pointer-events-none group-hover:opacity-60 transition-opacity" viewBox="0 0 110 50" preserveAspectRatio="none">
                <motion.path
                    d={path}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    className={color}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{
                        pathLength: { duration: duration, repeat: Infinity, ease: "linear" },
                        opacity: { duration: 1 }
                    }}
                />
            </svg>
        );
    };

    return (
        <div className="grid grid-cols-2 gap-4">
            {vitalTypes.map((type, idx) => {
                const vital = obsArray.find(o => 
                    o.code?.coding?.some(c => 
                        type.codes.some(tc => c.code?.toUpperCase() === tc.toUpperCase() || c.display?.toUpperCase().includes(tc.toUpperCase()))
                    )
                );
                
                const value = vital ? (vital.valueQuantity?.value || vital.valueString?.split(' ')[0] || '--') : '--';
                
                return (
                    <motion.div 
                        key={idx} 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className={`relative group h-40 bg-[#0b0f1a] border border-white/5 rounded-[2rem] p-6 overflow-hidden hover:border-white/20 transition-all cursor-default shadow-lg`}
                    >
                        <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-[60px] opacity-10 ${type.bg}`} />
                        <VitalWave color={type.color} type={type.wave} />

                        <div className="flex justify-between items-start relative z-10">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 opacity-60">{type.label}</span>
                            <motion.div 
                                animate={type.key === 'heart-rate' ? {
                                    scale: [1, 1.2, 1, 1.3, 1],
                                } : {}}
                                transition={type.key === 'heart-rate' ? {
                                    duration: 0.8,
                                    repeat: Infinity,
                                    times: [0, 0.1, 0.2, 0.4, 1],
                                    ease: "easeInOut"
                                } : {}}
                                className={`p-2.5 rounded-2xl ${type.bg} border border-white/5 shadow-inner`}
                            >
                                <type.icon size={16} className={type.iconColor} />
                            </motion.div>
                        </div>

                        <div className="mt-auto relative z-10 flex flex-col pt-4">
                            <div className="flex items-end gap-2">
                                <motion.span 
                                    animate={value !== '--' ? { opacity: [1, 0.8, 1] } : {}}
                                    transition={{ duration: 1, repeat: Infinity }}
                                    className={`text-4xl font-black tracking-tighter ${type.color} drop-shadow-[0_0_15px_rgba(225,29,72,0.3)]`}
                                >
                                    {value}
                                </motion.span>
                                <span className="text-[11px] font-black uppercase tracking-widest text-gray-600 mb-2">{type.unit}</span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-1">
                                <div className={`w-1 h-1 rounded-full ${type.color.replace('text-', 'bg-')} animate-pulse`} />
                                <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Live telemetry active</span>
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
};

const RiskAssessmentGauge = () => {
    return (
        <div className="relative h-[11.5rem] bg-[#0b0f1a] border border-white/5 rounded-[2rem] p-6 overflow-hidden flex flex-col justify-between group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 blur-[50px] -mr-10 -mt-10" />
            
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 opacity-60 relative z-10">AI Risk Insight</span>
            
            <div className="relative flex-1 flex items-center justify-center -mb-2">
                {/* Advanced Gauge Rendering */}
                <svg className="w-32 h-32 transform -rotate-90">
                    <circle cx="64" cy="64" r="48" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-white/5" />
                    <motion.circle 
                        cx="64" cy="64" r="48" 
                        stroke="currentColor" strokeWidth="6" 
                        fill="transparent" 
                        strokeDasharray="301.6"
                        initial={{ strokeDashoffset: 301.6 }}
                        animate={{ strokeDashoffset: 301.6 - (301.6 * 0.42) }}
                        transition={{ duration: 2, ease: "easeOut" }}
                        className="text-rose-500 drop-shadow-[0_0_12px_rgba(225,29,72,0.6)]" 
                    />
                    <motion.circle 
                        cx="64" cy="64" r="52" 
                        stroke="currentColor" strokeWidth="1" 
                        fill="transparent" 
                        className="text-rose-500/20"
                        animate={{ scale: [1, 1.05, 1], opacity: [0.2, 0.5, 0.2] }}
                        transition={{ duration: 3, repeat: Infinity }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pt-1">
                    <motion.span 
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-3xl font-black text-white tracking-tighter"
                    >42%</motion.span>
                </div>
            </div>
            
            <div className="flex items-center justify-between relative z-10 pt-2">
                <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">MODERATE RISK</span>
                <div className="flex gap-0.5">
                    <div className="w-1 h-3 bg-rose-500 rounded-full" />
                    <div className="w-1 h-3 bg-rose-500 rounded-full" />
                    <div className="w-1 h-3 bg-white/10 rounded-full" />
                </div>
            </div>
        </div>
    );
};

const QuickActionsWheel = () => {
    return (
        <div className="relative h-40 bg-[#0b0f1a] border border-white/5 rounded-[2rem] p-6 flex flex-col justify-between overflow-hidden">
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-blue-500/5 blur-[40px] -mb-10 -mr-10" />
            
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 opacity-60">Operations</span>
            
            <div className="grid grid-cols-2 gap-3 mb-1">
                {[
                    { label: 'Orders', icon: Activity, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
                    { label: 'Refer', icon: Users, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' }
                ].map((action, i) => (
                    <button key={i} className={`p-4 ${action.bg} border ${action.border} rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-white/5 transition-all group relative overflow-hidden`}>
                        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/20 rounded-tl-lg" />
                        <action.icon size={20} className={`${action.color} group-hover:scale-110 transition-transform drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]`} />
                        <span className={`text-[9px] font-black uppercase ${action.color} tracking-widest`}>{action.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

const ClinicalScratchpad = () => {
    return (
        <div className="glass-card p-0 relative overflow-hidden flex flex-col h-40">
            <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500">Scratchpad</span>
                <Edit2 size={12} className="text-amber-500/50" />
            </div>
            <textarea 
                className="w-full h-full bg-transparent p-4 text-sm text-gray-300 focus:outline-none resize-none placeholder-gray-600 font-medium"
                placeholder="Jot down quick thoughts here..."
            ></textarea>
        </div>
    );
};

const LabsPanel = ({ reports, expanded, onToggle }) => {
    const reportArray = Array.isArray(reports)
        ? reports.map(r => r.resource || r)
        : [];

    return (
        <div className="glass-card relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-transparent opacity-50 pointer-events-none rounded-2xl" />
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors border-b border-white/5 cursor-pointer relative z-10"
            >
                <div className="flex items-center gap-3">
                    <TrendingUp size={20} className="text-purple-400 drop-shadow-[0_0_8px_rgba(192,132,252,0.5)]" />
                    <h3 className="font-bold text-white text-lg">Lab Results ({reportArray.length})</h3>
                </div>
                <ChevronDown size={20} className={`text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
            {expanded && (
                <div className="p-6 space-y-3">
                    {reportArray.length > 0 ? (
                        reportArray.slice(0, 5).map((report, idx) => (
                            <div key={idx} className="bg-[#121822]/80 backdrop-blur-md border border-purple-500/20 shadow-md rounded-lg p-3 hover:border-purple-500/50 hover:shadow-purple-500/10 transition-all relative z-10">
                                <p className="text-white font-medium text-sm">{report.code?.coding?.[0]?.display || 'Lab Report'}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                    Issued: {new Date(report.issued).toLocaleDateString()}
                                </p>
                                <p className="text-xs font-semibold text-purple-400 mt-2">
                                    {report.result?.length || 0} results available
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
