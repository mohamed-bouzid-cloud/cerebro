import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar,
  FileText,
  Heart,
  Activity,
  Pill,
  AlertCircle,
  Microscope,
  Image,
  MoreVertical,
  ChevronRight,
  Clock,
  Zap
} from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { generateMockTimelineEvents } from '../mockData';

const getEventIcon = (type) => {
    const icons = {
      'appointment': <Calendar />, 'lab-result': <Microscope />, 'imaging-study': <Image />,
      'prescription': <Pill />, 'consultation-note': <FileText />, 'referral': <AlertCircle />,
      'vital-signs': <Activity />, 'admission': <Heart />, 'discharge': <Heart />
    };
    return icons[type] || <MoreVertical />;
  };

const getEventTheme = (type, isCritical) => {
    if (isCritical) return { color: '#f43f5e', shadow: 'rgba(244, 63, 94, 0.4)' };
    const themes = {
      'appointment': { color: '#3b82f6', shadow: 'rgba(59, 130, 246, 0.4)' },
      'lab-result': { color: '#10b981', shadow: 'rgba(16, 185, 129, 0.4)' },
      'prescription': { color: '#6366f1', shadow: 'rgba(99, 102, 241, 0.4)' },
      'consultation-note': { color: '#06b6d4', shadow: 'rgba(6, 182, 212, 0.4)' },
    };
    return themes[type] || { color: '#94a3b8', shadow: 'rgba(148, 163, 184, 0.3)' };
};

