import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                minHeight: '100vh', background: 'var(--c-bg)', color: 'var(--c-text-2)',
                fontSize: '0.9rem',
            }}>
                Loading…
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Check if user has an allowed role
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        // Redirect to the user's dashboard based on their role
        const redirectPath = user.role === 'doctor' ? '/doctor-dashboard' : '/patient-dashboard';
        return <Navigate to={redirectPath} replace />;
    }

    return children;
}
