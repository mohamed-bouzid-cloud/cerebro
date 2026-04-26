import React from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Stethoscope, ClipboardCheck, ArrowRight } from 'lucide-react';

const VisitSummarySection = ({ encounters }) => {
    return (
        <div style={{ position: 'relative', paddingLeft: '20px' }}>
            {/* Timeline Vertical Line */}
            <div style={{
                position: 'absolute',
                left: '7px',
                top: '0',
                bottom: '0',
                width: '2px',
                background: 'linear-gradient(to bottom, rgba(59,130,246,0.3) 0%, transparent 100%)'
            }} />

            <div style={{ display: 'grid', gap: '32px' }}>
                {encounters?.length > 0 ? (
                    encounters.map((visit, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            style={{ position: 'relative' }}
                        >
                            {/* Marker Dot */}
                            <div style={{
                                position: 'absolute',
                                left: '-18px',
                                top: '8px',
                                width: '10px',
                                height: '10px',
                                borderRadius: '5px',
                                background: '#3b82f6',
                                boxShadow: '0 0 10px rgba(59,130,246,0.8)'
                            }} />

                            <div style={{
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '20px',
                                padding: '24px'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                    <div>
                                        <p style={{ color: '#3b82f6', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 4px 0' }}>
                                            {new Date(visit.encounter_date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                        </p>
                                        <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, margin: 0 }}>Consultation with Dr. {visit.doctor_name}</h3>
                                    </div>
                                    <div style={{
                                        background: 'rgba(59,130,246,0.1)',
                                        padding: '10px',
                                        borderRadius: '12px',
                                        color: '#3b82f6'
                                    }}>
                                        <Stethoscope size={24} />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div>
                                        <h4 style={{ color: '#fff', fontSize: '14px', fontWeight: 700, margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <ClipboardList size={16} style={{ color: '#888' }} /> Chief Complaint
                                        </h4>
                                        <p style={{ color: '#aaa', fontSize: '14px', lineHeight: 1.5, margin: 0 }}>{visit.chief_complaint}</p>
                                    </div>
                                    <div>
                                        <h4 style={{ color: '#fff', fontSize: '14px', fontWeight: 700, margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <ClipboardCheck size={16} style={{ color: '#10b981' }} /> Diagnosis & Plan
                                        </h4>
                                        <p style={{ color: '#fff', fontSize: '14px', fontWeight: 600, margin: '0 0 4px 0' }}>{visit.diagnosis}</p>
                                        <p style={{ color: '#aaa', fontSize: '14px', lineHeight: 1.5, margin: 0 }}>{visit.treatment_plan}</p>
                                    </div>
                                </div>

                                {visit.notes && (
                                    <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                        <h4 style={{ color: '#fff', fontSize: '14px', fontWeight: 700, margin: '0 0 8px 0' }}>Additional Notes</h4>
                                        <p style={{ color: '#888', fontSize: '13px', fontStyle: 'italic', margin: 0 }}>{visit.notes}</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <p style={{ color: '#888', textAlign: 'center', padding: '40px' }}>No consultation history found.</p>
                )}
            </div>
        </div>
    );
};

export default VisitSummarySection;
