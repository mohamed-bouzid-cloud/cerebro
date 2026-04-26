import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0f14',
      color: 'white',
      padding: '40px 20px'
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '20px' }}>🧠 Cerebro</h1>
        <p style={{ fontSize: '1.1rem', color: '#a1a1aa', marginBottom: '40px' }}>
          Medical imaging platform for doctors and patients
        </p>

        {user ? (
          <div style={{
            background: '#121820',
            border: '1px solid #1f2937',
            borderRadius: '8px',
            padding: '24px',
            marginBottom: '24px'
          }}>
            <p style={{ marginBottom: '16px' }}>
              ✅ Logged in as: <strong>{user.email}</strong> (Role: {user.role})
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              {user.role === 'doctor' && (
                <Link to="/doctor-dashboard">
                  <button style={{
                    padding: '10px 20px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '1rem'
                  }}>
                    Doctor Dashboard
                  </button>
                </Link>
              )}
              {user.role === 'patient' && (
                <Link to="/patient-dashboard">
                  <button style={{
                    padding: '10px 20px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '1rem'
                  }}>
                    Patient Dashboard
                  </button>
                </Link>
              )}
              <button 
                onClick={logout}
                style={{
                  padding: '10px 20px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                Logout
              </button>
            </div>
          </div>
        ) : (
          <div style={{
            background: '#121820',
            border: '1px solid #1f2937',
            borderRadius: '8px',
            padding: '24px',
            marginBottom: '24px'
          }}>
            <p style={{ marginBottom: '16px', color: '#a1a1aa' }}>
              Not logged in. Use the buttons below to get started.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <Link to="/login">
                <button style={{
                  padding: '10px 20px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}>
                  Sign In
                </button>
              </Link>
              <Link to="/signup">
                <button style={{
                  padding: '10px 20px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}>
                  Sign Up
                </button>
              </Link>
            </div>
          </div>
        )}

        <div style={{
          background: '#121820',
          border: '1px solid #1f2937',
          borderRadius: '8px',
          padding: '24px',
          marginTop: '24px'
        }}>
          <h2 style={{ marginBottom: '16px' }}>Available Routes</h2>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li style={{ marginBottom: '8px' }}>📌 <strong>/</strong> - Home (this page)</li>
            <li style={{ marginBottom: '8px' }}>🔐 <strong>/login</strong> - Sign in</li>
            <li style={{ marginBottom: '8px' }}>📝 <strong>/signup</strong> - Create account</li>
            <li style={{ marginBottom: '8px' }}>👨‍⚕️ <strong>/doctor-dashboard</strong> - Doctor view (protected)</li>
            <li style={{ marginBottom: '8px' }}>🧑 <strong>/patient-dashboard</strong> - Patient view (protected)</li>
          </ul>
        </div>

        <div style={{
          background: '#121820',
          border: '1px solid #1f2937',
          borderRadius: '8px',
          padding: '24px',
          marginTop: '24px'
        }}>
          <h2 style={{ marginBottom: '16px' }}>Backend Status</h2>
          <p style={{ color: '#a1a1aa' }}>
            Backend API: <strong>http://localhost:8000</strong>
          </p>
          <p style={{ color: '#a1a1aa' }}>
            Frontend: <strong>http://localhost:5176</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
