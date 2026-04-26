import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

const AppointmentModal = ({ isOpen, onClose, doctorId, doctorName, onSuccess }) => {
    const [formData, setFormData] = useState({
        title: '',
        reason: '',
        scheduled_at: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fhirStatus, setFhirStatus] = useState(''); // Track FHIR sync status

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setFhirStatus('');
        setLoading(true);

        const token = localStorage.getItem('access_token');
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        try {
            // Create appointment (will auto-sync to FHIR via signal)
            setFhirStatus('Creating appointment...');
            const appointmentRes = await fetch('http://localhost:8000/api/auth/appointments/', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    doctor: parseInt(doctorId),
                    scheduled_at: formData.scheduled_at,
                    duration_minutes: 30,
                    status: 'scheduled',
                    notes: `${formData.title || `Appointment with Dr. ${doctorName}`} - ${formData.reason}`
                })
            });

            if (appointmentRes.ok) {
                const appointment = await appointmentRes.json();

                // FHIR sync happens automatically via the post_save signal
                setFhirStatus('✓ Appointment synced to FHIR server');
                
                // Optionally verify FHIR sync status
                setTimeout(() => {
                    fetch(`http://localhost:8000/api/auth/appointments/${appointment.id}/`, {
                        method: 'GET',
                        headers
                    })
                    .then(res => res.json())
                    .then(data => {
                        if (data.fhir_sync_status === 'synced') {
                            setFhirStatus('✓ FHIR sync confirmed! (ID: ' + data.fhir_resource_id + ')');
                        } else if (data.fhir_sync_status === 'failed') {
                            setFhirStatus('⚠ FHIR sync pending retry');
                        }
                    })
                    .catch(err => console.warn('Status check failed:', err));
                }, 1000);

                alert('Appointment scheduled successfully! Real-time FHIR synchronization in progress.');
                setFormData({ title: '', reason: '', scheduled_at: '' });
                
                // Callback to refresh doctor's appointment list
                setTimeout(() => {
                    onClose();
                    onSuccess?.();
                }, 2000);
            } else {
                const error = await appointmentRes.json();
                setError(error.detail || JSON.stringify(error));
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                    background: '#1a1f26',
                    borderRadius: '12px',
                    padding: '28px',
                    maxWidth: '500px',
                    width: '90%',
                    border: '1px solid rgba(255,255,255,0.1)'
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: 600, margin: 0 }}>
                        Schedule Appointment
                    </h3>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {error && (
                    <div style={{
                        background: 'rgba(239,68,68,0.1)',
                        border: '1px solid rgba(239,68,68,0.3)',
                        color: '#fca5a5',
                        padding: '12px',
                        borderRadius: '6px',
                        marginBottom: '16px',
                        fontSize: '14px'
                    }}>
                        {error}
                    </div>
                )}

                {fhirStatus && (
                    <div style={{
                        background: fhirStatus.includes('✓') ? 'rgba(34,197,94,0.1)' : 'rgba(250,204,21,0.1)',
                        border: `1px solid rgba(${fhirStatus.includes('✓') ? '34,197,94' : '250,204,21'},0.3)`,
                        color: fhirStatus.includes('✓') ? '#86efac' : '#fef08a',
                        padding: '12px',
                        borderRadius: '6px',
                        marginBottom: '16px',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <span>🔄</span> {fhirStatus}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ color: '#fff', fontSize: '14px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>
                            Appointment Title
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder={`Default: Appointment with Dr. ${doctorName}`}
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '6px',
                                color: '#fff',
                                fontSize: '14px',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ color: '#fff', fontSize: '14px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>
                            Reason for Visit
                        </label>
                        <textarea
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            required
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '6px',
                                color: '#fff',
                                fontSize: '14px',
                                minHeight: '80px',
                                fontFamily: 'inherit',
                                boxSizing: 'border-box'
                            }}
                            placeholder="Describe your reason for the appointment..."
                        />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ color: '#fff', fontSize: '14px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>
                            Date & Time
                        </label>
                        <input
                            type="datetime-local"
                            value={formData.scheduled_at}
                            onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                            required
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '6px',
                                color: '#fff',
                                fontSize: '14px',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                flex: 1,
                                background: '#3b82f6',
                                color: '#fff',
                                border: 'none',
                                padding: '10px 16px',
                                borderRadius: '6px',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                fontSize: '14px',
                                fontWeight: 500,
                                opacity: loading ? 0.7 : 1
                            }}
                        >
                            {loading ? 'Scheduling...' : 'Schedule Appointment'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                flex: 1,
                                background: 'transparent',
                                color: '#888',
                                border: '1px solid rgba(255,255,255,0.1)',
                                padding: '10px 16px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default AppointmentModal;
