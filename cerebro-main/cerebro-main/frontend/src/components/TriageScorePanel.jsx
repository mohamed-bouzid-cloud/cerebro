import React, { useState, useEffect } from 'react';
import { AlertTriangle, TrendingUp, Zap, Heart, Brain, Volume2, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { generateMockTriageScores } from '../mockData';

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
      const response = await fetch(`/api/auth/triage-scores/by_patient/?patient_id=${patientId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        setTriageScores(data);
        setLatestScore(data[0]);
      } else {
        // No real data, use mock
        const mockScores = getMockTriageForPatient(patientId);
        setTriageScores(mockScores);
        setLatestScore(mockScores[0]);
      }
    } catch (error) {
      // Backend unreachable, use mock data
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
      const response = await fetch('/api/auth/triage-scores/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          patient: patientId,
          ...formData,
        }),
      });
      if (response.ok) {
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
      }
    } catch (error) {
      console.error('Error creating triage score:', error);
    }
  };

  const getUrgencyColor = (level) => {
    const colors = {
      resuscitation: 'bg-red-100 text-red-800 border-red-300',
      emergency: 'bg-orange-100 text-orange-800 border-orange-300',
      urgent: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'semi-urgent': 'bg-blue-100 text-blue-800 border-blue-300',
      'non-urgent': 'bg-green-100 text-green-800 border-green-300',
    };
    return colors[level] || 'bg-gray-100 text-gray-800 border-gray-300';
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
    <div className="w-full bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-yellow-600" />
          Triage Score
        </h2>
        {isDoctor && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
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
            className={`p-6 rounded-lg border-2 mb-6 ${getUrgencyColor(latestScore.urgency_level)}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {getUrgencyIcon(latestScore.urgency_level)}
                <div>
                  <h3 className="font-semibold text-lg">{latestScore.get_urgency_level_display || latestScore.urgency_level}</h3>
                  <p className="text-sm opacity-75">Overall Score: {latestScore.overall_score}/100</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs opacity-75">
                  {new Date(latestScore.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            {latestScore.chief_complaint && (
              <p className="text-sm font-medium mb-3">Chief Complaint: {latestScore.chief_complaint}</p>
            )}

            {/* Component Scores */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-current border-opacity-20">
              <div className="text-center">
                <Volume2 className="w-4 h-4 mx-auto mb-1" />
                <p className="text-xs">Chief Complaint</p>
                <p className="text-lg font-bold">{latestScore.chief_complaint_severity}/10</p>
              </div>
              <div className="text-center">
                <Heart className="w-4 h-4 mx-auto mb-1" />
                <p className="text-xs">Vital Signs</p>
                <p className="text-lg font-bold">{latestScore.vital_signs_severity}/10</p>
              </div>
              <div className="text-center">
                <Brain className="w-4 h-4 mx-auto mb-1" />
                <p className="text-xs">Mental Status</p>
                <p className="text-lg font-bold">{latestScore.mental_status_severity}/10</p>
              </div>
              <div className="text-center">
                <TrendingUp className="w-4 h-4 mx-auto mb-1" />
                <p className="text-xs">Pain Level</p>
                <p className="text-lg font-bold">{latestScore.pain_level}/10</p>
              </div>
            </div>

            {latestScore.assessment_notes && (
              <div className="mt-4 pt-4 border-t border-current border-opacity-20">
                <p className="text-sm font-medium mb-2">Assessment Notes:</p>
                <p className="text-sm">{latestScore.assessment_notes}</p>
              </div>
            )}
          </motion.div>

          {/* History */}
          {triageScores.length > 1 && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Assessment History</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {triageScores.slice(1).map((score) => (
                  <motion.div
                    key={score.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-3 rounded border ${getUrgencyColor(score.urgency_level)} flex justify-between items-center`}
                  >
                    <div className="flex items-center gap-2">
                      {getUrgencyIcon(score.urgency_level)}
                      <div>
                        <p className="text-sm font-medium">{score.get_urgency_level_display || score.urgency_level}</p>
                        <p className="text-xs">{score.overall_score}/100</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600">
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
          <p>No triage scores available yet</p>
          {isDoctor && (
            <p className="text-sm mt-2">Create a new assessment to get started</p>
          )}
        </div>
      )}

      {/* Assessment Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-50 rounded-lg p-6 mt-6 border border-gray-200"
        >
          <h3 className="font-semibold text-gray-800 mb-4">New Triage Assessment</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Urgency Level</label>
                <select
                  value={formData.urgency_level}
                  onChange={(e) => setFormData({ ...formData, urgency_level: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="resuscitation">Resuscitation (Level 1)</option>
                  <option value="emergency">Emergency (Level 2)</option>
                  <option value="urgent">Urgent (Level 3)</option>
                  <option value="semi-urgent">Semi-Urgent (Level 4)</option>
                  <option value="non-urgent">Non-Urgent (Level 5)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Overall Score: {formData.overall_score}/100
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.overall_score}
                  onChange={(e) => setFormData({ ...formData, overall_score: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chief Complaint</label>
              <input
                type="text"
                value={formData.chief_complaint}
                onChange={(e) => setFormData({ ...formData, chief_complaint: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Severe headache, Chest pain"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chief Complaint Severity: {formData.chief_complaint_severity}/10
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={formData.chief_complaint_severity}
                  onChange={(e) => setFormData({ ...formData, chief_complaint_severity: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vital Signs Severity: {formData.vital_signs_severity}/10
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={formData.vital_signs_severity}
                  onChange={(e) => setFormData({ ...formData, vital_signs_severity: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mental Status Severity: {formData.mental_status_severity}/10
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={formData.mental_status_severity}
                  onChange={(e) => setFormData({ ...formData, mental_status_severity: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pain Level: {formData.pain_level}/10
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={formData.pain_level}
                  onChange={(e) => setFormData({ ...formData, pain_level: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assessment Notes</label>
              <textarea
                value={formData.assessment_notes}
                onChange={(e) => setFormData({ ...formData, assessment_notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="Additional clinical notes..."
              />
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
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
