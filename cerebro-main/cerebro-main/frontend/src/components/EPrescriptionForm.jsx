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
      active: 'bg-green-100 border-green-300 text-green-900',
      completed: 'bg-blue-100 border-blue-300 text-blue-900',
      cancelled: 'bg-red-100 border-red-300 text-red-900',
      draft: 'bg-gray-100 border-gray-300 text-gray-900',
    };
    return colors[status] || 'bg-gray-100 border-gray-300';
  };

  const isExpired = (expiryDate) => {
    return new Date(expiryDate) < new Date();
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Pill className="w-6 h-6 text-blue-600" />
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
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition text-white ${
              showForm ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
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
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 flex items-center gap-2">
          <Pill className="w-4 h-4 text-blue-600" />
          <span className="text-sm text-gray-700">
            Patient: <span className="font-semibold">{patientName}</span>
          </span>
        </div>
      )}

      {/* Prescription Form */}
      {showForm && isDoctor && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6"
        >
          <h3 className="font-semibold text-gray-800 mb-4">
            {editingId ? 'Edit Prescription' : 'Create New Prescription'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Medication Name *
                </label>
                <input
                  type="text"
                  value={formData.medication_name}
                  onChange={(e) => setFormData({ ...formData, medication_name: e.target.value })}
                  placeholder="e.g., Amoxicillin"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dosage *</label>
                <input
                  type="text"
                  value={formData.dosage}
                  onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                  placeholder="e.g., 500mg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Route</label>
                <select
                  value={formData.route}
                  onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="once-daily">Once Daily</option>
                  <option value="twice-daily">Twice Daily</option>
                  <option value="three-times-daily">Three Times Daily</option>
                  <option value="four-times-daily">Four Times Daily</option>
                  <option value="as-needed">As Needed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (days)</label>
                <select
                  value={formData.duration_days}
                  onChange={(e) => handleDurationChange(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="7">7 days</option>
                  <option value="14">14 days</option>
                  <option value="30">30 days</option>
                  <option value="60">60 days</option>
                  <option value="90">90 days</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                  placeholder="Number of tablets"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Refills</label>
                <input
                  type="number"
                  value={formData.refills_remaining}
                  onChange={(e) =>
                    setFormData({ ...formData, refills_remaining: parseInt(e.target.value) })
                  }
                  placeholder="Number of refills"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="e.g., Take with food, avoid dairy products"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
              />
            </div>

            <div className="bg-blue-100 p-3 rounded-lg text-sm text-blue-900">
              Expiry Date: <span className="font-semibold">{formData.expiry_date}</span>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {editingId ? 'Update' : 'Create'} Prescription
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Prescriptions List */}
      <div>
        <h3 className="font-semibold text-gray-800 mb-4">
          {loading ? 'Loading...' : `Active Prescriptions (${prescriptions.length})`}
        </h3>
        {loading ? (
          <div className="text-center py-4">Loading prescriptions...</div>
        ) : prescriptions.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {prescriptions.map((prescription) => (
              <motion.div
                key={prescription.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-4 border-2 rounded-lg ${getStatusColor(prescription.status)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg">{prescription.medication_name}</h4>
                    <p className="text-sm opacity-75">
                      {prescription.dosage} • {prescription.route}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-semibold block mb-1 ${
                        prescription.status === 'active'
                          ? 'bg-green-200 text-green-800'
                          : prescription.status === 'completed'
                          ? 'bg-blue-200 text-blue-800'
                          : 'bg-red-200 text-red-800'
                      }`}
                    >
                      {prescription.status.toUpperCase()}
                    </span>
                    {isExpired(prescription.expiry_date) && prescription.status === 'active' && (
                      <span className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded-full">
                        EXPIRED
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mb-3">
                  <div>
                    <p className="text-xs opacity-75">Frequency</p>
                    <p className="font-semibold">{getFrequencyLabel(prescription.frequency)}</p>
                  </div>
                  <div>
                    <p className="text-xs opacity-75">Duration</p>
                    <p className="font-semibold">{prescription.duration_days} days</p>
                  </div>
                  <div>
                    <p className="text-xs opacity-75">Quantity</p>
                    <p className="font-semibold">{prescription.quantity}</p>
                  </div>
                  <div>
                    <p className="text-xs opacity-75">Refills</p>
                    <p className="font-semibold">{prescription.refills_remaining}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs opacity-75 mb-3">
                  <span>
                    Start: {new Date(prescription.start_date).toLocaleDateString()}
                  </span>
                  →
                  <span>
                    Exp: {new Date(prescription.expiry_date).toLocaleDateString()}
                  </span>
                </div>

                {prescription.notes && (
                  <p className="text-sm italic bg-white bg-opacity-40 p-2 rounded mb-2">
                    {prescription.notes}
                  </p>
                )}

                {isDoctor && prescription.status !== 'cancelled' && (
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => handleEdit(prescription)}
                      className="flex-1 px-2 py-1 text-xs bg-white bg-opacity-50 hover:bg-opacity-75 rounded transition flex items-center justify-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(prescription.id)}
                      className="flex-1 px-2 py-1 text-xs bg-red-200 hover:bg-red-300 rounded transition flex items-center justify-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Cancel
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Pill className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No active prescriptions</p>
            {isDoctor && (
              <p className="text-sm mt-2">Create a new prescription using the button above</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EPrescriptionForm;
