import { useState, useEffect } from 'react'
import { bookingService } from '../../services/bookingService'
import { useAuth } from '../../contexts/AuthContext'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import CreateBookingForm from '../../components/CreateBookingFormSimple'
import toast from 'react-hot-toast'
import api from '../../services/authService'

const CustomerBookings = () => {
  const { user, isAuthenticated } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [showBookingDetails, setShowBookingDetails] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showModifyModal, setShowModifyModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [modifyFormData, setModifyFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    tableId: '',
    tableNumber: '',
    numberOfGuests: 2,
    bookingDate: '',
    bookingTime: '',
    specialRequests: ''
  })

  // Generate default tables like waiter form
  const tables = [
    { id: 1, number: 'T1', capacity: 4, status: 'AVAILABLE', location: 'Main Hall' },
    { id: 2, number: 'T2', capacity: 4, status: 'AVAILABLE', location: 'Main Hall' },
    { id: 3, number: 'T3', capacity: 2, status: 'AVAILABLE', location: 'Main Hall' },
    { id: 4, number: 'T4', capacity: 6, status: 'AVAILABLE', location: 'Main Hall' },
    { id: 5, number: 'T5', capacity: 4, status: 'AVAILABLE', location: 'Outdoor' },
    { id: 6, number: 'T6', capacity: 2, status: 'AVAILABLE', location: 'Outdoor' },
    { id: 7, number: 'T7', capacity: 8, status: 'AVAILABLE', location: 'Private Room' },
    { id: 8, number: 'T8', capacity: 4, status: 'AVAILABLE', location: 'Private Room' },
  ]

  useEffect(() => {
    let interval = null // Declare interval outside the if block
    
    // Only fetch if user is authenticated
    if (isAuthenticated && user) {
      fetchBookings()
      
      // Initial check for time-based status updates
      setTimeout(() => {
        updateBookingStatusesBasedOnTime()
      }, 1000)
      
      interval = setInterval(() => {
        fetchBookings()
        updateBookingStatusesBasedOnTime()
      }, 30000) // Refresh every 30 seconds and check time-based status
    } else {
      console.log('User not authenticated, skipping bookings fetch')
      setLoading(false)
    }
    
    // Listen for localStorage changes (when waiter clears tables)
    const handleStorageChange = (e) => {
      if (e.key === 'clearedBookings') {
        console.log('Cleared bookings updated by waiter, refreshing...')
        fetchBookings()
        updateBookingStatusesBasedOnTime()
      }
    }
    
    // Listen for custom tableCleared events from waiter
    const handleTableCleared = (e) => {
      console.log('Received tableCleared event:', e.detail)
      const bookingId = e.detail.bookingId
      console.log(`Booking ${bookingId} cleared by waiter, updating status to COMPLETED`)
      
      // Update the specific booking to COMPLETED immediately
      setBookings(prevBookings => 
        prevBookings.map(booking => 
          booking.id === bookingId 
            ? { ...booking, status: 'COMPLETED' }
            : booking
        )
      )
      
      // Also refresh from server to ensure consistency
      fetchBookings()
    }
    
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('tableCleared', handleTableCleared)
    
    return () => {
      if (interval) {
        clearInterval(interval)
      }
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('tableCleared', handleTableCleared)
    }
  }, [isAuthenticated, user])

  const updateBookingStatusesBasedOnTime = () => {
    const now = new Date()
    const completedBookings = JSON.parse(localStorage.getItem('clearedBookings') || '[]')
    
    console.log('Checking booking statuses at:', now.toISOString())
    console.log('Completed bookings from localStorage:', completedBookings)
    
    setBookings(prevBookings => {
      const updatedBookings = prevBookings.map(booking => {
        // If booking is marked as cleared by waiter, set to COMPLETED
        if (completedBookings.includes(booking.id)) {
          console.log(`Booking ${booking.id} marked as completed by waiter`)
          return { ...booking, status: 'COMPLETED' }
        }
        
        const bookingTime = new Date(booking.timeSlot)
        const twoHoursBeforeBooking = new Date(bookingTime.getTime() - (2 * 60 * 60 * 1000)) // 2 hours before
        
        console.log(`Booking ${booking.id} time:`, bookingTime.toISOString())
        console.log(`Two hours before booking:`, twoHoursBeforeBooking.toISOString())
        console.log(`Current time:`, now.toISOString())
        
        // If current time is before 2 hours of booking, keep as BOOKED
        if (now < twoHoursBeforeBooking && booking.status === 'BOOKED') {
          console.log(`Booking ${booking.id} is more than 2 hours away, keeping BOOKED`)
          return { ...booking, status: 'BOOKED' }
        }
        
        // If current time is between 2 hours before and booking time, show as RESERVED
        if (now >= twoHoursBeforeBooking && now < bookingTime && (booking.status === 'BOOKED' || booking.status === 'RESERVED')) {
          console.log(`Booking ${booking.id} is within 2 hours, updating to RESERVED`)
          return { ...booking, status: 'RESERVED' }
        }
        
        // If booking time has passed and status is still BOOKED or RESERVED, change to OCCUPIED
        if (now >= bookingTime && (booking.status === 'BOOKED' || booking.status === 'RESERVED')) {
          console.log(`Booking ${booking.id} time passed, updating to OCCUPIED`)
          return { ...booking, status: 'OCCUPIED' }
        }
        
        return booking
      })
      
      // Check for specific booking ID #6932db59f698b041ab13d322
      const specificBooking = updatedBookings.find(b => b.id === '6932db59f698b041ab13d322')
      if (specificBooking) {
        console.log('Specific booking #6932db59f698b041ab13d322 status:', specificBooking.status)
        console.log('Specific booking time:', new Date(specificBooking.timeSlot).toISOString())
      }
      
      return updatedBookings
    })
  }

  const fetchBookings = async () => {
    try {
      setLoading(true)
      console.log('Fetching customer bookings...')
      console.log('Current user:', user)
      console.log('Is authenticated:', isAuthenticated)
      console.log('Token in localStorage:', localStorage.getItem('token') ? 'Present' : 'Missing')
      
      let bookingsData = []
      try {
        console.log('Making API call to getCustomerBookings...')
        const data = await bookingService.getCustomerBookings()
        console.log('API response received:', data)
        bookingsData = data || []
        console.log('Bookings fetched:', bookingsData.length)
      } catch (apiError) {
        console.error('API failed with detailed error:', apiError)
        console.error('Error response:', apiError.response)
        console.error('Error status:', apiError.response?.status)
        console.error('Error data:', apiError.response?.data)
        toast.error('Failed to fetch bookings. Using sample data.')
        
        // Sample data for testing
        bookingsData = [
          {
            id: 'customer-booking-1',
            userId: 'customer-123',
            tableNumber: 'T1',
            peopleCount: 4,
            timeSlot: new Date(Date.now() + 3600000).toISOString(),
            status: 'BOOKED',
            specialRequests: 'Window seat preferred',
            createdAt: new Date().toISOString()
          },
          {
            id: 'customer-booking-2',
            userId: 'customer-123',
            tableNumber: 'T2',
            peopleCount: 2,
            timeSlot: new Date(Date.now() + 7200000).toISOString(),
            status: 'RESERVED',
            specialRequests: 'Birthday celebration',
            createdAt: new Date(Date.now() - 3600000).toISOString()
          }
        ]
      }
      
      // Apply localStorage completion status from waiter table clearing
      const completedBookings = JSON.parse(localStorage.getItem('clearedBookings') || '[]')
      
      const processedData = bookingsData.map(booking => {
        if (completedBookings.includes(booking.id)) {
          console.log(`Booking ${booking.id} marked as completed from localStorage`)
          return { ...booking, status: 'COMPLETED' }
        }
        return booking
      })
      
      // Sort bookings by time (newest first)
      const sortedBookings = [...processedData].sort((a, b) => {
        const dateFields = ['createdAt', 'timeSlot', 'bookingDate', 'created_at', 'timestamp', 'date']
        let dateA = 0, dateB = 0
        
        for (const field of dateFields) {
          if (a[field]) {
            dateA = new Date(a[field]).getTime()
            break
          }
        }
        
        for (const field of dateFields) {
          if (b[field]) {
            dateB = new Date(b[field]).getTime()
            break
          }
        }
        
        return dateB - dateA
      })
      
      setBookings(sortedBookings)
      console.log('Customer bookings loaded:', sortedBookings.length)
      
    } catch (error) {
      console.error('Failed to fetch customer bookings:', error)
      toast.error('Failed to load your bookings')
      setBookings([])
    } finally {
      setLoading(false)
    }
  }

  const handleCancelBooking = async (bookingId) => {
    try {
      await bookingService.cancelBooking(bookingId)
      fetchBookings()
      if (selectedBooking && selectedBooking.id === bookingId) {
        setShowBookingDetails(false)
        setSelectedBooking(null)
      }
      toast.success('Booking cancelled successfully!')
    } catch (error) {
      console.error('Failed to cancel booking:', error)
      toast.error('Failed to cancel booking. Please try again.')
    }
  }

  const handleCreateBooking = async (bookingData) => {
    try {
      // Convert time slot to proper datetime format for backend
      const getTimeSlotDateTime = (date, timeSlot) => {
        const baseDate = new Date(date)
        // Set to local time to avoid timezone issues
        switch(timeSlot) {
          case 'MORNING':
            baseDate.setHours(9, 0, 0, 0) // 9:00 AM
            break
          case 'AFTERNOON':
            baseDate.setHours(14, 0, 0, 0) // 2:00 PM
            break
          case 'EVENING':
            baseDate.setHours(19, 0, 0, 0) // 7:00 PM
            break
          default:
            baseDate.setHours(12, 0, 0, 0) // Default to noon
        }
        // Return in format backend expects (YYYY-MM-DDTHH:mm:ss)
        const year = baseDate.getFullYear()
        const month = String(baseDate.getMonth() + 1).padStart(2, '0')
        const day = String(baseDate.getDate()).padStart(2, '0')
        const hours = String(baseDate.getHours()).padStart(2, '0')
        const minutes = String(baseDate.getMinutes()).padStart(2, '0')
        const seconds = String(baseDate.getSeconds()).padStart(2, '0')
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
      }
      
      // Use the authenticated API service instead of hardcoded token
      const bookingServiceData = {
        customerName: bookingData.customerName,
        customerEmail: bookingData.customerEmail || null,
        customerPhone: bookingData.customerPhone || null,
        tableNumber: tables.find(t => t.id === parseInt(bookingData.tableId))?.number || 'T1',
        peopleCount: bookingData.numberOfGuests,
        timeSlot: getTimeSlotDateTime(bookingData.bookingDate, bookingData.bookingTimeSlot),
        specialRequests: bookingData.specialRequests || null,
        status: 'BOOKED',
        userId: user?.id || "6931bb3ad41b96691ca6ad27" // Add userId back
      }
      
      console.log('Creating booking with data:', bookingServiceData)
      
      // Use bookingService which handles authentication properly
      await bookingService.createBooking(bookingServiceData)
      
      toast.success('Booking created successfully!')
      setShowCreateModal(false)
      fetchBookings()
    } catch (error) {
      console.error('Failed to create booking:', error)
      console.error('Error response:', error.response?.data)
      if (error.response?.data?.errors) {
        console.error('Validation errors:', error.response.data.errors)
      }
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create booking'
      toast.error(errorMessage)
    }
  }

  const handleModifyBooking = (booking) => {
    setSelectedBooking(booking)
    
    // Parse the timeSlot to get date and time
    const bookingDateTime = new Date(booking.timeSlot)
    const date = bookingDateTime.toISOString().split('T')[0]
    const time = bookingDateTime.toTimeString().slice(0,5)
    
    // Find table ID from table number
    const tableId = tables.find(t => t.number === booking.tableNumber)?.id || ''
    
    setModifyFormData({
      customerName: booking.customerName || '',
      customerEmail: booking.customerEmail || '',
      customerPhone: booking.customerPhone || '',
      tableId: tableId,
      tableNumber: booking.tableNumber || '',
      numberOfGuests: booking.peopleCount || 2,
      bookingDate: date,
      bookingTime: time,
      specialRequests: booking.specialRequests || ''
    })
    setShowModifyModal(true)
  }

  const handleUpdateBooking = async () => {
    if (!selectedBooking) return

    try {
      // Combine date and time to create timeSlot
      const timeSlot = `${modifyFormData.bookingDate}T${modifyFormData.bookingTime}:00`
      
      const updateData = {
        id: selectedBooking.id,
        userId: selectedBooking.userId,
        tableNumber: tables.find(t => t.id === parseInt(modifyFormData.tableId))?.number || modifyFormData.tableNumber,
        timeSlot: timeSlot,
        peopleCount: parseInt(modifyFormData.numberOfGuests),
        specialRequests: modifyFormData.specialRequests,
        customerName: modifyFormData.customerName,
        customerEmail: modifyFormData.customerEmail,
        customerPhone: modifyFormData.customerPhone,
        status: selectedBooking.status, // Keep the same status
      }

      await bookingService.updateBooking(selectedBooking.id, updateData)
      toast.success('Booking updated successfully!')
      setShowModifyModal(false)
      setSelectedBooking(null)
      fetchBookings()
    } catch (error) {
      console.error('Failed to update booking:', error)
      toast.error('Failed to update booking. Please try again.')
    }
  }

