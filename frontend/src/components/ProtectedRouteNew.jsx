import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, user, hasRole } = useAuth()

  // Check if user is authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Check if user has required role (if specified)
  if (requiredRole && !hasRole(requiredRole)) {
    // Redirect to appropriate dashboard based on user role
    const userRole = user?.role
    let redirectPath = '/'
    
    switch (userRole) {
      case 'ROLE_ADMIN':
        redirectPath = '/dashboard/admin'
        break
      case 'ROLE_CHEF':
        redirectPath = '/dashboard/chef'
        break
      case 'ROLE_WAITER':
        redirectPath = '/dashboard/waiter'
        break
      case 'ROLE_CUSTOMER':
        redirectPath = '/dashboard/customer'
        break
      default:
        redirectPath = '/'
    }
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
          <a
            href={redirectPath}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Go to Your Dashboard
          </a>
        </div>
      </div>
    )
  }

  return children
}

export default ProtectedRoute
