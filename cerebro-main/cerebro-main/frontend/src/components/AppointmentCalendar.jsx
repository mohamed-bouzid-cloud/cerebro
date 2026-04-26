import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Phone,
  Video,
  User,
  Plus,
  Check,
  X,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { generateMockAppointments } from '../mockData';

const AppointmentCalendar = ({ patientId, isDoctor = false }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    date: '',
    time: '',
    type: 'general',
    reason: '',
  });

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getMockAppointmentsForPatient = (pid) => {
    const allMock = generateMockAppointments();
    const patientApts = allMock.filter(a => a.patient === pid);
    return patientApts.length > 0 ? patientApts : allMock.slice(0, 2);
  };

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/auth/appointments/?patient_id=${patientId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      const data = await response.json();
      const aptData = Array.isArray(data) ? data : (data.results || []);
      if (aptData.length > 0) {
        setAppointments(aptData);
      } else {
        setAppointments(getMockAppointmentsForPatient(patientId));
      }
    } catch (error) {
      // Backend unreachable, use mock data
      setAppointments(getMockAppointmentsForPatient(patientId));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAppointments();
  }, [patientId]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleAddAppointment = async () => {
    try {
      const response = await fetch('/api/auth/appointments/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          patient: patientId,
          scheduled_at: `${newAppointment.date}T${newAppointment.time}:00Z`,
          consultation_type: newAppointment.type,
          reason: newAppointment.reason,
          status: 'proposed',
        }),
      });
      if (response.ok) {
        fetchAppointments();
        setShowModal(false);
        setNewAppointment({ date: '', time: '', type: 'general', reason: '' });
      }
    } catch (error) {
      console.error('Error creating appointment:', error);
    }
  };

  const getAppointmentsForDate = (day) => {
    return appointments.filter((apt) => {
      const aptDate = new Date(apt.scheduled_at);
      return (
        aptDate.getDate() === day &&
        aptDate.getMonth() === currentDate.getMonth() &&
        aptDate.getFullYear() === currentDate.getFullYear()
      );
    });
  };

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days = [];

  // Add empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  // Add days of month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const getConsultationTypeIcon = (type) => {
    switch (type) {
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'audio':
        return <Phone className="w-4 h-4" />;
      case 'in-person':
        return <MapPin className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'booked':
        return 'bg-green-100 border-green-300';
      case 'completed':
        return 'bg-blue-100 border-blue-300';
      case 'cancelled':
        return 'bg-red-100 border-red-300';
      default:
        return 'bg-yellow-100 border-yellow-300';
    }
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Appointment Calendar</h2>
        {isDoctor && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
          >
            <Plus className="w-4 h-4" />
            Schedule Appointment
          </button>
        )}
      </div>

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between mb-4 bg-gray-50 p-4 rounded-lg">
        <button
          onClick={handlePrevMonth}
          className="p-2 hover:bg-gray-200 rounded-lg transition"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-semibold text-gray-800">{monthName}</h3>
        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-gray-200 rounded-lg transition"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center font-semibold text-gray-600 py-2 text-sm">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {days.map((day, index) => (
          <div
            key={index}
            className={`min-h-24 p-2 border rounded-lg transition ${
              day === null
                ? 'bg-gray-50 border-gray-200'
                : 'border-gray-300 hover:border-blue-500 cursor-pointer hover:bg-blue-50'
            }`}
            onClick={() => day && setSelectedDay(day)}
          >
            {day && (
              <>
                <div className={`text-sm font-semibold mb-1 ${day === selectedDay ? 'text-blue-600' : 'text-gray-700'}`}>
                  {day}
                </div>
                <div className="space-y-1">
                  {getAppointmentsForDate(day).map((apt) => (
                    <motion.div
                      key={apt.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`text-xs p-1 rounded border-l-2 truncate ${getStatusColor(apt.status)}`}
                      title={apt.reason}
                    >
                      {apt.consultation_type === 'general' ? 'Appointment' : apt.consultation_type}
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Selected Day Details */}
      {selectedDay && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-4"
        >
          <h4 className="font-semibold text-gray-800 mb-3">
            Appointments for{' '}
            {new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDay).toLocaleDateString()}
          </h4>
          {getAppointmentsForDate(selectedDay).length > 0 ? (
            <div className="space-y-2">
              {getAppointmentsForDate(selectedDay).map((apt) => (
                <motion.div
                  key={apt.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white p-3 rounded border border-gray-200 flex items-start justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getConsultationTypeIcon(apt.consultation_type)}
                      <span className="font-semibold text-gray-800">{apt.consultation_type}</span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          apt.status === 'booked'
                            ? 'bg-green-100 text-green-700'
                            : apt.status === 'completed'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {apt.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{apt.reason}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(apt.scheduled_at).toLocaleTimeString()}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-sm">No appointments scheduled for this day</p>
          )}
        </motion.div>
      )}

      {/* Add Appointment Modal */}
      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg p-6 max-w-md w-full m-4"
          >
            <h3 className="text-lg font-semibold mb-4">Schedule New Appointment</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={newAppointment.date}
                  onChange={(e) => setNewAppointment({ ...newAppointment, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                <input
                  type="time"
                  value={newAppointment.time}
                  onChange={(e) => setNewAppointment({ ...newAppointment, time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={newAppointment.type}
                  onChange={(e) => setNewAppointment({ ...newAppointment, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="general">General</option>
                  <option value="video">Video Call</option>
                  <option value="audio">Audio Call</option>
                  <option value="in-person">In-Person</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <textarea
                  value={newAppointment.reason}
                  onChange={(e) => setNewAppointment({ ...newAppointment, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  setNewAppointment({ date: '', time: '', type: 'general', reason: '' });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAppointment}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Schedule
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default AppointmentCalendar;
