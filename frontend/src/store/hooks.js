import { useDispatch, useSelector } from 'react-redux'
import { useCallback } from 'react'
import {
  // Auth actions and selectors
  loginUser,
  registerUser,
  logoutUser,
  refreshToken,
  getCurrentUser,
  clearError as clearAuthError,
  initializeAuth as initializeAuthAction,
  selectAuth,
} from './slices/authSlice'

import {
  // Product actions and selectors
  fetchProducts,
  fetchProductById,
  fetchProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  fetchCategories,
  fetchInStockProducts,
  fetchLowStockProducts,
  updateProductStock,
  fetchProductStats,
  setFilters as setProductFiltersAction,
  resetFilters as resetProductFiltersAction,
  clearError as clearProductErrorAction,
  clearCurrentProduct as clearCurrentProductAction,
  selectProducts,
  selectCurrentProduct,
  selectCategories,
  selectInStockProducts,
  selectLowStockProducts,
  selectProductStats,
  selectProductsLoading,
  selectProductsError,
  selectProductsPagination,
  selectProductsFilters,
} from './slices/productSlice'

import {
  // Order actions and selectors
  fetchOrders,
  fetchOrderById,
  createOrder,
  updateOrder,
  updateOrderStatus,
  cancelOrder,
  fetchMyOrders,
  fetchChefOrders,
  fetchWaiterOrders,
  fetchAdminOrders,
  fetchOrderStats,
  setFilters as setOrderFiltersAction,
  resetFilters as resetOrderFiltersAction,
  clearError as clearOrderErrorAction,
  clearCurrentOrder as clearCurrentOrderAction,
  selectOrders,
  selectCurrentOrder,
  selectMyOrders,
  selectChefOrders,
  selectWaiterOrders,
  selectAdminOrders,
  selectOrderStats,
  selectOrdersLoading,
  selectOrdersError,
  selectOrdersPagination,
  selectOrdersFilters,
} from './slices/orderSlice'

import {
  // Booking actions and selectors
  fetchBookings,
  fetchBookingById,
  createBooking,
  updateBooking,
  cancelBooking,
  completeBooking,
  fetchMyBookings,
  fetchTodayBookings,
  checkTableAvailability,
  fetchBookingStats,
  setFilters as setBookingFiltersAction,
  resetFilters as resetBookingFiltersAction,
  clearError as clearBookingErrorAction,
  clearCurrentBooking as clearCurrentBookingAction,
  selectBookings,
  selectCurrentBooking,
  selectMyBookings,
  selectTodayBookings,
  selectAvailableTables,
  selectBookingStats,
  selectBookingsLoading,
  selectBookingsError,
  selectBookingsPagination,
  selectBookingsFilters,
} from './slices/bookingSlice'

import {
  // UI actions and selectors
  toggleSidebar as toggleSidebarAction,
  setSidebarOpen as setSidebarOpenAction,
  setTheme as setThemeAction,
  addNotification as addNotificationAction,
  removeNotification as removeNotificationAction,
  clearNotifications as clearNotificationsAction,
  openModal as openModalAction,
  closeModal as closeModalAction,
  closeAllModals as closeAllModalsAction,
  setLoading as setLoadingAction,
  setGlobalLoading as setGlobalLoadingAction,
  addAlert as addAlertAction,
  removeAlert as removeAlertAction,
  clearAlerts as clearAlertsAction,
  setCurrentPage as setCurrentPageAction,
  setBreadcrumbs as setBreadcrumbsAction,
  setSearchQuery as setSearchQueryAction,
  clearSearchQuery as clearSearchQueryAction,
  setFilters as setUIFiltersAction,
  resetFilters as resetUIFiltersAction,
  initializeTheme as initializeThemeAction,
  showSuccessNotification,
  showErrorNotification,
  showInfoNotification,
  showWarningNotification,
} from './slices/uiSlice'

