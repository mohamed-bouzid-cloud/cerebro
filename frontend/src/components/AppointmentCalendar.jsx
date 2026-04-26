import React, { useState, useEffect, useRef } from 'react';
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
  Calendar as CalendarIcon,
  LayoutGrid,
  Columns,
  Square,
  Activity,
  Microscope,
  Stethoscope,
  Move,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateMockAppointments } from '../mockData';
import AppointmentModal from './AppointmentModal';

const AppointmentCalendar = ({ patientId, isDoctor = false, doctorId }) => {
  const [view, setView] = useState('month'); // month, week, day
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [draggingAppointment, setDraggingAppointment] = useState(null);
  
  const [newAppointment, setNewAppointment] = useState({
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    type: 'doctor',
    modality: '',
    reason: '',
  });

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const url = isDoctor 
        ? `/api/auth/appointments/` 
        : `/api/auth/appointments/?patient_id=${patientId}`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      const data = await response.json();
      const aptData = Array.isArray(data) ? data : (data.results || []);
      setAppointments(aptData);
    } catch (error) {
      console.error('Fetch error:', error);
      setAppointments(generateMockAppointments());
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAppointments();
  }, [patientId, doctorId]);

  // --- Date Helpers ---
  const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  
  const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  };

  const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  const isSameDay = (d1, d2) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  // --- Handlers ---
  const handlePrev = () => {
    if (view === 'month') setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    else if (view === 'week') setCurrentDate(addDays(currentDate, -7));
    else setCurrentDate(addDays(currentDate, -1));
  };

  const handleNext = () => {
    if (view === 'month') setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    else if (view === 'week') setCurrentDate(addDays(currentDate, 7));
    else setCurrentDate(addDays(currentDate, 1));
  };

  const handleReschedule = async (appointmentId, newTimestamp) => {
    try {
      const response = await fetch(`/api/auth/appointments/${appointmentId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({ scheduled_at: newTimestamp }),
      });
      if (response.ok) fetchAppointments();
      else alert("Failed to reschedule: Conflict detected or outside working hours.");
    } catch (error) {
      console.error('Reschedule error:', error);
    }
  };

  // --- Drag and Drop ---
  const onDragStart = (e, apt) => {
    setDraggingAppointment(apt);
    e.dataTransfer.setData('text/plain', apt.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDrop = (e, date) => {
    e.preventDefault();
    if (!draggingAppointment) return;
    
    // Maintain the original time, but change the date
    const originalTime = new Date(draggingAppointment.scheduled_at).toISOString().split('T')[1];
    const newTimestamp = `${date.toISOString().split('T')[0]}T${originalTime}`;
    
    handleReschedule(draggingAppointment.id, newTimestamp);
    setDraggingAppointment(null);
  };

  const onDragOver = (e) => e.preventDefault();

  // --- Renderers ---
  const renderMonthView = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));

    return (
      <div className="grid grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-center font-bold text-gray-400 py-2 text-xs uppercase tracking-wider">{d}</div>
        ))}
        {days.map((date, i) => (
          <div
            key={i}
            onDragOver={onDragOver}
            onDrop={(e) => date && onDrop(e, date)}
            className={`min-h-[120px] p-2 border border-[#1e232d] rounded-xl transition-all ${
              !date ? 'bg-black/20' : 'bg-[#151821] hover:bg-white/5 cursor-pointer group'
            }`}
          >
            {date && (
              <>
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-sm font-medium ${isSameDay(date, new Date()) ? 'bg-indigo-600 text-white w-6 h-6 flex items-center justify-center rounded-full shadow-[0_0_10px_rgba(79,70,229,0.5)]' : 'text-gray-400'}`}>
                    {date.getDate()}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {appointments.filter(a => isSameDay(new Date(a.scheduled_at), date)).slice(0, 3).map(apt => (
                    <motion.div
                      key={apt.id}
                      draggable
                      onDragStart={(e) => onDragStart(e, apt)}
                      className={`text-[10px] uppercase font-bold tracking-widest p-1.5 rounded-lg border-l-2 truncate shadow-sm cursor-move flex items-center gap-1.5 ${
                        apt.appointment_type === 'imaging' ? 'bg-purple-500/10 border-purple-500 text-purple-400' :
                        apt.appointment_type === 'lab' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' :
                        'bg-indigo-500/10 border-indigo-500 text-indigo-400'
                      }`}
                    >
                      <Move className="w-2 h-2 opacity-30" />
                      {apt.imaging_modality || apt.appointment_type}
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderWeekView = () => {
    const startOfWeek = getStartOfWeek(currentDate);
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek, i));

    return (
      <div className="grid grid-cols-8 gap-2">
        <div className="col-span-1 border-r border-[#1e232d] pr-2">
          <div className="h-12"></div>
          {Array.from({ length: 12 }, (_, i) => i + 8).map(hour => (
            <div key={hour} className="h-20 text-[10px] text-gray-500 font-medium pt-1 border-t border-[#1e232d] uppercase">
              {hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
            </div>
          ))}
        </div>
        {weekDays.map(date => (
          <div key={date.toString()} className="col-span-1">
            <div className={`text-center mb-4 p-2 rounded-xl transition-colors ${isSameDay(date, new Date()) ? 'bg-indigo-500/20 text-indigo-400' : 'text-gray-400'}`}>
              <div className="text-[10px] uppercase tracking-widest font-bold opacity-60">{date.toLocaleDateString('default', { weekday: 'short' })}</div>
              <div className="text-lg font-black text-white">{date.getDate()}</div>
            </div>
            <div className="relative h-[960px] bg-[#0a0f14] rounded-2xl border border-dashed border-[#1e232d]" 
                 onDragOver={onDragOver} 
                 onDrop={(e) => onDrop(e, date)}>
              {appointments
                .filter(a => isSameDay(new Date(a.scheduled_at), date))
                .map(apt => {
                  const hour = new Date(apt.scheduled_at).getHours();
                  const mins = new Date(apt.scheduled_at).getMinutes();
                  if (hour < 8 || hour > 20) return null;
                  const top = (hour - 8) * 80 + (mins / 60) * 80;
                  return (
                    <motion.div
                      key={apt.id}
                      draggable
                      onDragStart={(e) => onDragStart(e, apt)}
                      className={`absolute w-[95%] left-[2.5%] p-2 rounded-xl border-l-2 shadow-lg cursor-move z-10 opacity-90 hover:opacity-100 ${
                        apt.appointment_type === 'imaging' ? 'bg-purple-900 border-purple-500 text-purple-100' :
                        apt.appointment_type === 'lab' ? 'bg-emerald-900 border-emerald-500 text-emerald-100' :
                        'bg-indigo-900 border-indigo-500 text-indigo-100'
                      }`}
                      style={{ top, height: (apt.duration_minutes / 60) * 80 }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold truncate">{apt.patient_name || 'Patient'}</span>
                        <Move className="w-3 h-3 opacity-50" />
                      </div>
                      <div className="text-[9px] opacity-80 flex items-center gap-1 font-medium">
                        <Clock className="w-2 h-2" /> {new Date(apt.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </motion.div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderDayView = () => {
    return (
      <div className="flex gap-6">
        <div className="w-1/4 space-y-4">
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-3xl p-6 shadow-xl shadow-indigo-900/20">
            <h3 className="text-4xl font-black mb-1">{currentDate.getDate()}</h3>
            <p className="opacity-80 font-medium tracking-wide">{currentDate.toLocaleDateString('default', { month: 'long', weekday: 'long' })}</p>
          </div>
          <div className="bg-[#151821] rounded-3xl p-6 border border-[#1e232d] shadow-sm">
            <h4 className="font-bold text-white mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-400" /> Quick Add
            </h4>
            <div className="space-y-3">
              <button 
                onClick={() => {setView('day'); setShowModal(true);}}
                className="w-full text-left p-3 rounded-2xl bg-[#0a0f14] border border-[#1e232d] hover:border-white/10 transition-colors flex items-center gap-3 group"
              >
                <Stethoscope className="w-5 h-5 text-indigo-400" />
                <div>
                  <div className="text-xs font-bold text-gray-300">Consultation</div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">Book doctor visit</div>
                </div>
              </button>
              <button 
                onClick={() => {setView('day'); setShowModal(true);}}
                className="w-full text-left p-3 rounded-2xl bg-[#0a0f14] border border-[#1e232d] hover:border-white/10 transition-colors flex items-center gap-3 group"
              >
                <Activity className="w-5 h-5 text-purple-400" />
                <div>
                  <div className="text-xs font-bold text-gray-300">Imaging</div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">MRI, CT, X-Ray...</div>
                </div>
              </button>
            </div>
          </div>
        </div>
        <div className="flex-1 bg-[#151821] rounded-3xl border border-[#1e232d] p-8 shadow-sm h-[600px] overflow-y-auto custom-scrollbar">
          {appointments
            .filter(a => isSameDay(new Date(a.scheduled_at), currentDate))
            .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))
            .map(apt => (
              <motion.div
                key={apt.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-6 mb-6 group"
              >
                <div className="w-20 text-right">
                  <div className="text-sm font-black text-white">{new Date(apt.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  <div className="text-[10px] font-bold text-indigo-400">{apt.duration_minutes}m</div>
                </div>
                <div className="relative flex-1 bg-[#0a0f14] p-4 rounded-3xl group-hover:bg-white/5 transition-all border border-[#1e232d] group-hover:border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white flex items-center gap-2">
                        {apt.appointment_type === 'imaging' ? <Activity className="w-4 h-4 text-purple-400" /> : <Stethoscope className="w-4 h-4 text-indigo-400" />}
                        {apt.patient_name || 'Patient Name'}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest">{apt.reason || 'Routine checkup'}</p>
                    </div>
                    {apt.imaging_modality && (
                      <span className="bg-purple-500/10 border border-purple-500/30 text-purple-400 text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest">{apt.imaging_modality}</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          {appointments.filter(a => isSameDay(new Date(a.scheduled_at), currentDate)).length === 0 && (
            <div className="h-full flex flex-col items-center justify-center opacity-30">
              <CalendarIcon className="w-16 h-16 mb-4" />
              <p className="font-bold">No appointments for today</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-[#0f1117] p-6 rounded-[2rem] border border-[#1e232d] shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-500/20 border border-indigo-500/30 rounded-2xl shadow-lg">
            <CalendarIcon className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Clinical Calendar</h1>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-0.5">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-[#151821] p-1.5 rounded-2xl border border-[#1e232d]">
          {[
            { id: 'month', icon: LayoutGrid, label: 'Month' },
            { id: 'week', icon: Columns, label: 'Week' },
            { id: 'day', icon: Square, label: 'Day' }
          ].map(m => (
            <button
              key={m.id}
              onClick={() => setView(m.id)}
              className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black transition-all ${
                view === m.id ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-md' : 'text-gray-500 hover:text-white'
              }`}
            >
              <m.icon className="w-4 h-4" />
              {m.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[#151821] rounded-2xl p-1 border border-[#1e232d]">
            <button onClick={handlePrev} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"><ChevronLeft className="w-5 h-5" /></button>
            <button onClick={() => setCurrentDate(new Date())} className="px-4 text-[10px] font-black text-white uppercase tracking-widest">Today</button>
            <button onClick={handleNext} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"><ChevronRight className="w-5 h-5" /></button>
          </div>
          {isDoctor && (
            <button 
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl shadow-[0_0_15px_rgba(99,102,241,0.3)] font-bold flex items-center gap-2 transition-all transform hover:scale-105"
            >
              <Plus className="w-5 h-5" /> Schedule
            </button>
          )}
        </div>
      </div>

      {/* CALENDAR MAIN GRID */}
      <AnimatePresence mode="wait">
        <motion.div
           key={view + currentDate.toString()}
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           exit={{ opacity: 0, y: -10 }}
           className="bg-[#0f1117] rounded-[2.5rem] border border-[#1e232d] p-8 shadow-2xl min-h-[700px]"
        >
          {view === 'month' && renderMonthView()}
          {view === 'week' && renderWeekView()}
          {view === 'day' && renderDayView()}
        </motion.div>
      </AnimatePresence>

      {/* UNIFIED APPOINTMENT MODAL */}
      <AppointmentModal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        doctorId={doctorId || 'DOCTOR-001'}
        doctorName="Clinical Specialist"
        patientId={patientId || 'PATIENT-001'}
        onSuccess={fetchAppointments}
      />
    </div>
  );
};

export default AppointmentCalendar;
