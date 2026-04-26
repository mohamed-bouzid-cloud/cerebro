import React, { useState, useEffect } from 'react';
import { Pill, Plus, Save, X, Trash2, Edit2, Copy } from 'lucide-react';
import { motion } from 'framer-motion';
import { generateMockPrescriptions } from '../mockData';

const EPrescriptionForm = ({ patientId, patientName = '', isDoctor = false }) => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    medication_name: '',
    dosage: '',
    route: 'oral',
    frequency: 'once-daily',
    duration_days: 30,
    quantity: 30,
    refills_remaining: 0,
    status: 'active',
    notes: '',
    start_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
  });

  const getMockPrescriptionsForPatient = (pid) => {
    const allMock = generateMockPrescriptions();
    const patientRx = allMock.filter(p => p.patient === pid);
    return patientRx.length > 0 ? patientRx : [allMock[0]];
  };

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/auth/prescriptions/?patient_id=${patientId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      const data = await response.json();
      const filtered = Array.isArray(data) ? data.filter((p) => p.status !== 'cancelled') : [];
      if (filtered.length > 0) {
        setPrescriptions(filtered);
      } else {
        setPrescriptions(getMockPrescriptionsForPatient(patientId));
      }
    } catch (error) {
      // Backend unreachable, use mock data
      setPrescriptions(getMockPrescriptionsForPatient(patientId));
    }
    setLoading(false);
  };

  useEffect(() => {
    if (patientId) {
      fetchPrescriptions();
    }
  }, [patientId]);

  const calculateExpiryDate = (startDate, durationDays) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + durationDays);
    return date.toISOString().split('T')[0];
  };

  const handleDurationChange = (duration) => {
    setFormData({
      ...formData,
      duration_days: duration,
      expiry_date: calculateExpiryDate(formData.start_date, duration),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingId ? `/api/auth/prescriptions/${editingId}/` : '/api/auth/prescriptions/';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
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
        fetchPrescriptions();
        setShowForm(false);
        setEditingId(null);
        setFormData({
          medication_name: '',
          dosage: '',
          route: 'oral',
          frequency: 'once-daily',
          duration_days: 30,
          quantity: 30,
          refills_remaining: 0,
          status: 'active',
          notes: '',
          start_date: new Date().toISOString().split('T')[0],
          expiry_date: '',
        });
      }
    } catch (error) {
      console.error('Error saving prescription:', error);
      alert('Error saving prescription');
    }
  };

  const handleEdit = (prescription) => {
    setEditingId(prescription.id);
    setFormData({
      medication_name: prescription.medication_name,
      dosage: prescription.dosage,
      route: prescription.route,
      frequency: prescription.frequency,
      duration_days: prescription.duration_days,
      quantity: prescription.quantity,
      refills_remaining: prescription.refills_remaining,
      status: prescription.status,
      notes: prescription.notes,
      start_date: prescription.start_date,
      expiry_date: prescription.expiry_date,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to cancel this prescription?')) {
      try {
        const response = await fetch(`/api/auth/prescriptions/${id}/`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
          body: JSON.stringify({ status: 'cancelled' }),
        });
        if (response.ok) {
          fetchPrescriptions();
        }
      } catch (error) {
        console.error('Error cancelling prescription:', error);
      }
    }
  };

  const getFrequencyLabel = (freq) => {
    const labels = {
      'once-daily': '1x Daily',
      'twice-daily': '2x Daily',
      'three-times-daily': '3x Daily',
      'four-times-daily': '4x Daily',
      'as-needed': 'As Needed',
    };
    return labels[freq] || freq;
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
      completed: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
      cancelled: 'bg-red-500/10 border-red-500/20 text-red-400',
      draft: 'bg-gray-500/10 border-gray-500/20 text-gray-400',
    };
    return colors[status] || 'bg-[#151821] border-[#1e232d] text-gray-400';
  };

  const isExpired = (expiryDate) => {
    return new Date(expiryDate) < new Date();
  };

  return (
    <div className="glass-card p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5 relative z-10">
        <h2 className="text-xl font-bold text-white flex items-center gap-3 drop-shadow-md">
          <Pill className="w-5 h-5 text-indigo-500" />
          E-Prescriptions
        </h2>
        {isDoctor && (
          <button
            onClick={() => {
              setEditingId(null);
              setFormData({
                medication_name: '',
                dosage: '',
                route: 'oral',
                frequency: 'once-daily',
                duration_days: 30,
                quantity: 30,
                refills_remaining: 0,
                status: 'active',
                notes: '',
                start_date: new Date().toISOString().split('T')[0],
                expiry_date: '',
              });
              setShowForm(!showForm);
            }}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium border ${
              showForm 
                ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20' 
                : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20'
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
                New Prescription
              </>
            )}
          </button>
        )}
      </div>

      {patientName && (
        <div className="bg-[#121822]/80 backdrop-blur border border-white/5 shadow-md rounded-xl p-3 mb-6 flex items-center gap-3 relative z-10">
          <div className="p-1.5 bg-black/20 rounded-lg">
            <Pill className="w-4 h-4 text-indigo-400" />
          </div>
          <span className="text-sm font-semibold text-gray-400">
            Patient: <span className="font-bold text-white tracking-wide ml-1">{patientName}</span>
          </span>
        </div>
      )}

      {/* Prescription Form */}
      {showForm && isDoctor && (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-[#121822] to-[#151821] border border-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.4)] rounded-xl p-6 mb-8 relative z-10"
        >
          <h3 className="font-bold text-white tracking-wide mb-5">
            {editingId ? 'Edit Prescription' : 'Create New Prescription'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Medication Name *
                </label>
                <input
                  type="text"
                  value={formData.medication_name}
                  onChange={(e) => setFormData({ ...formData, medication_name: e.target.value })}
                  placeholder="e.g., Amoxicillin"
                  className="w-full px-3 py-2.5 bg-[#0a0f14] border border-[#1e232d] text-white rounded-lg focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Dosage *</label>
                <input
                  type="text"
                  value={formData.dosage}
                  onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                  placeholder="e.g., 500mg"
                  className="w-full px-3 py-2.5 bg-[#0a0f14] border border-[#1e232d] text-white rounded-lg focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Route</label>
                <select
                  value={formData.route}
                  onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                  className="w-full px-3 py-2.5 bg-[#0a0f14] border border-[#1e232d] text-white rounded-lg focus:outline-none focus:border-indigo-500"
                >
                  <option value="oral">Oral</option>
                  <option value="intravenous">Intravenous</option>
                  <option value="intramuscular">Intramuscular</option>
                  <option value="subcutaneous">Subcutaneous</option>
                  <option value="topical">Topical</option>
                  <option value="inhalation">Inhalation</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Frequency</label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  className="w-full px-3 py-2.5 bg-[#0a0f14] border border-[#1e232d] text-white rounded-lg focus:outline-none focus:border-indigo-500"
                >
                  <option value="once-daily">Once Daily</option>
                  <option value="twice-daily">Twice Daily</option>
                  <option value="three-times-daily">Three Times Daily</option>
                  <option value="four-times-daily">Four Times Daily</option>
                  <option value="as-needed">As Needed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Duration (days)</label>
                <select
                  value={formData.duration_days}
                  onChange={(e) => handleDurationChange(parseInt(e.target.value))}
                  className="w-full px-3 py-2.5 bg-[#0a0f14] border border-[#1e232d] text-white rounded-lg focus:outline-none focus:border-indigo-500"
                >
                  <option value="7">7 days</option>
                  <option value="14">14 days</option>
                  <option value="30">30 days</option>
                  <option value="60">60 days</option>
                  <option value="90">90 days</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Quantity</label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                  placeholder="Count"
                  className="w-full px-3 py-2.5 bg-[#0a0f14] border border-[#1e232d] text-white rounded-lg focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Refills</label>
                <input
                  type="number"
                  value={formData.refills_remaining}
                  onChange={(e) =>
                    setFormData({ ...formData, refills_remaining: parseInt(e.target.value) })
                  }
                  placeholder="Number of refills"
                  className="w-full px-3 py-2.5 bg-[#0a0f14] border border-[#1e232d] text-white rounded-lg focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Start Date</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      start_date: e.target.value,
                      expiry_date: calculateExpiryDate(e.target.value, formData.duration_days),
                    })
                  }
                  className="w-full px-3 py-2.5 bg-[#0a0f14] border border-[#1e232d] text-white rounded-lg focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Additional Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="e.g., Take with food, avoid dairy products"
                className="w-full px-3 py-2.5 bg-[#0a0f14] border border-[#1e232d] text-white rounded-lg focus:outline-none focus:border-indigo-500 resize-none h-20"
              />
            </div>

            <div className="bg-black/20 border border-white/5 p-3 rounded-lg text-xs font-bold text-gray-400 uppercase tracking-widest flex justify-between items-center">
              <span>Expiry Date computed</span>
              <span className="text-white bg-black/40 px-3 py-1 rounded">{formData.expiry_date}</span>
            </div>

            <div className="flex gap-3 pt-3 border-t border-[#1e232d]">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                className="flex-1 px-4 py-2 border border-[#1e232d] text-gray-300 rounded-lg hover:bg-white/5 transition flex items-center justify-center gap-2 font-medium text-sm"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-lg hover:bg-indigo-500/30 transition flex items-center justify-center gap-2 font-medium text-sm"
              >
                <Save className="w-4 h-4" />
                {editingId ? 'Update' : 'Create'} Prescription
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Prescriptions List */}
      {/* Prescriptions List */}
      <div>
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
          {loading ? 'Loading...' : `Active Prescriptions (${prescriptions.length})`}
        </h3>
        {loading ? (
          <div className="text-center py-4 text-gray-500 text-sm">Loading prescriptions...</div>
        ) : prescriptions.length > 0 ? (
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
            {prescriptions.map((prescription) => (
              <motion.div
                key={prescription.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-5 rounded-xl shadow-md backdrop-blur-sm relative z-10 border ${getStatusColor(prescription.status)}`}
              >
                <div className="flex items-start justify-between mb-4 border-b border-white/10 pb-3">
                  <div className="flex-1">
                    <h4 className="font-bold text-lg text-white tracking-wide">{prescription.medication_name}</h4>
                    <p className="text-sm opacity-80 mt-1 uppercase tracking-wider text-xs">
                      {prescription.dosage} • {prescription.route}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded border font-bold uppercase tracking-widest block mb-1.5 ${
                        prescription.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : prescription.status === 'completed'
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          : 'bg-red-500/10 text-red-500 border-red-500/20'
                      }`}
                    >
                      {prescription.status}
                    </span>
                    {isExpired(prescription.expiry_date) && prescription.status === 'active' && (
                      <span className="text-[9px] bg-red-500/20 text-red-500 border border-red-500/30 px-2 py-0.5 rounded font-bold uppercase tracking-widest shadow-[0_0_8px_rgba(239,68,68,0.3)]">
                        Expired
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="bg-black/20 p-2 rounded-lg border border-white/5">
                    <p className="text-[10px] uppercase font-bold tracking-widest opacity-60 mb-1">Frequency</p>
                    <p className="font-bold text-white text-sm">{getFrequencyLabel(prescription.frequency)}</p>
                  </div>
                  <div className="bg-black/20 p-2 rounded-lg border border-white/5">
                    <p className="text-[10px] uppercase font-bold tracking-widest opacity-60 mb-1">Duration</p>
                    <p className="font-bold text-white text-sm">{prescription.duration_days} days</p>
                  </div>
                  <div className="bg-black/20 p-2 rounded-lg border border-white/5">
                    <p className="text-[10px] uppercase font-bold tracking-widest opacity-60 mb-1">Quantity</p>
                    <p className="font-bold text-white text-sm">{prescription.quantity}</p>
                  </div>
                  <div className="bg-black/20 p-2 rounded-lg border border-white/5">
                    <p className="text-[10px] uppercase font-bold tracking-widest opacity-60 mb-1">Refills</p>
                    <p className="font-bold text-white text-sm">{prescription.refills_remaining}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest opacity-60 mb-4 bg-black/10 w-fit px-3 py-1.5 rounded border border-white/5">
                  <span className="text-white">Start: {new Date(prescription.start_date).toLocaleDateString()}</span>
                  <span className="opacity-50">→</span>
                  <span className="text-white">Exp: {new Date(prescription.expiry_date).toLocaleDateString()}</span>
                </div>

                {prescription.notes && (
                  <p className="text-sm italic bg-black/20 border border-white/5 p-3 rounded-lg mb-3 opacity-90 text-gray-300">
                    {prescription.notes}
                  </p>
                )}

                {isDoctor && prescription.status !== 'cancelled' && (
                  <div className="flex gap-3 pt-3 border-t border-white/5 mt-2">
                    <button
                      onClick={() => handleEdit(prescription)}
                      className="px-3 py-1.5 text-xs text-gray-400 hover:text-white border border-white/10 hover:bg-white/5 rounded-lg transition-colors flex items-center gap-1.5 font-bold"
                    >
                      <Edit2 className="w-3 h-3" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(prescription.id)}
                      className="px-3 py-1.5 text-xs text-red-400 hover:text-red-300 border border-red-500/20 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-1.5 font-bold"
                    >
                      <Trash2 className="w-3 h-3" />
                      Cancel Rx
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 border border-dashed border-[#1e232d] rounded-xl mb-4">
            <Pill className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No active prescriptions</p>
            {isDoctor && (
              <p className="text-xs mt-2 opacity-60">Create a new prescription using the button above</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EPrescriptionForm;
