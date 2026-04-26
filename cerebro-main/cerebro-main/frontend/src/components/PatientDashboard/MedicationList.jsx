import React from 'react';
import { motion } from 'framer-motion';
import { Pill, Download, Clock, Info } from 'lucide-react';

const MedicationList = ({ prescriptions }) => {
    const handleDownload = (prescription) => {
        // Simple print view for now
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Prescription - ${prescription.medication_name}</title>
                    <style>
                        body { font-family: sans-serif; padding: 40px; }
                        .header { border-bottom: 2px solid #333; margin-bottom: 20px; }
                        .content { line-height: 1.6; }
                        .box { border: 1px solid #ccc; padding: 20px; margin-top: 20px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>Medical Prescription</h1>
                        <p>Patient: ${prescription.patient_name}</p>
                        <p>Doctor: Dr. ${prescription.doctor_name}</p>
                        <p>Date: ${new Date(prescription.prescribed_at).toLocaleDateString()}</p>
                    </div>
                    <div class="content">
                        <h2>Medication: ${prescription.medication_name}</h2>
                        <p><strong>Dosage:</strong> ${prescription.dosage}</p>
                        <p><strong>Route:</strong> ${prescription.route}</p>
                        <p><strong>Frequency:</strong> ${prescription.frequency}</p>
                        <p><strong>Duration:</strong> ${prescription.duration_days} days</p>
                        <div class="box">
                            <h3>Instructions / Notes:</h3>
                            <p>${prescription.notes || 'No specific instructions.'}</p>
                        </div>
                    </div>
                    <div style="margin-top: 50px; border-top: 1px solid #eee; padding-top: 10px;">
                        <p>Refills Remaining: ${prescription.refills_remaining}</p>
                        <p>Expiry Date: ${new Date(prescription.expiry_date).toLocaleDateString()}</p>
                    </div>
                    <script>window.print();</script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <div style={{ display: 'grid', gap: '16px' }}>
            {prescriptions?.length > 0 ? (
                prescriptions.map((px, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '16px',
                            padding: '20px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}
                    >
                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                            <div style={{
                                width: '56px',
                                height: '56px',
                                background: 'rgba(16,185,129,0.1)',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#10b981'
                            }}>
                                <Pill size={28} />
                            </div>
                            <div>
                                <h4 style={{ color: '#fff', fontSize: '18px', fontWeight: 600, margin: 0 }}>{px.medication_name}</h4>
                                <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                                    <span style={{ color: '#888', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Clock size={14} /> {px.frequency}
                                    </span>
                                    <span style={{ color: '#888', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Info size={14} /> {px.dosage}
                                    </span>
                                </div>
                                {px.notes && (
                                    <p style={{ color: '#666', fontSize: '13px', margin: '8px 0 0 0', fontStyle: 'italic' }}>
                                        "{px.notes}"
                                    </p>
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
                            <button
                                onClick={() => handleDownload(px)}
                                style={{
                                    background: 'rgba(59,130,246,0.1)',
                                    color: '#3b82f6',
                                    border: 'none',
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    transition: 'all 0.2s'
                                }}
                            >
                                <Download size={16} />
                                Download PDF
                            </button>
                            <span style={{
                                color: '#10b981',
                                background: 'rgba(16,185,129,0.1)',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 700,
                                letterSpacing: '0.5px'
                            }}>
                                {px.status.toUpperCase()}
                            </span>
                        </div>
                    </motion.div>
                ))
            ) : (
                <p style={{ color: '#888', textAlign: 'center', padding: '40px' }}>No active prescriptions.</p>
            )}
        </div>
    );
};

export default MedicationList;
