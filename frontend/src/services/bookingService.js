import api from './authService'

export const bookingService = {
  // Create booking
  createBooking: async (bookingData) => {
    const response = await api.post('/bookings', bookingData)
    return response.data
  },

  // Get all bookings (admin only)
  getAllBookings: async () => {
    const response = await api.get('/bookings')
    return response.data
  },

  // Get booking by ID
  getBookingById: async (id) => {
    const response = await api.get(`/bookings/${id}`)
    return response.data
  },

  // Get my bookings
  getMyBookings: async () => {
    const response = await api.get('/bookings/my-bookings')
    return response.data
  },

  // Get customer bookings (alias for getMyBookings)
  getCustomerBookings: async () => {
    const response = await api.get('/bookings/my-bookings')
    return response.data
  },

  // Update booking
  updateBooking: async (id, bookingData) => {
    const response = await api.put(`/bookings/${id}`, bookingData)
    return response.data
  },

  // Update booking status
  updateBookingStatus: async (id, status) => {
    // First fetch the booking to get full details
    const { data: booking } = await api.get(`/bookings/${id}`)
    // Then update with full object to satisfy backend @Valid constraints
    const response = await api.put(`/bookings/${id}`, { ...booking, status })
    return response.data
  },

  // Cancel booking
  cancelBooking: async (id) => {
    try {
      // Try the cancel endpoint first
      const response = await api.put(`/bookings/${id}/cancel`)
      return response.data
    } catch (error) {
      console.log('Cancel endpoint failed, trying status update')
      // If cancel endpoint fails, try updating status directly
      const response = await api.put(`/bookings/${id}`, {
        status: 'CANCELLED'
      })
      return response.data
    }
  },

  // Complete booking (admin only)
  completeBooking: async (id) => {
    const response = await api.put(`/bookings/${id}/complete`)
    return response.data
  },

  // Check table availability
  checkTableAvailability: async (tableNumber, timeSlot) => {
    const response = await api.get('/bookings/check-availability', {
      params: { tableNumber, timeSlot },
    })
    return response.data
  },

  // Get today's bookings (admin only)
  getTodayBookings: async () => {
    const response = await api.get('/bookings/today')
    return response.data
  },

  // Get upcoming bookings
  getUpcomingBookings: async () => {
    const response = await api.get('/bookings/upcoming')
    return response.data
  },

  // Get booking statistics (admin only)
  getBookingStats: async () => {
    const response = await api.get('/bookings/stats')
    return response.data
  },

  // Get available time slots for a table
  getAvailableTimeSlots: async (tableNumber, date) => {
    const response = await api.get('/bookings/available-slots', {
      params: { tableNumber, date },
    })
    return response.data
  },
}

export default bookingService
