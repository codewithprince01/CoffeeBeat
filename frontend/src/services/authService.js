// API Configuration and Service
// This file provides a properly configured API client for your Coffee Beat application

import axios from 'axios';

/**
 * API Configuration
 * 
 * IMPORTANT: Your backend has context path /api configured in application.properties
 * So all endpoints are prefixed with /api
 * 
 * Backend URL: http://localhost:8080
 * Context Path: /api
 * Auth Controller: /auth
 * Full Login Endpoint: http://localhost:8080/api/auth/login
 */

// Get base URL from environment or use default
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081';

console.log('🔧 API Configuration:', {
  BASE_URL,
  VITE_API_URL: import.meta.env.VITE_API_URL,
  MODE: import.meta.env.MODE
});

/**
 * Create axios instance with proper configuration
 */
const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 30000, // Increased timeout to 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable credentials for authentication
});

/**
 * Request interceptor - adds auth token to requests
 */
api.interceptors.request.use(
  (config) => {
    // Log request details for debugging
    console.log('📤 API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      fullURL: `${config.baseURL}${config.url}`,
      headers: config.headers,
      data: config.data
    });

    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - handles responses and errors
 */
api.interceptors.response.use(
  (response) => {
    // Log successful response
    console.log('✅ API Response:', {
      status: response.status,
      statusText: response.statusText,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Log error details
    console.error('❌ API Error:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: originalRequest?.url,
      data: error.response?.data
    });

    // Handle 401 Unauthorized - attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const accessToken = localStorage.getItem('token');
      const refreshToken = localStorage.getItem('refreshToken');
      
      // Only attempt refresh if we have both tokens
      if (accessToken && refreshToken) {
        try {
          console.log('🔄 Attempting token refresh...');

          const response = await axios.post(
            `${BASE_URL}/api/auth/refresh`,
            { refreshToken }, // Send refreshToken in request body
            {
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );

          const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;

          // Store new tokens
          localStorage.setItem('token', newAccessToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          console.error('❌ Token refresh failed:', refreshError);

          // Only clear tokens if refresh actually failed (not if tokens were missing)
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');

          // Only redirect if not already on login page
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }

          return Promise.reject(refreshError);
        }
      } else {
        // No tokens available, don't attempt refresh
        console.log('🚫 No tokens available for refresh');
        // Don't clear localStorage as there might be nothing to clear
        // Don't redirect as this might be an initial unauthenticated request
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Auth Service
 * Handles all authentication-related API calls
 */
export const authService = {
  /**
   * Get current authentication token
   * @returns {string|null} - JWT token or null
   */
  getToken: () => {
    return localStorage.getItem('token');
  },

  /**
   * Get admin token for dashboard operations
   * @returns {string} - Admin JWT token
   */
  getAdminToken: () => {
    // Try to get current user token first
    const currentToken = localStorage.getItem('token');
    if (currentToken) {
      return currentToken;
    }

    // Fallback to hardcoded admin token for testing
    return "eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiUk9MRV9BRE1JTiIsInN1YiI6ImFkbWluQGNvZmZlZS50ZXN0IiwiaWF0IjoxNzY0OTI0Njg4LCJleHAiOjE3NjUwMTEwODh9.ryI6K6caA5I-Fp4mtSYgZQ2OGtDN_IQG5nsT2yQ-2SY";
  },

  /**
   * Check if user is authenticated
   * @returns {boolean} - true if authenticated
   */
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  /**
   * Get current user data
   * @returns {Object|null} - User data or null
   */
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  /**
   * Login user
   * @param {Object} credentials - { email, password }
   * @returns {Promise<Object>} - { accessToken, refreshToken, user }
   */
  login: async (credentials) => {
    console.log('🔐 Login attempt:', { email: credentials.email });

    try {
      const response = await api.post('/auth/login', {
        email: credentials.email,
        password: credentials.password
      });

      // Store tokens
      if (response.data.accessToken && response.data.refreshToken) {
        localStorage.setItem('token', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        console.log('✅ Login successful, tokens stored');
      }

      return response.data;
    } catch (error) {
      console.error('❌ Login failed:', error);

      // Create user-friendly error message
      let errorMessage = 'Login failed. Please try again.';

      if (error.response) {
        if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.status === 401) {
          errorMessage = 'Invalid email or password.';
        } else if (error.response.status === 403) {
          errorMessage = 'Your account is deactivated. Please contact support.';
        } else if (error.response.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        }
      } else if (error.request) {
        errorMessage = 'Unable to connect to the server. Please check your internet connection.';
      }

      const enhancedError = new Error(errorMessage);
      enhancedError.status = error.response?.status;
      enhancedError.originalError = error;
      throw enhancedError;
    }
  },

  /**
   * Register new user
   * @param {Object} userData - { name, email, password }
   * @returns {Promise<Object>} - { accessToken, refreshToken, user }
   */
  register: async (userData) => {
    console.log('📝 Registration attempt:', {
      name: userData.name,
      email: userData.email
    });

    try {
      const response = await api.post('/auth/register', {
        name: userData.name,
        email: userData.email,
        password: userData.password
      });

      // Auto-login after registration
      if (response.data.accessToken && response.data.refreshToken) {
        localStorage.setItem('token', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        console.log('✅ Registration successful, tokens stored');
      }

      return response.data;
    } catch (error) {
      console.error('❌ Registration failed:', error);

      let errorMessage = 'Registration failed. Please try again.';

      if (error.response) {
        if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.status === 400) {
          errorMessage = 'Invalid registration data. Please check your input.';
        } else if (error.response.status === 409) {
          errorMessage = 'Email already registered. Please use a different email.';
        }
      } else if (error.request) {
        errorMessage = 'Unable to connect to the server. Please check your internet connection.';
      }

      const enhancedError = new Error(errorMessage);
      enhancedError.status = error.response?.status;
      enhancedError.originalError = error;
      throw enhancedError;
    }
  },

  /**
   * Logout user
   */
  logout: async () => {
    console.log('👋 Logout');

    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage regardless of API call result
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  },

  /**
   * Get current user details
   * @returns {Object|null} - User object from localStorage
   */
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
        return null;
      }
    }
    return null;
  },

  /**
   * Refresh access token
   * @param {string} refreshToken
   * @returns {Promise<Object>} - { accessToken, refreshToken }
   */
  refreshToken: async (refreshToken) => {
    const response = await axios.post(
      `${BASE_URL}/api/auth/refresh`,
      { refreshToken }, // Send refreshToken in request body
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  },

  /**
   * Create invite token (Admin only)
   * @param {string} email
   * @param {string} role - ROLE_CHEF or ROLE_WAITER
   * @returns {Promise<Object>} - Invite token object
   */
  createInviteToken: async (email, role) => {
    const response = await api.post('/auth/invite', null, {
      params: { email, role },
    });
    return response.data;
  },

  /**
   * Validate invite token
   * @param {string} token
   * @returns {Promise<Object>} - Validation result
   */
  validateInviteToken: async (token) => {
    const response = await api.get(`/auth/validate-invite/${token}`);
    return response.data;
  },

  /**
   * Update user profile
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<Object>} - Updated user object
   */
  updateProfile: async (profileData) => {
    console.log('📝 Updating profile');

    try {
      const response = await api.put('/auth/profile', profileData);

      // Update stored user data
      if (response.data) {
        localStorage.setItem('user', JSON.stringify(response.data));
        console.log('✅ Profile updated successfully');
      }

      return response.data;
    } catch (error) {
      console.error('❌ Profile update failed:', error);
      throw error;
    }
  },

  /**
   * Change user password
   * @param {Object} passwordData - { currentPassword, newPassword }
   * @returns {Promise<Object>} - Success message
   */
  changePassword: async (passwordData) => {
    console.log('🔐 Changing password');

    try {
      const response = await api.put('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      console.log('✅ Password changed successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Password change failed:', error);

      let errorMessage = 'Failed to change password';

      if (error.response) {
        if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.status === 401) {
          errorMessage = 'Current password is incorrect';
        }
      }

      const enhancedError = new Error(errorMessage);
      enhancedError.status = error.response?.status;
      throw enhancedError;
    }
  },

  /**
   * Delete user account
   * @returns {Promise<Object>} - Success message
   */
  deleteAccount: async () => {
    console.log('🗑️ Deleting account');

    try {
      const response = await api.delete('/auth/account');

      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');

      console.log('✅ Account deleted successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Account deletion failed:', error);
      throw error;
    }
  },
};


/**
 * Helper function to check if user is authenticated
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  return !!token;
};

/**
 * Helper function to get stored user
 * @returns {Object|null}
 */
export const getStoredUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

/**
 * Helper function to get auth token
 * @returns {string|null}
 */
export const getAuthToken = () => {
  return localStorage.getItem('token');
};

export default api;
