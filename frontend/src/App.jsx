import { useEffect } from 'react'
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Navbar from './components/Navbar'
import LoadingSpinner from './components/ui/LoadingSpinner'

// Public Pages
import HomePage from './pages/HomePage'
import MenuPage from './pages/MenuPage'
import AboutPage from './pages/AboutPage'
import PublicCart from './pages/PublicCart'

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'

// Dashboard Pages
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminOrders from './pages/admin/AdminOrders'
import AdminBookings from './pages/admin/AdminBookings'
import AdminProducts from './pages/admin/AdminProducts'
import AdminUsers from './pages/admin/AdminUsers'
import AdminSettings from './pages/admin/AdminSettings'
import ChefDashboard from './pages/chef/ChefDashboard'
import ChefMenu from './pages/chef/ChefMenu'
import ChefOrders from './pages/chef/ChefOrders'
import WaiterDashboard from './pages/waiter/WaiterDashboard'
import WaiterOrders from './pages/waiter/WaiterOrders'
import WaiterTables from './pages/waiter/WaiterTables'
import WaiterDelivery from './pages/waiter/WaiterDelivery'
import CustomerDashboard from './pages/customer/CustomerDashboard'
import CustomerOrders from './pages/customer/CustomerOrders'
import CustomerBookings from './pages/customer/CustomerBookings'
import CustomerProfile from './pages/customer/CustomerProfile'
import CustomerCart from './pages/customer/CustomerCart'
import CustomerCartTest from './pages/customer/CustomerCartTest'

// Public Layout wrapper
const PublicLayout = ({ children }) => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>{children}</main>
    </div>
  )
}

// Role-based dashboard redirect component
function DashboardRedirect() {
  const { user, loading, isAuthenticated } = useAuth()

  // Show loading spinner while auth is being initialized
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  console.log('DashboardRedirect: user:', user, 'isAuthenticated:', isAuthenticated)

  // If not authenticated or no user data, redirect to login
  if (!isAuthenticated || !user) {
    console.log('DashboardRedirect: No user or role, redirecting to login')
    return <Navigate to="/login" replace />
  }

  // Check if user has role
  if (!user.role) {
    console.log('DashboardRedirect: User exists but no role, redirecting to login')
    return <Navigate to="/login" replace />
  }

  console.log('DashboardRedirect: Redirecting based on role:', user.role)

  // Redirect based on user role
  switch (user.role) {
    case 'ROLE_ADMIN':
    case 'ADMIN':
    case 'admin':
      return <Navigate to="/dashboard/admin" replace />
    case 'ROLE_CHEF':
    case 'CHEF':
    case 'chef':
      return <Navigate to="/dashboard/chef" replace />
    case 'ROLE_WAITER':
    case 'WAITER':
    case 'waiter':
      return <Navigate to="/dashboard/waiter" replace />
    case 'ROLE_CUSTOMER':
    case 'CUSTOMER':
    case 'customer':
      return <Navigate to="/dashboard/customer" replace />
    default:
      console.log('DashboardRedirect: Unknown role, redirecting to home')
      return <Navigate to="/" replace />
  }
}

// Public route component for menu/about
function PublicRoute({ children }) {
  const { user, isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // If authenticated and not a customer, redirect to dashboard
  if (isAuthenticated && user && user.role !== 'ROLE_CUSTOMER' && user.role !== 'CUSTOMER' && user.role !== 'customer') {
    return <Navigate to="/dashboard" replace />
  }

  // Show the page directly (pages already include their own navbar)
  return children
}

// Root route redirect component
function RootRedirect() {
  const { user, isAuthenticated, loading } = useAuth()

  // Show loading spinner while auth is being initialized
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // If authenticated and staff user, redirect to dashboard
  if (isAuthenticated && user && (user.role === 'admin' || user.role === 'ROLE_ADMIN' || user.role === 'chef' || user.role === 'ROLE_CHEF' || user.role === 'waiter' || user.role === 'ROLE_WAITER')) {
    return <Navigate to="/dashboard" replace />
  }

  // Show home page for customers and non-authenticated users
  console.log('RootRedirect: Showing home page')
  return <HomePage />
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
      {/* Public Routes - Only for non-authenticated users or customers */}
      <Route path="/" element={<RootRedirect />} />
      <Route path="/home" element={<RootRedirect />} />
      <Route path="/menu" element={<PublicRoute><MenuPage /></PublicRoute>} />
      <Route path="/about" element={<PublicRoute><AboutPage /></PublicRoute>} />
      <Route path="/cart" element={<PublicCart />} />

      {/* Authentication Routes */}
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to="/" replace />
          ) : (
            <LoginPage />
          )
        }
      />
      <Route
        path="/register"
        element={
          isAuthenticated ? (
            <Navigate to="/" replace />
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
            <Layout><Outlet /></Layout>
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
              <Outlet />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="analytics" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* Chef Routes */}
        <Route
          path="chef/*"
          element={
            <ProtectedRoute requiredRole="ROLE_CHEF">
              <Outlet />
            </ProtectedRoute>
          }
        >
          <Route index element={<ChefDashboard />} />
          <Route path="menu" element={<ChefMenu />} />
          <Route path="orders" element={<ChefOrders />} />
        </Route>

        {/* Waiter Routes */}
        <Route
          path="waiter/*"
          element={
            <ProtectedRoute requiredRole="ROLE_WAITER">
              <Outlet />
            </ProtectedRoute>
          }
        >
          <Route index element={<WaiterDashboard />} />
          <Route path="orders" element={<WaiterOrders />} />
          <Route path="tables" element={<WaiterTables />} />
          <Route path="delivery" element={<WaiterDelivery />} />
        </Route>

        {/* Customer Routes */}
        <Route
          path="customer/*"
          element={
            <ProtectedRoute>
              <Outlet />
            </ProtectedRoute>
          }
        >
          <Route index element={<CustomerDashboard />} />
          <Route path="orders" element={<CustomerOrders />} />
          <Route path="bookings" element={<CustomerBookings />} />
          <Route path="profile" element={<CustomerProfile />} />
          <Route path="cart" element={<CustomerCartTest />} />
        </Route>
      </Route>

      {/* Catch-all Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

// Apply theme IMMEDIATELY before React even starts
const savedTheme = localStorage.getItem('theme')
const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

let shouldBeDark = false
if (savedTheme === 'dark') {
  shouldBeDark = true
} else if (savedTheme === 'light') {
  shouldBeDark = false
} else {
  shouldBeDark = systemPrefersDark
  localStorage.setItem('theme', systemPrefersDark ? 'dark' : 'light')
}

// Apply theme IMMEDIATELY
document.documentElement.classList.toggle('dark', shouldBeDark)
console.log('Pre-React: Theme set to', shouldBeDark ? 'dark' : 'light')

function App() {
  // Re-apply theme only when needed
  useEffect(() => {
    const currentTheme = localStorage.getItem('theme')
    const shouldBeDark = currentTheme === 'dark'
    const isCurrentlyDark = document.documentElement.classList.contains('dark')
    
    // Only update if theme is different
    if (shouldBeDark !== isCurrentlyDark) {
      document.documentElement.classList.toggle('dark', shouldBeDark)
      console.log('App useEffect: Theme corrected to', shouldBeDark ? 'dark' : 'light')
    }
  }, []) // Run only once

  return <AppContent />
}

export default App
