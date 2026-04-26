import React, { useState, useEffect } from 'react';
import { Clock, Check, X, Calendar, Save, AlertCircle, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../api';

const AvailabilityManager = ({ doctorId }) => {
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [outOfOffice, setOutOfOffice] = useState(false);

  const days = [
    { id: 0, name: 'Monday' },
    { id: 1, name: 'Tuesday' },
    { id: 2, name: 'Wednesday' },
    { id: 3, name: 'Thursday' },
    { id: 4, name: 'Friday' },
    { id: 5, name: 'Saturday' },
    { id: 6, name: 'Sunday' },
  ];

  const fetchAvailability = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/api/auth/availability/');
      setAvailability(data);
    } catch (error) {
      console.error('Error fetching availability:', error);
    }
    setLoading(false);
  };

  const fetchProfile = async () => {
    try {
      const { data } = await API.get('/api/auth/me/');
      if (data.profile) {
        setOutOfOffice(data.profile.is_out_of_office);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  useEffect(() => {
    fetchAvailability();
    fetchProfile();
  }, [doctorId]);

  const handleUpdateSlot = (id, field, value) => {
    setAvailability(prev => prev.map(slot => 
      slot.id === id ? { ...slot, [field]: value } : slot
    ));
  };

  const handleAddNewSlot = (dayId) => {
    const newSlot = {
      id: `new-${Date.now()}`,
      day_of_week: dayId,
      start_time: '09:00',
      end_time: '17:00',
      is_active: true,
      isNew: true
    };
    setAvailability([...availability, newSlot]);
  };

  const handleRemoveSlot = (id) => {
    setAvailability(prev => prev.filter(slot => slot.id !== id));
  };

  const handleSave = async () => {
    // 1. Basic Client-side Validation (Overlaps)
    const dayGroups = {};
    availability.forEach(slot => {
        if (!dayGroups[slot.day_of_week]) dayGroups[slot.day_of_week] = [];
        
        // Check for exact start time duplicates within the same day
        const isDuplicate = dayGroups[slot.day_of_week].some(s => s.start_time === slot.start_time);
        if (isDuplicate) {
            setMessage({ type: 'error', text: `Duplicate start time found for ${days.find(d => d.id === slot.day_of_week).name}.` });
            return;
        }
        dayGroups[slot.day_of_week].push(slot);
    });

    if (message.type === 'error') return;

    setSaving(true);
    try {
      const response = await fetch('/api/auth/availability/bulk_sync/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify(availability.map(slot => ({
          day_of_week: slot.day_of_week,
          start_time: slot.start_time,
          end_time: slot.end_time,
          is_active: slot.is_active
        }))),
      });

      let result = null;
      const contentType = response.headers.get('content-type');
      
        const payload = availability.map(({ day_of_week, start_time, end_time, is_active }) => ({
            day_of_week,
            start_time,
            end_time,
            is_active
        }));
        
        await API.post('/api/auth/availability/bulk_sync/', payload);
        setMessage({ type: 'success', text: 'Working hours updated successfully.' });
        fetchAvailability();
    } catch (error) {
        console.error('Save error:', error);
        setMessage({ type: 'error', text: error.response?.data?.error || error.message });
    }
    setSaving(false);
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleToggleHoliday = async () => {
    const previousState = outOfOffice;
    setOutOfOffice(!previousState);
    try {
      await API.post('/api/auth/availability/toggle_holiday/');
      setMessage({ type: 'success', text: `You are now ${!previousState ? 'Out of Office' : 'Back in Office'}.` });
    } catch (error) {
      setOutOfOffice(previousState);
      setMessage({ type: 'error', text: 'Failed to update status.' });
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleGenerateDefault = () => {
    const defaultSchedule = [];
    // Mon-Fri (0-4)
    for (let i = 0; i <= 4; i++) {
        defaultSchedule.push({
            id: `temp-${i}`,
            day_of_week: i,
            start_time: '09:00',
            end_time: '17:00',
            is_active: true
        });
    }
    setAvailability(defaultSchedule);
    setMessage({ type: 'success', text: 'Default 9-5 schedule generated. Press Save to finalize.' });
  };

  return (
    <div className="bg-[#0f1117] border border-[#1e232d] rounded-[2.5rem] p-8 shadow-xl max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl">
            <Clock className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Working Hours</h2>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-0.5">Manage your clinical availability</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          {availability.length === 0 && (
            <button
              onClick={handleGenerateDefault}
              className="px-6 py-3 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-2xl font-bold text-sm transition-all"
            >
              Quick Setup (9-5 Mon-Fri)
            </button>
          )}
          <label className="flex items-center gap-2 cursor-pointer group">
            <input 
                type="checkbox" 
                className="hidden" 
                checked={outOfOffice} 
                onChange={handleToggleHoliday}
            />
            <div className={`relative w-12 h-6 rounded-full transition-colors ${outOfOffice ? 'bg-amber-500' : 'bg-[#1e232d]'}`}>
                <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${outOfOffice ? 'translate-x-6' : ''}`}></div>
            </div>
            <span className={`text-sm font-bold ${outOfOffice ? 'text-amber-400' : 'text-gray-500 group-hover:text-gray-300'}`}>Out of Office</span>
          </label>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all disabled:opacity-50"
          >
            {saving ? 'Saving...' : <><Save className="w-5 h-5" /> Save Changes</>}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {message.text && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`mb-6 p-4 rounded-2xl flex items-center gap-3 font-bold text-sm ${
              message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}
          >
            {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`space-y-4 transition-opacity duration-300 ${outOfOffice ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
        {days.map(day => {
            const daySlots = availability.filter(s => s.day_of_week === day.id);
            const isHoliday = daySlots.length === 0;

            return (
          <div key={day.id} className={`group relative p-6 rounded-3xl border transition-all overflow-hidden ${
              isHoliday 
              ? 'bg-amber-500/5 border-amber-500/10' 
              : 'bg-[#151821] border-[#1e232d] hover:border-white/10 hover:bg-white/5 shadow-lg'
          }`}>
            {/* Holiday Mode Stripe Overlay */}
            {isHoliday && (
                <div 
                    className="absolute inset-0 pointer-events-none opacity-10"
                    style={{
                        backgroundImage: 'repeating-linear-gradient(45deg, #f59e0b 0, #f59e0b 10px, transparent 10px, transparent 20px)'
                    }}
                ></div>
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="w-32">
                <span className={`text-sm font-black ${isHoliday ? 'text-amber-500' : 'text-white'}`}>{day.name}</span>
              </div>
              
              <div className="flex-1 space-y-3">
                {daySlots.map((slot, index) => (
                  <div key={slot.id}>
                      <div className="flex items-center gap-4">
                        <input 
                          type="time" 
                          value={slot.start_time.substring(0, 5)}
                          onChange={(e) => handleUpdateSlot(slot.id, 'start_time', e.target.value)}
                          className="bg-[#0a0f14] border border-[#1e232d] text-white rounded-xl px-4 py-2 text-sm font-bold shadow-sm focus:border-indigo-500 outline-none"
                        />
                        <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">to</span>
                        <input 
                          type="time" 
                          value={slot.end_time.substring(0, 5)}
                          onChange={(e) => handleUpdateSlot(slot.id, 'end_time', e.target.value)}
                          className="bg-[#0a0f14] border border-[#1e232d] text-white rounded-xl px-4 py-2 text-sm font-bold shadow-sm focus:border-indigo-500 outline-none"
                        />
                        <button 
                          onClick={() => handleRemoveSlot(slot.id)}
                          className="p-2 text-red-400 bg-red-500/5 hover:bg-red-500/20 rounded-lg transition-colors border border-transparent hover:border-red-500/30"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      {/* 5-Min Buffer visual between consecutive slots */}
                      {index < daySlots.length - 1 && (
                          <div className="pl-6 py-2 flex items-center gap-2">
                              <div className="w-px h-6 bg-indigo-500/30"></div>
                              <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20 uppercase tracking-widest">5-Min Buffer</span>
                          </div>
                      )}
                  </div>
                ))}
                {isHoliday && (
                  <span className="text-[10px] font-black text-amber-500/60 uppercase tracking-[0.2em] italic flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Clinic Closed
                  </span>
                )}
              </div>

              <button 
                onClick={() => handleAddNewSlot(day.id)}
                className="p-3 bg-[#0a0f14] border border-[#1e232d] text-gray-500 hover:bg-indigo-600 hover:text-white rounded-2xl transition-all relative z-10"
                title="Add Shift"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        )})}
      </div>

      <div className="mt-8 p-6 bg-indigo-500/10 rounded-3xl border border-indigo-500/20">
        <div className="flex items-center gap-3 mb-2">
          <AlertCircle className="w-5 h-5 text-indigo-400" />
          <h4 className="font-bold text-indigo-400 text-sm">Scheduling Best Practices</h4>
        </div>
        <p className="text-xs font-medium text-gray-400 leading-relaxed">
          The system uses these hours to prevent double-bookings and ensure patients can only request appointments when you are on-site. Any changes made here will immediately affect the vacancy check for new bookings.
        </p>
      </div>
    </div>
  );
};

export default AvailabilityManager;
