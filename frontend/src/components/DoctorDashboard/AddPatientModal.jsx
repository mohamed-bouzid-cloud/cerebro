import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, UserPlus, Link as LinkIcon, AlertCircle } from 'lucide-react';

const AddPatientModal = ({ isOpen, onClose, onSuccess }) => {
    const [mode, setMode] = useState('register'); // 'register' or 'link'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Register State
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        password: 'Password123!', // generic default
        role: 'patient'
    });

    // Link State
    const [linkEmail, setLinkEmail] = useState('');

    if (!isOpen) return null;

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('http://localhost:8000/api/auth/register/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            
            if (res.ok) {
                // Now link them
                await linkPatientToDoctor(data.user?.email || formData.email);
            } else {
                setError(data.detail || JSON.stringify(data));
                setLoading(false);
            }
        } catch (err) {
            setError("Failed to register patient");
            setLoading(false);
        }
    };

    const handleLink = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        await linkPatientToDoctor(linkEmail);
    };

    const linkPatientToDoctor = async (emailToLink) => {
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch('http://localhost:8000/api/auth/patients/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ email: emailToLink })
            });
            
            const data = await res.json();
            if (res.ok) {
                setTimeout(() => {
                    onSuccess(data.patient);
                    onClose();
                }, 500);
            } else {
                setError(data.error || "Failed to link patient");
                setLoading(false);
            }
        } catch (err) {
            setError("Error communicating with server");
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#0b0f14] w-full max-w-md border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
            >
                <div className="flex justify-between items-center p-6 border-b border-white/5 bg-white/5">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        {mode === 'register' ? <UserPlus size={20} className="text-blue-400" /> : <LinkIcon size={20} className="text-purple-400" />}
                        Add Patient to Practice
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors bg-black/20 p-2 rounded-full">
                        <X size={16} />
                    </button>
                </div>

                <div className="p-6">
                    <div className="flex bg-black/40 p-1 rounded-xl mb-6">
                        <button 
                            onClick={() => {setMode('register'); setError(null);}}
                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${mode === 'register' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
                        >
                            Register New
                        </button>
                        <button 
                            onClick={() => {setMode('link'); setError(null);}}
                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${mode === 'link' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
                        >
                            Link Existing
                        </button>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm font-medium">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    {mode === 'register' ? (
                        <form onSubmit={handleRegister} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">First Name</label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={formData.first_name}
                                        onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                                        className="w-full bg-[#151b23] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Last Name</label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={formData.last_name}
                                        onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                                        className="w-full bg-[#151b23] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
                                <input 
                                    type="email" 
                                    required 
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    className="w-full bg-[#151b23] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                />
                            </div>
                            
                            <button 
                                type="submit" 
                                disabled={loading}
                                className="w-full mt-6 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Processing...' : 'Register & Assign Patient'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleLink} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Patient Email Address</label>
                                <input 
                                    type="email" 
                                    required 
                                    value={linkEmail}
                                    onChange={(e) => setLinkEmail(e.target.value)}
                                    placeholder="patient@example.com"
                                    className="w-full bg-[#151b23] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                                />
                            </div>
                            <button 
                                type="submit" 
                                disabled={loading}
                                className="w-full mt-6 py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Linking...' : 'Link Patient'}
                            </button>
                        </form>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default AddPatientModal;
