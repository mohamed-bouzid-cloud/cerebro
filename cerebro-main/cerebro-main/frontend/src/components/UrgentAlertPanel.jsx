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
      resuscitation: 'bg-red-100 border-red-300',
      emergency: 'bg-orange-100 border-orange-300',
      urgent: 'bg-yellow-100 border-yellow-300',
    };
    return backgrounds[level] || 'bg-gray-100 border-gray-300';
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
      <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border-2 border-red-300 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-red-600 animate-pulse" />
          <h2 className="text-lg font-bold text-red-800">
            Critical & Urgent Patients ({urgentPatients.length})
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-4 text-gray-600">Loading...</div>
        ) : urgentPatients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
            {urgentPatients.map((score) => (
              <motion.div
                key={score.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                className={`p-3 rounded-lg border-2 cursor-pointer transition transform ${getUrgencyBg(
                  score.urgency_level
                )} hover:shadow-md`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getUrgencyIcon(score.urgency_level)}
                    <div>
                      <p className="font-bold text-sm">{score.patient_name}</p>
                      <p className="text-xs font-semibold text-red-700">
                        {getLevelLabel(score.urgency_level)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{score.overall_score}/100</p>
                  </div>
                </div>

                {score.chief_complaint && (
                  <p className="text-xs text-gray-700 mb-2 font-medium">
                    Complaint: {score.chief_complaint}
                  </p>
                )}

                {/* Score Indicators */}
                <div className="grid grid-cols-4 gap-1 mb-2">
                  <div className="bg-white bg-opacity-70 p-1 rounded text-center">
                    <p className="text-xs font-bold">{score.chief_complaint_severity}</p>
                    <p className="text-xs">Complaint</p>
                  </div>
                  <div className="bg-white bg-opacity-70 p-1 rounded text-center">
                    <p className="text-xs font-bold">{score.vital_signs_severity}</p>
                    <p className="text-xs">Vitals</p>
                  </div>
                  <div className="bg-white bg-opacity-70 p-1 rounded text-center">
                    <p className="text-xs font-bold">{score.mental_status_severity}</p>
                    <p className="text-xs">Mental</p>
                  </div>
                  <div className="bg-white bg-opacity-70 p-1 rounded text-center">
                    <p className="text-xs font-bold">{score.pain_level}</p>
                    <p className="text-xs">Pain</p>
                  </div>
                </div>

                {score.appointment_date && (
                  <p className="text-xs text-gray-600 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(score.appointment_date).toLocaleDateString()}
                  </p>
                )}

                {score.assessment_notes && (
                  <p className="text-xs text-gray-700 mt-2 italic bg-white bg-opacity-50 p-1 rounded">
                    "{score.assessment_notes.substring(0, 50)}..."
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-green-700 font-medium">
            ✓ No critical or urgent patients currently
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default UrgentAlertPanel;
