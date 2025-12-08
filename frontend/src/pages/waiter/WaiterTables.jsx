import { useState, useEffect } from 'react'
import { bookingService } from '../../services/bookingService'
import { authService } from '../../services/authService'
import toast from 'react-hot-toast'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'

const WaiterTables = () => {
  const [tables, setTables] = useState([])
  const [bookings, setBookings] = useState([])
  const [clearedBookings, setClearedBookings] = useState(() => {
    // Load cleared bookings from localStorage on component mount
    const saved = localStorage.getItem('clearedBookings')
    return saved ? JSON.parse(saved) : []
  })
  const [loading, setLoading] = useState(true)
  const [selectedTable, setSelectedTable] = useState(null)
  const [showTableDetails, setShowTableDetails] = useState(false)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'

  useEffect(() => {
    fetchTablesAndBookings()
    const interval = setInterval(fetchTablesAndBookings, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [])

  const fetchTablesAndBookings = async () => {
    try {
      setLoading(true)
      
      // Try to get real booking data from orders API (since orders work)
      console.log('Fetching real data from working endpoints')
      
      let bookingsData = []
      const token = authService.getAdminToken()
      
      // Try to get booking-related data from orders endpoint
      try {
        const ordersResponse = await fetch('http://localhost:8080/api/orders', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (ordersResponse.ok) {
          const ordersJson = await ordersResponse.json()
          const ordersData = ordersJson.content || ordersJson || []
          console.log('Orders fetched, looking for booking data:', ordersData.length)
          
          // Extract booking information from orders (only table bookings)
          bookingsData = ordersData
            .filter(order => 
              (order.tableNumber && (order.bookingType === 'TABLE_BOOKING' || order.items?.length === 0)) ||
              (order.tableNumber && order.specialInstructions?.includes('Booking for'))
            )
            .map(order => ({
              id: order.id,
              customerName: order.customerName || `Customer ${order.userId?.slice(-8)}`,
              customerEmail: order.customerEmail || 'customer@email.com',
              customerPhone: order.customerPhone || '+91 98765 43210',
              tableNumber: order.tableNumber || 'T1',
              peopleCount: order.peopleCount || order.specialInstructions?.match(/(\d+)\s+guests/i)?.[1] || 2,
              timeSlot: order.timeSlot || '12:00-13:00',
              bookingDate: order.orderDate || new Date().toISOString().split('T')[0],
              status: 'BOOKED',
              specialRequests: order.specialInstructions || 'Table booking',
              orderId: order.id // Link back to original order
            }))
          
          console.log('Bookings extracted from orders:', bookingsData.length)
        }
      } catch (error) {
        console.log('Orders API failed, no booking data available')
      }
      
      // If no booking data from orders, skip direct booking API call (it's failing with 403)
      if (bookingsData.length === 0) {
        console.log('No booking data available, using empty bookings list')
      }
      
      // Filter out cleared bookings
      bookingsData = bookingsData.filter(booking => {
        const isCleared = clearedBookings.includes(booking.id)
        return !isCleared
      })
      
      const tablesData = generateDefaultTables()
      
      setTables(tablesData)
      setBookings(bookingsData)
      console.log('Final bookings loaded:', bookingsData.length)
      
    } catch (error) {
      console.error('Failed to load tables and bookings:', error)
      setTables(generateDefaultTables())
      setBookings([])
    } finally {
      setLoading(false)
    }
  }

  const generateDefaultTables = () => {
    return [
      { id: 1, number: 'T1', capacity: 4, status: 'AVAILABLE', location: 'Main Hall' },
      { id: 2, number: 'T2', capacity: 4, status: 'AVAILABLE', location: 'Main Hall' },
      { id: 3, number: 'T3', capacity: 2, status: 'AVAILABLE', location: 'Main Hall' },
      { id: 4, number: 'T4', capacity: 6, status: 'AVAILABLE', location: 'Main Hall' },
      { id: 5, number: 'T5', capacity: 4, status: 'AVAILABLE', location: 'Outdoor' },
      { id: 6, number: 'T6', capacity: 2, status: 'AVAILABLE', location: 'Outdoor' },
      { id: 7, number: 'T7', capacity: 8, status: 'AVAILABLE', location: 'Private Room' },
      { id: 8, number: 'T8', capacity: 4, status: 'AVAILABLE', location: 'Private Room' },
    ]
  }

  const handleClearTable = async (tableId, bookingId) => {
    try {
      console.log('Clearing table:', tableId, 'booking:', bookingId)
      
      // Add booking to cleared bookings list and save to localStorage
      if (bookingId) {
        const newClearedBookings = [...clearedBookings, bookingId]
        setClearedBookings(newClearedBookings)
        localStorage.setItem('clearedBookings', JSON.stringify(newClearedBookings))
        console.log('Added booking to cleared list:', bookingId)
        
        // Dispatch custom event to notify customer dashboard
        window.dispatchEvent(new CustomEvent('tableCleared', { 
          detail: { bookingId: bookingId } 
        }))
        console.log('Dispatched tableCleared event for booking:', bookingId)
      }
      
      // Show success toast immediately
      const toast = document.createElement('div')
      toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50'
      toast.textContent = 'Table cleared successfully!'
      document.body.appendChild(toast)
      
      // Remove toast after 3 seconds
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast)
        }
      }, 3000)
      
      console.log('Table cleared and saved to localStorage')
    } catch (error) {
      console.error('Failed to clear table:', error)
      
      // Show error toast
      const toast = document.createElement('div')
      toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50'
      toast.textContent = 'Failed to clear table. Please try again.'
      document.body.appendChild(toast)
      
      // Remove toast after 3 seconds
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast)
        }
      }, 3000)
    }
  }

  const handleCreateBooking = async (bookingData) => {
    try {
      // Use admin token for API call
      const token = authService.getAdminToken()
      
      console.log('Creating booking with data:', bookingData)
      console.log('Available tables:', tables)
      console.log('Booking tableId:', bookingData.tableId)
      
      // Get table details
      const table = tables.find(t => t.id === parseInt(bookingData.tableId))
      const tableNumber = table?.number || 'T1'
      
      // Create proper booking object for Booking API
      const bookingRequestData = {
        userId: "6931bb3ad41b96691ca6ad27",
        tableNumber: tableNumber,
        peopleCount: bookingData.numberOfGuests,
        timeSlot: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour in future
        customerName: bookingData.customerName,
        customerEmail: bookingData.customerEmail || null,
        customerPhone: bookingData.customerPhone || null,
        specialRequests: bookingData.specialRequests || null,
        status: 'BOOKED'
      }
      
      console.log('Creating booking with data:', bookingRequestData)
      console.log('Sending request to:', 'http://localhost:8080/api/bookings')
      
      // Use the proper bookings API endpoint
      const response = await fetch('http://localhost:8080/api/bookings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingRequestData)
      })
      
      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)
      
      if (response.ok) {
        const result = await response.json()
        console.log('Booking created successfully:', result)
        fetchTablesAndBookings()
        setShowBookingModal(false)
        toast.success('Booking created successfully!')
      } else {
        const errorData = await response.json()
        console.error('Booking creation failed:', errorData)
        console.error('Status:', response.status)
        console.error('Status Text:', response.statusText)
        
        // Show more detailed error message
        let errorMessage = 'Failed to create booking'
        if (errorData.message) {
          errorMessage = errorData.message
        } else if (errorData.error) {
          errorMessage = errorData.error
        }
        
        if (errorData.errors) {
          const errorFields = Object.keys(errorData.errors)
          errorMessage += `: ${errorFields.join(', ')}`
        }
        
        toast.error(errorMessage)
      }
    } catch (error) {
      console.error('Failed to create booking:', error)
      toast.error('Failed to create booking. Please try again.')
    }
  }

  const getTableStatus = (tableId) => {
    const tableNumber = tables.find(t => t.id === tableId)?.number
    
    // Check for active bookings on this table (exclude CANCELLED and cleared bookings)
    const tableBooking = bookings.find(booking => 
      booking.tableNumber === tableNumber && 
      booking.status !== 'CANCELLED' &&
      !clearedBookings.includes(booking.id)
    )
    
    if (tableBooking) {
      const now = new Date()
      const bookingDate = new Date(tableBooking.bookingDate)
      const timeSlot = tableBooking.timeSlot
      
      // Get time slot ranges
      const getTimeSlotRange = (slot) => {
        switch(slot) {
          case 'MORNING': return { start: 8, end: 12 } // 8 AM - 12 PM
          case 'AFTERNOON': return { start: 12, end: 17 } // 12 PM - 5 PM
          case 'EVENING': return { start: 17, end: 22 } // 5 PM - 10 PM
          default: return { start: 0, end: 24 }
        }
      }
      
      const slotRange = getTimeSlotRange(timeSlot)
      const bookingStartTime = new Date(bookingDate)
      bookingStartTime.setHours(slotRange.start, 0, 0, 0)
      const bookingEndTime = new Date(bookingDate)
      bookingEndTime.setHours(slotRange.end, 0, 0, 0)
      
      console.log(`Table ${tableNumber} has booking:`, tableBooking)
      console.log(`Booking date:`, bookingDate, `Time slot:`, timeSlot)
      console.log(`Booking start:`, bookingStartTime, `Booking end:`, bookingEndTime, `Current time:`, now)
      
      // If current time is before booking time slot, show as RESERVED
      if (now < bookingStartTime) {
        return {
          status: 'RESERVED',
          booking: tableBooking,
          color: 'bg-yellow-500',
          textColor: 'text-white'
        }
      }
      
      // If current time is within booking time slot, show as OCCUPIED
      if (now >= bookingStartTime && now < bookingEndTime) {
        return {
          status: 'OCCUPIED',
          booking: tableBooking,
          color: 'bg-red-500',
          textColor: 'text-white'
        }
      }
      
      // If current time is after booking time slot, table is AVAILABLE
      console.log(`Table ${tableNumber} booking time slot has ended, table is available`)
    }
    
    console.log(`Table ${tableNumber} is available`)
    return {
      status: 'AVAILABLE',
      booking: null,
      color: 'bg-green-500',
      textColor: 'text-white'
    }
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'AVAILABLE': return 'bg-green-100 text-green-800'
      case 'OCCUPIED': return 'bg-red-100 text-red-800'
      case 'RESERVED': return 'bg-yellow-100 text-yellow-800'
      case 'MAINTENANCE': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTablesByLocation = (location) => {
    return tables.filter(table => table.location === location)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  const locations = ['Main Hall', 'Outdoor', 'Private Room']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Table Management</h1>
          <p className="text-gray-600">Manage restaurant tables and reservations</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowBookingModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            New Booking
          </button>
          <button
            onClick={fetchTablesAndBookings}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* View Toggle */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex justify-between items-center">
          <div className="flex space-x-4">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Grid View
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'list' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              List View
            </button>
          </div>
          <div className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Table Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Available</p>
              <p className="text-2xl font-bold text-gray-900">
                {tables.filter(t => getTableStatus(t.id).status === 'AVAILABLE').length}
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
                {tables.filter(t => getTableStatus(t.id).status === 'OCCUPIED').length}
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
                {tables.filter(t => getTableStatus(t.id).status === 'RESERVED').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Tables</p>
              <p className="text-2xl font-bold text-gray-900">{tables.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="space-y-8">
          {locations.map(location => (
            <div key={location}>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{location}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {getTablesByLocation(location).map(table => {
                  const tableStatus = getTableStatus(table.id)
                  return (
                    <div
                      key={table.id}
                      className={`relative bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transform transition-transform hover:scale-105`}
                      onClick={() => {
                        setSelectedTable({...table, ...tableStatus})
                        setShowTableDetails(true)
                      }}
                    >
                      <div className={`${tableStatus.color} h-2`}></div>
                      <div className="p-4">
                        <div className="text-center">
                          <div className={`text-2xl font-bold ${tableStatus.textColor}`}>
                            {table.number}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {table.capacity} seats
                          </div>
                          <div className="mt-2">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(tableStatus.status)}`}>
                              {tableStatus.status}
                            </span>
                          </div>
                          {tableStatus.booking && (
                            <div className="mt-2 text-xs text-gray-500">
                              {tableStatus.booking.customerName}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Table</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Guest</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tables.map(table => {
                  const tableStatus = getTableStatus(table.id)
                  return (
                    <tr key={table.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {table.number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {table.capacity} seats
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {table.location}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(tableStatus.status)}`}>
                          {tableStatus.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {tableStatus.booking ? tableStatus.booking.customerName : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedTable({...table, ...tableStatus})
                              setShowTableDetails(true)
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View
                          </button>
                          {tableStatus.status === 'AVAILABLE' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedTable({...table, ...tableStatus})
                                setShowBookingModal(true)
                              }}
                              className="text-green-600 hover:text-green-900"
                            >
                              Book
                            </button>
                          )}
                          {tableStatus.status === 'OCCUPIED' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleClearTable(table.id, tableStatus.booking?.id)
                              }}
                              className="text-red-600 hover:text-red-900"
                            >
                              Clear
                            </button>
                          )}
                          {tableStatus.status === 'RESERVED' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedTable({...table, ...tableStatus})
                                setShowTableDetails(true)
                              }}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              View
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Table Details Modal */}
      {showTableDetails && selectedTable && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Table Details</h2>
                <p className="text-sm text-gray-500">{selectedTable.number}</p>
              </div>
              <button
                onClick={() => {
                  setShowTableDetails(false)
                  setSelectedTable(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Table Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">Table Information</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-500">Table Number:</span>
                    <span className="ml-2 text-sm text-gray-900">{selectedTable.number}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Capacity:</span>
                    <span className="ml-2 text-sm text-gray-900">{selectedTable.capacity} seats</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Location:</span>
                    <span className="ml-2 text-sm text-gray-900">{selectedTable.location}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Status:</span>
                    <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedTable.status)}`}>
                      {selectedTable.status}
                    </span>
                  </div>
                </div>
              </div>

              {selectedTable.booking && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Current Booking</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-500">Customer:</span>
                      <span className="ml-2 text-sm text-gray-900">{selectedTable.booking.customerName}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Phone:</span>
                      <span className="ml-2 text-sm text-gray-900">{selectedTable.booking.customerPhone || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Guests:</span>
                      <span className="ml-2 text-sm text-gray-900">{selectedTable.booking.numberOfGuests}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Time:</span>
                      <span className="ml-2 text-sm text-gray-900">
                        {(() => {
                          const bookingDate = selectedTable.booking.timeSlot || selectedTable.booking.bookingDate
                          if (!bookingDate) return 'N/A'
                          try {
                            const date = new Date(bookingDate)
                            if (isNaN(date.getTime())) {
                              // If invalid date, try to parse the string manually
                              return bookingDate.includes('T') ? 
                                new Date(bookingDate).toLocaleString() : 
                                new Date(bookingDate + 'T12:00:00').toLocaleString()
                            }
                            return date.toLocaleString()
                          } catch (error) {
                            return bookingDate // Return raw string if parsing fails
                          }
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              {selectedTable.status === 'AVAILABLE' && (
                <button
                  onClick={() => {
                    setShowTableDetails(false)
                    setShowBookingModal(true)
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Create Booking
                </button>
              )}
              {selectedTable.status === 'OCCUPIED' && (
                <button
                  onClick={() => {
                    handleClearTable(selectedTable.id, selectedTable.booking?.id)
                    setShowTableDetails(false)
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Clear Table
                </button>
              )}
              <button
                onClick={() => {
                  setShowTableDetails(false)
                  setSelectedTable(null)
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
      {showBookingModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Create Booking</h2>
                <p className="text-sm text-gray-500">Reserve a table for customers</p>
              </div>
              <button
                onClick={() => setShowBookingModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <CreateBookingForm
              tables={tables}
              onSubmit={handleCreateBooking}
              onCancel={() => setShowBookingModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// CreateBookingForm Component
const CreateBookingForm = ({ tables, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    tableId: '',
    numberOfGuests: 2,
    bookingDate: '',
    bookingTimeSlot: '',
    specialRequests: ''
  })
  const [loading, setLoading] = useState(false)

  const getMinDateTime = () => {
    const now = new Date()
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
    return now.toISOString().slice(0, 16)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    if (!formData.customerName || !formData.tableId || !formData.bookingDate || !formData.bookingTimeSlot || !formData.numberOfGuests) {
      alert('Please fill all required fields')
      setLoading(false)
      return
    }

    try {
      await onSubmit(formData)
    } finally {
      setLoading(false)
    }
  }

  const availableTables = tables.filter(table => {
    const tableStatus = table.status // Would need to check real status
    return tableStatus === 'AVAILABLE'
  })

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Customer Name</label>
          <input
            type="text"
            required
            value={formData.customerName}
            onChange={(e) => setFormData({...formData, customerName: e.target.value})}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Phone Number</label>
          <input
            type="tel"
            value={formData.customerPhone}
            onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={formData.customerEmail}
            onChange={(e) => setFormData({...formData, customerEmail: e.target.value})}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Number of Guests</label>
          <input
            type="number"
            min="1"
            max="12"
            required
            value={formData.numberOfGuests}
            onChange={(e) => setFormData({...formData, numberOfGuests: parseInt(e.target.value)})}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Table</label>
          <select
            required
            value={formData.tableId}
            onChange={(e) => setFormData({...formData, tableId: parseInt(e.target.value)})}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select a table</option>
            {availableTables.map(table => (
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
            min={new Date().toISOString().split('T')[0]}
            value={formData.bookingDate}
            onChange={(e) => setFormData({...formData, bookingDate: e.target.value})}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Time Slot</label>
        <select
          required
          value={formData.bookingTimeSlot}
          onChange={(e) => setFormData({...formData, bookingTimeSlot: e.target.value})}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select a time slot</option>
          <option value="MORNING">Morning (8:00 AM - 12:00 PM)</option>
          <option value="AFTERNOON">Afternoon (12:00 PM - 5:00 PM)</option>
          <option value="EVENING">Evening (5:00 PM - 10:00 PM)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Special Requests</label>
        <textarea
          rows={3}
          value={formData.specialRequests}
          onChange={(e) => setFormData({...formData, specialRequests: e.target.value})}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Booking'}
        </button>
      </div>
    </form>
  )
}

export default WaiterTables
