import React from 'react';
import { motion } from 'framer-motion';
import { User, Phone, Calendar, Droplet } from 'lucide-react';

const ProfileCard = ({ user }) => {
    const calculateAge = (dob) => {
        if (!dob) return 'N/A';
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const profile = user?.profile || {};

    return (
        <motion.div
<<<<<<< HEAD
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card rim-light p-8 relative overflow-hidden group h-full"
        >
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <User size={120} className="text-blue-500" />
            </div>

            <div className="flex items-center gap-6 relative z-10">
                <div className="relative">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-3xl font-black shadow-[0_10px_30px_rgba(37,99,235,0.3)]">
                        {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#080a0f] rounded-lg border border-white/10 flex items-center justify-center">
                        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                    </div>
                </div>
                
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-black text-white tracking-tight m-0">
                            {user?.first_name} {user?.last_name}
                        </h2>
                        <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded text-[9px] font-black text-blue-400 uppercase tracking-widest">
                            Verified
                        </span>
                    </div>
                    <p className="text-[11px] font-bold text-gray-500 mt-1 uppercase tracking-[0.2em]">
                        Bio-Medical Cipher: <span className="text-blue-500/70">#PAT-{user?.id?.toString().padStart(4, '0')}</span>
=======
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '24px'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '40px',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '32px',
                    fontWeight: 700
                }}>
                    {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                    <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: 700, margin: 0 }}>
                        {user?.first_name} {user?.last_name}
                    </h2>
                    <p style={{ color: '#888', margin: '4px 0 0 0', fontSize: '14px' }}>
                        Patient ID: #PAT-{user?.id?.toString().padStart(4, '0')}
>>>>>>> b381c81bab0b6500d6e25aa0d8e664d8397d0550
                    </p>
                </div>
            </div>

<<<<<<< HEAD
            <div className="grid grid-cols-3 gap-6 mt-10 pt-8 border-t border-white/5 relative z-10">
                <div className="flex items-center gap-4 group/item">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover/item:bg-blue-500/20 transition-all border border-blue-500/10">
                        <Calendar size={18} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1.5">Age</p>
                        <p className="text-sm font-black text-white">
                            {calculateAge(profile.date_of_birth)} YRS
=======
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '16px',
                marginTop: '24px',
                paddingTop: '24px',
                borderTop: '1px solid rgba(255,255,255,0.1)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ color: '#3b82f6', background: 'rgba(59,130,246,0.1)', padding: '8px', borderRadius: '8px' }}>
                        <Calendar size={18} />
                    </div>
                    <div>
                        <p style={{ color: '#888', fontSize: '12px', margin: 0 }}>Age</p>
                        <p style={{ color: '#fff', fontSize: '14px', fontWeight: 600, margin: 0 }}>
                            {calculateAge(profile.date_of_birth)} years
>>>>>>> b381c81bab0b6500d6e25aa0d8e664d8397d0550
                        </p>
                    </div>
                </div>

<<<<<<< HEAD
                <div className="flex items-center gap-4 group/item">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400 group-hover/item:bg-rose-500/20 transition-all border border-rose-500/10">
                        <Droplet size={18} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1.5">Blood</p>
                        <p className="text-sm font-black text-white">
                            {profile.blood_type || 'RH-'}
=======
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '8px', borderRadius: '8px' }}>
                        <Droplet size={18} />
                    </div>
                    <div>
                        <p style={{ color: '#888', fontSize: '12px', margin: 0 }}>Blood Type</p>
                        <p style={{ color: '#fff', fontSize: '14px', fontWeight: 600, margin: 0 }}>
                            {profile.blood_type || 'Unknown'}
>>>>>>> b381c81bab0b6500d6e25aa0d8e664d8397d0550
                        </p>
                    </div>
                </div>

<<<<<<< HEAD
                <div className="flex items-center gap-4 group/item">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover/item:bg-emerald-500/20 transition-all border border-emerald-500/10">
                        <Phone size={18} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1.5">Comms</p>
                        <p className="text-sm font-black text-white truncate max-w-[100px]">
                            {profile.phone_number || 'ENC-SEC'}
=======
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '8px', borderRadius: '8px' }}>
                        <Phone size={18} />
                    </div>
                    <div>
                        <p style={{ color: '#888', fontSize: '12px', margin: 0 }}>Phone</p>
                        <p style={{ color: '#fff', fontSize: '14px', fontWeight: 600, margin: 0 }}>
                            {profile.phone_number || 'Not provided'}
>>>>>>> b381c81bab0b6500d6e25aa0d8e664d8397d0550
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default ProfileCard;
