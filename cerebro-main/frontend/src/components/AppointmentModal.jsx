<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, Stethoscope, Activity, Microscope, AlertCircle, CheckCircle2, User, Search, ChevronRight } from 'lucide-react';
import API from '../api';

const AppointmentModal = ({ isOpen, onClose, doctorId: propDoctorId, doctorName: propDoctorName, patientId, onSuccess }) => {
    const [step, setStep] = useState(propDoctorId ? 2 : 1); // skip doctor selection if pre-set
    const [doctors, setDoctors] = useState([]);
    const [filteredDoctors, setFilteredDoctors] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDoctor, setSelectedDoctor] = useState(
        propDoctorId ? { id: propDoctorId, first_name: '', last_name: propDoctorName || '', profile: {} } : null
    );
    const [formData, setFormData] = useState({
        appointment_type: 'doctor',
        imaging_modality: '',
        lab_test_type: '',
        reason: '',
        scheduled_at: '',
        duration_minutes: 30,
        notes: ''
    });
    const [loading, setLoading] = useState(false);
    const [loadingDoctors, setLoadingDoctors] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const modalities = [
        { id: 'MR', name: 'MRI' }, { id: 'CT', name: 'CT Scan' }, { id: 'XR', name: 'X-Ray' },
        { id: 'US', name: 'Ultrasound' }, { id: 'PET', name: 'PET Scan' },
        { id: 'NM', name: 'Nuclear Medicine' }, { id: 'DXA', name: 'Bone Density' },
        { id: 'MG', name: 'Mammography' }, { id: 'RF', name: 'Fluoroscopy' },
    ];

    const types = [
        { id: 'doctor', name: 'Consultation', icon: Stethoscope, color: 'indigo' },
        { id: 'imaging', name: 'Imaging', icon: Activity, color: 'purple' },
        { id: 'lab', name: 'Lab Test', icon: Microscope, color: 'teal' },
    ];

    useEffect(() => {
        if (isOpen && !propDoctorId) {
            fetchDoctors();
            setStep(1);
            setSelectedDoctor(null);
        } else if (isOpen && propDoctorId) {
            setStep(2);
        }
    }, [isOpen, propDoctorId]);

    useEffect(() => {
        if (searchQuery) {
            setFilteredDoctors(doctors.filter(d =>
                `${d.first_name} ${d.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
                d.profile?.specialty?.toLowerCase().includes(searchQuery.toLowerCase())
            ));
        } else {
            setFilteredDoctors(doctors);
        }
    }, [searchQuery, doctors]);

    const fetchDoctors = async () => {
        setLoadingDoctors(true);
        try {
            const { data } = await API.get('/api/auth/doctors/');
            const list = (data.results || data).filter(d => d.role === 'doctor' || d.profile?.specialty);
            setDoctors(list);
            setFilteredDoctors(list);
        } catch (err) {
            console.error('Failed to fetch doctors:', err);
        }
        setLoadingDoctors(false);
    };

    const handleDoctorSelect = (doctor) => {
        setSelectedDoctor(doctor);
        setStep(2);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedDoctor) {
            setError('Please select a doctor first.');
            return;
        }
        setError('');
        setLoading(true);

        try {
            await API.post('/api/auth/appointments/', {
                doctor: selectedDoctor.id,
                patient: patientId,
                appointment_type: formData.appointment_type,
                imaging_modality: formData.appointment_type === 'imaging' ? formData.imaging_modality : null,
                lab_test_type: formData.appointment_type === 'lab' ? formData.lab_test_type : null,
                scheduled_at: formData.scheduled_at,
                duration_minutes: formData.duration_minutes,
                notes: formData.notes,
                status: 'scheduled'
            });
            setSuccess(true);
            setTimeout(() => {
                onClose();
                onSuccess?.();
                setSuccess(false);
                setStep(propDoctorId ? 2 : 1);
                setSelectedDoctor(propDoctorId ? selectedDoctor : null);
                setFormData({ appointment_type: 'doctor', imaging_modality: '', lab_test_type: '', reason: '', scheduled_at: '', duration_minutes: 30, notes: '' });
            }, 2000);
        } catch (err) {
            const errData = err.response?.data;
            let errorMessage = 'Failed to schedule. Check availability or date/time conflicts.';
            
            if (errData) {
                if (typeof errData === 'string') {
                    errorMessage = errData;
                } else if (errData.non_field_errors) {
                    errorMessage = errData.non_field_errors[0];
                } else if (errData.detail) {
                    errorMessage = errData.detail;
                } else if (typeof errData === 'object') {
                    // Try to get the first error from any field
                    const firstKey = Object.keys(errData)[0];
                    const firstVal = errData[firstKey];
                    errorMessage = Array.isArray(firstVal) ? firstVal[0] : (typeof firstVal === 'string' ? firstVal : errorMessage);
                }
            }
            setError(errorMessage);
=======
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

const AppointmentModal = ({ isOpen, onClose, doctorId, doctorName, onSuccess }) => {
    const [formData, setFormData] = useState({
        title: '',
        reason: '',
        scheduled_at: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fhirStatus, setFhirStatus] = useState(''); // Track FHIR sync status

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setFhirStatus('');
        setLoading(true);

        const token = localStorage.getItem('access_token');
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        try {
            // Create appointment (will auto-sync to FHIR via signal)
            setFhirStatus('Creating appointment...');
            const appointmentRes = await fetch('http://localhost:8000/api/auth/appointments/', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    doctor: parseInt(doctorId),
                    scheduled_at: formData.scheduled_at,
                    duration_minutes: 30,
                    status: 'scheduled',
                    notes: `${formData.title || `Appointment with Dr. ${doctorName}`} - ${formData.reason}`
                })
            });

            if (appointmentRes.ok) {
                const appointment = await appointmentRes.json();

                // FHIR sync happens automatically via the post_save signal
                setFhirStatus('✓ Appointment synced to FHIR server');
                
                // Optionally verify FHIR sync status
                setTimeout(() => {
                    fetch(`http://localhost:8000/api/auth/appointments/${appointment.id}/`, {
                        method: 'GET',
                        headers
                    })
                    .then(res => res.json())
                    .then(data => {
                        if (data.fhir_sync_status === 'synced') {
                            setFhirStatus('✓ FHIR sync confirmed! (ID: ' + data.fhir_resource_id + ')');
                        } else if (data.fhir_sync_status === 'failed') {
                            setFhirStatus('⚠ FHIR sync pending retry');
                        }
                    })
                    .catch(err => console.warn('Status check failed:', err));
                }, 1000);

                alert('Appointment scheduled successfully! Real-time FHIR synchronization in progress.');
                setFormData({ title: '', reason: '', scheduled_at: '' });
                
                // Callback to refresh doctor's appointment list
                setTimeout(() => {
                    onClose();
                    onSuccess?.();
                }, 2000);
            } else {
                const error = await appointmentRes.json();
                setError(error.detail || JSON.stringify(error));
            }
        } catch (error) {
            setError(error.message);
>>>>>>> b381c81bab0b6500d6e25aa0d8e664d8397d0550
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

<<<<<<< HEAD
    const doctorDisplayName = selectedDoctor 
        ? `Dr. ${selectedDoctor.first_name} ${selectedDoctor.last_name}`.trim()
        : '';

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[250] p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-[#0a0d14] border border-white/10 rounded-[2rem] shadow-[0_40px_80px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col"
                style={{ width: '100%', maxWidth: step === 1 ? '680px' : '640px', maxHeight: '90vh' }}
            >
                {/* Glowing decoration */}
                <div className="absolute top-0 right-0 w-56 h-56 bg-indigo-500/5 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-500/5 rounded-full -ml-10 -mb-10 blur-3xl pointer-events-none" />

                {/* Header */}
                <div className="flex justify-between items-start p-8 pb-6 border-b border-white/5 relative z-10 shrink-0">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            {!propDoctorId && step === 2 && (
                                <button
                                    onClick={() => setStep(1)}
                                    className="w-7 h-7 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all text-gray-400 hover:text-white"
                                >
                                    ‹
                                </button>
                            )}
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${step === 1 ? 'bg-blue-500' : 'bg-gray-700'}`} />
                                <div className={`w-2 h-2 rounded-full ${step === 2 ? 'bg-indigo-500' : 'bg-gray-700'}`} />
                            </div>
                        </div>
                        <h2 className="text-xl font-black text-white tracking-tight">
                            {step === 1 ? 'Choose Your Physician' : 'Configure Session'}
                        </h2>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mt-1">
                            {step === 1
                                ? `${doctors.length} specialist${doctors.length !== 1 ? 's' : ''} available`
                                : selectedDoctor ? `with ${doctorDisplayName}` : 'Schedule appointment'
                            }
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-colors shrink-0">
                        <X size={18} className="text-gray-400 hover:text-white transition-colors" />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 relative z-10 p-8 pt-6">
                    <AnimatePresence mode="wait">
                        {/* ── STEP 1: DOCTOR SELECTION ── */}
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="space-y-5"
                            >
                                {/* Search */}
                                <div className="relative">
                                    <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                                    <input
                                        type="text"
                                        placeholder="Search by name or specialty..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-3.5 text-sm font-bold text-white placeholder-gray-600 outline-none focus:border-indigo-500/50 transition-all"
                                    />
                                </div>

                                {/* Doctor list */}
                                <div className="grid gap-3">
                                    {loadingDoctors ? (
                                        <div className="py-12 text-center">
                                            <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-3" />
                                            <p className="text-[10px] uppercase font-black tracking-widest text-gray-600">Fetching Specialists...</p>
                                        </div>
                                    ) : filteredDoctors.length === 0 ? (
                                        <div className="py-12 text-center opacity-40">
                                            <User size={32} className="mx-auto text-gray-700 mb-2" />
                                            <p className="text-[10px] uppercase font-black tracking-widest text-gray-500">No Specialists Found</p>
                                        </div>
                                    ) : (
                                        filteredDoctors.map((doctor, idx) => (
                                            <motion.button
                                                key={doctor.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.04 }}
                                                type="button"
                                                onClick={() => handleDoctorSelect(doctor)}
                                                className="w-full p-5 bg-white/[0.03] hover:bg-indigo-500/10 border border-white/[0.06] hover:border-indigo-500/30 rounded-2xl transition-all flex items-center gap-4 group text-left"
                                            >
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600/30 to-blue-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-300 font-black text-sm shrink-0">
                                                    {doctor.first_name?.charAt(0)}{doctor.last_name?.charAt(0)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-black text-white text-sm group-hover:text-indigo-300 transition-colors truncate">
                                                        Dr. {doctor.first_name} {doctor.last_name}
                                                    </p>
                                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5 truncate">
                                                        {doctor.profile?.specialty || 'General Practice'}
                                                    </p>
                                                    {doctor.profile?.license_number && (
                                                        <p className="text-[9px] font-bold text-gray-700 mt-0.5">
                                                            LIC: {doctor.profile.license_number}
                                                        </p>
                                                    )}
                                                </div>
                                                <ChevronRight size={16} className="text-gray-700 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all shrink-0" />
                                            </motion.button>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* ── STEP 2: SCHEDULE FORM ── */}
                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                {error && (
                                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="mb-6 bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3">
                                        <AlertCircle className="text-red-400 w-5 h-5 shrink-0" />
                                        <p className="text-sm font-bold text-red-400 leading-tight">{error}</p>
                                    </motion.div>
                                )}

                                {success ? (
                                    <div className="py-20 flex flex-col items-center justify-center text-center">
                                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mb-6">
                                            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                                        </motion.div>
                                        <h3 className="text-2xl font-black text-white mb-2">Scheduled!</h3>
                                        <p className="text-gray-400 text-sm font-medium tracking-wide">Session confirmed with {doctorDisplayName}.</p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        {/* Selected doctor recap */}
                                        {selectedDoctor && (
                                            <div className="flex items-center gap-4 p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl">
                                                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-black text-sm">
                                                    {selectedDoctor.first_name?.charAt(0)}{selectedDoctor.last_name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-black text-white text-sm">{doctorDisplayName}</p>
                                                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{selectedDoctor.profile?.specialty || 'Specialist'}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Session type */}
                                        <div className="grid grid-cols-3 gap-3">
                                            {types.map(t => (
                                                <button
                                                    key={t.id}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, appointment_type: t.id })}
                                                    className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-3 ${
                                                        formData.appointment_type === t.id
                                                        ? t.id === 'doctor' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.15)]'
                                                          : t.id === 'imaging' ? 'bg-purple-500/10 border-purple-500/30 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                                                          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                                                        : 'bg-white/[0.03] border-white/[0.06] text-gray-500 hover:border-white/10 hover:text-gray-300'
                                                    }`}
                                                >
                                                    <t.icon size={22} />
                                                    <span className="text-[9px] font-black uppercase tracking-widest">{t.name}</span>
                                                </button>
                                            ))}
                                        </div>

                                        {/* Date & Duration */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] font-black uppercase text-gray-500 mb-2 block ml-1 flex items-center gap-1.5 tracking-widest">
                                                    <Calendar className="w-3 h-3 text-indigo-400" /> Date & Time
                                                </label>
                                                <input
                                                    type="datetime-local"
                                                    required
                                                    value={formData.scheduled_at}
                                                    onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white focus:border-indigo-500 outline-none transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black uppercase text-gray-500 mb-2 block ml-1 flex items-center gap-1.5 tracking-widest">
                                                    <Clock className="w-3 h-3 text-indigo-400" /> Duration
                                                </label>
                                                <select
                                                    value={formData.duration_minutes}
                                                    onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white focus:border-indigo-500 outline-none transition-all appearance-none"
                                                >
                                                    <option value={15}>15 min</option>
                                                    <option value={30}>30 min</option>
                                                    <option value={45}>45 min</option>
                                                    <option value={60}>1 hour</option>
                                                    <option value={90}>1h30</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* Conditional fields */}
                                        {formData.appointment_type === 'imaging' && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                                                <label className="text-[10px] font-black uppercase text-gray-500 mb-2 block ml-1 tracking-widest">Imaging Modality</label>
                                                <select
                                                    required
                                                    value={formData.imaging_modality}
                                                    onChange={(e) => setFormData({ ...formData, imaging_modality: e.target.value })}
                                                    className="w-full bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4 text-sm font-bold text-purple-400 focus:border-purple-500 outline-none appearance-none"
                                                >
                                                    <option value="" className="bg-[#0a0d14]">Select modality...</option>
                                                    {modalities.map(m => <option key={m.id} value={m.id} className="bg-[#0a0d14] text-white">{m.name}</option>)}
                                                </select>
                                            </motion.div>
                                        )}

                                        {formData.appointment_type === 'lab' && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                                                <label className="text-[10px] font-black uppercase text-gray-500 mb-2 block ml-1 tracking-widest">Test / Panel</label>
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="e.g. CBC, Lipid Panel, Blood Glucose"
                                                    value={formData.lab_test_type}
                                                    onChange={(e) => setFormData({ ...formData, lab_test_type: e.target.value })}
                                                    className="w-full bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-sm font-bold text-emerald-400 placeholder-emerald-900 focus:border-emerald-500 outline-none"
                                                />
                                            </motion.div>
                                        )}

                                        {/* Notes */}
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-gray-500 mb-2 block ml-1 tracking-widest">Clinical Notes / Reason</label>
                                            <textarea
                                                value={formData.notes}
                                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                                rows={3}
                                                placeholder="Briefly describe your symptoms or reason for visit..."
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white focus:border-indigo-500 outline-none transition-all resize-none placeholder-gray-700"
                                            />
                                        </div>

                                        {/* Submit */}
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className={`w-full py-5 rounded-3xl font-black text-white transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest text-sm ${
                                                loading
                                                ? 'bg-white/5 text-gray-500 border border-white/10 cursor-not-allowed'
                                                : 'bg-indigo-600 hover:bg-indigo-500 shadow-[0_10px_30px_rgba(99,102,241,0.3)] hover:shadow-[0_15px_40px_rgba(99,102,241,0.4)]'
                                            }`}
                                        >
                                            {loading ? (
                                                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</>
                                            ) : (
                                                <><Calendar className="w-5 h-5" /> Confirm Session</>
                                            )}
                                        </button>
                                    </form>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
