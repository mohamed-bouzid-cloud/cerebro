import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';

const LabResultForm = ({ patient, lab, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        test_name: '',
        test_code: '',
        result_value: '',
        result_unit: '',
        reference_range: '',
        interpretation: '',
        panel_type: '',
        components: {},
    });

    const [components, setComponents] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const panelTypes = [
        { value: 'CBC', label: 'Complete Blood Count (CBC)' },
        { value: 'METABOLIC', label: 'Metabolic Panel' },
        { value: 'HEPATIC', label: 'Hepatic Panel' },
        { value: 'RENAL', label: 'Renal Panel' },
        { value: 'ANAPATH', label: 'Anatomical Pathology (Anapath)' },
    ];

    // Load existing lab data if editing
    useEffect(() => {
        if (lab) {
            setFormData({
                test_name: lab.test_name || '',
                test_code: lab.test_code || '',
                result_value: lab.result_value || '',
                result_unit: lab.result_unit || '',
                reference_range: lab.reference_range || '',
                interpretation: lab.interpretation || '',
                panel_type: lab.panel_type || '',
                components: lab.components || {},
            });

            // Load components into the editable list
            if (lab.components && Object.keys(lab.components).length > 0) {
                const compList = Object.entries(lab.components).map(([key, comp]) => ({
                    id: key,
                    ...comp,
                }));
                setComponents(compList);
            }
        }
    }, [lab]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handlePanelTypeChange = (e) => {
        const panelType = e.target.value;
        setFormData((prev) => ({ ...prev, panel_type: panelType }));

        // Clear components when switching panel type
        if (panelType) {
            setComponents([]);
        }
    };

    const addComponent = () => {
        setComponents((prev) => [
            ...prev,
            {
                id: `comp_${Date.now()}`,
                name: '',
                value: '',
                unit: '',
                reference_range: '',
                is_abnormal: false,
            },
        ]);
    };

    const removeComponent = (id) => {
        setComponents((prev) => prev.filter((comp) => comp.id !== id));
    };

    const updateComponent = (id, field, value) => {
        setComponents((prev) =>
            prev.map((comp) =>
                comp.id === id ? { ...comp, [field]: value } : comp
            )
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);

        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                setError('Authentication required');
                return;
            }

            // Build components object
            const componentsObj = {};
            components.forEach((comp) => {
                const key = comp.id || `comp_${components.indexOf(comp)}`;
                componentsObj[key] = {
                    name: comp.name,
                    value: comp.value,
                    unit: comp.unit,
                    reference_range: comp.reference_range,
                    is_abnormal: comp.is_abnormal || false,
                };
            });

            const payload = {
                ...formData,
                patient: patient?.id || lab?.patient,
                components: Object.keys(componentsObj).length > 0 ? componentsObj : {},
            };

            const method = lab ? 'PATCH' : 'POST';
            const url = lab
                ? `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/auth/lab-results/${lab.id}/`
                : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/auth/lab-results/`;

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to save lab result');
            }

            await onSubmit();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-[#1f2937] border border-[#374151] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
                {/* Header */}
                <div className="sticky top-0 flex items-center justify-between p-6 border-b border-[#374151] bg-[#0a0f14]/80 backdrop-blur-md">
                    <h2 className="text-2xl font-bold text-white">
                        {lab ? 'Edit Lab Result' : 'New Lab Result'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-[#374151] rounded-lg transition-colors"
                    >
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Error Alert */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-3"
                        >
                            <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-400">{error}</p>
                        </motion.div>
                    )}

                    {/* Patient Info (Read-only) */}
                    <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                        <p className="text-xs text-gray-500 uppercase mb-1">Patient</p>
                        <p className="font-bold text-white">
                            {patient ? `${patient?.first_name || patient?.name || ''} ${patient?.last_name || ''}` : lab?.patient_name}
                        </p>
                    </div>

                    {/* Basic Test Info */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-white uppercase">Test Information</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-400 uppercase mb-2">Test Name *</label>
                                <input
                                    type="text"
                                    name="test_name"
                                    value={formData.test_name}
                                    onChange={handleInputChange}
                                    placeholder="e.g., Hemoglobin"
                                    required
                                    className="w-full px-3 py-2 bg-[#2d3748] border border-[#4b5563] rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 uppercase mb-2">Test Code</label>
                                <input
                                    type="text"
                                    name="test_code"
                                    value={formData.test_code}
                                    onChange={handleInputChange}
                                    placeholder="e.g., HGB"
                                    className="w-full px-3 py-2 bg-[#2d3748] border border-[#4b5563] rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs text-gray-400 uppercase mb-2">Panel Type</label>
                            <select
                                value={formData.panel_type}
                                onChange={handlePanelTypeChange}
                                className="w-full px-3 py-2 bg-[#2d3748] border border-[#4b5563] rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                            >
                                <option value="">Select Panel (optional)</option>
                                {panelTypes.map((panel) => (
                                    <option key={panel.value} value={panel.value}>
                                        {panel.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Result Value (for single results) */}
                    {!formData.panel_type && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-white uppercase">Result</h3>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs text-gray-400 uppercase mb-2">Value *</label>
                                    <input
                                        type="text"
                                        name="result_value"
                                        value={formData.result_value}
                                        onChange={handleInputChange}
                                        placeholder="e.g., 13.5"
                                        required={!formData.panel_type}
                                        className="w-full px-3 py-2 bg-[#2d3748] border border-[#4b5563] rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 uppercase mb-2">Unit</label>
                                    <input
                                        type="text"
                                        name="result_unit"
                                        value={formData.result_unit}
                                        onChange={handleInputChange}
                                        placeholder="e.g., g/dL"
                                        className="w-full px-3 py-2 bg-[#2d3748] border border-[#4b5563] rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 uppercase mb-2">Reference Range</label>
                                    <input
                                        type="text"
                                        name="reference_range"
                                        value={formData.reference_range}
                                        onChange={handleInputChange}
                                        placeholder="e.g., 12.0 - 16.0"
                                        className="w-full px-3 py-2 bg-[#2d3748] border border-[#4b5563] rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs text-gray-400 uppercase mb-2">Interpretation</label>
                                <textarea
                                    name="interpretation"
                                    value={formData.interpretation}
                                    onChange={handleInputChange}
                                    placeholder="e.g., Slightly elevated, recommend follow-up"
                                    rows="2"
                                    className="w-full px-3 py-2 bg-[#2d3748] border border-[#4b5563] rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                />
                            </div>
                        </div>
                    )}

                    {/* Panel Components */}
                    {formData.panel_type && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-white uppercase">Panel Components</h3>
                                <motion.button
                                    type="button"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={addComponent}
                                    className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors"
                                >
                                    <Plus size={14} />
                                    Add Component
                                </motion.button>
                            </div>

                            {components.length === 0 ? (
                                <div className="p-4 text-center text-gray-400 border border-dashed border-[#374151] rounded-lg">
                                    <p className="text-sm">No components added yet. Click "Add Component" to start.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {components.map((comp) => (
                                        <motion.div
                                            key={comp.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="p-4 rounded-lg bg-[#2d3748] border border-[#4b5563] space-y-3"
                                        >
                                            <div className="grid grid-cols-2 gap-3">
                                                <input
                                                    type="text"
                                                    placeholder="Component Name"
                                                    value={comp.name}
                                                    onChange={(e) =>
                                                        updateComponent(comp.id, 'name', e.target.value)
                                                    }
                                                    className="px-2 py-1.5 bg-[#1f2937] border border-[#374151] rounded text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Value"
                                                    value={comp.value}
                                                    onChange={(e) =>
                                                        updateComponent(comp.id, 'value', e.target.value)
                                                    }
                                                    className="px-2 py-1.5 bg-[#1f2937] border border-[#374151] rounded text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                                />
                                            </div>
                                            <div className="grid grid-cols-3 gap-3">
                                                <input
                                                    type="text"
                                                    placeholder="Unit"
                                                    value={comp.unit}
                                                    onChange={(e) =>
                                                        updateComponent(comp.id, 'unit', e.target.value)
                                                    }
                                                    className="px-2 py-1.5 bg-[#1f2937] border border-[#374151] rounded text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Ref Range"
                                                    value={comp.reference_range}
                                                    onChange={(e) =>
                                                        updateComponent(
                                                            comp.id,
                                                            'reference_range',
                                                            e.target.value
                                                        )
                                                    }
                                                    className="px-2 py-1.5 bg-[#1f2937] border border-[#374151] rounded text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeComponent(comp.id)}
                                                    className="px-2 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded text-red-400 transition-colors flex items-center justify-center"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-6 border-t border-[#374151]">
                        <motion.button
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onClose}
                            disabled={submitting}
                            className="flex-1 px-4 py-2 bg-gray-600/30 hover:bg-gray-600/50 text-gray-300 rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </motion.button>
                        <motion.button
                            type="submit"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={submitting}
                            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {submitting ? (
                                <>
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                                    />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 size={16} />
                                    {lab ? 'Update Result' : 'Create Result'}
                                </>
                            )}
                        </motion.button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
};

export default LabResultForm;
