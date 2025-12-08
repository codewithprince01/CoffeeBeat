import { useState, useEffect } from 'react'
import { bookingService } from '../../services/bookingService'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { Search, Filter, Calendar, List } from 'lucide-react'
import BookingCalendar from './BookingCalendar'
import toast from 'react-hot-toast'

const AdminBookings = () => {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [showBookingDetails, setShowBookingDetails] = useState(false)
  const [viewMode, setViewMode] = useState('list') // 'list' or 'calendar'
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8


  useEffect(() => {
    fetchBookings()

    // Auto-refresh every 60 seconds to update booking statuses
    const interval = setInterval(() => {
      fetchBookings()
    }, 60000) // 60 seconds

    return () => clearInterval(interval)
  }, [])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      console.log('Fetching admin bookings...')
      
      let bookingsData = []
      try {
        const data = await bookingService.getAllBookings()
        bookingsData = data.content || data || []
        console.log('Bookings fetched:', bookingsData.length)
      } catch (apiError) {
        console.error('API failed, using sample data:', apiError)
        toast.error('Failed to fetch bookings. Using sample data.')
        
        // Sample data for testing
        bookingsData = [
          {
            id: 'admin-booking-1',
            userId: 'user-123',
            customerName: 'John Doe',
            customerEmail: 'john@email.com',
            customerPhone: '+91 98765 43210',
            tableNumber: 'T1',
            peopleCount: 4,
            timeSlot: new Date(Date.now() + 3600000).toISOString(),
            status: 'BOOKED',
            specialRequests: 'Window seat preferred',
            createdAt: new Date().toISOString()
          },
          {
            id: 'admin-booking-2',
            userId: 'user-456',
            customerName: 'Jane Smith',
            customerEmail: 'jane@email.com',
            customerPhone: '+91 98765 43211',
            tableNumber: 'T2',
            peopleCount: 2,
            timeSlot: new Date(Date.now() + 7200000).toISOString(),
            status: 'CONFIRMED',
            specialRequests: 'Birthday celebration',
            createdAt: new Date(Date.now() - 3600000).toISOString()
          }
        ]
      }

      // Auto-update booking status based on time
      const updatedBookings = bookingsData.map((booking) => {
        // Skip cancelled or already completed bookings
        if (booking.status === 'CANCELLED' || booking.status === 'COMPLETED') {
          return booking
        }

        const bookingTime = new Date(booking.timeSlot)
        const now = new Date()
        const bookingEndTime = new Date(bookingTime.getTime() + 2 * 60 * 60 * 1000) // 2 hour duration

        // If booking time has passed (ended), mark as COMPLETED
        if (now > bookingEndTime) {
          return { ...booking, status: 'COMPLETED' }
        }

        return booking
      })
      
      setBookings(updatedBookings)
      console.log('Admin bookings loaded:', updatedBookings.length)
      
    } catch (error) {
      console.error('Failed to fetch bookings:', error)
      toast.error('Failed to load bookings')
      setBookings([])
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateBookingStatus = async (bookingId, newStatus) => {
    try {
      await bookingService.updateBookingStatus(bookingId, newStatus)
      fetchBookings()
      if (selectedBooking && selectedBooking.id === bookingId) {
        setSelectedBooking({ ...selectedBooking, status: newStatus })
      }
    } catch (error) {
      console.error('Failed to update booking status:', error)
    }
  }

  const handleCancelBooking = async (bookingId) => {
    try {
      await bookingService.cancelBooking(bookingId)
      toast.success('Booking cancelled successfully!')
      fetchBookings()
      setShowBookingDetails(false)
      setSelectedBooking(null)
    } catch (error) {
      console.error('Failed to cancel booking:', error)
      toast.error('Failed to cancel booking: ' + (error.response?.data?.message || error.message))
    }
  }

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter

    let matchesDate = true
    if (dateFilter !== 'all') {
      const bookingDate = new Date(booking.bookingDate)
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const nextWeek = new Date(today)
      nextWeek.setDate(nextWeek.getDate() + 7)

      switch (dateFilter) {
        case 'today':
          matchesDate = bookingDate.toDateString() === today.toDateString()
          break
        case 'tomorrow':
          matchesDate = bookingDate.toDateString() === tomorrow.toDateString()
          break
        case 'week':
          matchesDate = bookingDate <= nextWeek && bookingDate >= today
          break
        case 'month':
          matchesDate = bookingDate.getMonth() === today.getMonth() && bookingDate.getFullYear() === today.getFullYear()
          break
        default:
          matchesDate = true
      }
    }

    return matchesSearch && matchesStatus && matchesDate
  }).sort((a, b) => new Date(b.timeSlot) - new Date(a.timeSlot))

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentBookings = filteredBookings.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage)

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'CONFIRMED': return 'bg-green-100 text-green-800'
      case 'RESERVED': return 'bg-purple-100 text-purple-800'
      case 'OCCUPIED': return 'bg-orange-100 text-orange-800'
      case 'BOOKED': return 'bg-green-100 text-green-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      case 'COMPLETED': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Booking Management</h1>
          <p className="text-gray-600">View and manage table reservations</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setViewMode(viewMode === 'list' ? 'calendar' : 'list')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            {viewMode === 'list' ? (
              <>
                <Calendar className="w-4 h-4 mr-2" />
                Calendar View
              </>
            ) : (
              <>
                <List className="w-4 h-4 mr-2" />
                List View
              </>
            )}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <input
              type="text"
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="RESERVED">Reserved</option>
              <option value="OCCUPIED">Occupied</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <div>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="tomorrow">Tomorrow</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
          <div>
            <button className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Bookings Content */}
      {viewMode === 'list' ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guests</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Table</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{booking.id?.slice(-8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">Customer #{booking.userId?.slice(-8)}</div>
                        <div className="text-sm text-gray-500">Table: {booking.tableNumber}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(booking.timeSlot).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {booking.peopleCount} guests
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {booking.tableNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(booking.status)}`}>
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
                        {booking.status !== 'COMPLETED' && booking.status !== 'CANCELLED' && (
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
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center my-4 space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
              >
                Previous
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-1 border rounded ${currentPage === i + 1 ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      ) : (
        <BookingCalendar
          bookings={filteredBookings}
          onSelectDate={(date) => {
            // Optional: Filter by date when clicked
          }}
        />
      )
      }

      {/* Booking Details Modal */}
      {
        showBookingDetails && selectedBooking && (
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Customer Information</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-500">Name:</span>
                      <span className="ml-2 text-sm text-gray-900">{selectedBooking.customerName}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Email:</span>
                      <span className="ml-2 text-sm text-gray-900">{selectedBooking.customerEmail}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Phone:</span>
                      <span className="ml-2 text-sm text-gray-900">{selectedBooking.customerPhone || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Booking Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Booking Information</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-500">Status:</span>
                      <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedBooking.status)}`}>
                        {selectedBooking.status}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Date:</span>
                      <span className="ml-2 text-sm text-gray-900">{new Date(selectedBooking.bookingDate).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Time:</span>
                      <span className="ml-2 text-sm text-gray-900">{selectedBooking.bookingTime}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Guests:</span>
                      <span className="ml-2 text-sm text-gray-900">{selectedBooking.numberOfGuests}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Table:</span>
                      <span className="ml-2 text-sm text-gray-900">{selectedBooking.tableNumber || 'Not assigned'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Special Requests */}
              {selectedBooking.specialRequests && (
                <div className="mt-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Special Requests</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-900">{selectedBooking.specialRequests}</p>
                  </div>
                </div>
              )}

              {/* Booking Actions */}
              <div className="mt-6">
                <h3 className="font-semibold text-gray-900 mb-3">Actions</h3>
                <div className="flex space-x-3">
                  {selectedBooking.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleUpdateBookingStatus(selectedBooking.id, 'CONFIRMED')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Confirm Booking
                      </button>
                      <button
                        onClick={() => handleCancelBooking(selectedBooking.id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Cancel Booking
                      </button>
                    </>
                  )}
                  {selectedBooking.status === 'CONFIRMED' && (
                    <>
                      <button
                        onClick={() => handleUpdateBookingStatus(selectedBooking.id, 'COMPLETED')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Mark as Completed
                      </button>
                      <button
                        onClick={() => handleCancelBooking(selectedBooking.id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Cancel Booking
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Timestamps */}
              <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">Timestamps</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-500">Created:</span>
                    <span className="ml-2 text-sm text-gray-900">{new Date(selectedBooking.createdAt).toLocaleString()}</span>
                  </div>
                  {selectedBooking.updatedAt && (
                    <div>
                      <span className="text-sm text-gray-500">Last Updated:</span>
                      <span className="ml-2 text-sm text-gray-900">{new Date(selectedBooking.updatedAt).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  )
}

export default AdminBookings