// Auth hooks
export const useAuth = () => {
  const dispatch = useDispatch()
  const auth = useSelector(selectAuth)
  
  const login = useCallback((credentials) => {
    return dispatch(loginUser(credentials))
  }, [dispatch])
  
  const register = useCallback((userData) => {
    return dispatch(registerUser(userData))
  }, [dispatch])
  
  const logout = useCallback(() => {
    return dispatch(logoutUser())
  }, [dispatch])
  
  const refreshToken = useCallback(() => {
    return dispatch(refreshToken())
  }, [dispatch])
  
  const getCurrentUser = useCallback(() => {
    return dispatch(getCurrentUser())
  }, [dispatch])
  
  const clearError = useCallback(() => {
    return dispatch(clearAuthError())
  }, [dispatch])
  
  const initializeAuth = useCallback(() => {
    return dispatch(initializeAuthAction())
  }, [dispatch])
  
  return {
    ...auth,
    login,
    register,
    logout,
    refreshToken,
    getCurrentUser,
    clearError,
    initializeAuth,
  }
}

// Products hooks
export const useProducts = () => {
  const dispatch = useDispatch()
  const products = useSelector(selectProducts)
  const currentProduct = useSelector(selectCurrentProduct)
  const categories = useSelector(selectCategories)
  const inStockProducts = useSelector(selectInStockProducts)
  const lowStockProducts = useSelector(selectLowStockProducts)
  const stats = useSelector(selectProductStats)
  const loading = useSelector(selectProductsLoading)
  const error = useSelector(selectProductsError)
  const pagination = useSelector(selectProductsPagination)
  const filters = useSelector(selectProductsFilters)
  
  const fetchProducts = useCallback((params) => {
    return dispatch(fetchProducts(params))
  }, [dispatch])
  
  const fetchProductById = useCallback((id) => {
    return dispatch(fetchProductById(id))
  }, [dispatch])
  
  const fetchProductBySlug = useCallback((slug) => {
    return dispatch(fetchProductBySlug(slug))
  }, [dispatch])
  
  const createProduct = useCallback((productData) => {
    return dispatch(createProduct(productData))
  }, [dispatch])
  
  const updateProduct = useCallback((id, productData) => {
    return dispatch(updateProduct({ id, productData }))
  }, [dispatch])
  
  const deleteProduct = useCallback((id) => {
    return dispatch(deleteProduct(id))
  }, [dispatch])
  
  const fetchCategories = useCallback(() => {
    return dispatch(fetchCategories())
  }, [dispatch])
  
  const fetchInStockProducts = useCallback(() => {
    return dispatch(fetchInStockProducts())
  }, [dispatch])
  
  const fetchLowStockProducts = useCallback(() => {
    return dispatch(fetchLowStockProducts())
  }, [dispatch])
  
  const updateProductStock = useCallback((id, stock) => {
    return dispatch(updateProductStock({ id, stock }))
  }, [dispatch])
  
  const fetchProductStats = useCallback(() => {
    return dispatch(fetchProductStats())
  }, [dispatch])
  
  const setFilters = useCallback((filters) => {
    return dispatch(setProductFiltersAction(filters))
  }, [dispatch])
  
  const resetFilters = useCallback(() => {
    return dispatch(resetProductFiltersAction())
  }, [dispatch])
  
  const clearError = useCallback(() => {
    return dispatch(clearProductErrorAction())
  }, [dispatch])
  
  const clearCurrentProduct = useCallback(() => {
    return dispatch(clearCurrentProductAction())
  }, [dispatch])
  
  return {
    products,
    currentProduct,
    categories,
    inStockProducts,
    lowStockProducts,
    stats,
    loading,
    error,
    pagination,
    filters,
    fetchProducts,
    fetchProductById,
    fetchProductBySlug,
    createProduct,
    updateProduct,
    deleteProduct,
    fetchCategories,
    fetchInStockProducts,
    fetchLowStockProducts,
    updateProductStock,
    fetchProductStats,
    setFilters,
    resetFilters,
    clearError,
    clearCurrentProduct,
  }
}

