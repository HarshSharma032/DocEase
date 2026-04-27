import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense } from 'react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import DoctorListing from './pages/DoctorListing';
import DoctorProfile from './pages/DoctorProfile';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import AvailabilitySettings from './pages/AvailabilitySettings';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentFailed from './pages/PaymentFailed';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastContainer } from './components/Toast';
import { useAuth } from './context/AuthContext';

// Protected Route wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <div className="min-h-screen flex flex-col pt-16">
          <Navbar />
          <ToastContainer />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/doctors" element={<DoctorListing />} />
              <Route path="/doctor/:id" element={<DoctorProfile />} />
              <Route path="/book/:id" element={<DoctorProfile />} />

              {/* Protected Patient Routes */}
              <Route path="/patient-dashboard" element={
                <ProtectedRoute allowedRoles={['Patient']}>
                  <PatientDashboard />
                </ProtectedRoute>
              } />
              <Route path="/payment-success" element={
                <ProtectedRoute allowedRoles={['Patient']}>
                  <PaymentSuccess />
                </ProtectedRoute>
              } />
              <Route path="/payment-failed" element={
                <ProtectedRoute allowedRoles={['Patient']}>
                  <PaymentFailed />
                </ProtectedRoute>
              } />

              {/* Protected Doctor Routes */}
              <Route path="/doctor-dashboard" element={
                <ProtectedRoute allowedRoles={['Doctor']}>
                  <DoctorDashboard />
                </ProtectedRoute>
              } />

              <Route path="/availability-settings" element={
                <ProtectedRoute allowedRoles={['Doctor']}>
                  <AvailabilitySettings />
                </ProtectedRoute>
              } />

              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="/admin-dashboard" element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
