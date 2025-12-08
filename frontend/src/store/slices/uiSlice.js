import { createSlice } from '@reduxjs/toolkit'

// Initial state
const initialState = {
  sidebarOpen: true,
  theme: 'light', // 'light' | 'dark'
  notifications: [],
  modals: {
    productForm: false,
    bookingForm: false,
    orderForm: false,
    userProfile: false,
    confirmDialog: false,
  },
  loading: {
    global: false,
    products: false,
    orders: false,
    bookings: false,
  },
  alerts: [],
  currentPage: 'dashboard',
  breadcrumbs: [],
  searchQuery: '',
  filters: {
    dateRange: null,
    status: 'all',
    category: 'all',
  },
}

// Slice
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Sidebar
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload
    },

    // Theme
    setTheme: (state, action) => {
      state.theme = action.payload
      localStorage.setItem('theme', action.payload)
    },

    // Notifications
    addNotification: (state, action) => {
      const notification = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        ...action.payload,
      }
      state.notifications.unshift(notification)
      
      // Auto-remove notification after 5 seconds
      if (notification.autoRemove !== false) {
        setTimeout(() => {
          state.notifications = state.notifications.filter(n => n.id !== notification.id)
        }, 5000)
      }
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      )
    },
    clearNotifications: (state) => {
      state.notifications = []
    },

    // Modals
    openModal: (state, action) => {
      const modalName = action.payload
      state.modals[modalName] = true
    },
    closeModal: (state, action) => {
      const modalName = action.payload
      state.modals[modalName] = false
    },
    closeAllModals: (state) => {
      Object.keys(state.modals).forEach(key => {
        state.modals[key] = false
      })
    },

    // Loading states
    setLoading: (state, action) => {
      const { key, loading } = action.payload
      if (key === 'global') {
        state.loading.global = loading
      } else {
        state.loading[key] = loading
      }
    },
    setGlobalLoading: (state, action) => {
      state.loading.global = action.payload
    },

    // Alerts
    addAlert: (state, action) => {
      const alert = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        ...action.payload,
      }
      state.alerts.unshift(alert)
      
      // Auto-remove alert after 3 seconds
      if (alert.autoRemove !== false) {
        setTimeout(() => {
          state.alerts = state.alerts.filter(a => a.id !== alert.id)
        }, 3000)
      }
    },
    removeAlert: (state, action) => {
      state.alerts = state.alerts.filter(alert => alert.id !== action.payload)
    },
    clearAlerts: (state) => {
      state.alerts = []
    },

    // Navigation
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload
    },
    setBreadcrumbs: (state, action) => {
      state.breadcrumbs = action.payload
    },

    // Search
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload
    },
    clearSearchQuery: (state) => {
      state.searchQuery = ''
    },

    // Filters
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    resetFilters: (state) => {
      state.filters = initialState.filters
    },

    // Initialize theme from localStorage
    initializeTheme: (state) => {
      const savedTheme = localStorage.getItem('theme')
      if (savedTheme) {
        state.theme = savedTheme
      }
    },
  },
})

export const {
  toggleSidebar,
  setSidebarOpen,
  setTheme,
  addNotification,
  removeNotification,
  clearNotifications,
  openModal,
  closeModal,
  closeAllModals,
  setLoading,
  setGlobalLoading,
  addAlert,
  removeAlert,
  clearAlerts,
  setCurrentPage,
  setBreadcrumbs,
  setSearchQuery,
  clearSearchQuery,
  setFilters,
  resetFilters,
  initializeTheme,
} = uiSlice.actions

// Selectors
export const selectSidebarOpen = (state) => state.ui.sidebarOpen
export const selectTheme = (state) => state.ui.theme
export const selectNotifications = (state) => state.ui.notifications
export const selectModals = (state) => state.ui.modals
export const selectLoading = (state) => state.ui.loading
export const selectGlobalLoading = (state) => state.ui.loading.global
export const selectAlerts = (state) => state.ui.alerts
export const selectCurrentPage = (state) => state.ui.currentPage
export const selectBreadcrumbs = (state) => state.ui.breadcrumbs
export const selectSearchQuery = (state) => state.ui.searchQuery
export const selectFilters = (state) => state.ui.filters

// Selectors for specific modals
export const selectProductFormModal = (state) => state.ui.modals.productForm
export const selectBookingFormModal = (state) => state.ui.modals.bookingForm
export const selectOrderFormModal = (state) => state.ui.modals.orderForm
export const selectUserProfileModal = (state) => state.ui.modals.userProfile
export const selectConfirmDialogModal = (state) => state.ui.modals.confirmDialog

// Thunks for complex operations
export const showSuccessNotification = (message) => (dispatch) => {
  dispatch(addNotification({
    type: 'success',
    message,
    title: 'Success',
  }))
}

export const showErrorNotification = (message) => (dispatch) => {
  dispatch(addNotification({
    type: 'error',
    message,
    title: 'Error',
  }))
}

export const showInfoNotification = (message) => (dispatch) => {
  dispatch(addNotification({
    type: 'info',
    message,
    title: 'Info',
  }))
}

export const showWarningNotification = (message) => (dispatch) => {
  dispatch(addNotification({
    type: 'warning',
    message,
    title: 'Warning',
  }))
}

export const showSuccessAlert = (message) => (dispatch) => {
  dispatch(addAlert({
    type: 'success',
    message,
  }))
}

export const showErrorAlert = (message) => (dispatch) => {
  dispatch(addAlert({
    type: 'error',
    message,
  }))
}

export default uiSlice.reducer
