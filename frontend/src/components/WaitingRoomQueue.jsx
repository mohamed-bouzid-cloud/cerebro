import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, User, CheckCircle, Timer } from 'lucide-react';

const WaitingRoomQueue = ({ queue = [], setQueue }) => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const calculateWaitTime = (arrivedAt) => {
        if (!arrivedAt) return '0m';
        const arrival = new Date(arrivedAt);
        const diffMs = currentTime - arrival;
        const diffMins = Math.floor(diffMs / 60000);
        return diffMins > 60 ? `${Math.floor(diffMins / 60)}h ${diffMins % 60}m` : `${diffMins}m`;
    };

    const handleComplete = (aptId) => {
        if (setQueue) {
            setQueue(prev => prev.filter(a => a.id !== aptId));
        }
    };

    return (
        <div className="glass-card overflow-hidden h-full flex flex-col">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-blue-600/5 to-transparent">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                        <Clock size={20} className="text-blue-400" />
                    </div>
                    <div>
                        <h3 className="font-extrabold text-white text-lg tracking-tight">Live Waiting Room</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[9px] uppercase font-black text-gray-500 tracking-[0.2em]">Live Tracking Active</span>
                        </div>
                    </div>
                </div>
                <div className="px-3 py-1 bg-blue-500/5 border border-blue-500/20 rounded-full">
                    <span className="text-[10px] font-black text-blue-400 tracking-wider whitespace-nowrap">{queue.length} IN QUEUE</span>
                </div>
            </div>

            <div className="p-4 flex-1 overflow-y-auto custom-scrollbar space-y-3">
                <AnimatePresence initial={false}>
                    {queue.length > 0 ? (
                        queue.map((apt, idx) => (
                            <motion.div
                                key={apt.id}
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.9, x: 20 }}
                                className="group p-4 bg-white/[0.02] border border-white/5 hover:border-blue-500/20 rounded-2xl transition-all duration-300 relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/[0.02] transition-colors" />
                                <div className="flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-white/10 flex items-center justify-center text-white font-black text-sm shadow-inner group-hover:shadow-[0_0_15px_rgba(59,130,246,0.2)] transition-all">
                                            {apt.patient_name[0]}
                                        </div>
                                        <div>
                                            <p className="font-extrabold text-white text-sm tracking-wide group-hover:text-blue-400 transition-colors uppercase">{apt.patient_name}</p>
                                            <div className="flex items-center gap-3 mt-1.5">
                                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-500/10 rounded-md border border-blue-500/10">
                                                    <Timer size={10} className="text-blue-400" />
                                                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-tighter">Wait: {calculateWaitTime(apt.arrived_at || apt.scheduled_at)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <button 
                                        onClick={() => handleComplete(apt.id)}
                                        className="w-9 h-9 flex items-center justify-center text-emerald-500/40 hover:text-emerald-400 bg-white/5 hover:bg-emerald-500/10 rounded-xl transition-all border border-transparent hover:border-emerald-500/20"
                                    >
                                        <CheckCircle size={18} />
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center py-12 text-center opacity-40 group"
                        >
                            <User size={40} className="text-gray-600 mb-4 transition-transform group-hover:scale-110" />
                            <p className="text-xs font-black text-gray-500 uppercase tracking-widest leading-loose">Waiting Room Empty<br/>Ready for next intake</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default WaitingRoomQueue;
