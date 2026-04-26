import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Microscope, Plus, AlertCircle, CheckCircle2, Clock, Search,
    ChevronDown, Filter, Download, Activity, TrendingUp
} from 'lucide-react';
import LabResultForm from './LabResultForm';

const LabCenterPanel = ({ patient }) => {
    const [labs, setLabs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // all, pending, in_progress, completed
    const [showForm, setShowForm] = useState(false);
    const [selectedLab, setSelectedLab] = useState(null);
    const [expandedLab, setExpandedLab] = useState(null);

    // Fetch labs for current patient
    useEffect(() => {
        fetchLabResults();
    }, [patient?.id]);

    const fetchLabResults = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            if (!token) return;

            const url = patient?.id
                ? `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/auth/lab-results/?patient=${patient.id}`
                : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/auth/lab-results/`;

            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setLabs(Array.isArray(data) ? data : data.results || []);
            }
        } catch (error) {
            console.error('Error fetching lab results:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleNewResult = () => {
        setSelectedLab(null);
        setShowForm(true);
    };

    const handleEditResult = (lab) => {
        setSelectedLab(lab);
        setShowForm(true);
    };

    const handleFormClose = () => {
        setShowForm(false);
        setSelectedLab(null);
    };

    const handleFormSubmit = async () => {
        await fetchLabResults();
        handleFormClose();
    };

    const filteredLabs = labs.filter((lab) => {
        const matchesSearch =
            lab.test_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lab.patient_name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter =
            filterStatus === 'all' || lab.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    const statusConfig = {
        pending: { color: 'bg-gray-500/10', text: 'text-gray-400', badge: 'bg-gray-600', icon: Clock },
        in_progress: { color: 'bg-blue-500/10', text: 'text-blue-400', badge: 'bg-blue-600', icon: Activity },
        completed: { color: 'bg-emerald-500/10', text: 'text-emerald-400', badge: 'bg-emerald-600', icon: CheckCircle2 },
    };

    const getStatusConfig = (status) => statusConfig[status] || statusConfig.pending;

    const getCriticalFlag = (lab) => lab.critical_flag ? (
        <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex items-center gap-2 px-3 py-1 bg-red-500/20 border border-red-500 rounded-full"
        >
            <AlertCircle size={14} className="text-red-500" />
            <span className="text-xs font-bold text-red-500">CRITICAL</span>
        </motion.div>
    ) : null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center">
                        <Microscope size={24} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">Lab Center</h2>
                        <p className="text-sm text-gray-400">Manage and review laboratory test results</p>
                    </div>
                </div>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleNewResult}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                    <Plus size={18} />
                    New Result
                </motion.button>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search size={16} className="absolute left-3 top-3 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search by test name or patient..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-[#1f2937] border border-[#374151] rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter size={16} className="text-gray-500" />
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-2 bg-[#1f2937] border border-[#374151] rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Total Results', value: labs.length, icon: Microscope, color: 'blue' },
                    {
                        label: 'Pending',
                        value: labs.filter((l) => l.status === 'pending').length,
                        icon: Clock,
                        color: 'gray',
                    },
                    {
                        label: 'Critical Values',
                        value: labs.filter((l) => l.critical_flag).length,
                        icon: AlertCircle,
                        color: 'red',
                    },
                    {
                        label: 'Completed',
                        value: labs.filter((l) => l.status === 'completed').length,
                        icon: CheckCircle2,
                        color: 'emerald',
                    },
                ].map((stat, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className={`p-4 rounded-lg border ${
                            stat.color === 'blue'
                                ? 'bg-blue-500/10 border-blue-500/30'
                                : stat.color === 'gray'
                                ? 'bg-gray-500/10 border-gray-500/30'
                                : stat.color === 'red'
                                ? 'bg-red-500/10 border-red-500/30'
                                : 'bg-emerald-500/10 border-emerald-500/30'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-gray-400 uppercase">{stat.label}</p>
                                <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                            </div>
                            <stat.icon
                                size={24}
                                className={`${
                                    stat.color === 'blue'
                                        ? 'text-blue-500'
                                        : stat.color === 'gray'
                                        ? 'text-gray-500'
                                        : stat.color === 'red'
                                        ? 'text-red-500'
                                        : 'text-emerald-500'
                                }`}
                            />
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Results List or Empty State */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="inline-block">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                            className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"
                        />
                    </div>
                    <p className="mt-4 text-gray-400">Loading lab results...</p>
                </div>
            ) : filteredLabs.length === 0 ? (
                <div className="text-center py-12 bg-[#1f2937]/50 rounded-lg border border-[#374151]">
                    <Microscope size={32} className="mx-auto text-gray-600 mb-4" />
                    <p className="text-gray-400 font-medium">No lab results found</p>
                    <p className="text-sm text-gray-500 mt-1">Create a new result to get started</p>
                </div>
            ) : (
                <div className="space-y-3">
                    <AnimatePresence>
                        {filteredLabs.map((lab, idx) => {
                            const isExpanded = expandedLab === lab.id;
                            const config = getStatusConfig(lab.status);
                            const StatusIcon = config.icon;

                            return (
                                <motion.div
                                    key={lab.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className={`border rounded-lg transition-all ${
                                        isExpanded
                                            ? 'bg-[#1f2937]/80 border-blue-500/50'
                                            : config.color + ' border-[#374151] hover:border-[#4b5563]'
                                    }`}
                                >
                                    {/* Header */}
                                    <button
                                        onClick={() => setExpandedLab(isExpanded ? null : lab.id)}
                                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#1f2937]/30 transition-colors"
                                    >
                                        <div className="flex items-center gap-4 flex-1">
                                            <StatusIcon size={18} className={config.text} />
                                            <div className="text-left">
                                                <p className="font-bold text-white uppercase tracking-wide text-xs mb-1 text-blue-400">
                                                    Patient: {lab.patient_name || 'Unknown Patient'}
                                                </p>
                                                <p className="font-bold text-white text-lg">{lab.test_name}</p>
                                                <p className="text-sm text-gray-400">
                                                    {lab.panel_type && `Panel: ${lab.panel_type} • `}
                                                    {new Date(lab.ordered_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {getCriticalFlag(lab)}
                                            <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
                                                <ChevronDown size={18} className="text-gray-500" />
                                            </motion.div>
                                        </div>
                                    </button>

                                    {/* Expanded Content */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="border-t border-[#374151] px-6 py-4 bg-[#1f2937]/50 space-y-4"
                                            >
                                                {/* Result Value */}
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-xs text-gray-500 uppercase">Result Value</p>
                                                        <p className={`text-xl font-bold mt-1 ${
                                                            lab.is_abnormal ? 'text-red-400' : 'text-white'
                                                        }`}>
                                                            {lab.result_value} {lab.result_unit}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 uppercase">Reference Range</p>
                                                        <p className="text-sm text-gray-300 mt-1">{lab.reference_range}</p>
                                                    </div>
                                                </div>

                                                {/* Components (if panel) */}
                                                {lab.components && Object.keys(lab.components).length > 0 && (
                                                    <div>
                                                        <p className="text-xs text-gray-500 uppercase mb-3">Panel Components</p>
                                                        <div className="space-y-2 max-h-48 overflow-y-auto">
                                                            {Object.entries(lab.components).map(([key, comp]) => (
                                                                <div
                                                                    key={key}
                                                                    className={`p-2 rounded-lg ${
                                                                        comp.is_abnormal
                                                                            ? 'bg-red-500/10 border border-red-500/30'
                                                                            : 'bg-gray-500/10 border border-gray-500/30'
                                                                    }`}
                                                                >
                                                                    <div className="flex justify-between items-start">
                                                                        <div>
                                                                            <p className="text-sm font-medium text-white">{comp.name || key}</p>
                                                                            <p className="text-xs text-gray-400">
                                                                                {comp.value} {comp.unit}
                                                                            </p>
                                                                        </div>
                                                                        <span
                                                                            className={`text-xs font-bold px-2 py-1 rounded ${
                                                                                comp.is_abnormal
                                                                                    ? 'bg-red-500 text-white'
                                                                                    : 'bg-emerald-500 text-white'
                                                                            }`}
                                                                        >
                                                                            {comp.is_abnormal ? 'ABNORMAL' : 'NORMAL'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Interpretation */}
                                                {lab.interpretation && (
                                                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                                                        <p className="text-xs text-gray-500 uppercase mb-1">Interpretation</p>
                                                        <p className="text-sm text-blue-300">{lab.interpretation}</p>
                                                    </div>
                                                )}

                                                {/* Action Buttons */}
                                                <div className="flex gap-2 pt-4 border-t border-[#374151]">
                                                    {lab.status !== 'completed' && (
                                                        <motion.button
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={() => handleEditResult(lab)}
                                                            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                                                        >
                                                            Edit
                                                        </motion.button>
                                                    )}
                                                    <motion.button
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => window.print()}
                                                        className="flex-1 px-4 py-2 bg-gray-600/30 hover:bg-gray-600/50 text-gray-300 rounded-lg text-sm font-medium transition-colors"
                                                    >
                                                        Download PDF
                                                    </motion.button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}

            {/* Lab Result Form Modal */}
            <AnimatePresence>
                {showForm && (
                    <LabResultForm
                        patient={patient}
                        lab={selectedLab}
                        onClose={handleFormClose}
                        onSubmit={handleFormSubmit}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default LabCenterPanel;
