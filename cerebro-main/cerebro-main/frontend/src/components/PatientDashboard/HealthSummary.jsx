import React from 'react';
import { motion } from 'framer-motion';
import { Activity, AlertTriangle, ShieldCheck } from 'lucide-react';

const HealthSummary = ({ medicalHistory, allergies }) => {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            {/* Active Conditions */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '16px',
                    padding: '24px'
                }}
            >
                <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: 600, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Activity size={20} style={{ color: '#3b82f6' }} />
                    Active Conditions
                </h3>
                {medicalHistory?.chronic_conditions ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {medicalHistory.chronic_conditions.split(',').map((condition, idx) => (
                            <span key={idx} style={{
                                background: 'rgba(59,130,246,0.1)',
                                color: '#3b82f6',
                                padding: '6px 12px',
                                borderRadius: '20px',
                                fontSize: '13px',
                                fontWeight: 500
                            }}>
                                {condition.trim()}
                            </span>
                        ))}
                    </div>
                ) : (
                    <p style={{ color: '#666', margin: 0, fontSize: '14px', fontStyle: 'italic' }}>No chronic conditions recorded.</p>
                )}
            </motion.div>

            {/* Allergies & Intolerances */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '16px',
                    padding: '24px'
                }}
            >
                <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: 600, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <AlertTriangle size={20} style={{ color: '#ef4444' }} />
                    Allergies & Intolerances
                </h3>
                {allergies?.length > 0 ? (
                    <div style={{ display: 'grid', gap: '10px' }}>
                        {allergies.map((allergy, idx) => (
                            <div key={idx} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                background: 'rgba(239,68,68,0.05)',
                                border: '1px solid rgba(239,68,68,0.1)',
                                padding: '8px 12px',
                                borderRadius: '8px'
                            }}>
                                <div>
                                    <p style={{ color: '#fff', fontSize: '14px', fontWeight: 600, margin: 0 }}>{allergy.allergen}</p>
                                    <p style={{ color: '#888', fontSize: '12px', margin: 0 }}>{allergy.reaction}</p>
                                </div>
                                <span style={{
                                    color: allergy.severity === 'severe' ? '#ef4444' : '#f59e0b',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>
                                    {allergy.severity}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981' }}>
                        <ShieldCheck size={16} />
                        <p style={{ margin: 0, fontSize: '14px' }}>No known allergies.</p>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default HealthSummary;
