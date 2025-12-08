import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import LoadingSpinner from './components/ui/LoadingSpinner'

// Public Pages
import HomePage from './pages/HomePageNew'
import MenuPage from './pages/MenuPageNew'
import AboutPage from './pages/AboutPage'

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'

// Dashboard Pages
import AdminDashboard from './pages/admin/AdminDashboard'
import ChefDashboard from './pages/chef/ChefDashboard'
import WaiterDashboard from './pages/waiter/WaiterDashboard'
import CustomerDashboard from './pages/customer/CustomerDashboard'

// Role-based dashboard redirect component
function DashboardRedirect() {
  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated || !user || !user.role) {
    return <Navigate to="/login" replace />
  }

  // Redirect based on user role
  switch (user.role) {
    case 'ROLE_ADMIN':
      return <Navigate to="/dashboard/admin" replace />
    case 'ROLE_CHEF':
      return <Navigate to="/dashboard/chef" replace />
    case 'ROLE_WAITER':
      return <Navigate to="/dashboard/waiter" replace />
    case 'ROLE_CUSTOMER':
      return <Navigate to="/dashboard/customer" replace />
    default:
      return <Navigate to="/" replace />
  }
}

function AppContent() {
  const { isAuthenticated, loading } = useAuth()

  // Show loading spinner while auth is being initialized
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route path="/menu" element={<MenuPage />} />
      <Route path="/about" element={<AboutPage />} />

      {/* Authentication Routes */}
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <DashboardRedirect />
          ) : (
            <LoginPage />
          )
        }
      />
      <Route
        path="/register"
        element={
          isAuthenticated ? (
            <DashboardRedirect />
          ) : (
            <RegisterPage />
          )
        }
      />

      {/* Protected Dashboard Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* Default dashboard route - redirects based on role */}
        <Route index element={<DashboardRedirect />} />

        {/* Admin Routes */}
        <Route
          path="admin/*"
          element={
            <ProtectedRoute requiredRole="ROLE_ADMIN">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Chef Routes */}
        <Route
          path="chef/*"
          element={
            <ProtectedRoute requiredRole="ROLE_CHEF">
              <ChefDashboard />
            </ProtectedRoute>
          }
        />

        {/* Waiter Routes */}
        <Route
          path="waiter/*"
          element={
            <ProtectedRoute requiredRole="ROLE_WAITER">
              <WaiterDashboard />
            </ProtectedRoute>
          }
        />

        {/* Customer Routes */}
        <Route
          path="customer/*"
          element={
            <ProtectedRoute requiredRole="ROLE_CUSTOMER">
              <CustomerDashboard />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Catch-all Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
