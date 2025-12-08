import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import bookingService from '../../services/bookingService'

// Async thunks
export const fetchBookings = createAsyncThunk(
  'bookings/fetchBookings',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await bookingService.getBookings(params)
      return response
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch bookings'
      )
    }
  }
)

export const fetchBookingById = createAsyncThunk(
  'bookings/fetchBookingById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await bookingService.getBookingById(id)
      return response
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch booking'
      )
    }
  }
)

export const createBooking = createAsyncThunk(
  'bookings/createBooking',
  async (bookingData, { rejectWithValue }) => {
    try {
      const response = await bookingService.createBooking(bookingData)
      return response
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create booking'
      )
    }
  }
)

export const updateBooking = createAsyncThunk(
  'bookings/updateBooking',
  async ({ id, bookingData }, { rejectWithValue }) => {
    try {
      const response = await bookingService.updateBooking(id, bookingData)
      return response
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update booking'
      )
    }
  }
)

export const cancelBooking = createAsyncThunk(
  'bookings/cancelBooking',
  async (id, { rejectWithValue }) => {
    try {
      const response = await bookingService.cancelBooking(id)
      return response
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to cancel booking'
      )
    }
  }
)

export const completeBooking = createAsyncThunk(
  'bookings/completeBooking',
  async (id, { rejectWithValue }) => {
    try {
      const response = await bookingService.completeBooking(id)
      return response
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to complete booking'
      )
    }
  }
)

export const fetchMyBookings = createAsyncThunk(
  'bookings/fetchMyBookings',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await bookingService.getMyBookings(params)
      return response
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch my bookings'
      )
    }
  }
)

export const fetchTodayBookings = createAsyncThunk(
  'bookings/fetchTodayBookings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await bookingService.getTodayBookings()
      return response
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch today bookings'
      )
    }
  }
)

export const checkTableAvailability = createAsyncThunk(
  'bookings/checkTableAvailability',
  async ({ tableNumber, date, time }, { rejectWithValue }) => {
    try {
      const response = await bookingService.checkTableAvailability(tableNumber, date, time)
      return response
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to check table availability'
      )
    }
  }
)

export const fetchBookingStats = createAsyncThunk(
  'bookings/fetchBookingStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await bookingService.getBookingStats()
      return response
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch booking statistics'
      )
    }
  }
)

// Initial state
const initialState = {
  bookings: [],
  currentBooking: null,
  myBookings: [],
  todayBookings: [],
  availableTables: [],
  stats: null,
  loading: false,
  error: null,
  pagination: {
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0,
  },
  filters: {
    status: '',
    dateFrom: '',
    dateTo: '',
    tableNumber: '',
    sortBy: 'timeSlot',
    sortDir: 'asc',
  },
}

