// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import InstallPrompt from './components/common/InstallPrompt'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { SocketProvider } from './context/SocketContext'
import DoctorChatPage from './pages/doctor/Chat'
// Auth pages
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'

// Patient pages
import PatientDashboard from './pages/patient/Dashboard'
import PatientProfile from './pages/patient/Profile'
import HealthDataPage from './pages/patient/HealthData'
import MedicationsPage from './pages/patient/Medications'
import ReportsPage from './pages/patient/Reports'
import AppointmentsPage from './pages/patient/Appointments'
import AIInsightsPage from './pages/patient/AIInsights'
import ChatPage from './pages/patient/Chat'
import EmergencyPage from './pages/patient/Emergency'

// Doctor pages
import DoctorDashboard from './pages/doctor/Dashboard'
import DoctorPatients from './pages/doctor/Patients'
import DoctorPatientDetail from './pages/doctor/PatientDetail'
import DoctorPrescriptions from './pages/doctor/Prescriptions'
import DoctorAppointments from './pages/doctor/Appointments'

// Admin pages
import AdminDashboard from './pages/admin/Dashboard'
import AdminUsers from './pages/admin/Users'
import AdminDoctorApprovals from './pages/admin/DoctorApprovals'

// Layout
import AppLayout from './components/common/AppLayout'
import LandingPage from './pages/LandingPage'

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />
  return children
}

const RoleRedirect = () => {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'doctor') return <Navigate to="/doctor/dashboard" replace />
  if (user.role === 'admin')  return <Navigate to="/admin/dashboard" replace />
  return <Navigate to="/patient/dashboard" replace />
}

const LoadingScreen = () => (
  <div style={{
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--bg-primary)', flexDirection: 'column', gap: '16px'
  }}>
    <div style={{
      width: 48, height: 48, borderRadius: '50%',
      border: '3px solid var(--border)',
      borderTopColor: 'var(--teal-400)',
      animation: 'spin 0.8s linear infinite'
    }} />
    <p style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-display)', fontSize: '0.9rem' }}>
      Loading HealthCore...
    </p>
  </div>
)

const AppRoutes = () => {
  const { user } = useAuth()

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={user ? <RoleRedirect /> : <LoginPage />} />
      <Route path="/register" element={user ? <RoleRedirect /> : <RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/dashboard" element={<RoleRedirect />} />

      {/* Patient routes */}
      <Route path="/patient" element={
        <ProtectedRoute roles={['patient']}>
          <AppLayout role="patient" />
        </ProtectedRoute>
      }>
        <Route path="dashboard"    element={<PatientDashboard />} />
        <Route path="profile"      element={<PatientProfile />} />
        <Route path="health-data"  element={<HealthDataPage />} />
        <Route path="medications"  element={<MedicationsPage />} />
        <Route path="reports"      element={<ReportsPage />} />
        <Route path="appointments" element={<AppointmentsPage />} />
        <Route path="ai-insights"  element={<AIInsightsPage />} />
        <Route path="chat"         element={<ChatPage />} />
        <Route path="emergency"    element={<EmergencyPage />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* Doctor routes */}
      <Route path="/doctor" element={
        <ProtectedRoute roles={['doctor']}>
          <AppLayout role="doctor" />
        </ProtectedRoute>
      }>
        <Route path="dashboard"       element={<DoctorDashboard />} />
        <Route path="patients"        element={<DoctorPatients />} />
        <Route path="patients/:id"    element={<DoctorPatientDetail />} />
        <Route path="prescriptions"   element={<DoctorPrescriptions />} />
        <Route path="appointments"    element={<DoctorAppointments />} />
        <Route path="chat" element={<DoctorChatPage />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* Admin routes */}
      <Route path="/admin" element={
        <ProtectedRoute roles={['admin']}>
          <AppLayout role="admin" />
        </ProtectedRoute>
      }>
        <Route path="dashboard"  element={<AdminDashboard />} />
        <Route path="users"      element={<AdminUsers />} />
        <Route path="approvals"  element={<AdminDoctorApprovals />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <AppRoutes />
          <InstallPrompt />
      <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--teal-900)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-accent)',
              borderRadius: '12px',
              fontFamily: 'var(--font-body)',
              fontSize: '0.875rem',
            },
            success: { iconTheme: { primary: '#66bb6a', secondary: 'transparent' } },
            error:   { iconTheme: { primary: '#ef5350', secondary: 'transparent' } },
          }}
        />
      </SocketProvider>
    </AuthProvider>
    </BrowserRouter>
  )
}