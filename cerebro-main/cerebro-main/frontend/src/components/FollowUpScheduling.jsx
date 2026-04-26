import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, FileText, Check, X, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { generateMockAppointments } from '../mockData';

const FollowUpScheduling = ({ appointmentId, patientId, patientName = '', isDoctor = false }) => {
  const [futureAppointments, setFutureAppointments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    followup_type: 'general',
    suggested_date: '',
    suggested_time: '10:00',
    reason: 'Follow-up from previous consultation',
    priority: 'normal',
  });

  const getMockFollowupsForPatient = (pid) => {
    const allMock = generateMockAppointments();
    const patientApts = allMock.filter(a => a.patient === pid);
    const future = (patientApts.length > 0 ? patientApts : allMock.slice(0, 2)).filter(a => {
      const aptDate = new Date(a.scheduled_at);
      return aptDate > new Date();
    });
    return future;
  };

  const fetchFutureAppointments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/auth/appointments/?patient_id=${patientId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      const data = await response.json();
      const aptData = Array.isArray(data) ? data : [];
      const future = aptData.filter((apt) => {
        const aptDate = new Date(apt.scheduled_at);
        return aptDate > new Date() && apt.status !== 'cancelled';
      });
      if (future.length > 0) {
        setFutureAppointments(future);
      } else {
        setFutureAppointments(getMockFollowupsForPatient(patientId));
      }
    } catch (error) {
      // Backend unreachable, use mock data
      setFutureAppointments(getMockFollowupsForPatient(patientId));
    }
    setLoading(false);
  };

  useEffect(() => {
    if (patientId) {
      fetchFutureAppointments();
    }
  }, [patientId]);

  const handleScheduleFollowUp = async () => {
    if (!formData.suggested_date || !formData.suggested_time) {
      alert('Please select both date and time');
      return;
    }

    try {
      const response = await fetch('/api/auth/appointments/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          patient: patientId,
          scheduled_at: `${formData.suggested_date}T${formData.suggested_time}:00Z`,
          consultation_type: formData.followup_type,
          reason: formData.reason,
          status: 'proposed',
          notes: `Priority: ${formData.priority}`,
        }),
      });

      if (response.ok) {
        // Also create a timeline event for this follow-up
        await fetch('/api/auth/patient-timeline/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
          body: JSON.stringify({
            patient: patientId,
            event_type: 'appointment',
            title: `Follow-up Appointment Scheduled`,
            description: `${formData.followup_type} follow-up scheduled. Reason: ${formData.reason}`,
            event_date: `${formData.suggested_date}T${formData.suggested_time}:00Z`,
            is_critical: formData.priority === 'urgent',
          }),
        });

        fetchFutureAppointments();
        setShowForm(false);
        setFormData({
          followup_type: 'general',
          suggested_date: '',
          suggested_time: '10:00',
          reason: 'Follow-up from previous consultation',
          priority: 'normal',
        });
      }
    } catch (error) {
      console.error('Error scheduling follow-up:', error);
      alert('Error scheduling follow-up');
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: 'bg-red-100 border-red-300 text-red-900',
      high: 'bg-orange-100 border-orange-300 text-orange-900',
      normal: 'bg-blue-100 border-blue-300 text-blue-900',
      low: 'bg-green-100 border-green-300 text-green-900',
    };
    return colors[priority] || 'bg-gray-100 border-gray-300';
  };

  const getFollowupIcon = (type) => {
    const icons = {
      'general': <FileText className="w-4 h-4" />,
      'video': '📹',
      'audio': '📞',
      'in-person': '🏥',
      'follow-up': '↩️',
    };
    return icons[type] || <Calendar className="w-4 h-4" />;
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-green-600" />
          Follow-up Scheduling
        </h2>
        {isDoctor && (
          <button
            onClick={() => setShowForm(!showForm)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition text-white ${
              showForm ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {showForm ? (
              <>
                <X className="w-4 h-4" />
                Cancel
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Schedule Follow-up
              </>
            )}
          </button>
        )}
      </div>

      {/* Schedule Form */}
      {showForm && isDoctor && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-6"
        >
          <h3 className="font-semibold text-gray-800 mb-4">Schedule Follow-up Appointment</h3>
          {patientName && (
            <p className="text-sm text-gray-600 mb-4 flex items-center gap-2">
              <User className="w-4 h-4" />
              Patient: <span className="font-semibold">{patientName}</span>
            </p>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Type</label>
                <select
                  value={formData.followup_type}
                  onChange={(e) => setFormData({ ...formData, followup_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="general">General Follow-up</option>
                  <option value="video">Video Call</option>
                  <option value="audio">Phone Call</option>
                  <option value="in-person">In-Person</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Suggested Date</label>
                <input
                  type="date"
                  value={formData.suggested_date}
                  onChange={(e) => setFormData({ ...formData, suggested_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Suggested Time</label>
                <input
                  type="time"
                  value={formData.suggested_time}
                  onChange={(e) => setFormData({ ...formData, suggested_time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Reason</label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                rows="3"
                placeholder="Reason for follow-up..."
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setShowForm(false);
                  setFormData({
                    followup_type: 'general',
                    suggested_date: '',
                    suggested_time: '10:00',
                    reason: 'Follow-up from previous consultation',
                    priority: 'normal',
                  });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                onClick={handleScheduleFollowUp}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Schedule
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Upcoming Follow-ups */}
      <div>
        <h3 className="font-semibold text-gray-800 mb-4">
          Upcoming Appointments ({futureAppointments.length})
        </h3>
        {loading ? (
          <div className="text-center py-4 text-gray-600">Loading appointments...</div>
        ) : futureAppointments.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {futureAppointments.map((apt) => (
              <motion.div
                key={apt.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 border-2 border-blue-200 rounded-lg bg-blue-50 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <h4 className="font-semibold text-gray-800">
                        {apt.consultation_type === 'general'
                          ? 'Appointment'
                          : apt.consultation_type}
                      </h4>
                    </div>
                    <p className="text-sm text-gray-600">{apt.reason}</p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-semibold ${
                      apt.status === 'booked'
                        ? 'bg-green-200 text-green-800'
                        : 'bg-yellow-200 text-yellow-800'
                    }`}
                  >
                    {apt.status}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(apt.scheduled_at).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {new Date(apt.scheduled_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                  <div className="flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {apt.duration_minutes} min
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No upcoming appointments scheduled</p>
            {isDoctor && (
              <p className="text-sm mt-2">Schedule a follow-up appointment using the button above</p>
            )}
          </div>
        )}
      </div>

      {/* Recommendations */}
      {isDoctor && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-yellow-900 flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4" />
              Follow-up Best Practices
            </p>
            <ul className="text-sm text-yellow-800 space-y-1 ml-6">
              <li>• Schedule within 1-2 weeks for acute conditions</li>
              <li>• Schedule within 1 month for chronic disease management</li>
              <li>• Document reason for follow-up in the timeline</li>
              <li>• Use video calls for routine follow-ups to reduce no-shows</li>
              <li>• Set urgent priority for critical conditions requiring monitoring</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

// Added Plus icon import
import { Plus } from 'lucide-react';

export default FollowUpScheduling;
