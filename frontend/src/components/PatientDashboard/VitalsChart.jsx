import React from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Heart, Activity, Thermometer } from 'lucide-react';

const VitalsChart = ({ vitalsData }) => {
    // Process data for Recharts
    const chartData = [...vitalsData].reverse().map(v => ({
        date: new Date(v.measured_at).toLocaleDateString(),
        temp: v.temperature,
        hr: v.heart_rate,
        sys: v.blood_pressure_systolic,
        dia: v.blood_pressure_diastolic,
        fullDate: new Date(v.measured_at).toLocaleString()
    }));

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{
                    background: 'rgba(15, 20, 25, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '12px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                }}>
                    <p style={{ color: '#fff', fontSize: '12px', marginBottom: '8px', fontWeight: 600 }}>{payload[0].payload.fullDate}</p>
                    {payload.map((entry, index) => (
                        <p key={index} style={{ color: entry.color, fontSize: '13px', margin: '4px 0' }}>
                            {entry.name}: {entry.value} {entry.unit}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div style={{ display: 'grid', gap: '20px', marginBottom: '24px' }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '16px',
                    padding: '24px',
                    height: '400px'
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Activity size={20} style={{ color: '#3b82f6' }} />
                        Vital Signs Trends
                    </h3>
                </div>

                <ResponsiveContainer width="100%" height="85%">
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis 
                            dataKey="date" 
                            stroke="#666" 
                            fontSize={12} 
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis 
                            stroke="#666" 
                            fontSize={12} 
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                        
                        <Line 
                            name="Systolic BP" 
                            type="monotone" 
                            dataKey="sys" 
                            stroke="#3b82f6" 
                            strokeWidth={3}
                            dot={{ fill: '#3b82f6', r: 4 }}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                            unit="mmHg"
                        />
                        <Line 
                            name="Diastolic BP" 
                            type="monotone" 
                            dataKey="dia" 
                            stroke="#10b981" 
                            strokeWidth={3}
                            dot={{ fill: '#10b981', r: 4 }}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                            unit="mmHg"
                        />
                        <Line 
                            name="Heart Rate" 
                            type="monotone" 
                            dataKey="hr" 
                            stroke="#ef4444" 
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={{ fill: '#ef4444', r: 3 }}
                            unit="bpm"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </motion.div>
        </div>
    );
};

export default VitalsChart;
