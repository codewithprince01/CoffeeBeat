import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, user } = useAuth()

  console.log('ProtectedRoute - User:', user, 'Required Role:', requiredRole, 'User Role:', user?.role)

  // Check if user is authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Check if user has required role (if specified)
  // Handle both ROLE_ and non-ROLE_ formats
  const normalizedUserRole = user?.role?.startsWith('ROLE_') ? user.role : `ROLE_${user?.role}`;
  const normalizedRequiredRole = requiredRole?.startsWith('ROLE_') ? requiredRole : `ROLE_${requiredRole}`;
  
  console.log('ProtectedRoute - Normalized User Role:', normalizedUserRole, 'Normalized Required Role:', normalizedRequiredRole)
  
  if (requiredRole && normalizedUserRole !== normalizedRequiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
          <p className="text-sm text-gray-500 mt-2">User Role: {user?.role} | Required: {requiredRole}</p>
        </div>
      </div>
    )
  }

  return children
}

export default ProtectedRoute