// Orders hooks
export const useOrders = () => {
  const dispatch = useDispatch()
  const orders = useSelector(selectOrders)
  const currentOrder = useSelector(selectCurrentOrder)
  const myOrders = useSelector(selectMyOrders)
  const chefOrders = useSelector(selectChefOrders)
  const waiterOrders = useSelector(selectWaiterOrders)
  const adminOrders = useSelector(selectAdminOrders)
  const stats = useSelector(selectOrderStats)
  const loading = useSelector(selectOrdersLoading)
  const error = useSelector(selectOrdersError)
  const pagination = useSelector(selectOrdersPagination)
  const filters = useSelector(selectOrdersFilters)
  
  const fetchOrders = useCallback((params) => {
    return dispatch(fetchOrders(params))
  }, [dispatch])
  
  const fetchOrderById = useCallback((id) => {
    return dispatch(fetchOrderById(id))
  }, [dispatch])
  
  const createOrder = useCallback((orderData) => {
    return dispatch(createOrder(orderData))
  }, [dispatch])
  
  const updateOrder = useCallback((id, orderData) => {
    return dispatch(updateOrder({ id, orderData }))
  }, [dispatch])
  
  const updateOrderStatus = useCallback((id, status) => {
    return dispatch(updateOrderStatus({ id, status }))
  }, [dispatch])
  
  const cancelOrder = useCallback((id) => {
    return dispatch(cancelOrder(id))
  }, [dispatch])
  
  const fetchMyOrders = useCallback((params) => {
    return dispatch(fetchMyOrders(params))
  }, [dispatch])
  
  const fetchChefOrders = useCallback((params) => {
    return dispatch(fetchChefOrders(params))
  }, [dispatch])
  
  const fetchWaiterOrders = useCallback((params) => {
    return dispatch(fetchWaiterOrders(params))
  }, [dispatch])
  
  const fetchAdminOrders = useCallback((params) => {
    return dispatch(fetchAdminOrders(params))
  }, [dispatch])
  
  const fetchOrderStats = useCallback(() => {
    return dispatch(fetchOrderStats())
  }, [dispatch])
  
  const setFilters = useCallback((filters) => {
    return dispatch(setOrderFiltersAction(filters))
  }, [dispatch])
  
  const resetFilters = useCallback(() => {
    return dispatch(resetOrderFiltersAction())
  }, [dispatch])
  
  const clearError = useCallback(() => {
    return dispatch(clearOrderErrorAction())
  }, [dispatch])
  
  const clearCurrentOrder = useCallback(() => {
    return dispatch(clearCurrentOrderAction())
  }, [dispatch])
  
  return {
    orders,
    currentOrder,
    myOrders,
    chefOrders,
    waiterOrders,
    adminOrders,
    stats,
    loading,
    error,
    pagination,
    filters,
    fetchOrders,
    fetchOrderById,
    createOrder,
    updateOrder,
    updateOrderStatus,
    cancelOrder,
    fetchMyOrders,
    fetchChefOrders,
    fetchWaiterOrders,
    fetchAdminOrders,
    fetchOrderStats,
    setFilters,
    resetFilters,
    clearError,
    clearCurrentOrder,
  }
}

// Bookings hooks
export const useBookings = () => {
  const dispatch = useDispatch()
  const bookings = useSelector(selectBookings)
  const currentBooking = useSelector(selectCurrentBooking)
  const myBookings = useSelector(selectMyBookings)
  const todayBookings = useSelector(selectTodayBookings)
  const availableTables = useSelector(selectAvailableTables)
  const stats = useSelector(selectBookingStats)
  const loading = useSelector(selectBookingsLoading)
  const error = useSelector(selectBookingsError)
  const pagination = useSelector(selectBookingsPagination)
  const filters = useSelector(selectBookingsFilters)
  
  const fetchBookings = useCallback((params) => {
    return dispatch(fetchBookings(params))
  }, [dispatch])
  
  const fetchBookingById = useCallback((id) => {
    return dispatch(fetchBookingById(id))
  }, [dispatch])
  
  const createBooking = useCallback((bookingData) => {
    return dispatch(createBooking(bookingData))
  }, [dispatch])
  
  const updateBooking = useCallback((id, bookingData) => {
    return dispatch(updateBooking({ id, bookingData }))
  }, [dispatch])
  
  const cancelBooking = useCallback((id) => {
    return dispatch(cancelBooking(id))
  }, [dispatch])
  
  const completeBooking = useCallback((id) => {
    return dispatch(completeBooking(id))
  }, [dispatch])
  
  const fetchMyBookings = useCallback((params) => {
    return dispatch(fetchMyBookings(params))
  }, [dispatch])
  
  const fetchTodayBookings = useCallback(() => {
    return dispatch(fetchTodayBookings())
  }, [dispatch])
  
  const checkTableAvailability = useCallback((tableNumber, date, time) => {
    return dispatch(checkTableAvailability({ tableNumber, date, time }))
  }, [dispatch])
  
  const fetchBookingStats = useCallback(() => {
    return dispatch(fetchBookingStats())
  }, [dispatch])
  
  const setFilters = useCallback((filters) => {
    return dispatch(setBookingFiltersAction(filters))
  }, [dispatch])
  
  const resetFilters = useCallback(() => {
    return dispatch(resetBookingFiltersAction())
  }, [dispatch])
  
  const clearError = useCallback(() => {
    return dispatch(clearBookingErrorAction())
  }, [dispatch])
  
  const clearCurrentBooking = useCallback(() => {
    return dispatch(clearCurrentBookingAction())
  }, [dispatch])
  
  return {
    bookings,
    currentBooking,
    myBookings,
    todayBookings,
    availableTables,
    stats,
    loading,
    error,
    pagination,
    filters,
    fetchBookings,
    fetchBookingById,
    createBooking,
    updateBooking,
    cancelBooking,
    completeBooking,
    fetchMyBookings,
    fetchTodayBookings,
    checkTableAvailability,
    fetchBookingStats,
    setFilters,
    resetFilters,
    clearError,
    clearCurrentBooking,
  }
}