=======
    return (
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
                    <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: 600, margin: 0 }}>
                        Schedule Appointment
                    </h3>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {error && (
                    <div style={{
                        background: 'rgba(239,68,68,0.1)',
                        border: '1px solid rgba(239,68,68,0.3)',
                        color: '#fca5a5',
                        padding: '12px',
                        borderRadius: '6px',
                        marginBottom: '16px',
                        fontSize: '14px'
                    }}>
                        {error}
                    </div>
                )}

                {fhirStatus && (
                    <div style={{
                        background: fhirStatus.includes('✓') ? 'rgba(34,197,94,0.1)' : 'rgba(250,204,21,0.1)',
                        border: `1px solid rgba(${fhirStatus.includes('✓') ? '34,197,94' : '250,204,21'},0.3)`,
                        color: fhirStatus.includes('✓') ? '#86efac' : '#fef08a',
                        padding: '12px',
                        borderRadius: '6px',
                        marginBottom: '16px',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <span>🔄</span> {fhirStatus}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ color: '#fff', fontSize: '14px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>
                            Appointment Title
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder={`Default: Appointment with Dr. ${doctorName}`}
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
                        />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ color: '#fff', fontSize: '14px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>
                            Reason for Visit
                        </label>
                        <textarea
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            required
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '6px',
                                color: '#fff',
                                fontSize: '14px',
                                minHeight: '80px',
                                fontFamily: 'inherit',
                                boxSizing: 'border-box'
                            }}
                            placeholder="Describe your reason for the appointment..."
                        />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ color: '#fff', fontSize: '14px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>
                            Date & Time
                        </label>
                        <input
                            type="datetime-local"
                            value={formData.scheduled_at}
                            onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                            required
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
                            {loading ? 'Scheduling...' : 'Schedule Appointment'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
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
>>>>>>> b381c81bab0b6500d6e25aa0d8e664d8397d0550
            </motion.div>
        </div>
    );
};

export default AppointmentModal;
