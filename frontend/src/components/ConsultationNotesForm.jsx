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
      'chief-complaint': 'bg-red-500/10 border-red-500/20 text-red-400',
      'history-present-illness': 'bg-blue-500/10 border-blue-500/20 text-blue-400',
      'physical-exam': 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
      'assessment-plan': 'bg-purple-500/10 border-purple-500/20 text-purple-400',
      'progress-note': 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
      'follow-up-note': 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
    };
    return colors[type] || 'bg-[#151821] border-[#1e232d] text-gray-300';
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
    <div className="glass-card p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5 relative z-10">
        <h2 className="text-xl font-bold text-white flex items-center gap-3 drop-shadow-md">
          <FileText className="w-5 h-5 text-indigo-500" />
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
            className="flex items-center gap-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 px-3 py-2 rounded-lg transition-colors text-sm font-medium"
          >
            <Edit2 className="w-4 h-4" />
            {showForm ? 'Cancel' : 'Add Note'}
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading notes...</div>
      ) : notes.length > 0 ? (
        <div className="space-y-4 mb-6">
          {notes.map((note) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-5 rounded-xl border ${getNoteTypeColor(note.note_type)} shadow-md backdrop-blur-sm relative z-10`}
            >
              <div className="flex items-start justify-between mb-4 border-b border-white/5 pb-3">
                <div>
                  <h3 className="font-bold text-white tracking-wide uppercase text-sm">{getNoteTypeLabel(note.note_type)}</h3>
                  <p className="text-xs opacity-60 mt-1">
                    by {note.doctor_name} • {new Date(note.created_at).toLocaleString()}
                  </p>
                </div>
                {isDoctor && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(note)}
                      className="p-1.5 hover:bg-white/10 rounded-lg transition text-gray-400 hover:text-white"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="p-1.5 hover:bg-red-500/20 rounded-lg transition text-red-500/70 hover:text-red-400"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-[#0a0f14] border border-[#1e232d] p-4 rounded-lg mb-4">
                <p className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">{note.content}</p>
              </div>

              {/* Additional Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {note.medications_reviewed && (
                  <div className="bg-[#151821] border border-[#1e232d] p-3 rounded-lg text-gray-400">
                    <p className="font-bold text-gray-500 uppercase tracking-widest mb-1.5 text-[10px]">Medications Reviewed</p>
                    <p className="text-gray-300">{note.medications_reviewed}</p>
                  </div>
                )}
                {note.allergies_reviewed && (
                  <div className="bg-[#151821] border border-[#1e232d] p-3 rounded-lg text-gray-400">
                    <p className="font-bold text-gray-500 uppercase tracking-widest mb-1.5 text-[10px]">Allergies Reviewed</p>
                    <p className="text-gray-300">{note.allergies_reviewed}</p>
                  </div>
                )}
              </div>

              {/* Vital Signs */}
              {note.vital_signs && Object.keys(note.vital_signs).length > 0 && (
                <div className="bg-[#151821] border border-[#1e232d] p-3 rounded-lg mt-4 text-gray-400">
                  <p className="font-bold text-gray-500 uppercase tracking-widest mb-3 text-[10px]">Vital Signs</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    {Object.entries(note.vital_signs).map(([key, value]) => (
                      <div key={key} className="text-center bg-[#0a0f14] border border-[#1e232d] p-2 rounded">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{key}</p>
                        <p className="font-bold text-white">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 text-gray-500 border border-dashed border-[#1e232d] rounded-xl mb-6">
          <FileText className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No consultation notes yet</p>
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-[#121822] to-[#151821] rounded-xl p-6 border border-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.4)] relative z-10"
        >
          <h3 className="font-bold text-white mb-5 tracking-wide">
            {editingId ? 'Edit Consultation Note' : 'New Consultation Note'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Note Type</label>
              <select
                value={formData.note_type}
                onChange={(e) => setFormData({ ...formData, note_type: e.target.value })}
                className="w-full px-3 py-2.5 bg-[#0a0f14] border border-[#1e232d] text-white rounded-lg focus:outline-none focus:border-indigo-500"
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
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Clinical Notes *</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full px-3 py-3 bg-[#0a0f14] border border-[#1e232d] text-white rounded-lg focus:outline-none focus:border-indigo-500 text-sm leading-relaxed"
                rows="6"
                placeholder="Enter your clinical notes here..."
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Medications Reviewed</label>
                <textarea
                  value={formData.medications_reviewed}
                  onChange={(e) => setFormData({ ...formData, medications_reviewed: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0a0f14] border border-[#1e232d] text-white rounded-lg focus:outline-none focus:border-indigo-500 text-sm"
                  rows="3"
                  placeholder="Current medications discussed..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Allergies Reviewed</label>
                <textarea
                  value={formData.allergies_reviewed}
                  onChange={(e) => setFormData({ ...formData, allergies_reviewed: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0a0f14] border border-[#1e232d] text-white rounded-lg focus:outline-none focus:border-indigo-500 text-sm"
                  rows="3"
                  placeholder="Allergies reviewed with patient..."
                />
              </div>
            </div>

            <div className="flex gap-3 pt-3">
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