const filteredBookings = bookings.filter(booking => {
    if (statusFilter === 'all') return true
    return booking.status === statusFilter
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-green-100 text-green-800'
      case 'OCCUPIED': return 'bg-red-100 text-red-800'
      case 'RESERVED': return 'bg-yellow-100 text-yellow-800'
      case 'BOOKED': return 'bg-blue-100 text-blue-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now - date) / (1000 * 60))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`
    return `${Math.floor(diffInMinutes / 1440)} days ago`
  }

  const canCancel = (booking) => {
    return ['BOOKED'].includes(booking.status)
  }

  const canModify = (booking) => {
    return ['BOOKED'].includes(booking.status)
  }

if (loading) {
  return (
    <div className="flex items-center justify-center h-64">
      <LoadingSpinner size="large" />
    </div>
  )
}

return (
  <div className="space-y-6">
    {/* Header */}
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
        <p className="text-gray-600">Manage your table reservations</p>
      </div>
      <div className="flex space-x-3">
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          New Booking
        </button>
        <button
          onClick={fetchBookings}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>
    </div>

    {/* Status Filter */}
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex flex-wrap space-x-2">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-4 py-2 rounded-lg transition-colors ${statusFilter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
        >
          All Bookings ({bookings.length})
        </button>
        <button
          onClick={() => setStatusFilter('BOOKED')}
          className={`px-4 py-2 rounded-lg transition-colors ${statusFilter === 'BOOKED'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
        >
          Booked ({bookings.filter(b => b.status === 'BOOKED').length})
        </button>
        <button
          onClick={() => setStatusFilter('RESERVED')}
          className={`px-4 py-2 rounded-lg transition-colors ${statusFilter === 'RESERVED'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
        >
          Reserved ({bookings.filter(b => b.status === 'RESERVED').length})
        </button>
        <button
          onClick={() => setStatusFilter('OCCUPIED')}
          className={`px-4 py-2 rounded-lg transition-colors ${statusFilter === 'OCCUPIED'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
        >
          Occupied ({bookings.filter(b => b.status === 'OCCUPIED').length})
        </button>
        <button
          onClick={() => setStatusFilter('COMPLETED')}
          className={`px-4 py-2 rounded-lg transition-colors ${statusFilter === 'COMPLETED'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
        >
          Completed ({bookings.filter(b => b.status === 'COMPLETED').length})
        </button>
        <button
          onClick={() => setStatusFilter('CANCELLED')}
          className={`px-4 py-2 rounded-lg transition-colors ${statusFilter === 'CANCELLED'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
        >
          Cancelled ({bookings.filter(b => b.status === 'CANCELLED').length})
        </button>
      </div>
    </div>

    {/* Booking Statistics */}
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center">
          <div className="p-3 bg-blue-100 rounded-full">
            <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Booked</p>
            <p className="text-2xl font-bold text-gray-900">
              {bookings.filter(b => b.status === 'BOOKED').length}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center">
          <div className="p-3 bg-yellow-100 rounded-full">
            <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Reserved</p>
            <p className="text-2xl font-bold text-gray-900">
              {bookings.filter(b => b.status === 'RESERVED').length}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center">
          <div className="p-3 bg-red-100 rounded-full">
            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Occupied</p>
            <p className="text-2xl font-bold text-gray-900">
              {bookings.filter(b => b.status === 'OCCUPIED').length}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center">
          <div className="p-3 bg-green-100 rounded-full">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Completed</p>
            <p className="text-2xl font-bold text-gray-900">
              {bookings.filter(b => b.status === 'COMPLETED').length}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center">
          <div className="p-3 bg-red-100 rounded-full">
            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Cancelled</p>
            <p className="text-2xl font-bold text-gray-900">
              {bookings.filter(b => b.status === 'CANCELLED').length}
            </p>
          </div>
        </div>
      </div>
    </div>

    {/* Bookings List */}
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guests</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Table</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredBookings.map((booking) => (
              <tr key={booking.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  #{booking.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(booking.timeSlot).toLocaleDateString()}
                  <br />
                  <span className="text-xs text-gray-500">
                    {new Date(booking.timeSlot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {booking.peopleCount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {booking.tableNumber || `Table ${booking.tableId}`}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                    {booking.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedBooking(booking)
                        setShowBookingDetails(true)
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View
                    </button>
                    {canModify(booking) && (
                      <button
                        onClick={() => handleModifyBooking(booking)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Modify
                      </button>
                    )}
                    {canCancel(booking) && (
                      <button
                        onClick={() => handleCancelBooking(booking.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    {/* Booking Details Modal */}
    {showBookingDetails && selectedBooking && (
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-screen overflow-y-auto">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Booking Details</h2>
              <p className="text-sm text-gray-500">Booking #{selectedBooking.id}</p>
            </div>
            <button
              onClick={() => {
                setShowBookingDetails(false)
                setSelectedBooking(null)
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Booking Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">Booking Information</h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-500">Booking Number:</span>
                  <span className="ml-2 text-sm text-gray-900">#{selectedBooking.id}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Status:</span>
                  <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedBooking.status)}`}>
                    {selectedBooking.status}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Booking Date:</span>
                  <span className="ml-2 text-sm text-gray-900">
                    {new Date(selectedBooking.timeSlot).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Created:</span>
                  <span className="ml-2 text-sm text-gray-900">{getTimeAgo(selectedBooking.createdAt)}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">Reservation Details</h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-500">Number of People:</span>
                  <span className="ml-2 text-sm text-gray-900">{selectedBooking.peopleCount}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Table:</span>
                  <span className="ml-2 text-sm text-gray-900">{selectedBooking.tableNumber || `Table ${selectedBooking.tableId}`}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Occasion:</span>
                  <span className="ml-2 text-sm text-gray-900">{selectedBooking.occasion || 'Regular dining'}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Special Requests:</span>
                  <span className="ml-2 text-sm text-gray-900">{selectedBooking.specialRequests || 'None'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="mb-6 bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">Booking Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-500">User ID:</span>
                <span className="ml-2 text-sm text-gray-900">{selectedBooking.userId}</span>
              </div>
              <div>
                <span className="text-sm text-gray-500">Booking ID:</span>
                <span className="ml-2 text-sm text-gray-900">{selectedBooking.id}</span>
              </div>
            </div>
          </div>

          {/* Special Requests */}
          {selectedBooking.specialRequests && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Special Requests</h3>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-gray-900">{selectedBooking.specialRequests}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            {canModify(selectedBooking) && (
              <button
                onClick={() => {
                  setShowBookingDetails(false)
                  handleModifyBooking(selectedBooking)
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Modify Booking
              </button>
            )}
            {canCancel(selectedBooking) && (
              <button
                onClick={() => handleCancelBooking(selectedBooking.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Cancel Booking
              </button>
            )}
            <button
              onClick={() => {
                setShowBookingDetails(false)
                setSelectedBooking(null)
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Create Booking Modal */}
    {showCreateModal && (
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-screen overflow-y-auto">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Create New Booking</h2>
              <p className="text-sm text-gray-500">Reserve a table for your dining experience</p>
            </div>
            <button
              onClick={() => setShowCreateModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <CreateBookingForm
            onSubmit={handleCreateBooking}
            onCancel={() => setShowCreateModal(false)}
          />
        </div>
      </div>
    )}

    {/* Modify Booking Modal */}
    {showModifyModal && selectedBooking && (
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-screen overflow-y-auto">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Modify Booking</h2>
              <p className="text-sm text-gray-500">Update your table reservation details</p>
            </div>
            <button
              onClick={() => setShowModifyModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleUpdateBooking(); }} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Customer Name</label>
                <input
                  type="text"
                  required
                  value={selectedBooking.customerName || ''}
                  readOnly
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                <input
                  type="tel"
                  value={selectedBooking.customerPhone || ''}
                  readOnly
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={selectedBooking.customerEmail || ''}
                  readOnly
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Number of Guests</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  required
                  value={modifyFormData.peopleCount}
                  onChange={(e) => setModifyFormData({ ...modifyFormData, peopleCount: parseInt(e.target.value) })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Table</label>
                <select
                  required
                  value={modifyFormData.tableId || ''}
                  onChange={(e) => {
                    const tableId = parseInt(e.target.value)
                    const selectedTable = tables.find(t => t.id === tableId)
                    setModifyFormData({ 
                      ...modifyFormData, 
                      tableId: tableId,
                      tableNumber: selectedTable?.number || modifyFormData.tableNumber
                    })
                  }}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a table</option>
                  {tables.map(table => (
                    <option key={table.id} value={table.id}>
                      {table.number} - {table.capacity} seats - {table.location}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Booking Date</label>
                <input
                  type="date"
                  required
                  value={modifyFormData.bookingDate || new Date(modifyFormData.timeSlot).toISOString().split('T')[0]}
                  onChange={(e) => setModifyFormData({ ...modifyFormData, bookingDate: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Booking Time</label>
              <input
                type="time"
                required
                value={modifyFormData.bookingTime || new Date(modifyFormData.timeSlot).toTimeString().slice(0,5)}
                onChange={(e) => setModifyFormData({ ...modifyFormData, bookingTime: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Special Requests</label>
              <textarea
                rows={3}
                value={modifyFormData.specialRequests || selectedBooking.specialRequests || ''}
                onChange={(e) => setModifyFormData({ ...modifyFormData, specialRequests: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Current Booking Details</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>Table: {selectedBooking.tableNumber}</p>
                <p>Time: {new Date(selectedBooking.timeSlot).toLocaleString()}</p>
                <p>People: {selectedBooking.peopleCount}</p>
                <p>Status: {selectedBooking.status}</p>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowModifyModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Update Booking
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
  </div>
  )
}

export default CustomerBookings