// UI hooks
export const useUI = () => {
  const dispatch = useDispatch()
  const ui = useSelector((state) => state.ui)
  
  const toggleSidebar = useCallback(() => {
    return dispatch(toggleSidebarAction())
  }, [dispatch])
  
  const setSidebarOpen = useCallback((open) => {
    return dispatch(setSidebarOpenAction(open))
  }, [dispatch])
  
  const setTheme = useCallback((theme) => {
    return dispatch(setThemeAction(theme))
  }, [dispatch])
  
  const addNotification = useCallback((notification) => {
    return dispatch(addNotificationAction(notification))
  }, [dispatch])
  
  const removeNotification = useCallback((id) => {
    return dispatch(removeNotificationAction(id))
  }, [dispatch])
  
  const clearNotifications = useCallback(() => {
    return dispatch(clearNotificationsAction())
  }, [dispatch])
  
  const openModal = useCallback((modalName) => {
    return dispatch(openModalAction(modalName))
  }, [dispatch])
  
  const closeModal = useCallback((modalName) => {
    return dispatch(closeModalAction(modalName))
  }, [dispatch])
  
  const closeAllModals = useCallback(() => {
    return dispatch(closeAllModalsAction())
  }, [dispatch])
  
  const setLoading = useCallback((key, loading) => {
    return dispatch(setLoadingAction({ key, loading }))
  }, [dispatch])
  
  const setGlobalLoading = useCallback((loading) => {
    return dispatch(setGlobalLoadingAction(loading))
  }, [dispatch])
  
  const addAlert = useCallback((alert) => {
    return dispatch(addAlertAction(alert))
  }, [dispatch])
  
  const removeAlert = useCallback((id) => {
    return dispatch(removeAlertAction(id))
  }, [dispatch])
  
  const clearAlerts = useCallback(() => {
    return dispatch(clearAlertsAction())
  }, [dispatch])
  
  const setCurrentPage = useCallback((page) => {
    return dispatch(setCurrentPageAction(page))
  }, [dispatch])
  
  const setBreadcrumbs = useCallback((breadcrumbs) => {
    return dispatch(setBreadcrumbsAction(breadcrumbs))
  }, [dispatch])
  
  const setSearchQuery = useCallback((query) => {
    return dispatch(setSearchQueryAction(query))
  }, [dispatch])
  
  const clearSearchQuery = useCallback(() => {
    return dispatch(clearSearchQueryAction())
  }, [dispatch])
  
  const setFilters = useCallback((filters) => {
    return dispatch(setUIFiltersAction(filters))
  }, [dispatch])
  
  const resetFilters = useCallback(() => {
    return dispatch(resetUIFiltersAction())
  }, [dispatch])
  
  const initializeTheme = useCallback(() => {
    return dispatch(initializeThemeAction())
  }, [dispatch])
  
  const showSuccessNotification = useCallback((message) => {
    return dispatch(showSuccessNotification(message))
  }, [dispatch])
  
  const showErrorNotification = useCallback((message) => {
    return dispatch(showErrorNotification(message))
  }, [dispatch])
  
  const showInfoNotification = useCallback((message) => {
    return dispatch(showInfoNotification(message))
  }, [dispatch])
  
  const showWarningNotification = useCallback((message) => {
    return dispatch(showWarningNotification(message))
  }, [dispatch])
  
  return {
    ...ui,
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
    showSuccessNotification,
    showErrorNotification,
    showInfoNotification,
    showWarningNotification,
  }
}

export default useAuth
