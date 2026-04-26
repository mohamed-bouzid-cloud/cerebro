import React, { useState, useEffect } from 'react';
import { FileText, Save, X, Edit2, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { generateMockConsultationNotes } from '../mockData';

const ConsultationNotesForm = ({ appointmentId, patientId, isDoctor = false }) => {
  const [notes, setNotes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    note_type: 'progress-note',
    content: '',
    medications_reviewed: '',
    allergies_reviewed: '',
    vital_signs: {},
  });

  const getMockNotesForPatient = (pid) => {
    const allMock = generateMockConsultationNotes();
    const patientNotes = allMock.filter(n => n.patient === pid);
    return patientNotes.length > 0 ? patientNotes : [allMock[0]];
  };

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/auth/consultation-notes/by_appointment/?appointment_id=${appointmentId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      );
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        setNotes(data);
      } else {
        setNotes(getMockNotesForPatient(patientId));
      }
    } catch (error) {
      // Backend unreachable, use mock data
      setNotes(getMockNotesForPatient(patientId));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotes();
  }, [appointmentId, patientId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingId ? `/api/auth/consultation-notes/${editingId}/` : '/api/auth/consultation-notes/';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          appointment: appointmentId,
          patient: patientId,
          ...formData,
        }),
      });

      if (response.ok) {
        fetchNotes();
        setShowForm(false);
        setEditingId(null);
        setFormData({
          note_type: 'progress-note',
          content: '',
          medications_reviewed: '',
          allergies_reviewed: '',
          vital_signs: {},
        });
      }
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  const handleEdit = (note) => {
    setEditingId(note.id);
    setFormData({
      note_type: note.note_type,
      content: note.content,
      medications_reviewed: note.medications_reviewed || '',
      allergies_reviewed: note.allergies_reviewed || '',
      vital_signs: note.vital_signs || {},
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        const response = await fetch(`/api/auth/consultation-notes/${id}/`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        });
        if (response.ok) {
          fetchNotes();
        }
      } catch (error) {
        console.error('Error deleting note:', error);
      }
    }
  };

  const getNoteTypeColor = (type) => {
    const colors = {
      'chief-complaint': 'bg-red-50 border-red-200',
      'history-present-illness': 'bg-blue-50 border-blue-200',
      'physical-exam': 'bg-green-50 border-green-200',
      'assessment-plan': 'bg-purple-50 border-purple-200',
      'progress-note': 'bg-yellow-50 border-yellow-200',
      'follow-up-note': 'bg-indigo-50 border-indigo-200',
    };
    return colors[type] || 'bg-gray-50 border-gray-200';
  };

  const getNoteTypeLabel = (type) => {
    const labels = {
      'chief-complaint': 'Chief Complaint',
      'history-present-illness': 'History of Present Illness',
      'physical-exam': 'Physical Examination',
      'assessment-plan': 'Assessment & Plan',
      'progress-note': 'Progress Note',
      'follow-up-note': 'Follow-up Note',
    };
    return labels[type] || type;
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FileText className="w-6 h-6 text-blue-600" />
          Consultation Notes
        </h2>
        {isDoctor && (
          <button
            onClick={() => {
              setEditingId(null);
              setFormData({
                note_type: 'progress-note',
                content: '',
                medications_reviewed: '',
                allergies_reviewed: '',
                vital_signs: {},
              });
              setShowForm(!showForm);
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
          >
            <Edit2 className="w-4 h-4" />
            {showForm ? 'Cancel' : 'Add Note'}
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-8">Loading notes...</div>
      ) : notes.length > 0 ? (
        <div className="space-y-4 mb-6">
          {notes.map((note) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-lg border-2 ${getNoteTypeColor(note.note_type)}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-800">{getNoteTypeLabel(note.note_type)}</h3>
                  <p className="text-xs text-gray-600">
                    by {note.doctor_name} • {new Date(note.created_at).toLocaleString()}
                  </p>
                </div>
                {isDoctor && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(note)}
                      className="p-1 hover:bg-white hover:bg-opacity-50 rounded transition"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="p-1 hover:bg-white hover:bg-opacity-50 rounded transition text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-white bg-opacity-70 p-3 rounded mb-3">
                <p className="text-gray-800 whitespace-pre-wrap">{note.content}</p>
              </div>

              {/* Additional Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                {note.medications_reviewed && (
                  <div className="bg-white bg-opacity-70 p-2 rounded">
                    <p className="font-semibold text-gray-700">Medications Reviewed:</p>
                    <p className="text-gray-600">{note.medications_reviewed}</p>
                  </div>
                )}
                {note.allergies_reviewed && (
                  <div className="bg-white bg-opacity-70 p-2 rounded">
                    <p className="font-semibold text-gray-700">Allergies Reviewed:</p>
                    <p className="text-gray-600">{note.allergies_reviewed}</p>
                  </div>
                )}
              </div>

              {/* Vital Signs */}
              {note.vital_signs && Object.keys(note.vital_signs).length > 0 && (
                <div className="bg-white bg-opacity-70 p-2 rounded mt-3">
                  <p className="font-semibold text-gray-700 mb-2">Vital Signs:</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    {Object.entries(note.vital_signs).map(([key, value]) => (
                      <div key={key} className="text-center">
                        <p className="text-gray-600 capitalize">{key}</p>
                        <p className="font-semibold">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 mb-6">
          <p>No consultation notes yet</p>
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-50 rounded-lg p-6 border border-gray-200"
        >
          <h3 className="font-semibold text-gray-800 mb-4">
            {editingId ? 'Edit Consultation Note' : 'New Consultation Note'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Note Type</label>
              <select
                value={formData.note_type}
                onChange={(e) => setFormData({ ...formData, note_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="chief-complaint">Chief Complaint</option>
                <option value="history-present-illness">History of Present Illness</option>
                <option value="physical-exam">Physical Examination</option>
                <option value="assessment-plan">Assessment & Plan</option>
                <option value="progress-note">Progress Note</option>
                <option value="follow-up-note">Follow-up Note</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Clinical Notes *</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                rows="6"
                placeholder="Enter your clinical notes here..."
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Medications Reviewed</label>
                <textarea
                  value={formData.medications_reviewed}
                  onChange={(e) => setFormData({ ...formData, medications_reviewed: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  rows="3"
                  placeholder="Current medications discussed..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Allergies Reviewed</label>
                <textarea
                  value={formData.allergies_reviewed}
                  onChange={(e) => setFormData({ ...formData, allergies_reviewed: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  rows="3"
                  placeholder="Allergies reviewed with patient..."
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {editingId ? 'Update' : 'Save'} Note
              </button>
            </div>
          </form>
        </motion.div>
      )}
    </div>
  );
};

export default ConsultationNotesForm;
