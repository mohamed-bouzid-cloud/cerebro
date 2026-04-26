import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Plus, Trash2, Heart, Calendar, Phone, Activity, AlertTriangle } from 'lucide-react';

const EditProfileModal = ({ user, medicalHistory, allergies, onClose, onUpdate }) => {
    const profile = user?.profile || {};
    
    const [formData, setFormData] = useState({
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        date_of_birth: profile.date_of_birth || '',
        blood_type: profile.blood_type || '',
        phone_number: profile.phone_number || '',
        chronic_conditions: medicalHistory?.chronic_conditions || ''
    });

    const [newAllergy, setNewAllergy] = useState({ allergen: '', severity: 'moderate', reaction: '' });
    const [loading, setLoading] = useState(false);

    const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        const updateData = {
            first_name: formData.first_name,
            last_name: formData.last_name,
            profile: {
                date_of_birth: formData.date_of_birth,
                blood_type: formData.blood_type,
                phone_number: formData.phone_number
            }
        };

        try {
            // Update User Profile
            const token = localStorage.getItem('access_token');
            const res = await fetch('http://localhost:8000/api/auth/me/', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });

            // Update Medical History (Conditions)
            await fetch('http://localhost:8000/api/auth/medical-history/', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ chronic_conditions: formData.chronic_conditions })
            });

            if (res.ok) {
                onUpdate();
                onClose();
            }
        } catch (error) {
            console.error('Update failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddAllergy = async () => {
        if (!newAllergy.allergen) return;
        
        const token = localStorage.getItem('access_token');
        try {
            const res = await fetch('http://localhost:8000/api/auth/allergies/', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newAllergy)
            });
            if (res.ok) {
                setNewAllergy({ allergen: '', severity: 'moderate', reaction: '' });
                onUpdate(); // Refresh data
            }
        } catch (error) {
            console.error('Failed to add allergy:', error);
        }
    };

    const handleDeleteAllergy = async (id) => {
        const token = localStorage.getItem('access_token');
        try {
            const res = await fetch(`http://localhost:8000/api/auth/allergies/${id}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                onUpdate();
            }
        } catch (error) {
            console.error('Failed to delete allergy:', error);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(10px)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                style={{
                    background: '#161b22',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '24px',
                    width: '100%',
                    maxWidth: '800px',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    padding: '32px'
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: 800, margin: 0 }}>Edit Health Profile</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    {/* Personal Info */}
                    <div style={{ gridColumn: '1 / -1' }}>
                        <h4 style={{ color: '#3b82f6', fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Heart size={16} /> Personal Information
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                                <label style={{ color: '#888', fontSize: '12px', display: 'block', marginBottom: '6px' }}>First Name</label>
                                <input 
                                    type="text" 
                                    value={formData.first_name}
                                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px', color: '#fff' }}
                                />
                            </div>
                            <div>
                                <label style={{ color: '#888', fontSize: '12px', display: 'block', marginBottom: '6px' }}>Last Name</label>
                                <input 
                                    type="text" 
                                    value={formData.last_name}
                                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px', color: '#fff' }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Vitals & Specs */}
                    <div>
                        <h4 style={{ color: '#3b82f6', fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Calendar size={16} /> Vital Details
                        </h4>
                        <div style={{ display: 'grid', gap: '16px' }}>
                            <div>
                                <label style={{ color: '#888', fontSize: '12px', display: 'block', marginBottom: '6px' }}>Date of Birth</label>
                                <input 
                                    type="date" 
                                    value={formData.date_of_birth}
                                    onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px', color: '#fff', colorScheme: 'dark' }}
                                />
                            </div>
                            <div>
                                <label style={{ color: '#888', fontSize: '12px', display: 'block', marginBottom: '6px' }}>Blood Type</label>
                                <select 
                                    value={formData.blood_type}
                                    onChange={(e) => setFormData({...formData, blood_type: e.target.value})}
                                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px', color: '#fff', cursor: 'pointer' }}
                                >
                                    <option value="" style={{ background: '#161b22', color: '#fff' }}>Unknown</option>
                                    {bloodTypes.map(t => <option key={t} value={t} style={{ background: '#161b22', color: '#fff' }}>{t}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ color: '#888', fontSize: '12px', display: 'block', marginBottom: '6px' }}>Phone Number</label>
                                <input 
                                    type="text" 
                                    value={formData.phone_number}
                                    onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                                    placeholder="+1 234 567 890"
                                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px', color: '#fff' }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Conditions */}
                    <div>
                        <h4 style={{ color: '#3b82f6', fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Activity size={16} /> Chronic Conditions
                        </h4>
                        <textarea 
                            value={formData.chronic_conditions}
                            onChange={(e) => setFormData({...formData, chronic_conditions: e.target.value})}
                            placeholder="Diabetes, Hypertension, Asthma..."
                            style={{ 
                                width: '100%', 
                                height: '145px',
                                background: 'rgba(255,255,255,0.05)', 
                                border: '1px solid rgba(255,255,255,0.1)', 
                                borderRadius: '10px', 
                                padding: '12px', 
                                color: '#fff',
                                fontFamily: 'inherit',
                                resize: 'none'
                            }}
                        />
                        <p style={{ color: '#666', fontSize: '11px', mt: '8px' }}>Separate multiple conditions with commas.</p>
                    </div>

                    {/* Allergy management */}
                    <div style={{ gridColumn: '1 / -1', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '24px' }}>
                        <h4 style={{ color: '#ef4444', fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <AlertTriangle size={16} /> Manage Allergies
                        </h4>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr auto', gap: '12px', marginBottom: '20px' }}>
                            <input 
                                type="text" 
                                placeholder="Allergen (e.g. Peanuts)"
                                value={newAllergy.allergen}
                                onChange={(e) => setNewAllergy({...newAllergy, allergen: e.target.value})}
                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px', color: '#fff' }}
                            />
                            <select 
                                value={newAllergy.severity}
                                onChange={(e) => setNewAllergy({...newAllergy, severity: e.target.value})}
                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px', color: '#fff', cursor: 'pointer' }}
                            >
                                <option value="mild" style={{ background: '#161b22', color: '#fff' }}>Mild</option>
                                <option value="moderate" style={{ background: '#161b22', color: '#fff' }}>Moderate</option>
                                <option value="severe" style={{ background: '#161b22', color: '#fff' }}>Severe</option>
                            </select>
                            <input 
                                type="text" 
                                placeholder="Reaction (e.g. Rash)"
                                value={newAllergy.reaction}
                                onChange={(e) => setNewAllergy({...newAllergy, reaction: e.target.value})}
                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px', color: '#fff' }}
                            />
                            <button 
                                type="button"
                                onClick={handleAddAllergy}
                                style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', padding: '0 16px', cursor: 'pointer' }}
                            >
                                <Plus size={20} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                            {allergies.map((a) => (
                                <div key={a.id} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    padding: '6px 12px',
                                    borderRadius: '20px'
                                }}>
                                    <span style={{ fontSize: '13px', color: '#fff' }}>{a.allergen}</span>
                                    <span style={{ fontSize: '11px', color: a.severity === 'severe' ? '#ef4444' : '#f59e0b', fontWeight: 800 }}>{a.severity}</span>
                                    <button 
                                        type="button"
                                        onClick={() => handleDeleteAllergy(a.id)}
                                        style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: 0 }}
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ gridColumn: '1 / -1', marginTop: '20px', display: 'flex', gap: '16px' }}>
                        <button 
                            type="submit"
                            disabled={loading}
                            style={{ 
                                flex: 1, 
                                background: '#3b82f6', 
                                color: '#fff', 
                                border: 'none', 
                                padding: '14px', 
                                borderRadius: '12px', 
                                fontWeight: 700, 
                                cursor: loading ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px'
                            }}
                        >
                            <Save size={20} />
                            {loading ? 'Saving Changes...' : 'Save Health Profile'}
                        </button>
                        <button 
                            type="button"
                            onClick={onClose}
                            style={{ flex: 1, background: 'transparent', color: '#888', border: '1px solid rgba(255,255,255,0.1)', padding: '14px', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default EditProfileModal;