// Slice
const bookingSlice = createSlice({
  name: 'bookings',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    clearCurrentBooking: (state) => {
      state.currentBooking = null
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    resetFilters: (state) => {
      state.filters = initialState.filters
    },
    updateBookingInList: (state, action) => {
      const { id, updates } = action.payload
      const updateBookingList = (bookingList) => {
        const index = bookingList.findIndex(booking => booking.id === id)
        if (index !== -1) {
          bookingList[index] = { ...bookingList[index], ...updates }
        }
      }
      updateBookingList(state.bookings)
      updateBookingList(state.myBookings)
      updateBookingList(state.todayBookings)
      
      if (state.currentBooking?.id === id) {
        state.currentBooking = { ...state.currentBooking, ...updates }
      }
    },
    addNewBooking: (state, action) => {
      const newBooking = action.payload
      state.bookings.unshift(newBooking)
      state.myBookings.unshift(newBooking)
      state.todayBookings.unshift(newBooking)
    },
    setAvailableTables: (state, action) => {
      state.availableTables = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch bookings
      .addCase(fetchBookings.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchBookings.fulfilled, (state, action) => {
        state.loading = false
        state.bookings = action.payload.content || action.payload
        state.pagination = {
          page: action.payload.number || 0,
          size: action.payload.size || 20,
          totalElements: action.payload.totalElements || 0,
          totalPages: action.payload.totalPages || 0,
        }
        state.error = null
      })
      .addCase(fetchBookings.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Fetch booking by ID
      .addCase(fetchBookingById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchBookingById.fulfilled, (state, action) => {
        state.loading = false
        state.currentBooking = action.payload
        state.error = null
      })
      .addCase(fetchBookingById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        state.currentBooking = null
      })
      // Create booking
      .addCase(createBooking.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.loading = false
        state.bookings.unshift(action.payload)
        state.myBookings.unshift(action.payload)
        state.todayBookings.unshift(action.payload)
        state.error = null
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Update booking
      .addCase(updateBooking.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateBooking.fulfilled, (state, action) => {
        state.loading = false
        const updateBookingList = (bookingList) => {
          const index = bookingList.findIndex(booking => booking.id === action.payload.id)
          if (index !== -1) {
            bookingList[index] = action.payload
          }
        }
        updateBookingList(state.bookings)
        updateBookingList(state.myBookings)
        updateBookingList(state.todayBookings)
        
        if (state.currentBooking?.id === action.payload.id) {
          state.currentBooking = action.payload
        }
        state.error = null
      })
      .addCase(updateBooking.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Cancel booking
      .addCase(cancelBooking.fulfilled, (state, action) => {
        const updateBookingList = (bookingList) => {
          const index = bookingList.findIndex(booking => booking.id === action.payload.id)
          if (index !== -1) {
            bookingList[index] = action.payload
          }
        }
        updateBookingList(state.bookings)
        updateBookingList(state.myBookings)
        updateBookingList(state.todayBookings)
        
        if (state.currentBooking?.id === action.payload.id) {
          state.currentBooking = action.payload
        }
      })
      // Complete booking
      .addCase(completeBooking.fulfilled, (state, action) => {
        const updateBookingList = (bookingList) => {
          const index = bookingList.findIndex(booking => booking.id === action.payload.id)
          if (index !== -1) {
            bookingList[index] = action.payload
          }
        }
        updateBookingList(state.bookings)
        updateBookingList(state.myBookings)
        updateBookingList(state.todayBookings)
        
        if (state.currentBooking?.id === action.payload.id) {
          state.currentBooking = action.payload
        }
      })
      // Fetch my bookings
      .addCase(fetchMyBookings.fulfilled, (state, action) => {
        state.myBookings = action.payload.content || action.payload
      })
      // Fetch today bookings
      .addCase(fetchTodayBookings.fulfilled, (state, action) => {
        state.todayBookings = action.payload.content || action.payload
      })
      // Check table availability
      .addCase(checkTableAvailability.fulfilled, (state, action) => {
        state.availableTables = action.payload
      })
      // Fetch booking stats
      .addCase(fetchBookingStats.fulfilled, (state, action) => {
        state.stats = action.payload
      })
  },
})

export const {
  clearError,
  clearCurrentBooking,
  setFilters,
  resetFilters,
  updateBookingInList,
  addNewBooking,
  setAvailableTables,
} = bookingSlice.actions

// Selectors
export const selectBookings = (state) => state.bookings.bookings
export const selectCurrentBooking = (state) => state.bookings.currentBooking
export const selectMyBookings = (state) => state.bookings.myBookings
export const selectTodayBookings = (state) => state.bookings.todayBookings
export const selectAvailableTables = (state) => state.bookings.availableTables
export const selectBookingStats = (state) => state.bookings.stats
export const selectBookingsLoading = (state) => state.bookings.loading
export const selectBookingsError = (state) => state.bookings.error
export const selectBookingsPagination = (state) => state.bookings.pagination
export const selectBookingsFilters = (state) => state.bookings.filters

export default bookingSlice.reducer
