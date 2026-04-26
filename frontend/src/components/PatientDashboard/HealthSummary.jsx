import React from 'react';
import { motion } from 'framer-motion';
import { Activity, AlertTriangle, ShieldCheck } from 'lucide-react';

const HealthSummary = ({ medicalHistory, allergies }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            {/* Active Conditions */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-card rim-light p-8 flex flex-col"
            >
                <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                    <Activity size={18} className="text-blue-500" />
                    Bio-Medical Conditions
                </h3>
                {medicalHistory?.chronic_conditions ? (
                    <div className="flex flex-wrap gap-2">
                        {medicalHistory.chronic_conditions.split(',').map((condition, idx) => (
                            <span key={idx} className="bg-blue-500/10 border border-blue-500/20 text-blue-400 px-4 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-widest">
                                {condition.trim()}
                            </span>
                        ))}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center opacity-30 py-8">
                        <Activity size={32} className="text-gray-600 mb-2" />
                        <p className="text-[10px] uppercase font-black tracking-widest text-gray-500">No Chronic Diagnostics</p>
                    </div>
                )}
            </motion.div>

            {/* Allergies & Intolerances */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-card rim-light p-8 flex flex-col"
            >
                <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                    <AlertTriangle size={18} className="text-rose-500" />
                    Immunological Alerts
                </h3>
                {allergies?.length > 0 ? (
                    <div className="space-y-3">
                        {allergies.map((allergy, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-rose-500/5 border border-rose-500/10 p-3 rounded-2xl group hover:bg-rose-500/10 transition-all">
                                <div>
                                    <p className="text-white text-xs font-black uppercase tracking-widest m-0">{allergy.allergen}</p>
                                    <p className="text-[10px] font-bold text-gray-500 m-0 group-hover:text-gray-400 transition-colors">{allergy.reaction}</p>
                                </div>
                                <span className={`text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded border ${
                                    allergy.severity === 'severe' ? 'text-rose-500 border-rose-500/30 bg-rose-500/10' : 'text-amber-500 border-amber-500/30 bg-amber-500/10'
                                }`}>
                                    {allergy.severity}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center gap-3 text-emerald-500/60 py-8">
                        <ShieldCheck size={24} />
                        <p className="text-[10px] font-black uppercase tracking-widest">No Active Bio-Allergies</p>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default HealthSummary;