const PatientHistoryTimeline = ({ patientId }) => {
  const [events, setEvents] = useState([]);
  const [criticalOnly, setCriticalOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);
  const { scrollXProgress } = useScroll({ container: containerRef });

  const fetchEvents = () => {
    setLoading(true);
    try {
      const allMock = generateMockTimelineEvents();
      const patientEvents = allMock.filter(e => e.patient === patientId);
      setEvents(patientEvents.length > 0 ? patientEvents : allMock.slice(0, 10));
    } catch (error) {
      setEvents([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (patientId) fetchEvents();
  }, [patientId]);

  const filteredEvents = criticalOnly ? events.filter(e => e.is_critical) : events;

  return (
    <div className="mt-8 mb-4 bg-[#0d121f] border border-white/20 rounded-[2.5rem] p-10 relative overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.9)] bg-dot-pattern">
        {/* Cinematic Atmospheric Light Source */}
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[80%] h-[40%] bg-blue-500/15 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
        
        <div className="flex items-center justify-between mb-8 relative z-10 px-2">
            <div className="space-y-1">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20">
                        <Activity className="text-blue-400" size={20} />
                    </div>
                    <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic text-glow">
                        Patient <span className="text-blue-500 text-glow-blue">Clinical Timeline</span>
                    </h2>
                </div>
                <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.4em]">Chronological Clinical Audit Stream</p>
            </div>

            <label className="flex items-center gap-3 cursor-pointer group/toggle bg-white/5 p-1.5 rounded-xl border border-white/10 pr-4 hover:bg-white/10 transition-all">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${criticalOnly ? 'bg-rose-500 text-white' : 'bg-white/5 text-gray-500'}`}>
                    <AlertCircle size={16} />
                </div>
                <div className="flex flex-col">
                    <span className="text-[8px] font-black uppercase text-gray-500 tracking-widest leading-none mb-1">Filter</span>
                    <span className="text-[10px] font-bold text-white uppercase tracking-tighter leading-none">CRITICAL</span>
                </div>
                <input type="checkbox" className="hidden" checked={criticalOnly} onChange={() => setCriticalOnly(!criticalOnly)} />
            </label>
        </div>

        <div 
            ref={containerRef}
            className="flex gap-6 overflow-x-auto pb-10 pt-6 px-2 scrollbar-hide relative snap-x"
            style={{ perspective: '1200px' }}
        >
            {/* Sharper Track Line */}
            {/* fiber-optic Neon Track Rail */}
            <div className="absolute left-[50px] right-[50px] h-[6px] bg-[#1a1f2e] top-[74px] z-0 rounded-full border border-white/5" />
            
            <motion.div 
                className="absolute left-[50px] h-[6px] bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-600 top-[74px] z-10 neon-track-glow rounded-full"
                style={{ width: scrollXProgress, transformOrigin: 'left' }}
                transformTemplate={({ width }) => `calc(${width} - 100px)`}
            />
            {/* Ambient Pulse Light */}
            <motion.div 
                className="absolute h-[6px] w-[100px] bg-white brightness-200 top-[74px] z-20 blur-sm rounded-full"
                animate={{ left: ['0%', '100%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                style={{ opacity: useTransform(scrollXProgress, [0, 1], [1, 0]) }}
            />

            {filteredEvents.map((event, index) => (
                <TimelineNode key={event.id || index} event={event} containerRef={containerRef} />
            ))}
        </div>

        <div className="mt-2 flex items-center gap-4 relative z-10 px-2 opacity-60 hover:opacity-100 transition-opacity">
            <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest whitespace-nowrap">Audit Progress</span>
            <div className="flex-1 h-[2px] bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                    className="h-full bg-blue-500/40"
                    style={{ scaleX: scrollXProgress, transformOrigin: 'left' }}
                />
            </div>
            <span className="text-[9px] font-black text-blue-500/50 uppercase tracking-widest whitespace-nowrap">End of log</span>
        </div>

        <style jsx>{`
            .scrollbar-hide::-webkit-scrollbar { display: none; }
            .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>
    </div>
  );
};

const TimelineNode = ({ event, containerRef }) => {
    const nodeRef = useRef(null);
    const { scrollXProgress: nodeScroll } = useScroll({
        target: nodeRef,
        container: containerRef,
        offset: ["start end", "end start"]
    });

    const rotateY = useTransform(nodeScroll, [0, 0.5, 1], [15, 0, -15]);
    const scale = useTransform(nodeScroll, [0, 0.5, 1], [0.95, 1, 0.95]);
    const opacity = useTransform(nodeScroll, [0, 0.1, 0.9, 1], [0.5, 1, 1, 0.5]);

    const theme = getEventTheme(event.event_type, event.is_critical);

    return (
        <motion.div 
            ref={nodeRef}
            style={{ rotateY, scale, opacity }}
            className="flex-shrink-0 w-[260px] snap-center relative py-6"
        >
            {/* Node Joint with Light Ray */}
            <div className="absolute top-[62px] left-1/2 -translate-x-1/2 flex flex-col items-center">
                <div 
                    className="w-6 h-6 rounded-full border-[3px] border-[#0d121f] z-20 transition-all duration-300"
                    style={{ backgroundColor: theme.color, boxShadow: `0 0 30px ${theme.shadow}` }}
                >
                    <div className="absolute inset-0 bg-white/40 blur-sm rounded-full animate-pulse" />
                </div>
                <div className="w-[1px] h-20 bg-gradient-to-b from-white/40 via-white/10 to-transparent" />
            </div>

            {event.is_critical && (
                <div className="absolute top-[62px] left-1/2 -translate-x-1/2 w-6 h-6 pointer-events-none">
                    <motion.div 
                        className="absolute inset-0 rounded-full bg-rose-500/30"
                        animate={{ scale: [1, 2.5], opacity: [0.5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    />
                </div>
            )}

            <div className="pt-12 px-1">
                <motion.div 
                    className="relative group cursor-pointer"
                    whileHover={{ y: -4 }}
                >
                    <div className="absolute inset-0 blur-[50px] opacity-0 group-hover:opacity-60 transition-opacity duration-700"
                         style={{ backgroundColor: theme.color }} />

                    <div className="holographic-surface rounded-[2rem] p-7 shadow-[0_40px_80px_rgba(0,0,0,0.85)] relative overflow-hidden group-hover:border-blue-500/80 transition-all duration-500 min-h-[260px]">
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />
                        <div className="flex items-center justify-between mb-5">
                            <div className="p-3.5 rounded-2xl border-2 border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.1)] backdrop-blur-xl"
                                 style={{ backgroundColor: `${theme.color}25`, color: theme.color }}>
                                {React.cloneElement(getEventIcon(event.event_type), { size: 24 })}
                            </div>
                            <span className="text-[9px] font-black text-white/50 uppercase tracking-widest bg-white/5 px-2 px-1 rounded-md">REF: #{event.id?.slice(-4) || 'XXXX'}</span>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <h4 className="text-[9px] font-black uppercase tracking-[0.2em] mb-1.5 opacity-80" style={{ color: theme.color }}>
                                    {event.event_type?.replace('_', ' ') || 'CLINICAL EVENT'}
                                </h4>
                                <h3 className="text-[18px] font-black text-white tracking-tight leading-loose line-clamp-2 italic">
                                    {event.title}
                                </h3>
                            </div>

                            <div className="flex items-center gap-2 text-[9px] font-bold text-gray-500">
                                <Clock size={10} className="opacity-40" />
                                {event.event_date ? new Date(event.event_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                <Calendar size={10} className="ml-1 opacity-40" />
                                {event.event_date ? new Date(event.event_date).toLocaleDateString() : 'NO DATE'}
                            </div>

                            {event.description && (
                                <p className="text-[11px] text-[#cbd5e1] font-medium leading-relaxed line-clamp-3 p-3.5 bg-black/50 border border-white/10 rounded-2xl shadow-inner italic">
                                    "{event.description}"
                                </p>
                            )}

                            <div className="pt-2 flex items-center justify-between opacity-50 group-hover:opacity-100 transition-opacity">
                                <span className="text-[9px] font-black text-blue-400 uppercase tracking-[0.2em] text-glow-blue">Analyze Node</span>
                                <ChevronRight size={14} className="text-blue-500 animate-pulse" />
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default PatientHistoryTimeline;
