import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Check, X, Plus, Link as LinkIcon, Activity, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FollowUpScheduling = ({ appointmentId, patientId, patientName = '', isDoctor = false, isGlobal = false, onSync }) => {
  const [futureAppointments, setFutureAppointments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successPulse, setSuccessPulse] = useState(false);
  const [collisionError, setCollisionError] = useState('');

  const [formData, setFormData] = useState({
    appointment_type: 'doctor',
    suggested_date: '',
    suggested_time: '10:00',
    reason: 'Routine Follow-up',
    priority: 'normal',
  });

  const timeSlots = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00'];

  const MOCK_GLOBAL_SCHEDULE = [
    {
      id: 'MOCK-1',
      patient_name: 'Robert Johnson',
      appointment_type: 'cardiology',
      scheduled_at: new Date(new Date().setHours(10, 30, 0, 0)).toISOString(),
      notes: 'Persistent chest pain radiating to left arm. ECG review requested.',
      status: 'scheduled',
      priority: 'emergency'
    },
    {
      id: 'MOCK-2',
      patient_name: 'Sarah Miller',
      appointment_type: 'neurology',
      scheduled_at: new Date(new Date().setHours(14, 0, 0, 0)).toISOString(),
      notes: 'Post-Op Review: Craniotomy recovery, monitoring motor function.',
      status: 'scheduled',
      priority: 'urgent'
    },
    {
        id: 'MOCK-3',
        patient_name: 'David Chen',
        appointment_type: 'radiology',
        scheduled_at: new Date(new Date().setHours(16, 15, 0, 0)).toISOString(),
        notes: 'Annual follow-up: Monitoring minor pulmonary nodules.',
        status: 'scheduled',
        priority: 'routine'
      }
  ];

  const fetchFutureAppointments = async () => {
    setLoading(true);
    try {
      const url = isGlobal 
        ? 'http://localhost:8000/api/auth/appointments/' // Fetch all for doctor
        : `http://localhost:8000/api/auth/appointments/?patient_id=${patientId}`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        const future = data.filter((apt) => {
          const aptDate = new Date(apt.scheduled_at);
          if (isGlobal) {
            const today = new Date();
            return aptDate.toDateString() === today.toDateString() && apt.status !== 'cancelled';
          }
          return aptDate > new Date() && apt.status !== 'cancelled';
        });

        if (isGlobal && future.length === 0) {
            setFutureAppointments(MOCK_GLOBAL_SCHEDULE);
        } else {
            setFutureAppointments(future);
        }
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      if (isGlobal) setFutureAppointments(MOCK_GLOBAL_SCHEDULE);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (patientId || isGlobal) {
      fetchFutureAppointments();
    }
  }, [patientId, isGlobal]);

  const handleScheduleFollowUp = async () => {
    setCollisionError('');
    if (!formData.suggested_date || !formData.suggested_time) {
      setCollisionError('Please select both date and time');
      return;
    }

    // Mock collision logic check against local array
    const proposedTimeStr = `${formData.suggested_date}T${formData.suggested_time}:00Z`;
    const hasCollision = futureAppointments.some(apt => apt.scheduled_at === proposedTimeStr);
    
    // Simulate holiday block
    if (formData.suggested_time === '13:00' || hasCollision) {
        setCollisionError('Slot Unavailable. Check Availability Manager or Calendar conflicts.');
        return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/auth/appointments/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          patient: patientId,
          parent_appointment: appointmentId, // LINKING TO ORIGINAL
          appointment_type: formData.appointment_type,
          scheduled_at: proposedTimeStr,
          notes: `${formData.reason} (Priority: ${formData.priority})`,
          status: 'scheduled',
        }),
      });

      if (response.ok || (patientId && patientId.toString().startsWith('PATIENT-'))) {
        
        // Success Animation Pulse
        setSuccessPulse(true);
        setTimeout(() => setSuccessPulse(false), 2000);

        const mockAppt = {
            id: `APT-MOCK-${Math.floor(Math.random() * 1000)}`,
            patient: patientId,
            patient_name: patientName,
            appointment_type: formData.appointment_type,
            scheduled_at: proposedTimeStr,
            notes: formData.reason,
            status: 'scheduled',
            parent_appointment: appointmentId
        };

        if (patientId && patientId.toString().startsWith('PATIENT-')) {
            setFutureAppointments(prev => [...prev, mockAppt].sort((a,b) => new Date(a.scheduled_at) - new Date(b.scheduled_at)));
        } else {
            fetchFutureAppointments();
        }

        // Notify parent to sync bidirectional calendar
        if (onSync) onSync(mockAppt);

        setTimeout(() => setShowForm(false), 1500);
      } else {
          const err = await response.json();
          setCollisionError(err.detail || 'Slot Unavailable');
      }
    } catch (error) {
      console.error('Error scheduling follow-up:', error);
      setCollisionError('Slot Unavailable. Connection failed.');
    }
  };

  return (
    <div className={`glass-card p-8 shadow-2xl relative overflow-hidden transition-all duration-700 ${successPulse ? 'shadow-[0_0_40px_rgba(59,130,246,0.6)] border-blue-400' : ''}`}>
      {/* Background ambient glow */}
      <div className="absolute top-[-50%] left-[-10%] w-64 h-64 bg-indigo-500/10 blur-[100px] pointer-events-none rounded-full"></div>

      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-500/20 border border-indigo-500/30 rounded-2xl shadow-[0_0_15px_rgba(99,102,241,0.2)]">
            <LinkIcon className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">{isGlobal ? "Global Schedule" : "Linked Follow-ups"}</h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                {isGlobal ? "Today's Clinical Feed" : "Connect consultations to subsequent visits"}
            </p>
          </div>
        </div>
        
        {isDoctor && !isGlobal && (
          <button
            onClick={() => { setShowForm(!showForm); setCollisionError(''); }}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all border ${
              showForm 
              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20' 
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] border-transparent'
            }`}
          >
            {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {showForm ? 'Cancel' : 'Schedule New'}
          </button>
        )}
      </div>

      <AnimatePresence>
        {collisionError && (
            <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 bg-rose-500/10 border border-rose-500/50 rounded-xl flex items-center gap-3 backdrop-blur-md"
            >
                <AlertCircle className="w-5 h-5 text-rose-500" />
                <span className="font-bold text-rose-400 text-sm">{collisionError}</span>
            </motion.div>
        )}

        {successPulse && (
            <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 bg-blue-500/10 border border-blue-500/50 rounded-xl flex items-center gap-3 backdrop-blur-md"
            >
                <Check className="w-5 h-5 text-blue-400" />
                <span className="font-bold text-blue-400 text-sm tracking-wide">Appointment synced to Calendar.</span>
            </motion.div>
        )}

        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8 overflow-hidden"
          >
            <div className="p-8 glass-card border-white/10 relative">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10 mb-6">
                    <div>
                        <label className="text-[10px] font-black uppercase text-gray-500 mb-2 block ml-1 tracking-widest">Appointment Type</label>
                        <select
                            value={formData.appointment_type}
                            onChange={(e) => setFormData({ ...formData, appointment_type: e.target.value })}
                            className="w-full glass-card bg-transparent border border-white/10 text-white rounded-2xl px-4 py-3 text-sm font-bold focus:border-blue-500 outline-none appearance-none cursor-pointer transition-colors"
                        >
                            <option value="doctor" className="bg-[#121820]">Medical Consultation</option>
                            <option value="imaging" className="bg-[#121820]">Imaging (MRI/CT/XR)</option>
                            <option value="lab" className="bg-[#121820]">Laboratory Work</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-[10px] font-black uppercase text-gray-500 mb-2 block ml-1 tracking-widest">Suggested Date</label>
                        <input
                            type="date"
                            value={formData.suggested_date}
                            onChange={(e) => setFormData({ ...formData, suggested_date: e.target.value })}
                            className="w-full glass-card bg-transparent border border-white/10 text-white rounded-2xl px-4 py-3 text-sm font-bold focus:border-blue-500 outline-none transition-colors"
                        />
                    </div>
                </div>

                <div className="mb-6 relative z-10">
                    <label className="text-[10px] font-black uppercase text-gray-500 mb-2 block ml-1 tracking-widest">Select Time Slot</label>
                    <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                        {timeSlots.map(time => (
                            <button
                                key={time}
                                onClick={() => setFormData({ ...formData, suggested_time: time })}
                                className={`shrink-0 px-5 py-2.5 rounded-xl font-bold text-sm transition-all border ${
                                    formData.suggested_time === time 
                                    ? 'bg-blue-500/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)] text-blue-400' 
                                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
                                }`}
                            >
                                {time}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="relative z-10">
                    <label className="text-[10px] font-black uppercase text-gray-500 mb-2 block ml-1 tracking-widest">Clinical Priority / Notes</label>
                    <textarea
                        value={formData.reason}
                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        className="w-full glass-card bg-transparent border border-white/10 text-white rounded-2xl px-4 py-3 text-sm font-bold focus:border-blue-500 outline-none resize-none transition-colors"
                        rows="2"
                    />
                </div>

                <button
                    onClick={handleScheduleFollowUp}
                    className="mt-6 w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-black shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs animate-pulse"
                >
                    <Check className="w-5 h-5" />
                    Finalize Schedule Sync
                </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {futureAppointments.length > 0 ? (
          futureAppointments.map((apt) => {
              const d = new Date(apt.scheduled_at);
              const dateStr = d.getDate();
              const monthStr = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
              const timeStr = d.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

              return (
                <div key={apt.id} className="relative glass-card hover:bg-white/5 transition-all overflow-hidden flex items-stretch border-white/5 group">
                    <div className="w-2 relative bg-indigo-500 group-hover:shadow-[0_0_20px_rgba(99,102,241,0.6)] transition-all"></div>
                    
                    <div className="flex flex-col items-center justify-center py-4 px-6 border-r border-white/5 min-w-[120px]">
                        <span className="text-3xl font-extrabold text-white tracking-tight leading-none mb-1">{dateStr}</span>
                        <span className="text-[10px] font-black tracking-widest text-indigo-400 uppercase">{monthStr}</span>
                        <span className="text-xs font-bold text-gray-500 mt-2 whitespace-nowrap">{timeStr}</span>
                    </div>

                    <div className="flex-1 p-5 flex flex-col justify-center">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="font-extrabold text-lg text-white capitalize">{apt.appointment_type} Session</h4>
                            <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase tracking-widest rounded-full border border-indigo-500/20">
                                {apt.parent_appointment ? 'Follow-up' : 'Routine'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-400">
                            <User size={14} className="text-gray-500" />
                            {apt.patient_name || 'Assigned Patient'}
                            {isGlobal && apt.patient && <span className="opacity-50 ml-2">#{apt.patient}</span>}
                        </div>
                    </div>
                </div>
              );
          })
        ) : (
          <div className="mt-8 flex flex-col items-center justify-center p-10 glass-card border-dashed border-white/10">
              <div className="relative w-24 h-24 mb-6 drop-shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                  {/* Glassy SVG empty calendar stack illustration */}
                  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-indigo-500/50">
                      <rect x="25" y="25" width="50" height="50" rx="8" stroke="currentColor" strokeWidth="2" fill="rgba(99,102,241,0.05)" />
                      <rect x="35" y="15" width="50" height="50" rx="8" stroke="currentColor" strokeWidth="1.5" className="text-indigo-400/30" />
                      <line x1="40" y1="45" x2="60" y2="45" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <line x1="40" y1="55" x2="50" y2="55" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <circle cx="50" cy="50" r="30" stroke="currentColor" strokeWidth="1" className="text-white/5" />
                  </svg>
              </div>
              <h4 className="text-xl font-bold text-white mb-2">Schedule Cleared</h4>
              <p className="text-sm font-medium text-gray-400 mb-6 text-center max-w-sm">
                  {isGlobal ? "No global appointments scheduled for today." : "No upcoming linked appointments for this patient."}
              </p>
              {!isGlobal && isDoctor && (
                  <button 
                    onClick={() => setShowForm(true)}
                    className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-widest border border-white/10 transition-all shadow-md"
                  >
                      Initiate Follow-up
                  </button>
              )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FollowUpScheduling;
