import React from 'react';
import { motion } from 'framer-motion';
import { User, Phone, Calendar, Droplet } from 'lucide-react';

const ProfileCard = ({ user }) => {
    const calculateAge = (dob) => {
        if (!dob) return 'N/A';
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const profile = user?.profile || {};

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '24px'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '40px',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '32px',
                    fontWeight: 700
                }}>
                    {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                    <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: 700, margin: 0 }}>
                        {user?.first_name} {user?.last_name}
                    </h2>
                    <p style={{ color: '#888', margin: '4px 0 0 0', fontSize: '14px' }}>
                        Patient ID: #PAT-{user?.id?.toString().padStart(4, '0')}
                    </p>
                </div>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '16px',
                marginTop: '24px',
                paddingTop: '24px',
                borderTop: '1px solid rgba(255,255,255,0.1)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ color: '#3b82f6', background: 'rgba(59,130,246,0.1)', padding: '8px', borderRadius: '8px' }}>
                        <Calendar size={18} />
                    </div>
                    <div>
                        <p style={{ color: '#888', fontSize: '12px', margin: 0 }}>Age</p>
                        <p style={{ color: '#fff', fontSize: '14px', fontWeight: 600, margin: 0 }}>
                            {calculateAge(profile.date_of_birth)} years
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '8px', borderRadius: '8px' }}>
                        <Droplet size={18} />
                    </div>
                    <div>
                        <p style={{ color: '#888', fontSize: '12px', margin: 0 }}>Blood Type</p>
                        <p style={{ color: '#fff', fontSize: '14px', fontWeight: 600, margin: 0 }}>
                            {profile.blood_type || 'Unknown'}
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '8px', borderRadius: '8px' }}>
                        <Phone size={18} />
                    </div>
                    <div>
                        <p style={{ color: '#888', fontSize: '12px', margin: 0 }}>Phone</p>
                        <p style={{ color: '#fff', fontSize: '14px', fontWeight: 600, margin: 0 }}>
                            {profile.phone_number || 'Not provided'}
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default ProfileCard;
