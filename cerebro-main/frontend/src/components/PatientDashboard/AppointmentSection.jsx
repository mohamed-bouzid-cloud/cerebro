import React, { useState } from 'react';
<<<<<<< HEAD
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar, Clock, MapPin, Plus, LayoutGrid, List, ArrowRight,
    CheckCircle2, Stethoscope, Activity, Microscope, AlertTriangle,
    TrendingUp, Shield, ChevronRight, Phone, Mail, Building2, Zap,
    Video, VideoOff, Mic, MicOff, X, Maximize2, Minimize2, Loader2
} from 'lucide-react';
import AppointmentCalendar from '../AppointmentCalendar';
import AppointmentModal from '../AppointmentModal';

// ── DEMO DATA (remove when backend is live) ─────────────────────────────────
const getDemoAppointments = () => {
    const now = Date.now();
    const todayAt = (h, m) => {
        const d = new Date();
        d.setHours(h, m, 0, 0);
        return d.toISOString();
    };
    return [
        {
            id: 'd0',
            doctor_name: 'James Okafor',
            appointment_type: 'Consultation',
            scheduled_at: todayAt(9, 0),
            duration_minutes: 30,
            status: 'scheduled',
            is_virtual: true,
            location_room: 'Virtual Room 04',
            notes: 'Routine cardiology follow-up. ECG results will be reviewed.',
        },
        {
            id: 'd0b',
            doctor_name: 'Yasmine Larbi',
            appointment_type: 'Lab Test',
            scheduled_at: todayAt(14, 30),
            duration_minutes: 20,
            status: 'scheduled',
            is_virtual: false,
            location_room: 'Lab Unit A-12',
            notes: 'Complete blood count + lipid panel. Fasting required.',
        },
        {
            id: 'd1',
            doctor_name: 'Sarah Chen',
            appointment_type: 'Consultation',
            scheduled_at: new Date(now + 2 * 86400000).toISOString(),
            duration_minutes: 30,
            status: 'scheduled',
            is_virtual: true,
            location_room: 'Virtual Room 02',
            notes: 'Follow-up on hypertension management. Bring latest blood pressure readings.',
        },
        {
            id: 'd2',
            doctor_name: 'Marco Ferretti',
            appointment_type: 'Imaging',
            scheduled_at: new Date(now + 7 * 86400000).toISOString(),
            duration_minutes: 45,
            status: 'scheduled',
            is_virtual: false,
            location_room: 'Radiology Wing B',
            notes: 'Thoracic MRI — no food 4h before.',
        },
        {
            id: 'd3',
            doctor_name: 'Amina Khalil',
            doctor_name: 'Yasmine Larbi',
            appointment_type: 'Lab Test',
            scheduled_at: new Date(now + 14 * 86400000).toISOString(),
            duration_minutes: 15,
            status: 'scheduled',
            is_virtual: false,
            location_room: 'Phlebotomy Unit',
            notes: '',
        },
        {
            id: 'd4',
            doctor_name: 'James Okafor',
            appointment_type: 'Consultation',
            scheduled_at: new Date(now - 10 * 86400000).toISOString(),
            duration_minutes: 30,
            status: 'completed',
            is_virtual: false,
            location_room: 'Office 402',
            notes: 'Annual check-up. All results within normal range.',
        },
        {
            id: 'd5',
            doctor_name: 'Sarah Chen',
            appointment_type: 'Consultation',
            scheduled_at: new Date(now - 30 * 86400000).toISOString(),
            duration_minutes: 30,
            status: 'completed',
            is_virtual: false,
            location_room: 'Office 405',
            notes: 'Initial hypertension diagnosis.',
        },
        {
            id: 'd6',
            doctor_name: 'Marco Ferretti',
            appointment_type: 'Imaging',
            scheduled_at: new Date(now - 60 * 86400000).toISOString(),
            duration_minutes: 60,
            status: 'cancelled',
            is_virtual: false,
            location_room: 'Radiology Wing B',
            notes: '',
        },
    ];
};

