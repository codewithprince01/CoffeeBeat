import { createContext, useContext, useReducer, useEffect } from 'react'
import { authService } from '../services/authService'
import websocketService from '../services/websocketService'
import toast from 'react-hot-toast'

// Initial state
const initialState = {
  user: null,
  token: null,
  refreshToken: null,
  loading: true,
  isAuthenticated: false,
  error: null,
}

// Action types
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  REGISTER_START: 'REGISTER_START',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_FAILURE: 'REGISTER_FAILURE',
  LOAD_USER_START: 'LOAD_USER_START',
  LOAD_USER_SUCCESS: 'LOAD_USER_SUCCESS',
  LOAD_USER_FAILURE: 'LOAD_USER_FAILURE',
  UPDATE_USER: 'UPDATE_USER',
  CLEAR_ERROR: 'CLEAR_ERROR',
}

// Reducer function
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
    case AUTH_ACTIONS.REGISTER_START:
    case AUTH_ACTIONS.LOAD_USER_START:
      return {
        ...state,
        loading: true,
        error: null,
      }

    case AUTH_ACTIONS.LOGIN_SUCCESS:
    case AUTH_ACTIONS.REGISTER_SUCCESS:
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        refreshToken: action.payload.refreshToken,
        error: null,
      }

    case AUTH_ACTIONS.LOAD_USER_SUCCESS:
      return {
        ...state,
        loading: false,
        isAuthenticated: !!action.payload,
        user: action.payload,
        error: null,
      }

    case AUTH_ACTIONS.LOGIN_FAILURE:
    case AUTH_ACTIONS.REGISTER_FAILURE:
    case AUTH_ACTIONS.LOAD_USER_FAILURE:
      return {
        ...state,
        loading: false,
        isAuthenticated: false,
        user: null,
        token: null,
        refreshToken: null,
        error: action.payload,
      }

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        loading: false,
        isAuthenticated: false,
        user: null,
        token: null,
        refreshToken: null,
        error: null,
      }

    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      }

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      }

    default:
      return state
  }
}

