import api from './authService'

export const bookingService = {
  // Create booking
  createBooking: async (bookingData) => {
    const response = await api.post('/api/bookings', bookingData)
    return response.data
  },

  // Get all bookings (admin only)
  getAllBookings: async () => {
    const response = await api.get('/api/bookings')
    return response.data
  },

  // Get booking by ID
  getBookingById: async (id) => {
    const response = await api.get(`/api/bookings/${id}`)
    return response.data
  },

  // Get my bookings
  getMyBookings: async () => {
    const response = await api.get('/api/bookings/my-bookings')
    return response.data
  },

  // Get customer bookings (alias for getMyBookings)
  getCustomerBookings: async () => {
    const response = await api.get('/api/bookings/my-bookings')
    return response.data
  },

  // Update booking
  updateBooking: async (id, bookingData) => {
    const response = await api.put(`/api/bookings/${id}`, bookingData)
    return response.data
  },

  // Cancel booking
  cancelBooking: async (id) => {
    const response = await api.put(`/api/bookings/${id}/cancel`)
    return response.data
  },

  // Complete booking (admin only)
  completeBooking: async (id) => {
    const response = await api.put(`/api/bookings/${id}/complete`)
    return response.data
  },

  // Check table availability
  checkTableAvailability: async (tableNumber, timeSlot) => {
    const response = await api.get('/api/bookings/check-availability', {
      params: { tableNumber, timeSlot },
    })
    return response.data
  },

  // Get today's bookings (admin only)
  getTodayBookings: async () => {
    const response = await api.get('/api/bookings/today')
    return response.data
  },

  // Get upcoming bookings
  getUpcomingBookings: async () => {
    const response = await api.get('/api/bookings/upcoming')
    return response.data
  },

  // Get booking statistics (admin only)
  getBookingStats: async () => {
    const response = await api.get('/api/bookings/stats')
    return response.data
  },

  // Get available time slots for a table
  getAvailableTimeSlots: async (tableNumber, date) => {
    const response = await api.get('/api/bookings/available-slots', {
      params: { tableNumber, date },
    })
    return response.data
  },
}

export default bookingService
