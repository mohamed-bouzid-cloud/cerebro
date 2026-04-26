import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Beaker, AlertCircle, CheckCircle, ChevronDown, X } from 'lucide-react';

const LabResultsTable = ({ labs }) => {
    const [expanded, setExpanded] = useState(null);

    const closeModal = () => setExpanded(null);

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
                                        Ordered by Dr. {lab.doctor_name} • {new Date(lab.ordered_at).toLocaleDateString()}
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
                            <button onClick={() => setExpanded(idx)} style={{
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

            {/* Expanded modal */}
            {expanded !== null && labs && labs[expanded] && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: '90%', maxWidth: '900px', background: '#0b0f14', borderRadius: '12px', padding: '20px', border: '1px solid rgba(255,255,255,0.06)', color: '#fff' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                                {labs[expanded].test_name} — Full Report
                                <button onClick={() => window.print()} style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', color: '#3b82f6', cursor: 'pointer', padding: '4px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                    Download PDF
                                </button>
                            </h3>
                            <button onClick={closeModal} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}><X /></button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: '16px' }}>
                            <div>
                                <p style={{ color: '#ccc' }}>{labs[expanded].notes || 'No additional notes.'}</p>
                                <h4 style={{ color: '#fff', marginTop: '12px' }}>Measurements</h4>
                                <div style={{ display: 'grid', gap: '8px', marginTop: '8px' }}>
                                    {/* components or single value */}
                                    {labs[expanded].components && Object.keys(labs[expanded].components || {}).length > 0 ? (
                                        Object.entries(labs[expanded].components).map(([k, v], i) => {
                                            const isAb = v.is_abnormal || (v.value && v.reference_range && (() => {
                                                try {
                                                    const num = parseFloat(v.value);
                                                    const m = (v.reference_range.match(/[-+]?[0-9]*\.?[0-9]+/g) || []).map(Number);
                                                    if (m.length >= 2) return num < m[0] || num > m[1];
                                                } catch (e) { }
                                                return false;
                                            })());
                                            return (
                                                <div key={i} style={{ padding: '10px', borderRadius: '8px', background: isAb ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.02)', border: `1px solid ${isAb ? 'rgba(239,68,68,0.18)' : 'rgba(255,255,255,0.04)'}` }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div>
                                                            <div style={{ fontWeight: 800 }}>{k}</div>
                                                            <div style={{ color: '#999', fontSize: '12px' }}>{v.reference_range || 'Ref: N/A'}</div>
                                                        </div>
                                                        <div style={{ textAlign: 'right' }}>
                                                            <div style={{ fontWeight: 900, color: isAb ? '#ef4444' : '#10b981', fontSize: '18px' }}>{v.value} {v.unit || ''}</div>
                                                            {isAb && <div style={{ color: '#ef9a9a', fontSize: '12px' }}>{v.interpretation || 'Abnormal'}</div>}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div style={{ padding: '10px', borderRadius: '8px', background: labs[expanded].is_abnormal ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.02)', border: `1px solid ${labs[expanded].is_abnormal ? 'rgba(239,68,68,0.18)' : 'rgba(255,255,255,0.04)'}` }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <div style={{ fontWeight: 800 }}>{labs[expanded].test_name}</div>
                                                    <div style={{ color: '#999', fontSize: '12px' }}>{labs[expanded].reference_range || 'Ref: N/A'}</div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontWeight: 900, color: labs[expanded].is_abnormal ? '#ef4444' : '#10b981', fontSize: '18px' }}>{labs[expanded].result_value} {labs[expanded].result_unit || ''}</div>
                                                    {labs[expanded].is_abnormal && <div style={{ color: '#ef9a9a', fontSize: '12px' }}>{labs[expanded].interpretation || 'Abnormal'}</div>}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <div style={{ padding: '12px', borderRadius: '8px', background: '#071018', border: '1px solid rgba(255,255,255,0.03)' }}>
                                    <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>Meta</div>
                                    <div style={{ fontWeight: 800 }}>{new Date(labs[expanded].ordered_at).toLocaleString()}</div>
                                    <div style={{ color: '#999', fontSize: '13px', marginTop: '8px' }}>Status: <span style={{ fontWeight: 800 }}>{labs[expanded].status}</span></div>
                                    {labs[expanded].critical_flag && <div style={{ marginTop: '10px', padding: '8px', borderRadius: '6px', background: 'rgba(239,68,68,0.06)', color: '#ef4444' }}>Critical value flagged</div>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LabResultsTable;
