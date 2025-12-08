// Utility function to get dashboard path based on user role
export const getDashboardPath = (role) => {
    switch (role) {
        case 'ROLE_ADMIN':
            return '/dashboard/admin'
        case 'ROLE_CHEF':
            return '/dashboard/chef'
        case 'ROLE_WAITER':
            return '/dashboard/waiter'
        case 'ROLE_CUSTOMER':
            return '/dashboard/customer'
        default:
            return '/'
    }
}

// Utility function to check if user has required role
export const hasRole = (userRole, requiredRole) => {
    if (!requiredRole) return true
    if (!userRole) return false
    return userRole === requiredRole
}

// Utility function to check if user has any of the required roles
export const hasAnyRole = (userRole, requiredRoles) => {
    if (!requiredRoles || requiredRoles.length === 0) return true
    if (!userRole) return false
    return requiredRoles.includes(userRole)
}

// Get user role display name
export const getRoleDisplayName = (role) => {
    switch (role) {
        case 'ROLE_ADMIN':
            return 'Admin'
        case 'ROLE_CHEF':
            return 'Chef'
        case 'ROLE_WAITER':
            return 'Waiter'
        case 'ROLE_CUSTOMER':
            return 'Customer'
        default:
            return 'User'
    }
}

// Check if role is staff role (admin, chef, waiter)
export const isStaffRole = (role) => {
    return ['ROLE_ADMIN', 'ROLE_CHEF', 'ROLE_WAITER'].includes(role)
}

// Check if role is customer role
export const isCustomerRole = (role) => {
    return role === 'ROLE_CUSTOMER'
}

// Check if role is admin
export const isAdminRole = (role) => {
    return role === 'ROLE_ADMIN'
}
