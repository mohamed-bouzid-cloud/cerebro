import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { ChevronLeft, User, Calendar, Phone, Activity, FileText, Plus, ImageIcon, Upload, FlaskConical, ActivitySquare } from 'lucide-react';

const DoctorPatientPortal = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [patient, setPatient] = useState(null);
    const [studies, setStudies] = useState([]);
    const [labResults, setLabResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [localFolderPath, setLocalFolderPath] = useState('');
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchPatientData();
    }, [id]);

    const fetchPatientData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const headers = { Authorization: `Bearer ${token}` };

            // Fetch patient details (Assuming you have an endpoint for this, if not, we filter from /patients/)
            const patientsRes = await fetch('http://localhost:8000/api/auth/patients/', { headers });
            if (patientsRes.ok) {
                const patientsList = await patientsRes.json();
                const currentPatient = patientsList.find(p => p.id === parseInt(id));
                setPatient(currentPatient);
            }

            // Fetch studies and filter by patient
            const dicomRes = await fetch('http://localhost:8000/api/auth/dicom-studies/', { headers });
            if (dicomRes.ok) {
                const data = await dicomRes.json();
                const allStudies = data.results || data;
                // Since api might not filter by patient id directly from this endpoint in the dummy setup,
                // we'll filter client side for now.
                setStudies(allStudies.filter(s => s.patient === parseInt(id) || s.patient_name === patient?.first_name));
            }

            // Mock FHIR Lab Results
            const mockLabs = [
                { id: "lr-001", date: "2023-11-15", testName: "Complete Blood Count (CBC)", status: "final", isAbnormal: false, loinc: "58410-5" },
                { id: "lr-002", date: "2023-10-02", testName: "Lipid Panel", status: "final", isAbnormal: true, loinc: "24331-1" }
            ];
            setLabResults(mockLabs);
        } catch (error) {
            console.error("Failed to load patient data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUploadLocalStudy = async (e) => {
        e.preventDefault();
        if (!localFolderPath) return;
        setUploading(true);
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch('http://localhost:8000/api/auth/dicom-studies/upload-local/', {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({ patient_id: patient.id, folder_path: localFolderPath })
            });
            if (res.ok) {
                setLocalFolderPath('');
                setIsUploadModalOpen(false);
                fetchPatientData(); // Refresh studies
            } else {
                const errData = await res.json();
                alert(`Upload failed: ${errData.error || errData.detail || 'Unknown error'}`);
            }
        } catch (error) {
            console.error("Failed to link local study", error);
            alert("Network error.");
        } finally {
            setUploading(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-[#0f1419] flex items-center justify-center text-white">Loading Portal...</div>;
    if (!patient) return <div className="min-h-screen bg-[#0f1419] flex pt-20 justify-center text-white">Patient not found or access denied.</div>;

    return (
        <div className="min-h-screen bg-[#0f1419] text-gray-200 p-8 font-sans">
            {/* Navigation Header */}
            <div className="max-w-6xl mx-auto mb-8 flex items-center gap-4">
                <button 
                    onClick={() => navigate('/doctor-dashboard')}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                    <ChevronLeft size={20} />
                    Back to Dashboard
                </button>
            </div>

            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Column: Patient Profile Card */}
                <div className="lg:col-span-1 space-y-6">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-[#161d24] border border-white/5 rounded-2xl p-6 shadow-xl"
                    >
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center text-2xl font-bold shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                                {patient.first_name[0]}{patient.last_name[0]}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white tracking-wide">{patient.first_name} {patient.last_name}</h2>
                                <p className="text-cyan-500/50 font-mono text-xs uppercase tracking-widest mt-1">ID: PT-{patient.id}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-gray-300">
                                <User size={18} className="text-gray-500" />
                                <span>{patient.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-300">
                                <Phone size={18} className="text-gray-500" />
                                <span>{patient.phone || 'No phone recorded'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-300">
                                <Calendar size={18} className="text-gray-500" />
                                <span>Registered: {new Date(patient.date_joined || Date.now()).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Quick Stats */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="bg-[#161d24] border border-white/5 rounded-2xl p-6 shadow-xl"
                    >
                        <h3 className="text-lg font-semibold text-white mb-4">Patient Overview</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                                <Activity size={20} className="text-emerald-400 mb-2" />
                                <div className="text-2xl font-bold text-white">0</div>
                                <div className="text-xs text-gray-400">Active Prescriptions</div>
                            </div>
                            <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                                <FileText size={20} className="text-blue-400 mb-2" />
                                <div className="text-2xl font-bold text-white">{studies.length}</div>
                                <div className="text-xs text-gray-400">DICOM Studies</div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Right Column: Studies & Records */}
                <div className="lg:col-span-2 space-y-6">
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                        className="bg-[#161d24] border border-white/5 rounded-2xl p-6 shadow-xl"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2 tracking-wide">
                                <ImageIcon size={24} className="text-cyan-500" />
                                DICOM Studies
                            </h3>
                            <button 
                                onClick={() => setIsUploadModalOpen(true)}
                                className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-lg shadow-cyan-900/20"
                            >
                                <Upload size={16} />
                                Upload Study
                            </button>
                        </div>

                        {studies.length === 0 ? (
                            <div className="text-center py-12 bg-black/20 rounded-xl border border-dashed border-white/10">
                                <ImageIcon size={48} className="mx-auto text-gray-600 mb-4" />
                                <p className="text-gray-400">No DICOM studies found for this patient.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {studies.map((study, idx) => (
                                    <div key={idx} className="bg-black/30 border border-white/5 rounded-xl p-5 flex items-center justify-between hover:border-cyan-500/30 transition-all hover:bg-[#0a0f14]">
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 bg-cyan-900/20 border border-cyan-500/20 rounded-lg flex items-center justify-center text-cyan-400 font-bold tracking-wider shadow-inner">
                                                {study.modality || 'MRI'}
                                            </div>
                                            <div>
                                                <h4 className="text-white font-medium text-lg">{study.body_part || 'Brain Scan'}</h4>
                                                <div className="flex items-center gap-3 text-sm text-gray-400 mt-1">
                                                    <span>{study.study_date || new Date().toISOString().split('T')[0]}</span>
                                                    <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                                                    <span>ID: {study.study_id?.substring(0, 15)}...</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => navigate(`/doctor/dicom-viewer?study_id=${study.id}`)}
                                            className="px-5 py-2.5 bg-cyan-600/10 hover:bg-cyan-600 text-cyan-400 hover:text-white border border-cyan-500/20 rounded-lg font-bold text-[10px] uppercase tracking-[0.15em] transition-all shadow-md hover:shadow-cyan-500/20 flex items-center gap-2 group"
                                        >
                                            <ActivitySquare size={14} className="group-hover:animate-pulse" />
                                            Open Viewer
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>

                    {/* Labs Results using FHIR Mock */}
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
                        className="bg-[#161d24] border border-white/5 rounded-2xl p-6 shadow-xl"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <FlaskConical size={24} className="text-purple-500" />
                                Recent Lab Results (FHIR)
                            </h3>
                        </div>
                        {labResults.length === 0 ? (
                            <p className="text-gray-400">No lab results found in FHIR repository.</p>
                        ) : (
                            <div className="space-y-4">
                                {labResults.map((lab, idx) => (
                                    <div key={idx} className="bg-black/30 border border-white/5 rounded-xl p-5 flex items-center justify-between hover:border-purple-500/30 transition-colors">
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 bg-purple-900/40 rounded-lg flex items-center justify-center text-purple-400 font-bold tracking-wider">
                                                LAB
                                            </div>
                                            <div>
                                                <h4 className="text-white font-medium text-lg">{lab.testName}</h4>
                                                <div className="flex items-center gap-3 text-sm text-gray-400 mt-1">
                                                    <span>{lab.date}</span>
                                                    <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                                                    <span>LOINC: {lab.loinc}</span>
                                                    <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                                                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${lab.isAbnormal ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                                                        {lab.isAbnormal ? 'Abnormal' : 'Normal'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <button className="text-purple-400 hover:text-purple-300 transition-colors text-sm font-medium border border-purple-500/20 px-4 py-2 rounded-lg bg-purple-600/10 hover:bg-purple-600/20">
                                            View Report
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                </div>

            </div>

            {/* Upload Modal */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        className="bg-[#161d24] border border-[#2a364a] rounded-2xl p-6 w-full max-w-lg shadow-2xl"
                    >
                        <h2 className="text-xl font-bold text-white mb-2">Import Local DICOM Study</h2>
                        <p className="text-sm text-gray-400 mb-6">Enter the absolute local pathway to the folder on your workstation containing the DICOM files. The engine will read the headers directly from your disk.</p>
                        
                        <form onSubmit={handleUploadLocalStudy}>
                            <div className="mb-6">
                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Local Folder Path</label>
                                <input 
                                    type="text" 
                                    value={localFolderPath}
                                    onChange={(e) => setLocalFolderPath(e.target.value)}
                                    placeholder="e.g. C:\Users\Doctor\Downloads\patient_data"
                                    className="w-full bg-[#0a0f14] border border-[#2a364a] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors font-mono text-sm"
                                    required
                                />
                            </div>
                            
                            <div className="flex items-center justify-end gap-3">
                                <button 
                                    type="button" 
                                    onClick={() => setIsUploadModalOpen(false)}
                                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm font-medium"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={uploading}
                                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-blue-500/20"
                                >
                                    {uploading ? 'Scanning...' : 'Import Study'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default DoctorPatientPortal;