// Create context
const AuthContext = createContext()

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = async () => {
      // Clear any previous errors on startup
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR })

      const token = localStorage.getItem('token')
      const refreshToken = localStorage.getItem('refreshToken')
      const user = localStorage.getItem('user')

      console.log('Checking localStorage items:', { 
        hasToken: !!token, 
        hasRefreshToken: !!refreshToken, 
        hasUser: !!user 
      })

      // Only attempt to load user if we have all three items
      if (token && refreshToken && user) {
        try {
          dispatch({ type: AUTH_ACTIONS.LOAD_USER_START })
          
          // First validate the token by checking if it's properly formatted
          if (!token.startsWith('eyJ')) {
            console.log('Invalid token format, clearing auth data')
            throw new Error('Invalid token format')
          }

          // Parse user data from localStorage
          const userData = JSON.parse(user)
          dispatch({ type: AUTH_ACTIONS.LOAD_USER_SUCCESS, payload: userData })

          // Connect to WebSocket (non-blocking)
          setTimeout(() => {
            websocketService.connect(token).catch(err => {
              console.error('WebSocket connection failed:', err);
            });
          }, 100);

        } catch (error) {
          console.error('Failed to load user:', error)
          // Clear invalid tokens
          localStorage.removeItem('token')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('user')
          dispatch({ type: AUTH_ACTIONS.LOGOUT })
        }
      } else {
        // No valid session, clear any partial data
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        dispatch({ type: AUTH_ACTIONS.LOAD_USER_SUCCESS, payload: null })
        console.log('No valid authentication data found')
      }
    }

    loadUser()
  }, [])

  // Login function
  const login = async (credentials) => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOGIN_START })

      // Log the login attempt
      console.log('Attempting login with credentials:', {
        email: credentials.email,
        // Don't log the actual password
        hasPassword: !!credentials.password
      })

      const response = await authService.login(credentials)

      // Store tokens
      localStorage.setItem('token', response.accessToken)
      localStorage.setItem('refreshToken', response.refreshToken)

      // Store user data
      if (response.user) {
        localStorage.setItem('user', JSON.stringify(response.user))
      }

      // Log successful token storage
      console.log('Authentication tokens stored successfully')

      // Use user data from login response
      const user = response.user
      console.log('User details from login:', user)

      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: {
          user,
          token: response.accessToken,
          refreshToken: response.refreshToken,
        }
      })

      // Connect to WebSocket (non-blocking)
      setTimeout(() => {
        websocketService.connect(response.accessToken).catch(err => {
          console.error('WebSocket connection failed:', err);
        });
      }, 100);

      console.log('Login dispatch completed, auth state updated')
      toast.success('Login successful!')
      return response
    } catch (error) {
      console.error('Login error details:', {
        error,
        message: error.message,
        status: error.status,
        response: error.response?.data
      })

      // Use the error message from the enhanced error handling in authService
      const errorMessage = error.message || 'Login failed. Please try again.'

      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: errorMessage
      })

      // Show error toast with the error message
      toast.error(errorMessage)

      // Re-throw the error for the component to handle if needed
      throw error
    }
  }

  // Register function
  const register = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.REGISTER_START })

      // Log the registration attempt
      console.log('Starting registration for:', userData.email)

      const response = await authService.register(userData)

      if (!response || !response.accessToken) {
        throw new Error('Invalid response from server')
      }

      // Store tokens
      localStorage.setItem('token', response.accessToken)
      localStorage.setItem('refreshToken', response.refreshToken)

      // Store user data
      if (response.user) {
        localStorage.setItem('user', JSON.stringify(response.user))
      }

      console.log('Registration successful, tokens stored')

      // Use user data from registration response
      const user = response.user
      console.log('User data from registration:', user)

      dispatch({
        type: AUTH_ACTIONS.REGISTER_SUCCESS,
        payload: {
          user,
          token: response.accessToken,
          refreshToken: response.refreshToken,
        }
      })

      // Connect to WebSocket on registration (auto-login, non-blocking)
      setTimeout(() => {
        websocketService.connect(response.accessToken).catch(err => {
          console.error('WebSocket connection failed:', err);
        });
      }, 100);

      console.log('Registration flow completed successfully')
      toast.success('Registration successful! Welcome to Coffee Beat!')
      return { ...response, user }

    } catch (error) {
      console.error('Registration error in AuthContext:', {
        error,
        message: error.message,
        response: error.response?.data
      })

      const errorMessage = error.response?.data?.message ||
        error.message ||
        'Registration failed. Please try again.'

      dispatch({
        type: AUTH_ACTIONS.REGISTER_FAILURE,
        payload: errorMessage
      })

      toast.error(errorMessage)
      throw error
    }
  }

  // Logout function
  const logout = async () => {
    try {
      websocketService.disconnect()
      await authService.logout()
    } catch (error) {
      // Even if logout fails on server, clear local storage
      console.error('Logout error:', error)
    } finally {
      // Clear tokens and user data
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')

      dispatch({ type: AUTH_ACTIONS.LOGOUT })
      toast.success('Logged out successfully')
    }
  }

  // Update user function
  const updateUser = (userData) => {
    dispatch({ type: AUTH_ACTIONS.UPDATE_USER, payload: userData })
  }

  // Clear error function
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR })
  }

  // Get dashboard redirect path based on user role
  const getDashboardPath = () => {
    const role = state.user?.role?.toLowerCase()
    switch (role) {
      case 'admin':
      case 'role_admin':
        return '/dashboard/admin'
      case 'chef':
      case 'role_chef':
        return '/dashboard/chef'
      case 'waiter':
      case 'role_waiter':
        return '/dashboard/waiter'
      case 'customer':
      case 'role_customer':
        return '/dashboard/customer'
      default:
        return '/dashboard'
    }
  }

  // Check user role
  const hasRole = (role) => {
    return state.user?.role === role || state.user?.role === `ROLE_${role.toUpperCase()}`
  }

  // Check if user has any of the specified roles
  const hasAnyRole = (roles) => {
    return roles.some(role => 
      state.user?.role === role || state.user?.role === `ROLE_${role.toUpperCase()}`
    )
  }

  // Check if user is staff (admin, chef, waiter)
  const isStaffUser = () => {
    return hasAnyRole(['admin', 'chef', 'waiter'])
  }

  const value = {
    ...state,
    login,
    register,
    logout,
    updateUser,
    clearError,
    hasRole,
    hasAnyRole,
    isStaffUser,
    getDashboardPath,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
