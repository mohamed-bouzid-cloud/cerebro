import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
  



const ConsultationModal = ({ isOpen, onClose, doctorId, doctorName, onSuccess }) => {
    const [formData, setFormData] = useState({
        consultation_type: 'video',
        reason: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const consultationTypes = [
        { value: 'video', label: 'Video Call' },
        { value: 'audio', label: 'Audio Call' },
        { value: 'in-person', label: 'In-Person' },
        { value: 'follow-up', label: 'Follow-up' }
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!formData.reason.trim()) {
            setError('Please describe the reason for consultation');
            setLoading(false);
            return;
        }

        const token = localStorage.getItem('access_token');
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        try {
            // Create consultation
            const consultationRes = await fetch('http://localhost:8000/api/auth/consultations/', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    doctor: parseInt(doctorId),
                    consultation_type: formData.consultation_type,
                    reason: formData.reason
                })
            });

            if (consultationRes.ok) {
                const consultation = await consultationRes.json();
                alert('Consultation request sent successfully!');
                setFormData({ consultation_type: 'video', reason: '' });
                onClose();
                onSuccess?.();
            } else {
                const errorData = await consultationRes.json();
                setError(errorData.detail || JSON.stringify(errorData));
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
                        Request Consultation
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

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ color: '#fff', fontSize: '14px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>
                            Doctor: Dr. {doctorName}
                        </label>
                        <div style={{
                            padding: '10px 12px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '6px',
                            color: '#888',
                            fontSize: '14px'
                        }}>
                            {doctorName}
                        </div>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ color: '#fff', fontSize: '14px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>
                            Consultation Type
                        </label>
                        <select
                            value={formData.consultation_type}
                            onChange={(e) => setFormData({ ...formData, consultation_type: e.target.value })}
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
                        >
                            {consultationTypes.map(type => (
                                <option key={type.value} value={type.value} style={{ background: '#1a1f26', color: '#fff' }}>
                                    {type.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ color: '#fff', fontSize: '14px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>
                            Reason for Consultation *
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
                                minHeight: '100px',
                                fontFamily: 'inherit',
                                boxSizing: 'border-box'
                            }}
                            placeholder="Describe your symptoms, concerns, or reason for consultation..."
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
                            {loading ? 'Sending...' : 'Request Consultation'}
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

export default ConsultationModal;
