import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { authService } from '../../services/authService'

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials)
      return response
    } catch (error) {
      return rejectWithValue(
        error.message || 'Login failed'
      )
    }
  }
)

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authService.register(userData)
      return response
    } catch (error) {
      return rejectWithValue(
        error.message || 'Registration failed'
      )
    }
  }
)

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout()
      return null
    } catch (error) {
      return rejectWithValue(
        error.message || 'Logout failed'
      )
    }
  }
)

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.getCurrentUser()
      return response
    } catch (error) {
      return rejectWithValue(
        error.message || 'Failed to get user data'
      )
    }
  }
)

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      const refreshToken = localStorage.getItem('refreshToken')
      const response = await authService.refreshToken(refreshToken)
      return response
    } catch (error) {
      return rejectWithValue(
        error.message || 'Token refresh failed'
      )
    }
  }
)

// Initial state
const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  refreshToken: localStorage.getItem('refreshToken'),
  isAuthenticated: false,
  loading: false,
  error: null,
  isInitialized: false,
}

// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    clearUser: (state) => {
      state.user = null
      state.token = null
      state.refreshToken = null
      state.isAuthenticated = false
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
    },
    setCredentials: (state, action) => {
      const { user, token, refreshToken } = action.payload
      state.user = user
      state.token = token
      state.refreshToken = refreshToken
      state.isAuthenticated = true
      localStorage.setItem('token', token)
      localStorage.setItem('refreshToken', refreshToken)
    },
    initializeAuth: (state) => {
      const token = localStorage.getItem('token')
      const refreshToken = localStorage.getItem('refreshToken')
      const user = JSON.parse(localStorage.getItem('user'))

      if (token && refreshToken && user) {
        state.token = token
        state.refreshToken = refreshToken
        state.user = user
        state.isAuthenticated = true
      }
      state.isInitialized = true
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false
        // Backend returns { accessToken, refreshToken, id, email, name, role }
        // We need to construct user object from the response
        state.user = {
          id: action.payload.id,
          email: action.payload.email,
          name: action.payload.name,
          role: action.payload.role
        }
        state.token = action.payload.accessToken  // Backend returns accessToken
        state.refreshToken = action.payload.refreshToken
        state.isAuthenticated = true
        state.error = null
        localStorage.setItem('token', action.payload.accessToken)
        localStorage.setItem('refreshToken', action.payload.refreshToken)
        localStorage.setItem('user', JSON.stringify(state.user))
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        state.isAuthenticated = false
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false
        // Backend returns { accessToken, refreshToken, id, email, name, role }
        state.user = {
          id: action.payload.id,
          email: action.payload.email,
          name: action.payload.name,
          role: action.payload.role
        }
        state.token = action.payload.accessToken  // Backend returns accessToken
        state.refreshToken = action.payload.refreshToken
        state.isAuthenticated = true
        state.error = null
        localStorage.setItem('token', action.payload.accessToken)
        localStorage.setItem('refreshToken', action.payload.refreshToken)
        localStorage.setItem('user', JSON.stringify(state.user))
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        state.isAuthenticated = false
      })
      // Logout
      .addCase(logoutUser.pending, (state) => {
        state.loading = true
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false
        state.user = null
        state.token = null
        state.refreshToken = null
        state.isAuthenticated = false
        state.error = null
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        // Still clear auth state even if logout API call fails
        state.user = null
        state.token = null
        state.refreshToken = null
        state.isAuthenticated = false
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
      })
      // Get current user
      .addCase(getCurrentUser.pending, (state) => {
        state.loading = true
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload
        state.error = null
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        // If we can't get current user, clear auth state
        state.user = null
        state.token = null
        state.refreshToken = null
        state.isAuthenticated = false
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
      })
      // Refresh token
      .addCase(refreshToken.pending, (state) => {
        state.loading = true
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.loading = false
        state.token = action.payload.accessToken  // Backend returns accessToken
        state.refreshToken = action.payload.refreshToken
        state.error = null
        localStorage.setItem('token', action.payload.accessToken)
        localStorage.setItem('refreshToken', action.payload.refreshToken)
      })
      .addCase(refreshToken.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        // If refresh fails, clear auth state
        state.user = null
        state.token = null
        state.refreshToken = null
        state.isAuthenticated = false
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
      })
  },
})

export const { clearError, clearUser, setCredentials, initializeAuth } = authSlice.actions

// Selectors
export const selectAuth = (state) => state.auth
export const selectUser = (state) => state.auth.user
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated
export const selectAuthLoading = (state) => state.auth.loading
export const selectAuthError = (state) => state.auth.error
export const selectIsInitialized = (state) => state.auth.isInitialized

export default authSlice.reducer
