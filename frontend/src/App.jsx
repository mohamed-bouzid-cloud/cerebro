import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import Signup from './components/Signup';
import ProtectedRoute from './components/ProtectedRoute';
import PatientDashboard from './components/PatientDashboard';
import DoctorDashboard from './components/DoctorDashboard';
<<<<<<< HEAD

=======
import DoctorPatientPortal from './components/DoctorPatientPortal';
import DicomPage from './components/DicomPage';
// 1. Importation du composant Viewer
// import DicomViewer from './components/DicomViewer';
>>>>>>> dcc8718832808e12203694ff91ad11bc675c1868
function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
<<<<<<< HEAD
      
=======

>>>>>>> dcc8718832808e12203694ff91ad11bc675c1868
      {/* Role-based dashboard routes */}
      <Route path="/patient-dashboard" element={
        <ProtectedRoute allowedRoles={['patient']}>
          <PatientDashboard />
        </ProtectedRoute>
      } />
<<<<<<< HEAD
=======

>>>>>>> dcc8718832808e12203694ff91ad11bc675c1868
      <Route path="/doctor-dashboard" element={
        <ProtectedRoute allowedRoles={['doctor']}>
          <DoctorDashboard />
        </ProtectedRoute>
      } />
<<<<<<< HEAD
      
=======

      <Route path="/doctor/patient/:id" element={
        <ProtectedRoute allowedRoles={['doctor']}>
          <DoctorPatientPortal />
        </ProtectedRoute>
      } />

      <Route path="/doctor/dicom-viewer" element={
        <ProtectedRoute allowedRoles={['doctor']}>
          <DicomPage />
        </ProtectedRoute>
      } />

>>>>>>> dcc8718832808e12203694ff91ad11bc675c1868
      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;