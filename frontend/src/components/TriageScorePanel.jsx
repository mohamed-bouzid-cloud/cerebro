import React, { useState, useEffect } from 'react';
import { AlertTriangle, TrendingUp, Zap, Heart, Brain, Volume2, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { generateMockTriageScores } from '../mockData';
import API from '../api';

const TriageScorePanel = ({ patientId, isDoctor = false }) => {
  const [triageScores, setTriageScores] = useState([]);
  const [latestScore, setLatestScore] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    urgency_level: 'semi-urgent',
    overall_score: 50,
    chief_complaint_severity: 5,
    vital_signs_severity: 5,
    mental_status_severity: 5,
    pain_level: 5,
    chief_complaint: '',
    assessment_notes: '',
  });

  const getMockTriageForPatient = (pid) => {
    const allMock = generateMockTriageScores();
    const patientScores = allMock.filter(s => s.patient === pid);
    return patientScores.length > 0 ? patientScores : [allMock[0]]; // fallback to first mock
  };

  const fetchTriageScores = async () => {
    setLoading(true);
    try {
      const { data } = await API.get(`/api/auth/triage-scores/by_patient/?patient_id=${patientId}`);
      if (Array.isArray(data) && data.length > 0) {
        setTriageScores(data);
        setLatestScore(data[0]);
      } else {
        const mockScores = getMockTriageForPatient(patientId);
        setTriageScores(mockScores);
        setLatestScore(mockScores[0]);
      }
    } catch (error) {
      const mockScores = getMockTriageForPatient(patientId);
      setTriageScores(mockScores);
      setLatestScore(mockScores[0]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTriageScores();
  }, [patientId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/api/auth/triage-scores/', {
        patient: patientId,
        ...formData,
      });
      fetchTriageScores();
      setShowForm(false);
      setFormData({
        urgency_level: 'semi-urgent',
        overall_score: 50,
        chief_complaint_severity: 5,
        vital_signs_severity: 5,
        mental_status_severity: 5,
        pain_level: 5,
        chief_complaint: '',
        assessment_notes: '',
      });
    } catch (error) {
      console.error('Error creating triage score:', error);
    }
  };

  const getUrgencyColor = (level) => {
    const colors = {
      resuscitation: 'bg-red-500/10 border-red-500/20 text-red-400',
      emergency: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
      urgent: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500',
      'semi-urgent': 'bg-blue-500/10 border-blue-500/20 text-blue-400',
      'non-urgent': 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    };
    return colors[level] || 'bg-white/5 border-white/10 text-gray-400';
  };

  const getUrgencyIcon = (level) => {
    const icons = {
      resuscitation: <AlertTriangle className="w-5 h-5" />,
      emergency: <Zap className="w-5 h-5" />,
      urgent: <TrendingUp className="w-5 h-5" />,
      'semi-urgent': <Heart className="w-5 h-5" />,
      'non-urgent': <Brain className="w-5 h-5" />,
    };
    return icons[level] || <AlertTriangle className="w-5 h-5" />;
  };

  const getSeverityGauge = (value, label) => {
    const percentage = (value / 10) * 100;
    const color = value <= 3 ? 'bg-green-500' : value <= 6 ? 'bg-yellow-500' : 'bg-red-500';

    return (
      <div key={label} className="mb-4">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <span className="text-sm font-semibold text-gray-800">{value}/10</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${percentage}%` }} />
        </div>
      </div>
    );
  };

  return (
    <div className="glass-card p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none rounded-2xl" />
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5 relative z-10">
        <h2 className="text-xl font-bold text-white flex items-center gap-3 drop-shadow-md">
          <AlertTriangle className="w-5 h-5 text-indigo-500" />
          Clinical Triage Score
        </h2>
        {isDoctor && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 px-3 py-2 rounded-lg transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            New Assessment
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : latestScore ? (
        <>
          {/* Latest Score Summary */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-6 rounded-xl border shadow-[0_8px_30px_rgba(0,0,0,0.3)] backdrop-blur-md relative z-10 ${getUrgencyColor(latestScore.urgency_level)} mb-6`}
          >
            <div className="flex items-start justify-between mb-5 border-b border-white/10 pb-4">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-black/20 rounded-lg">
                  {getUrgencyIcon(latestScore.urgency_level)}
                </div>
                <div>
                  <h3 className="font-bold text-lg uppercase tracking-wide">{latestScore.get_urgency_level_display || latestScore.urgency_level}</h3>
                  <p className="text-sm opacity-80 mt-0.5">Overall Triage Score: <span className="font-bold text-white ml-2 text-lg">{latestScore.overall_score}/100</span></p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs opacity-60 font-medium">
                  {new Date(latestScore.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            {latestScore.chief_complaint && (
              <p className="text-sm font-medium mb-4 flex gap-2">
                <span className="opacity-60">Chief Complaint:</span>
                <span className="text-white">{latestScore.chief_complaint}</span>
              </p>
            )}

            {/* Component Scores */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4">
              <div className="text-center bg-black/20 p-3 rounded-lg border border-white/5">
                <Volume2 className="w-4 h-4 mx-auto mb-2 opacity-70" />
                <p className="text-xs opacity-70 mb-1">Chief Complaint</p>
                <p className="text-lg font-bold text-white">{latestScore.chief_complaint_severity}<span className="text-xs opacity-50 ml-1">/10</span></p>
              </div>
              <div className="text-center bg-black/20 p-3 rounded-lg border border-white/5">
                <Heart className="w-4 h-4 mx-auto mb-2 opacity-70" />
                <p className="text-xs opacity-70 mb-1">Vital Signs</p>
                <p className="text-lg font-bold text-white">{latestScore.vital_signs_severity}<span className="text-xs opacity-50 ml-1">/10</span></p>
              </div>
              <div className="text-center bg-black/20 p-3 rounded-lg border border-white/5">
                <Brain className="w-4 h-4 mx-auto mb-2 opacity-70" />
                <p className="text-xs opacity-70 mb-1">Mental Status</p>
                <p className="text-lg font-bold text-white">{latestScore.mental_status_severity}<span className="text-xs opacity-50 ml-1">/10</span></p>
              </div>
              <div className="text-center bg-black/20 p-3 rounded-lg border border-white/5">
                <TrendingUp className="w-4 h-4 mx-auto mb-2 opacity-70" />
                <p className="text-xs opacity-70 mb-1">Pain Level</p>
                <p className="text-lg font-bold text-white">{latestScore.pain_level}<span className="text-xs opacity-50 ml-1">/10</span></p>
              </div>
            </div>

            {latestScore.assessment_notes && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-xs opacity-60 font-medium mb-2 uppercase tracking-widest">Assessment Notes</p>
                <p className="text-sm italic opacity-90">{latestScore.assessment_notes}</p>
              </div>
            )}
          </motion.div>

          {/* History */}
          {triageScores.length > 1 && (
            <div className="mt-8">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Assessment History</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                {triageScores.slice(1).map((score) => (
                  <motion.div
                    key={score.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-3 rounded-lg border flex justify-between items-center ${getUrgencyColor(score.urgency_level)}`}
                  >
                    <div className="flex items-center gap-3">
                      {getUrgencyIcon(score.urgency_level)}
                      <div>
                        <p className="text-sm font-bold tracking-wide">{score.get_urgency_level_display || score.urgency_level}</p>
                        <p className="text-xs opacity-70">Score: {score.overall_score}/100</p>
                      </div>
                    </div>
                    <p className="text-xs opacity-60 font-medium">
                      {new Date(score.created_at).toLocaleDateString()}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/5 mb-3">
            <AlertTriangle className="w-6 h-6 text-gray-600" />
          </div>
          <p className="text-sm font-medium">No triage scores available</p>
        </div>
      )}

      {/* Assessment Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-[#121822] to-[#151821] rounded-xl p-6 mt-6 border border-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.4)] relative z-10"
        >
          <h3 className="font-bold text-white mb-4">New Triage Assessment</h3>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Urgency Level</label>
                <select
                  value={formData.urgency_level}
                  onChange={(e) => setFormData({ ...formData, urgency_level: e.target.value })}
                  className="w-full px-3 py-2.5 bg-[#0a0f14] border border-[#1e232d] text-white rounded-lg focus:outline-none focus:border-indigo-500"
                >
                  <option value="resuscitation">Resuscitation (Level 1)</option>
                  <option value="emergency">Emergency (Level 2)</option>
                  <option value="urgent">Urgent (Level 3)</option>
                  <option value="semi-urgent">Semi-Urgent (Level 4)</option>
                  <option value="non-urgent">Non-Urgent (Level 5)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Overall Score: <span className="text-white">{formData.overall_score}/100</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.overall_score}
                  onChange={(e) => setFormData({ ...formData, overall_score: parseInt(e.target.value) })}
                  className="w-full accent-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Chief Complaint</label>
              <input
                type="text"
                value={formData.chief_complaint}
                onChange={(e) => setFormData({ ...formData, chief_complaint: e.target.value })}
                className="w-full px-3 py-2.5 bg-[#0a0f14] border border-[#1e232d] text-white rounded-lg focus:outline-none focus:border-indigo-500"
                placeholder="e.g., Severe headache, Chest pain"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Complaint Severity: <span className="text-white">{formData.chief_complaint_severity}/10</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={formData.chief_complaint_severity}
                  onChange={(e) => setFormData({ ...formData, chief_complaint_severity: parseInt(e.target.value) })}
                  className="w-full accent-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Vital Signs Severity: <span className="text-white">{formData.vital_signs_severity}/10</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={formData.vital_signs_severity}
                  onChange={(e) => setFormData({ ...formData, vital_signs_severity: parseInt(e.target.value) })}
                  className="w-full accent-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Mental Status Severity: <span className="text-white">{formData.mental_status_severity}/10</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={formData.mental_status_severity}
                  onChange={(e) => setFormData({ ...formData, mental_status_severity: parseInt(e.target.value) })}
                  className="w-full accent-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Pain Level: <span className="text-white">{formData.pain_level}/10</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={formData.pain_level}
                  onChange={(e) => setFormData({ ...formData, pain_level: parseInt(e.target.value) })}
                  className="w-full accent-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Assessment Notes</label>
              <textarea
                value={formData.assessment_notes}
                onChange={(e) => setFormData({ ...formData, assessment_notes: e.target.value })}
                className="w-full px-3 py-2.5 bg-[#0a0f14] border border-[#1e232d] text-white rounded-lg focus:outline-none focus:border-indigo-500 h-24 resize-none"
                placeholder="Additional clinical notes..."
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 px-4 py-2 border border-[#1e232d] text-gray-300 rounded-lg hover:bg-white/5 transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-lg hover:bg-indigo-500/30 transition-colors font-medium text-sm"
              >
                Save Assessment
              </button>
            </div>
          </form>
        </motion.div>
      )}
    </div>
  );
};

export default TriageScorePanel;
