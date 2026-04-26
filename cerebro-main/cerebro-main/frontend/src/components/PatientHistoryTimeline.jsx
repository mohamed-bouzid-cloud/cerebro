import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { motion } from 'framer-motion';
import { generateMockTimelineEvents } from '../mockData';

const PatientHistoryTimeline = ({ patientId, isDoctor = false }) => {
  const [events, setEvents] = useState([]);
  const [criticalOnly, setCriticalOnly] = useState(false);
  const [loading, setLoading] = useState(false);

  const getMockEventsForPatient = (pid) => {
    const allMock = generateMockTimelineEvents();
    const patientEvents = allMock.filter(e => e.patient === pid);
    return patientEvents.length > 0 ? patientEvents : allMock.slice(0, 3);
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/auth/patient-timeline/?patient_id=${patientId}&ordering=-event_date`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      );
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        setEvents(data);
      } else {
        setEvents(getMockEventsForPatient(patientId));
      }
    } catch (error) {
      // Backend unreachable, use mock data
      setEvents(getMockEventsForPatient(patientId));
    }
    setLoading(false);
  };

  useEffect(() => {
    if (patientId) {
      fetchEvents();
    }
  }, [patientId]);

  const getEventIcon = (eventType) => {
    const icons = {
      'appointment': <Calendar className="w-4 h-4" />,
      'lab-result': <Microscope className="w-4 h-4" />,
      'imaging-study': <Image className="w-4 h-4" />,
      'prescription': <Pill className="w-4 h-4" />,
      'consultation-note': <FileText className="w-4 h-4" />,
      'referral': <AlertCircle className="w-4 h-4" />,
      'vital-signs': <Activity className="w-4 h-4" />,
      'admission': <Heart className="w-4 h-4" />,
      'discharge': <Heart className="w-4 h-4" />,
      'allergy-reported': <AlertCircle className="w-4 h-4" />,
      'medication-change': <Pill className="w-4 h-4" />,
      'other': <MoreVertical className="w-4 h-4" />,
    };
    return icons[eventType] || <MoreVertical className="w-4 h-4" />;
  };

  const getEventColor = (eventType, isCritical) => {
    if (isCritical) {
      return 'bg-red-50 border-red-200 text-red-900';
    }

    const colors = {
      'appointment': 'bg-blue-50 border-blue-200 text-blue-900',
      'lab-result': 'bg-green-50 border-green-200 text-green-900',
      'imaging-study': 'bg-purple-50 border-purple-200 text-purple-900',
      'prescription': 'bg-yellow-50 border-yellow-200 text-yellow-900',
      'consultation-note': 'bg-indigo-50 border-indigo-200 text-indigo-900',
      'referral': 'bg-orange-50 border-orange-200 text-orange-900',
      'vital-signs': 'bg-pink-50 border-pink-200 text-pink-900',
      'admission': 'bg-red-50 border-red-200 text-red-900',
      'discharge': 'bg-green-50 border-green-200 text-green-900',
      'allergy-reported': 'bg-red-50 border-red-200 text-red-900',
      'medication-change': 'bg-yellow-50 border-yellow-200 text-yellow-900',
      'other': 'bg-gray-50 border-gray-200 text-gray-900',
    };
    return colors[eventType] || 'bg-gray-50 border-gray-200 text-gray-900';
  };

  const getAccentColor = (eventType, isCritical) => {
    if (isCritical) {
      return 'bg-red-300';
    }

    const colors = {
      'appointment': 'bg-blue-300',
      'lab-result': 'bg-green-300',
      'imaging-study': 'bg-purple-300',
      'prescription': 'bg-yellow-300',
      'consultation-note': 'bg-indigo-300',
      'referral': 'bg-orange-300',
      'vital-signs': 'bg-pink-300',
      'admission': 'bg-red-300',
      'discharge': 'bg-green-300',
      'allergy-reported': 'bg-red-300',
      'medication-change': 'bg-yellow-300',
      'other': 'bg-gray-300',
    };
    return colors[eventType] || 'bg-gray-300';
  };

  const filteredEvents = criticalOnly ? events.filter((e) => e.is_critical) : events;

  const displayedEvents = filteredEvents.slice(0, 50); // Show latest 50 events

  return (
    <div className="w-full bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Patient History Timeline</h2>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={criticalOnly}
            onChange={(e) => setCriticalOnly(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm font-medium text-gray-700">Critical Events Only</span>
        </label>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading timeline...</div>
      ) : displayedEvents.length > 0 ? (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 md:left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-300 via-purple-300 to-gray-300" />

          {/* Events */}
          <div className="space-y-4 md:space-y-6">
            {displayedEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative pl-16 md:pl-20"
              >
                {/* Timeline dot */}
                <div className={`absolute left-0 md:left-0.5 top-1 w-8 h-8 md:w-9 md:h-9 rounded-full border-4 border-white flex items-center justify-center ${getAccentColor(
                  event.event_type,
                  event.is_critical
                )} transform -translate-x-2 md:-translate-x-2.5`}>
                  <div className="text-white">
                    {getEventIcon(event.event_type)}
                  </div>
                </div>

                {/* Event card */}
                <motion.div
                  whileHover={{ scale: 1.02, shadow: '0 10px 20px rgba(0,0,0,0.1)' }}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition ${getEventColor(
                    event.event_type,
                    event.is_critical
                  )}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{event.title}</h3>
                      <p className="text-sm opacity-75">
                        {event.event_type_display || event.event_type}
                      </p>
                    </div>
                    {event.is_critical && (
                      <span className="flex items-center gap-1 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                        <AlertCircle className="w-3 h-3" />
                        CRITICAL
                      </span>
                    )}
                  </div>

                  {/* Date */}
                  <p className="text-xs opacity-60 mb-2 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(event.event_date).toLocaleString()}
                  </p>

                  {/* Description */}
                  {event.description && (
                    <p className="text-sm mb-3 bg-white bg-opacity-40 p-2 rounded">
                      {event.description}
                    </p>
                  )}

                  {/* Related Information */}
                  {(event.appointment ||
                    event.lab_result ||
                    event.dicom_study ||
                    event.prescription ||
                    event.consultation_note) && (
                    <div className="text-xs opacity-75 space-y-1 bg-white bg-opacity-30 p-2 rounded">
                      {event.appointment && (
                        <p>📋 Related to appointment (ID: {event.appointment})</p>
                      )}
                      {event.lab_result && (
                        <p>🔬 Lab result (ID: {event.lab_result})</p>
                      )}
                      {event.dicom_study && (
                        <p>🖼️ Imaging study (ID: {event.dicom_study})</p>
                      )}
                      {event.prescription && (
                        <p>💊 Prescription (ID: {event.prescription})</p>
                      )}
                      {event.consultation_note && (
                        <p>📝 Consultation note (ID: {event.consultation_note})</p>
                      )}
                    </div>
                  )}
                </motion.div>
              </motion.div>
            ))}
          </div>

          {/* Total events indicator */}
          <div className="mt-8 text-center text-sm text-gray-600">
            <p>
              Showing {displayedEvents.length} of {filteredEvents.length} events
              {criticalOnly && filteredEvents.length === 0 && ' • No critical events'}
            </p>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No events in patient history yet</p>
        </div>
      )}

      {/* Legend */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h3 className="font-semibold text-gray-800 mb-3">Event Types</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-sm">
          {[
            { type: 'appointment', label: 'Appointment' },
            { type: 'lab-result', label: 'Lab Result' },
            { type: 'imaging-study', label: 'Imaging' },
            { type: 'prescription', label: 'Prescription' },
            { type: 'consultation-note', label: 'Consultation' },
            { type: 'referral', label: 'Referral' },
            { type: 'vital-signs', label: 'Vital Signs' },
            { type: 'admission', label: 'Admission' },
          ].map((item) => (
            <div key={item.type} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getAccentColor(item.type, false)}`} />
              <span className="text-gray-700">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PatientHistoryTimeline;
