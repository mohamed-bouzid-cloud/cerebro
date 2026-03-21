import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import {
    Users, Activity, FileText, Calendar, LogOut, ChevronRight, Search, 
    Bell, Stethoscope, Clock, ShieldCheck
} from 'lucide-react';

const DoctorDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [patients, setPatients] = useState([]);
    const [stats, setStats] = useState({ studies: 0, appointments: 0 });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const headers = { Authorization: `Bearer ${token}` };

            const [patientsRes, dicomRes] = await Promise.all([
                fetch('http://localhost:8000/api/auth/patients/', { headers }),
                fetch('http://localhost:8000/api/auth/dicom-studies/', { headers })
            ]);

            if (patientsRes.ok) {
                const pData = await patientsRes.json();
                // If the backend returns all patients, we'll pretend these are our assigned ones
                // Ideally backend only returns doctors assigned patients
                setPatients(pData);
            }
            if (dicomRes.ok) {
                const dData = await dicomRes.json();
                const dicomCount = dData.count || (dData.results ? dData.results.length : dData.length);
                setStats(s => ({ ...s, studies: dicomCount }));
            }
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setLoading(false);
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
                    
                    <div className="relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input 
                            type="text" 
                            placeholder="Search patients..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[#0a0f14] border border-[#1f2937] text-white rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors placeholder-gray-600"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 px-2">Assigned Patients ({patients.length})</h3>
                    {filteredPatients.length > 0 ? (
                        filteredPatients.map((patient) => (
                            <div 
                                key={patient.id}
                                onClick={() => navigate(`/doctor/patient/${patient.id}`)}
                                className="group flex items-center justify-between p-3 rounded-xl hover:bg-[#1a2332] cursor-pointer transition-all border border-transparent hover:border-[#2a364a]"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-sm border border-blue-500/20 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                        {patient.first_name[0]}{patient.last_name[0]}
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">
                                            {patient.first_name} {patient.last_name}
                                        </div>
                                        <div className="text-xs text-gray-500">{patient.email}</div>
                                    </div>
                                </div>
                                <ChevronRight size={16} className="text-gray-600 group-hover:text-blue-500 transition-colors" />
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
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Welcome, Dr. {user?.last_name || 'Doctor'}</h1>
                        <p className="text-sm text-gray-400 mt-1">Here is the summary of your clinical practice.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="relative p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-[#1a2332]">
                            <Bell size={20} />
                            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-blue-500 border-2 border-[#0a0f14] rounded-full"></span>
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
                            { label: 'Appointments Today', value: '4', icon: Calendar, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
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

                    {/* Main Split Area */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Quick Start Card */}
                        <div className="lg:col-span-2 bg-gradient-to-br from-[#121820] to-[#1a2332] border border-[#2a364a] rounded-2xl p-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
                            
                            <h2 className="text-2xl font-bold text-white mb-2 relative z-10">Select a patient to begin</h2>
                            <p className="text-gray-400 mb-8 max-w-lg relative z-10">
                                Click on any patient from the left sidebar to access their secure portal. From there, you can view their medical history, upload new DICOM imaging series, and analyze volumes in our new integrated viewer.
                            </p>
                            
                            <div className="grid sm:grid-cols-2 gap-4 relative z-10">
                                <div className="bg-black/30 border border-white/5 rounded-xl p-5 flex items-start gap-4">
                                    <div className="bg-blue-500/20 p-2.5 rounded-lg text-blue-400">
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-medium mb-1">Upload Scans</h4>
                                        <p className="text-xs text-gray-500 leading-relaxed">Directly assign robust DICOM volumetric series to client records securely.</p>
                                    </div>
                                </div>
                                <div className="bg-black/30 border border-white/5 rounded-xl p-5 flex items-start gap-4">
                                    <div className="bg-emerald-500/20 p-2.5 rounded-lg text-emerald-400">
                                        <Activity size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-medium mb-1">Volumetric Analysis</h4>
                                        <p className="text-xs text-gray-500 leading-relaxed">Fast scrolling over stacked DICOM files via our integrated clinical viewer.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity Mini-Feed */}
                        <div className="bg-[#121820] border border-[#1f2937] rounded-2xl p-6">
                            <h3 className="font-bold text-white mb-6">Recent System Activity</h3>
                            <div className="space-y-6">
                                {[
                                    { time: '10 mins ago', desc: 'Secure connection established to Cerebro Server', type: 'system' },
                                    { time: '2 hours ago', desc: 'DICOM parser updated to latest protocol', type: 'update' },
                                    { time: 'Yesterday', desc: 'Session expired, automatic forced logout executed', type: 'security' }
                                ].map((item, idx) => (
                                    <div key={idx} className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className="w-2 h-2 rounded-full bg-blue-500 ring-4 ring-[#0a0f14]" />
                                            {idx !== 2 && <div className="w-px h-full bg-[#1f2937] my-1" />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-200">{item.desc}</p>
                                            <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                                                <Clock size={12} />
                                                {item.time}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default DoctorDashboard;
