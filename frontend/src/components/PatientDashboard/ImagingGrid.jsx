import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scan, Brain, Info, ChevronRight, Zap, FileText } from 'lucide-react';

const ImagingGrid = ({ studies }) => {
    const [selectedStudy, setSelectedStudy] = useState(null);

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
            {studies?.length > 0 ? (
                studies.map((study, idx) => (
                    <motion.div
                        key={idx}
                        layoutId={`study-${study.id}`}
                        onClick={() => setSelectedStudy(study)}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ y: -5, background: 'rgba(255,255,255,0.08)' }}
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '20px',
                            padding: '24px',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    background: 'rgba(139,92,246,0.1)',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#8b5cf6'
                                }}>
                                    <Scan size={24} />
                                </div>
                                <div>
                                    <h4 style={{ color: '#fff', fontSize: '18px', fontWeight: 700, margin: 0 }}>{study.modality} Scan</h4>
                                    <p style={{ color: '#3b82f6', fontSize: '13px', margin: '2px 0 0 0', fontWeight: 600 }}>{study.body_part}</p>
                                </div>
                            </div>
                            <span style={{
                                color: '#10b981',
                                background: 'rgba(16,185,129,0.1)',
                                padding: '4px 10px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: 700
                            }}>
                                {study.status.toUpperCase()}
                            </span>
                        </div>

                        <div style={{ display: 'flex', gap: '16px', color: '#666', fontSize: '13px' }}>
                            <span>{new Date(study.study_date).toLocaleDateString()}</span>
                            <span>&bull;</span>
                            <span>{study.number_of_images} images</span>
                        </div>

                        {study.impression && (
                            <div style={{ 
                                background: 'rgba(59,130,246,0.05)', 
                                padding: '12px', 
                                borderRadius: '12px', 
                                border: '1px solid rgba(59,130,246,0.1)'
                            }}>
                                <p style={{ color: '#3b82f6', fontSize: '12px', fontWeight: 700, margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Zap size={14} /> AI INSIGHT
                                </p>
                                <p style={{ color: '#aaa', fontSize: '13px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                    {study.impression}
                                </p>
                            </div>
                        )}

                        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end' }}>
                            <span style={{ color: '#fff', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                View Full Report <ChevronRight size={16} />
                            </span>
                        </div>
                    </motion.div>
                ))
            ) : (
                <p style={{ color: '#888', gridColumn: '1/-1', textAlign: 'center', padding: '40px' }}>No imaging studies found.</p>
            )}

            {/* Detailed Modal/Overlay (Conceptual) */}
            <AnimatePresence>
                {selectedStudy && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedStudy(null)}
                            style={{
                                position: 'fixed',
                                inset: 0,
                                background: 'rgba(0,0,0,0.8)',
                                backdropFilter: 'blur(8px)',
                                zIndex: 1000,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '40px'
                            }}
                        >
                            <motion.div
                                layoutId={`study-${selectedStudy.id}`}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                    background: '#161b22',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '24px',
                                    maxWidth: '800px',
                                    width: '100%',
                                    maxHeight: '80vh',
                                    overflowY: 'auto',
                                    padding: '32px'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                                    <div>
                                        <h2 style={{ color: '#fff', fontSize: '28px', fontWeight: 800, margin: 0 }}>
                                            {selectedStudy.modality} Study: {selectedStudy.body_part}
                                        </h2>
                                        <p style={{ color: '#888', fontSize: '14px', marginTop: '4px' }}>
                                            Performed on {new Date(selectedStudy.study_date).toLocaleDateString()} at {selectedStudy.institution_name || 'General Hospital'}
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => setSelectedStudy(null)}
                                        style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#888', padding: '8px', borderRadius: '50%', cursor: 'pointer' }}
                                    >
                                        <Scan size={20} />
                                    </button>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
                                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '16px' }}>
                                        <h4 style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                            <FileText size={18} style={{ color: '#3b82f6' }} /> Findings
                                        </h4>
                                        <p style={{ color: '#aaa', fontSize: '15px', lineHeight: 1.6 }}>
                                            {selectedStudy.findings || 'No formal findings recorded yet.'}
                                        </p>
                                    </div>
                                    <div style={{ background: 'rgba(59,130,246,0.05)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(59,130,246,0.1)' }}>
                                        <h4 style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                            <Zap size={18} style={{ color: '#3b82f6' }} /> AI Impression
                                        </h4>
                                        <p style={{ color: '#aaa', fontSize: '15px', lineHeight: 1.6, fontWeight: 500 }}>
                                            {selectedStudy.impression || 'AI analysis in progress.'}
                                        </p>
                                    </div>
                                </div>

                                <div style={{ textAlign: 'center' }}>
                                    <button style={{
                                        background: '#3b82f6',
                                        color: '#fff',
                                        border: 'none',
                                        padding: '12px 32px',
                                        borderRadius: '12px',
                                        fontSize: '16px',
                                        fontWeight: 700,
                                        cursor: 'pointer'
                                    }}>
                                        Open DICOM Viewer
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ImagingGrid;
