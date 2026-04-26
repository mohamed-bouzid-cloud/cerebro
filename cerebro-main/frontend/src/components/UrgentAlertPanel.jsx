import React, { useState, useEffect } from 'react';
import { AlertTriangle, Zap, Heart, User, Calendar, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import { generateMockTriageScores } from '../mockData';

const UrgentAlertPanel = ({ isDoctor = false }) => {
  const [urgentPatients, setUrgentPatients] = useState([]);
  const [loading, setLoading] = useState(false);

  const getMockUrgentPatients = () => {
    const allScores = generateMockTriageScores();
    return allScores.filter(s => 
      s.urgency_level === 'resuscitation' || 
      s.urgency_level === 'emergency' || 
      s.urgency_level === 'urgent'
    );
  };

  const fetchUrgentPatients = async () => {
    if (!isDoctor) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/auth/triage-scores/urgent_patients/', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        setUrgentPatients(data);
      } else {
        setUrgentPatients(getMockUrgentPatients());
      }
    } catch (error) {
      // Backend unreachable, use mock data
      setUrgentPatients(getMockUrgentPatients());
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUrgentPatients();
    // Refresh every 30 seconds only if backend is reachable
    const interval = setInterval(fetchUrgentPatients, 30000);
    return () => clearInterval(interval);
  }, [isDoctor]);

  if (!isDoctor) return null;

  const getUrgencyIcon = (level) => {
    const icons = {
      resuscitation: <Zap className="w-5 h-5 animate-pulse" />,
      emergency: <AlertTriangle className="w-5 h-5" />,
      urgent: <Heart className="w-5 h-5" />,
    };
    return icons[level] || <AlertTriangle className="w-5 h-5" />;
  };

  const getUrgencyBg = (level) => {
    const backgrounds = {
      resuscitation: 'bg-red-500/10 border-red-500/20 text-red-400',
      emergency: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
      urgent: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
    };
    return backgrounds[level] || 'bg-white/5 border-white/10 text-gray-400';
  };

  const getLevelLabel = (level) => {
    const labels = {
      resuscitation: 'CRITICAL',
      emergency: 'EMERGENCY',
      urgent: 'URGENT',
    };
    return labels[level] || level;
  };

  if (!loading && urgentPatients.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full mb-6"
    >
      <div className="glass-card p-5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent pointer-events-none" />
        <div className="flex items-center gap-3 mb-5 border-b border-white/5 pb-4 relative z-10">
          <Zap className="w-5 h-5 text-red-500 animate-pulse drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
          <h2 className="text-lg font-bold text-white tracking-wide drop-shadow-md">
            Critical & Urgent ({urgentPatients.length})
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-6 text-gray-500 text-sm">Loading urgent cases...</div>
        ) : urgentPatients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[32rem] overflow-y-auto pr-2 custom-scrollbar">
            {urgentPatients.map((score) => (
              <motion.div
                key={score.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.01 }}
                className={`p-4 rounded-xl border transition-all cursor-pointer shadow-[0_8px_30px_rgba(0,0,0,0.3)] backdrop-blur-md relative z-10 ${getUrgencyBg(
                  score.urgency_level
                )} hover:border-white/20`}
              >
                <div className="flex items-start justify-between mb-3 border-b border-black/10 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-black/20">
                      {getUrgencyIcon(score.urgency_level)}
                    </div>
                    <div>
                      <p className="font-bold text-white text-md">{score.patient_name}</p>
                      <p className="text-xs font-bold uppercase tracking-widest mt-1 opacity-90">
                        {getLevelLabel(score.urgency_level)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold font-mono">{score.overall_score}</p>
                    <p className="text-[10px] uppercase tracking-wider opacity-70">Score</p>
                  </div>
                </div>

                {score.chief_complaint && (
                  <p className="text-sm font-medium mb-4 flex items-start gap-2">
                    <span className="opacity-70">Complaint:</span> 
                    <span className="text-white">{score.chief_complaint}</span>
                  </p>
                )}

                {/* Score Indicators */}
                <div className="grid grid-cols-4 gap-2 mb-3">
                  <div className="bg-black/20 p-2 rounded-lg text-center border border-white/5">
                    <p className="text-sm font-bold text-white">{score.chief_complaint_severity}</p>
                    <p className="text-[10px] opacity-70 mt-0.5">C/C</p>
                  </div>
                  <div className="bg-black/20 p-2 rounded-lg text-center border border-white/5">
                    <p className="text-sm font-bold text-white">{score.vital_signs_severity}</p>
                    <p className="text-[10px] opacity-70 mt-0.5">Vitals</p>
                  </div>
                  <div className="bg-black/20 p-2 rounded-lg text-center border border-white/5">
                    <p className="text-sm font-bold text-white">{score.mental_status_severity}</p>
                    <p className="text-[10px] opacity-70 mt-0.5">Mental</p>
                  </div>
                  <div className="bg-black/20 p-2 rounded-lg text-center border border-white/5">
                    <p className="text-sm font-bold text-white">{score.pain_level}</p>
                    <p className="text-[10px] opacity-70 mt-0.5">Pain</p>
                  </div>
                </div>

                {score.assessment_notes && (
                  <p className="text-xs mt-3 italic bg-black/20 p-2 rounded border border-white/5 opacity-80">
                    "{score.assessment_notes.substring(0, 60)}..."
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 mb-3">
              <Zap className="w-6 h-6 text-emerald-500" />
            </div>
            <p className="text-gray-400 text-sm font-medium">All clear. No critical patients.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default UrgentAlertPanel;
