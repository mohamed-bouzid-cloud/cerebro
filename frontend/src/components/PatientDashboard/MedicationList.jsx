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
        <div className="grid gap-5">
            {prescriptions?.length > 0 ? (
                prescriptions.map((px, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="glass-card rim-light p-6 flex justify-between items-center group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        <div className="flex gap-6 items-center relative z-10">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-inner group-hover:scale-105 transition-transform">
                                <Pill size={28} />
                            </div>
                            <div>
                                <h4 className="text-white font-black text-lg m-0 flex items-center gap-2">
                                    {px.medication_name}
                                    <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[9px] font-black text-emerald-400 uppercase tracking-tighter">
                                        Active
                                    </span>
                                </h4>
                                <div className="flex gap-4 mt-2">
                                    <span className="text-gray-400 text-[11px] font-bold flex items-center gap-1.5">
                                        <Clock size={12} className="text-emerald-500/60" /> {px.frequency}
                                    </span>
                                    <span className="text-gray-400 text-[11px] font-bold flex items-center gap-1.5">
                                        <Info size={12} className="text-emerald-500/60" /> {px.dosage}
                                    </span>
                                </div>
                                {px.notes && (
                                    <p className="text-[11px] font-bold text-gray-500 m-0 mt-3 pl-3 border-l-2 border-emerald-500/20 italic max-w-md">
                                        "{px.notes}"
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-3 relative z-10 text-right">
                            <button
                                onClick={() => handleDownload(px)}
                                className="bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-600/20 px-6 py-2 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-2"
                            >
                                <Download size={14} /> PDF BRIEF
                            </button>
                            <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">
                                EXP: {new Date(px.expiry_date).toLocaleDateString()}
                            </span>
                        </div>
                    </motion.div>
                ))
            ) : (
                <div className="py-20 text-center glass-card rim-light !border-dashed opacity-30">
                    <Pill className="mx-auto text-gray-700 mb-4" size={40} />
                    <p className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-500">No Pharmacological Records</p>
                </div>
            )}
        </div>
    );
};

export default MedicationList;
