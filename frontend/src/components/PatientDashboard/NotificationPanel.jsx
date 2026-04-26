import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff, X, Calendar, Beaker, Pill, MessageCircle, AlertCircle } from 'lucide-react';

const NotificationPanel = ({ notifications, onMarkAsRead, onClearAll }) => {
    const getIcon = (type) => {
        switch (type) {
            case 'appointment': return <Calendar size={18} />;
            case 'result': return <Beaker size={18} />;
            case 'prescription': return <Pill size={18} />;
            case 'message': return <MessageCircle size={18} />;
            default: return <Bell size={18} />;
        }
    };

    const getColor = (type) => {
        switch (type) {
            case 'appointment': return '#3b82f6';
            case 'result': return '#8b5cf6';
            case 'prescription': return '#10b981';
            case 'message': return '#f59e0b';
            default: return '#888';
        }
    };

    const unread = notifications?.filter(n => !n.is_read) || [];

    return (
        <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Bell size={20} />
                    Notifications 
                    {unread.length > 0 && <span style={{ background: '#ef4444', color: '#fff', fontSize: '11px', padding: '2px 8px', borderRadius: '10px' }}>{unread.length} new</span>}
                </h2>
                {notifications?.length > 0 && (
                    <button 
                        onClick={onClearAll}
                        style={{ background: 'transparent', border: 'none', color: '#666', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                        Mark all as read
                    </button>
                )}
            </div>

            <div style={{ display: 'grid', gap: '12px' }}>
                {notifications?.length > 0 ? (
                    <AnimatePresence>
                        {notifications.map((n, idx) => (
                            <motion.div
                                key={n.id || idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                style={{
                                    background: n.is_read ? 'rgba(255,255,255,0.03)' : 'rgba(59,130,246,0.08)',
                                    border: `1px solid ${n.is_read ? 'rgba(255,255,255,0.05)' : 'rgba(59,130,246,0.2)'}`,
                                    borderRadius: '16px',
                                    padding: '16px',
                                    display: 'flex',
                                    gap: '16px',
                                    cursor: 'pointer',
                                    position: 'relative'
                                }}
                                onClick={() => !n.is_read && onMarkAsRead(n.id)}
                            >
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '10px',
                                    background: `${getColor(n.notification_type)}22`,
                                    color: getColor(n.notification_type),
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    {getIcon(n.notification_type)}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ color: '#fff', fontSize: '15px', fontWeight: 600, margin: '0 0 4px 0' }}>{n.title}</h4>
                                    <p style={{ color: '#888', fontSize: '13px', margin: 0, lineHeight: 1.4 }}>{n.content}</p>
                                    <p style={{ color: '#555', fontSize: '11px', marginTop: '8px' }}>
                                        {new Date(n.created_at).toLocaleString()}
                                    </p>
                                </div>
                                {!n.is_read && (
                                    <div style={{ 
                                        width: '8px', 
                                        height: '8px', 
                                        background: '#3b82f6', 
                                        borderRadius: '50%', 
                                        position: 'absolute', 
                                        top: '16px', 
                                        right: '16px' 
                                    }} />
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                ) : (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: '#666' }}>
                        <BellOff size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                        <p style={{ margin: 0 }}>All caught up! No new notifications.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationPanel;