const PREP_PROTOCOLS = {
    'Consultation': [
        'List of current medications',
        'Last 3 vitals readings',
        'Identify 2 priority health questions'
    ],
    'Lab Test': [
        'Fasting (at least 8 hours)',
        'Hydrate with water only',
        'Avoid caffeine 2 hours before'
    ],
    'Imaging': [
        'Metallic objects removed',
        'Comfortable loose clothing',
        'No jewelry or watches'
    ]
};
// ────────────────────────────────────────────────────────────────────────────

const AppointmentSection = ({ appointments, patientId, onRefresh, compact = false }) => {
    const [viewMode, setViewMode] = useState('overview');
    const [historyFilter, setHistoryFilter] = useState('upcoming');
    const [showBookingModal, setShowBookingModal] = useState(false);
    
    // Interactive States
    const [checkedSteps, setCheckedSteps] = useState(new Set());
    const [checkedIn, setCheckedIn] = useState(new Set());
    const [isConnecting, setIsConnecting] = useState(false);
    const [showVideoRoom, setShowVideoRoom] = useState(false);

    // Merge real appointments from backend with demo appointments for a populated dashboard
    const allAppointments = [
        ...(appointments || []),
        ...getDemoAppointments()
    ];

    const now = new Date();
    const todayApts = allAppointments
        .filter(a => new Date(a.scheduled_at).toDateString() === now.toDateString() && a.status !== 'cancelled')
        .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));

    const upcoming = allAppointments
        .filter(a => new Date(a.scheduled_at) >= now)
        .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
    const past = allAppointments
        .filter(a => new Date(a.scheduled_at) < now)
        .sort((a, b) => new Date(b.scheduled_at) - new Date(a.scheduled_at));

    const nextApt = upcoming[0] || null;
    const completedCount = past.filter(a => a.status === 'completed').length;
    const cancelledCount = past.filter(a => a.status === 'cancelled').length;

    /* ─── Helper: toggle protocol step ─── */
    const toggleStep = (step) => {
        const newChecked = new Set(checkedSteps);
        if (newChecked.has(step)) newChecked.delete(step);
        else newChecked.add(step);
        setCheckedSteps(newChecked);
    };

    /* ─── Helper: toggle check-in status ─── */
    const toggleCheckIn = (id) => {
        const newChecked = new Set(checkedIn);
        if (newChecked.has(id)) newChecked.delete(id);
        else newChecked.add(id);
        setCheckedIn(newChecked);
    };

    /* ─── Helper: handle telehealth connection ─── */
    const handleConnect = () => {
        setIsConnecting(true);
        setTimeout(() => {
            setIsConnecting(false);
            setShowVideoRoom(true);
        }, 2000);
    };

    /* ─── Helper: time until next appointment ─── */
    const getCountdown = (dateStr) => {
        const diff = new Date(dateStr) - now;
        const days = Math.floor(diff / 86400000);
        const hours = Math.floor((diff % 86400000) / 3600000);
        if (days > 0) return { value: days, unit: days === 1 ? 'day' : 'days' };
        if (hours > 0) return { value: hours, unit: hours === 1 ? 'hour' : 'hours' };
        return { value: 'Soon', unit: '' };
    };

    /* ─── Inner Component: Telehealth Room Modal ─── */
    const TelehealthRoom = ({ doctorName, onExit }) => {
        const [isMuted, setIsMuted] = useState(false);
        const [isVideoOff, setIsVideoOff] = useState(false);
        const [elapsed, setElapsed] = useState(0);

        React.useEffect(() => {
            const timer = setInterval(() => setElapsed(e => e + 1), 1000);
            return () => clearInterval(timer);
        }, []);

        const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

        return (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-4 md:p-8"
            >
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 z-10" />
                    <img 
                        src="https://images.unsplash.com/photo-1559839734-2b71f1536b1a?auto=format&fit=crop&q=80&w=2000" 
                        alt="Doctor's office" 
                        className="w-full h-full object-cover opacity-30 blur-sm scale-110"
                    />
                </div>

                <div className="relative z-20 w-full h-full flex flex-col justify-between max-w-7xl mx-auto">
                    {/* Top Bar */}
                    <div className="flex items-center justify-between p-4 glass-card rim-light !bg-white/5 border-white/10 rounded-2xl">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                                <Stethoscope size={20} />
                            </div>
                            <div>
                                <h2 className="text-white font-black text-sm m-0">Dr. {doctorName}</h2>
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">En direct • Sécurisé</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-8">
                            <div className="text-center">
                                <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Durée</p>
                                <p className="text-sm font-black text-white tabular-nums">{formatTime(elapsed)}</p>
                            </div>
                            <div className="w-px h-8 bg-white/10" />
                            <div className="text-center">
                                <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Signal</p>
                                <div className="flex items-end gap-1 h-3">
                                    {[1, 2, 3, 4].map(i => <div key={i} className={`w-1 h-${i} rounded-full bg-blue-400`} />)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Participant Grid (Simulated) */}
                    <div className="flex-1 flex items-center justify-center">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white/5 border border-white/10 rounded-3xl p-12 flex flex-col items-center gap-4 text-center max-w-md backdrop-blur-xl"
                        >
                            <div className="w-24 h-24 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-2">
                                <Video size={40} className="text-blue-500/40" />
                            </div>
                            <h3 className="text-white text-xl font-black">Waiting for Practitioner...</h3>
                            <p className="text-gray-400 text-xs font-bold px-6 leading-relaxed">
                                Dr. {doctorName} has been notified of your arrival. Please stay on the line.
                            </p>
                            <div className="flex gap-2 mt-4">
                                <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0s' }} />
                                <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0.2s' }} />
                                <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0.4s' }} />
                            </div>
                        </motion.div>
                    </div>

                    {/* Controls Footer */}
                    <div className="flex items-center justify-center gap-6 pb-8">
                        <button 
                            onClick={() => setIsMuted(!isMuted)}
                            className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all border ${
                                isMuted ? 'bg-rose-500 border-rose-400 shadow-lg shadow-rose-500/20' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                            }`}
                        >
                            {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                        </button>
                        <button 
                            onClick={() => setIsVideoOff(!isVideoOff)}
                            className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all border ${
                                isVideoOff ? 'bg-rose-500 border-rose-400 shadow-lg shadow-rose-500/20' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                            }`}
                        >
                            {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
                        </button>
                        <button 
                            onClick={onExit}
                            className="px-10 h-16 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center gap-3 transition-all shadow-xl shadow-rose-600/30"
                        >
                            <X size={20} /> End Session
                        </button>
                    </div>

                    {/* User Preview */}
                    <div className="absolute right-4 bottom-32 w-56 h-36 rounded-3xl overflow-hidden glass-card rim-light border-white/20 shadow-2xl">
                        <div className="absolute inset-0 bg-gray-900/90 flex flex-col items-center justify-center gap-2">
                            {isVideoOff ? (
                                <VideoOff className="text-gray-700" size={32} />
                            ) : (
                                <div className="w-full h-full bg-blue-500/10 flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping" />
                                </div>
                            )}
                        </div>
                        <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/60 rounded-lg backdrop-blur-md">
                            <span className="text-[9px] font-black text-white uppercase tracking-widest">You (Local)</span>
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    };

    /* ─── Shared appointment card component ─── */
    const AppointmentCard = ({ apt, i }) => {
        const isPast = new Date(apt.scheduled_at) < now;
        const isToday = new Date(apt.scheduled_at).toDateString() === now.toDateString();
        return (
            <motion.div
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="glass-card rim-light p-5 flex flex-col md:flex-row justify-between items-center group relative overflow-hidden gap-5"
                style={{ opacity: isPast ? 0.75 : 1 }}
            >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex gap-5 items-center relative z-10 flex-1 w-full">
                    <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black shrink-0 shadow-inner border ${
                        isPast ? 'bg-white/[0.03] border-white/5 text-gray-600' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                    }`}>
                        <span className="text-lg leading-none">{new Date(apt.scheduled_at).getDate()}</span>
                        <span className="text-[9px] uppercase tracking-widest opacity-70 mt-0.5">{new Date(apt.scheduled_at).toLocaleString('default', { month: 'short' })}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-white font-black text-sm m-0 truncate">Dr. {apt.doctor_name}</h4>
                            <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/15 rounded text-[8px] font-black text-blue-400 uppercase tracking-tight">{apt.appointment_type}</span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                            <span className="text-gray-500 text-[10px] font-bold flex items-center gap-1"><Clock size={10} /> {new Date(apt.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                            <span className="text-gray-500 text-[10px] font-bold flex items-center gap-1"><MapPin size={10} /> {apt.is_virtual ? 'Virtual Room' : apt.location_room}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3 relative z-10 justify-end">
                    {apt.is_virtual && isToday && (
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                handleConnect();
                            }}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20"
                        >
                            Join Call
                        </button>
                    )}
                    {!apt.is_virtual && isToday && apt.status === 'scheduled' && (
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleCheckIn(apt.id);
                            }}
                            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                                checkedIn.has(apt.id)
                                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                                : 'bg-blue-600/10 hover:bg-blue-600/20 border border-blue-600/20 text-blue-400'
                            }`}
                        >
                            {checkedIn.has(apt.id) ? 'Arrived' : 'Check-in'}
                        </button>
                    )}
                    <span className={`px-3 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest border ${
                        checkedIn.has(apt.id) ? 'bg-emerald-600/10 text-emerald-400 border-emerald-600/20' :
                        apt.status === 'scheduled' ? 'bg-blue-600/10 text-blue-400 border-blue-600/20' : 
                        'bg-emerald-600/10 text-emerald-400 border-emerald-600/20'
                    }`}>
                        {checkedIn.has(apt.id) ? 'arrived' : apt.status}
                    </span>
                </div>
            </motion.div>
        );
    };

    return (
        <div className="space-y-8">
            {/* Header Action Bar */}
            {!compact && (
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex glass-card rim-light p-1 w-fit">
                        {[{ id: 'overview', icon: List, label: 'Briefing' }, { id: 'calendar', icon: LayoutGrid, label: 'Schedule' }].map(({ id, icon: Icon, label }) => (
                            <button key={id} onClick={() => setViewMode(id)} className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === id ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>
                                <Icon size={13} /> {label}
                            </button>
                        ))}
                    </div>
                    <button onClick={() => setShowBookingModal(true)} className="flex items-center gap-2 holographic-btn text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest">
                        <Plus size={16} /> Book Next Session
                    </button>
                </div>
            )}

            <AnimatePresence mode="wait">
                {viewMode === 'overview' && (
                    <motion.div key="overview" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="space-y-8">
                        {/* KPI Metrics */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {[
                                { label: 'Prochains', value: upcoming.length, color: 'blue', icon: Calendar, glow: 'glow-blue' },
                                { label: 'Terminés', value: completedCount, color: 'emerald', icon: CheckCircle2, glow: 'glow-emerald' },
                                { label: 'Annulés', value: cancelledCount, color: 'rose', icon: AlertTriangle, glow: 'glow-purple' },
                                { label: 'Total', value: allAppointments.length, color: 'indigo', icon: Activity, glow: 'glow-blue' },
                            ].map(({ label, value, color, icon: Icon, glow }) => (
                                <motion.div 
                                    key={label} 
                                    whileHover={{ y: -8, scale: 1.02 }}
                                    className={`quantum-glass p-6 flex flex-col items-start gap-4 transition-all relative group cursor-default overflow-hidden rounded-[24px] ${glow}`}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className={`w-12 h-12 rounded-2xl bg-${color}-500/20 border border-${color}-500/30 flex items-center justify-center text-${color}-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]`}><Icon size={24} /></div>
                                    <div>
                                        <p className="text-3xl font-black text-white leading-none tracking-tight text-glow">{value}</p>
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-2 opacity-70 group-hover:opacity-100 transition-all">{label}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                        
                        {/* ── Today's Clinical Agenda ── */}
                        {todayApts.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="quantum-glass volumetric-shadow p-6 relative overflow-hidden rounded-[32px] glow-emerald border-emerald-500/20"
                            >
                                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] -mr-32 -mt-32" />
                                
                                <div className="flex items-center justify-between mb-6 relative z-10">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">Today's Clinical Journey</span>
                                    </div>
                                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{now.toLocaleDateString('default', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
                                    {todayApts.map((apt, idx) => {
                                        const isArrived = checkedIn.has(apt.id);
                                        const progress = isArrived ? 66 : 33; // Simulated progress
                                        
                                        return (
                                            <div key={apt.id} className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 group hover:bg-white/[0.05] transition-all">
                                                <div className="flex items-center justify-between mb-4">
                                                    <span className="text-sm font-black text-white">{new Date(apt.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tight ${
                                                        isArrived ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                                    }`}>
                                                        {isArrived ? 'Arrived • Processing' : 'Confirmed'}
                                                    </span>
                                                </div>
                                                
                                                <h4 className="text-xs font-bold text-gray-300 mb-1">Dr. {apt.doctor_name}</h4>
                                                <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mb-4">{apt.appointment_type}</p>
                                                
                                                <div className="space-y-3">
                                                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                                        <motion.div 
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${progress}%` }}
                                                            className={`h-full ${isArrived ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-blue-500'}`}
                                                        />
                                                    </div>
                                                    
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-1.5">
                                                            <div className={`w-1.5 h-1.5 rounded-full ${isArrived ? 'bg-emerald-500' : 'bg-white/10'}`} />
                                                            <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">{isArrived ? 'On deck' : 'Upcoming'}</span>
                                                        </div>
                                                        {!isArrived && !apt.is_virtual && (
                                                            <button 
                                                                onClick={() => toggleCheckIn(apt.id)}
                                                                className="text-[9px] font-black text-blue-400 hover:text-blue-300 uppercase tracking-widest flex items-center gap-1"
                                                            >
                                                                Check-in <ArrowRight size={10} />
                                                            </button>
                                                        )}
                                                        {apt.is_virtual && (
                                                            <button 
                                                                onClick={handleConnect}
                                                                className="text-[9px] font-black text-blue-400 hover:text-blue-300 uppercase tracking-widest flex items-center gap-1"
                                                            >
                                                                Launch Session <Zap size={10} fill="currentColor" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}

                        {/* 14-Day Timeline */}
                        {!compact && (
                            <div className="glass-card p-6 volumetric-shadow">
                                <div className="flex items-center justify-between mb-5">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] opacity-60">Clinical Calendar — Next 14 Days</span>
                                    <button onClick={() => setViewMode('calendar')} className="text-[9px] font-black text-blue-400 uppercase tracking-widest hover:text-white transition-colors">Full View</button>
                                </div>
                                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar" style={{ scrollbarWidth: 'none' }}>
                                    {Array.from({ length: 14 }).map((_, i) => {
                                        const d = new Date(now); d.setDate(now.getDate() + i);
                                        const apts = allAppointments.filter(a => new Date(a.scheduled_at).toDateString() === d.toDateString());
                                        const isToday = i === 0;
                                        
                                        const hasConsult = apts.some(a => a.appointment_type === 'Consultation');
                                        const hasLab = apts.some(a => a.appointment_type === 'Lab Test');
                                        const hasImaging = apts.some(a => a.appointment_type === 'Imaging');

                                        return (
                                            <motion.div 
                                                key={i} 
                                                whileHover={{ y: -5, scale: 1.05 }}
                                                className={`shrink-0 w-20 p-3 rounded-2xl flex flex-col items-center border transition-all cursor-pointer relative group/day ${isToday ? 'bg-blue-600/20 border-blue-500/40 glow-blue' : 'bg-white/[0.03] border-white/5'}`}
                                            >
                                                <span className={`text-[8px] font-black uppercase ${isToday ? 'text-blue-400' : 'text-gray-500'}`}>{d.toLocaleDateString('default', { weekday: 'short' })}</span>
                                                <span className="text-xl font-black text-white mt-1">{d.getDate()}</span>
                                                
                                                <div className="flex flex-col gap-1 mt-2 w-full px-1">
                                                    {hasConsult && (
                                                        <div className="w-full py-0.5 bg-blue-500/20 border border-blue-500/30 rounded flex items-center justify-center shadow-[0_0_8px_rgba(59,130,246,0.2)]">
                                                            <span className="text-[7px] font-black text-blue-400 uppercase tracking-tighter">Consult</span>
                                                        </div>
                                                    )}
                                                    {hasLab && (
                                                        <div className="w-full py-0.5 bg-emerald-500/20 border border-emerald-500/30 rounded flex items-center justify-center shadow-[0_0_8px_rgba(16,185,129,0.2)]">
                                                            <span className="text-[7px] font-black text-emerald-400 uppercase tracking-tighter">Lab</span>
                                                        </div>
                                                    )}
                                                    {hasImaging && (
                                                        <div className="w-full py-0.5 bg-rose-500/20 border border-rose-500/30 rounded flex items-center justify-center shadow-[0_0_8px_rgba(244,63,94,0.2)]">
                                                            <span className="text-[7px] font-black text-rose-400 uppercase tracking-tighter">Imaging</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {apts.length > 0 && (
                                                    <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 group-hover/day:opacity-100 transition-opacity pointer-events-none z-[110]">
                                                        <div className="glass-panel p-2 rounded-lg border border-white/10 shadow-2xl min-w-[140px]">
                                                            {apts.map(apt => (
                                                                <div key={apt.id} className="text-[8px] font-black uppercase tracking-tighter text-gray-300 py-1 border-b border-white/5 last:border-0 flex items-center justify-between gap-3">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <div className={`w-1 h-1 rounded-full ${apt.appointment_type === 'Lab Test' ? 'bg-emerald-500' : apt.appointment_type === 'Imaging' ? 'bg-rose-500' : 'bg-blue-500'}`} />
                                                                        {apt.appointment_type}
                                                                    </div>
                                                                    <span className="text-gray-500 font-bold">{new Date(apt.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Hero Section */}
                        <div className={`grid grid-cols-1 ${compact ? '' : 'xl:grid-cols-3'} gap-8`}>
                            <div className={`${compact ? 'w-full' : 'xl:col-span-2'} space-y-6`}>
                                {nextApt ? (
                                    <motion.div 
                                        whileHover={{ scale: 1.01 }}
                                        className="quantum-glass volumetric-shadow p-10 relative overflow-hidden group rounded-[40px] animate-floating"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-purple-600/5 opacity-50" />
                                        <div className="flex flex-col md:flex-row gap-8 relative z-10">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-6">
                                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                                                    <span className="text-[9px] font-black text-blue-400 uppercase tracking-[0.3em]">Next Session Intensity</span>
                                                </div>
                                                <div className="flex items-center gap-6 mb-8">
                                                    <div className="w-20 h-20 rounded-2xl bg-blue-600/20 border border-blue-500/20 flex flex-col items-center justify-center font-black text-blue-400">
                                                        <span className="text-3xl">{new Date(nextApt.scheduled_at).getDate()}</span>
                                                        <span className="text-[9px] uppercase">{new Date(nextApt.scheduled_at).toLocaleString('default', { month: 'short' })}</span>
                                                    </div>
                                                    <div>
                                                        <h3 className="text-2xl font-black text-white mb-2">Dr. {nextApt.doctor_name}</h3>
                                                        <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[9px] font-black text-emerald-400 uppercase tracking-widest">{nextApt.appointment_type} {nextApt.is_virtual && '• Virtual'}</span>
                                                    </div>
                                                </div>

                                                {/* CTA Button */}
                                                {nextApt.is_virtual && new Date(nextApt.scheduled_at).toDateString() === now.toDateString() && (
                                                    <button 
                                                        onClick={handleConnect}
                                                        disabled={isConnecting}
                                                        className={`w-full mb-8 py-5 rounded-3xl font-black text-sm uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-4 ${isConnecting ? 'bg-indigo-900/40 opacity-50' : 'holographic-btn glow-blue text-white'}`}
                                                    >
                                                        {isConnecting ? <><Loader2 className="animate-spin" size={20} /> Initializing Link...</> : <><Zap size={20} fill="currentColor" /> Enter Consultation Room</>}
                                                    </button>
                                                )}

                                                {/* Checklist */}
                                                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                                    <div className="flex items-center gap-2 mb-4">
                                                        <CheckCircle2 size={14} className="text-blue-400" />
                                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Protocol Preparation</span>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {(PREP_PROTOCOLS[nextApt.appointment_type] || PREP_PROTOCOLS['Consultation']).map((step, idx) => {
                                                            const isChecked = checkedSteps.has(step);
                                                            return (
                                                                <button key={idx} onClick={() => toggleStep(step)} className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${isChecked ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-white/5 border-white/5 text-gray-400'}`}>
                                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${isChecked ? 'bg-emerald-500 border-emerald-500' : 'border-white/20'}`}>{isChecked && <X size={10} className="text-white" />}</div>
                                                                    <span className={`text-xs font-bold ${isChecked ? 'line-through opacity-50' : ''}`}>{step}</span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Countdown */}
                                            <div className="shrink-0 flex flex-col items-center justify-center">
                                                <div className="w-24 h-24 rounded-3xl bg-indigo-600/10 border border-indigo-500/20 flex flex-col items-center justify-center shadow-inner">
                                                    <span className="text-3xl font-black text-indigo-300">{getCountdown(nextApt.scheduled_at).value}</span>
                                                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">{getCountdown(nextApt.scheduled_at).unit}</span>
                                                </div>
                                                <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mt-3">Countdown</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : null}

                                {/* History/Queue Toggle & List (Hidden in compact) */}
                                {!compact && (
                                    <>
                                        <div className="flex gap-4">
                                            {[{ id: 'upcoming', label: 'Prochains', icon: TrendingUp }, { id: 'past', label: 'Historique', icon: Clock }].map(({ id, label, icon: Icon }) => (
                                                <button key={id} onClick={() => setHistoryFilter(id)} className={`flex-1 p-4 rounded-2xl border flex items-center justify-between transition-all ${historyFilter === id ? 'bg-blue-600/10 border-blue-500/20 text-blue-400' : 'bg-white/5 border-white/5 text-gray-500'}`}>
                                                    <div className="flex items-center gap-3"><Icon size={16} /><span className="text-xs font-black uppercase tracking-widest">{label}</span></div>
                                                    <span className="text-lg font-black">{id === 'upcoming' ? upcoming.length : past.length}</span>
                                                </button>
                                            ))}
                                        </div>

                                        <div className="space-y-3">
                                            {(historyFilter === 'upcoming' ? upcoming : past).slice(0, 5).map((apt, i) => <AppointmentCard key={apt.id} apt={apt} i={i} />)}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Sidebar Info (Hidden in compact) */}
                            {!compact && (
                                <div className="xl:col-span-1 space-y-5">
                                    <div className="glass-card p-6">
                                        <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Clinic Information</h3>
                                        <div className="space-y-4">
                                            {[
                                                { icon: Building2, label: 'Cerebro Health Center', sub: 'Wing B, Floor 4' },
                                                { icon: Phone, label: '+1 (555) 012-3456', sub: 'Urgent Line 24/7' },
                                                { icon: Mail, label: 'care@cerebro.plus', sub: 'Response < 2h' }
                                            ].map(({ icon: Icon, label, sub }) => (
                                                <div key={label} className="flex gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0"><Icon size={16} className="text-gray-400" /></div>
                                                    <div><p className="text-[11px] font-black text-white">{label}</p><p className="text-[9px] font-bold text-gray-600">{sub}</p></div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
                {viewMode === 'calendar' && (
                    <motion.div key="calendar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="glass-card p-8">
                        <AppointmentCalendar patientId={patientId} isDoctor={false} />
                    </motion.div>
                )}
            </AnimatePresence>

            <AppointmentModal 
                isOpen={showBookingModal} 
                onClose={() => setShowBookingModal(false)} 
                patientId={patientId}
                onSuccess={onRefresh}
            />
            
            <AnimatePresence>
                {showVideoRoom && <TelehealthRoom doctorName={nextApt?.doctor_name} onExit={() => setShowVideoRoom(false)} />}
            </AnimatePresence>
=======
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, User, CheckCircle, XCircle } from 'lucide-react';

const AppointmentSection = ({ appointments }) => {
    const [view, setView] = useState('upcoming');
    const now = new Date();

    const upcoming = appointments.filter(a => new Date(a.scheduled_at) >= now).sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
    const past = appointments.filter(a => new Date(a.scheduled_at) < now).sort((a, b) => new Date(b.scheduled_at) - new Date(a.scheduled_at));

    const AppointmentCard = ({ apt, isPast }) => (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '16px',
                padding: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                opacity: isPast ? 0.7 : 1
            }}
        >
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <div style={{
                    width: '64px',
                    height: '64px',
                    background: isPast ? 'rgba(255,255,255,0.05)' : 'rgba(59,130,246,0.1)',
                    borderRadius: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isPast ? '#888' : '#3b82f6'
                }}>
                    <span style={{ fontSize: '18px', fontWeight: 800 }}>{new Date(apt.scheduled_at).getDate()}</span>
                    <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}>
                        {new Date(apt.scheduled_at).toLocaleString('default', { month: 'short' })}
                    </span>
                </div>
                <div>
                    <h4 style={{ color: '#fff', fontSize: '17px', fontWeight: 600, margin: 0 }}>Dr. {apt.doctor_name}</h4>
                    <p style={{ color: '#3b82f6', fontSize: '13px', margin: '2px 0 0 0', fontWeight: 500 }}>{apt.doctor_specialty || 'General Practitioner'}</p>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                        <span style={{ color: '#888', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} /> {new Date(apt.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span style={{ color: '#888', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={12} /> Main Clinic, Suite 402
                        </span>
                    </div>
                </div>
            </div>

            <div style={{ textAlign: 'right' }}>
                <span style={{
                    background: apt.status === 'scheduled' ? 'rgba(59,130,246,0.1)' : apt.status === 'completed' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                    color: apt.status === 'scheduled' ? '#3b82f6' : apt.status === 'completed' ? '#10b981' : '#ef4444',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                }}>
                    {apt.status}
                </span>
                {isPast && apt.status === 'completed' && (
                    <p style={{ color: '#666', fontSize: '11px', margin: '8px 0 0 0', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                        <CheckCircle size={12} /> Summary Available
                    </p>
                )}
            </div>
        </motion.div>
    );

    return (
        <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '12px', width: 'fit-content' }}>
                {['upcoming', 'past'].map(t => (
                    <button
                        key={t}
                        onClick={() => setView(t)}
                        style={{
                            background: view === t ? '#3b82f6' : 'transparent',
                            color: view === t ? '#fff' : '#888',
                            border: 'none',
                            padding: '8px 20px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 600,
                            transition: 'all 0.2s',
                            textTransform: 'capitalize'
                        }}
                    >
                        {t}
                    </button>
                ))}
            </div>

            <div style={{ display: 'grid', gap: '16px' }}>
                {view === 'upcoming' ? (
                    upcoming.length > 0 ? upcoming.map((a, i) => <AppointmentCard key={i} apt={a} isPast={false} />) : <p style={{ color: '#888', textAlign: 'center', padding: '40px' }}>No upcoming appointments found.</p>
                ) : (
                    past.length > 0 ? past.map((a, i) => <AppointmentCard key={i} apt={a} isPast={true} />) : <p style={{ color: '#888', textAlign: 'center', padding: '40px' }}>No past appointments recorded.</p>
                )}
            </div>
>>>>>>> b381c81bab0b6500d6e25aa0d8e664d8397d0550
        </div>
    );
};

export default AppointmentSection;
