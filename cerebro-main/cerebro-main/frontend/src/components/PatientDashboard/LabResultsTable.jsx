import React from 'react';
import { motion } from 'framer-motion';
import { Beaker, AlertCircle, CheckCircle, ChevronDown } from 'lucide-react';

const LabResultsTable = ({ labs }) => {
    return (
        <div style={{ display: 'grid', gap: '16px' }}>
            {labs?.length > 0 ? (
                labs.map((lab, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: `1px solid ${lab.is_abnormal ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.05)'}`,
                            borderRadius: '16px',
                            overflow: 'hidden'
                        }}
                    >
                        <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    background: lab.is_abnormal ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: lab.is_abnormal ? '#ef4444' : '#3b82f6'
                                }}>
                                    <Beaker size={24} />
                                </div>
                                <div>
                                    <h4 style={{ color: '#fff', fontSize: '16px', fontWeight: 600, margin: 0 }}>{lab.test_name}</h4>
                                    <p style={{ color: '#666', fontSize: '13px', margin: '2px 0 0 0' }}>
                                        Ordered by Dr. {lab.doctor_name} &bull; {new Date(lab.ordered_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
                                    <span style={{
                                        color: lab.is_abnormal ? '#ef4444' : '#10b981',
                                        fontSize: '24px',
                                        fontWeight: 800
                                    }}>
                                        {lab.result_value}
                                    </span>
                                    <span style={{ color: '#888', fontSize: '14px' }}>{lab.result_unit}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', justifyContent: 'flex-end' }}>
                                    {lab.is_abnormal ? (
                                        <AlertCircle size={14} style={{ color: '#ef4444' }} />
                                    ) : (
                                        <CheckCircle size={14} style={{ color: '#10b981' }} />
                                    )}
                                    <span style={{
                                        color: lab.is_abnormal ? '#ef4444' : '#10b981',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        textTransform: 'uppercase'
                                    }}>
                                        {lab.interpretation || (lab.is_abnormal ? 'Abnormal' : 'Normal')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Reference Range footer */}
                        <div style={{
                            background: 'rgba(255,255,255,0.02)',
                            padding: '12px 20px',
                            borderTop: '1px solid rgba(255,255,255,0.05)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <p style={{ color: '#666', fontSize: '12px', margin: 0 }}>
                                Reference Range: <span style={{ color: '#888' }}>{lab.reference_range || 'N/A'}</span>
                            </p>
                            <button style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#3b82f6',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}>
                                View Full Report <ChevronDown size={14} />
                            </button>
                        </div>
                    </motion.div>
                ))
            ) : (
                <p style={{ color: '#888', textAlign: 'center', padding: '40px' }}>No lab results available.</p>
            )}
        </div>
    );
};

export default LabResultsTable;
