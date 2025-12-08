import { useState, useEffect } from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import { bookingService } from '../../services/bookingService'
import { orderService } from '../../services/orderService'
import { authService } from '../../services/authService'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

// Import individual waiter pages
import WaiterOrders from './WaiterOrders'
import WaiterTables from './WaiterTables'
import WaiterDelivery from './WaiterDelivery'

export const WaiterDashboard = () => {
  const [orders, setOrders] = useState([])
  const [bookings, setBookings] = useState([])
  const [cancelledBookings, setCancelledBookings] = useState(() => {
    // Load cancelled bookings from localStorage on component mount
    const saved = localStorage.getItem('cancelledBookings')
    return saved ? JSON.parse(saved) : []
  })
  const [completedBookings, setCompletedBookings] = useState(() => {
    // Load completed bookings from localStorage on component mount
    const saved = localStorage.getItem('completedBookings')
    return saved ? JSON.parse(saved) : []
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('orders')
  const [searchTerm, setSearchTerm] = useState('')
  const navigate = useNavigate()

  // Product name mapping from real backend data
  const productNames = {
    '692f03f93f72b23c91ffd882': 'Americano',
    '692f03f93f72b23c91ffd88a': 'Bagel',
    '692f03f93f72b23c91ffd886': 'Black Tea',
    '692f03f93f72b23c91ffd88d': 'Cake Slice',
    '692f03f93f72b23c91ffd880': 'Cappuccino',
    '692f03f93f72b23c91ffd887': 'Chai Latte',
    '692f03f93f72b23c91ffd884': 'Cold Brew',
    '692f03f93f72b23c91ffd891': 'Cookie',
    '692f03f93f72b23c91ffd889': 'Croissant',
    '692f03f93f72b23c91ffd88f': 'Danish',
    '692f03f93f72b23c91ffd890': 'Donut',
    '692f03f93f72b23c91ffd87f': 'Espresso',
    '692f03f93f72b23c91ffd885': 'Green Tea',
    '692f03f93f72b23c91ffd888': 'Herbal Tea',
    '692f03f93f72b23c91ffd881': 'Latte',
    '692f03f93f72b23c91ffd883': 'Mocha',
    '692f03f93f72b23c91ffd88e': 'Muffin',
    '692f03f93f72b23c91ffd88c': 'Salad',
    '692f03f93f72b23c91ffd88b': 'Sandwich'
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrders() // Fetch fresh orders when switching to orders tab
      // Auto-refresh orders every 30 seconds
      const orderInterval = setInterval(fetchOrders, 30000)
      return () => clearInterval(orderInterval)
    } else if (activeTab === 'bookings') {
      fetchBookings() // Fetch fresh bookings when switching to bookings tab
      // Auto-refresh bookings every 30 seconds
      const bookingInterval = setInterval(fetchBookings, 30000)
      return () => clearInterval(bookingInterval)
    }
  }, [activeTab])

  // Re-apply local status changes when localStorage arrays change
  useEffect(() => {
    if (bookings.length > 0) {
      console.log('Re-applying local status changes due to localStorage update')
      setBookings(prevBookings => 
        prevBookings.map(booking => {
          if (cancelledBookings.includes(booking.id)) {
            return { ...booking, status: 'CANCELLED' }
          }
          if (completedBookings.includes(booking.id)) {
            return { ...booking, status: 'COMPLETED' }
          }
          return booking
        })
      )
    }
  }, [cancelledBookings, completedBookings])

  const fetchData = async () => {
    try {
      console.log('Fetching waiter dashboard data...')
      setLoading(true)
      
      // Check authentication token
      const token = authService.getAdminToken()
      console.log('Token available:', !!token)
      if (!token) {
        console.error('No authentication token found!')
        setLoading(false)
        return
      }
      
      let ordersData = []
      let bookingsData = []
      
      try {
        // Fetch orders using the service
        console.log('Fetching orders...')
        const ordersResponse = await orderService.getAllOrders({ size: 100 })
        ordersData = ordersResponse.content || ordersResponse || []
        console.log('Orders fetched:', ordersData.length)
        
        // Fetch bookings using the service
        console.log('Fetching bookings...')
        const bookingsResponse = await bookingService.getAllBookings({ size: 100, page: 0 })
        bookingsData = bookingsResponse.content || bookingsResponse || []
        console.log('Bookings fetched:', bookingsData.length)
        
        // Process orders to add product names and customer names
        ordersData = ordersData.map(order => {
          // Get product names using mapping
          const itemsWithNames = order.items?.map(item => ({
            ...item,
            productName: productNames[item.productId] || item.productName || `Product ${item.productId?.slice(-8) || 'Unknown'}`
          })) || []
          
          // Get customer information
          let customerName = 'Customer'
          if (order.userId) {
            customerName = `Customer ${order.userId.slice(-8)}`
          }
          
          return {
            ...order,
            items: itemsWithNames,
            customerName: customerName
          }
        })
        
      } catch (error) {
        console.error('API calls failed, using sample data:', error)
        toast.error('Failed to fetch data. Using sample data.')
        
        // Create sample data
        ordersData = [
          {
            id: 'waiter-order-1',
            customerName: 'John Doe',
            status: 'PREPARING',
            tableBookingId: 'T1',
            items: [
              { productId: '692f03f93f72b23c91ffd880', productName: 'Cappuccino', quantity: 2, price: 4.50 },
              { productId: '692f03f93f72b23c91ffd889', productName: 'Croissant', quantity: 1, price: 3.00 }
            ],
            totalPrice: 12.00,
            createdAt: new Date().toISOString()
          }
        ]
        
        bookingsData = [
          {
            id: 'waiter-booking-1',
            customerName: 'Jane Smith',
            customerEmail: 'jane@email.com',
            customerPhone: '+91 98765 43210',
            tableNumber: 'T2',
            peopleCount: 4,
            timeSlot: new Date(Date.now() + 3600000).toISOString(),
            bookingDate: new Date().toISOString().split('T')[0],
            status: 'BOOKED',
            specialRequests: 'Window seat preferred'
          }
        ]
      }
      
      setOrders(ordersData)
      setBookings(bookingsData)
      console.log('Waiter dashboard data set:', { orders: ordersData.length, bookings: bookingsData.length })
      
    } catch (error) {
      console.error('Failed to fetch waiter dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const fetchOrders = async () => {
    try {
      console.log('Fetching waiter orders...')
      
      const token = authService.getAdminToken()
      
      const response = await fetch('http://localhost:8081/api/orders?size=100&page=0', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        let ordersData = data.content || data || []
        
        // Process orders to add product names and customer names
        ordersData = await Promise.all(ordersData.map(async order => {
          // Get product names using mapping
          const itemsWithNames = order.items?.map(item => ({
            ...item,
            productName: productNames[item.productId] || item.productName || `Product ${item.productId?.slice(-8) || 'Unknown'}`
          })) || []
          
          // Get customer information (skip user API call to avoid 403 errors)
          let customerName = 'Customer'
          if (order.userId) {
            customerName = `Customer ${order.userId.slice(-8)}`
          }
          
          return {
            ...order,
            items: itemsWithNames,
            customerName: customerName
          }
        }))
        
        // Filter out table bookings from orders list
        ordersData = ordersData.filter(order => {
          // Exclude orders that are table bookings
          const isTableBooking = 
            (order.tableNumber && (order.bookingType === 'TABLE_BOOKING' || order.items?.length === 0)) ||
            (order.tableNumber && order.specialInstructions?.includes('Booking for')) ||
            (order.specialInstructions && order.specialInstructions.includes('guests at'))
          
          return !isTableBooking
        })
        
        // Sort orders by creation time (most recent first)
        ordersData.sort((a, b) => {
          const dateA = new Date(a.createdAt || a.orderDate || 0)
          const dateB = new Date(b.createdAt || b.orderDate || 0)
          return dateB.getTime() - dateA.getTime()
        })
        
        setOrders(ordersData)
        console.log('Waiter orders fetched:', ordersData.length)
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      console.error('Failed to fetch waiter orders:', error)
      // Fallback to service
      try {
        const response = await orderService.getAllOrders({ size: 100, page: 0 })
        setOrders(response.content || response || [])
      } catch (serviceError) {
        toast.error('Failed to fetch orders')
      }
    }
  }

  const fetchBookings = async () => {
    try {
      console.log('Fetching bookings using bookingService...')
      
      // Use bookingService.getAllBookings() like customer dashboard
      const bookingsData = await bookingService.getAllBookings()
      console.log('Bookings fetched from bookingService:', bookingsData)
      
      // Filter out cancelled and completed bookings
      const filteredBookings = bookingsData.filter(booking => {
        const isCancelled = cancelledBookings.includes(booking.id)
        const isCompleted = completedBookings.includes(booking.id)
        return !isCancelled && !isCompleted
      })
      
      console.log('Bookings after filtering:', filteredBookings.length)
      setBookings(filteredBookings)
      
    } catch (error) {
      console.error('Failed to fetch bookings:', error)
      console.log('Falling back to orders API for booking data...')
      
      // Fallback to orders API if bookingService fails
      try {
        const token = authService.getAdminToken()
        const ordersResponse = await fetch('http://localhost:8081/api/orders', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (ordersResponse.ok) {
          const ordersJson = await ordersResponse.json()
          const ordersData = ordersJson.content || ordersJson || []
          console.log('Orders fetched, extracting booking data:', ordersData.length)
          
          // Extract booking information from dine-in orders
          const bookingsFromOrders = ordersData
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
              numberOfGuests: order.peopleCount || parseInt(order.specialInstructions?.match(/(\d+)\s+guests/i)?.[1]) || 2,
              timeSlot: order.timeSlot || new Date(order.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
              bookingDate: order.orderDate || new Date(order.createdAt).toISOString().split('T')[0],
              status: order.status === 'COMPLETED' ? 'COMPLETED' : 'BOOKED',
              specialRequests: order.specialInstructions || 'Table booking'
            }))
          
          console.log('Bookings extracted from orders:', bookingsFromOrders.length)
          setBookings(bookingsFromOrders)
        }
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError)
        setBookings([])
      }
    }
  }

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      // Use same logic as ChefDashboard - map frontend status to backend status
      const statusMapping = {
        'CONFIRMED': 'CONFIRMED',
        'PREPARING': 'PREPARING', 
        'READY': 'READY_FOR_SERVICE',
        'COMPLETED': 'SERVED'
      }
      
      const backendStatus = statusMapping[newStatus] || newStatus
      
      const token = authService.getAdminToken()
      
      const response = await fetch(`http://localhost:8080/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: backendStatus })
      })
      
      if (response.ok) {
        toast.success(`Order status updated to ${newStatus}`)
        fetchOrders()
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      console.error('Failed to update order status:', error)
      toast.error('Failed to update order status')
    }
  }

  const updateBookingStatus = async (bookingId, action) => {
    try {
      console.log(`Updating booking ${bookingId} with action: ${action}`)
      
      if (action === 'complete') {
        // Update booking status locally to COMPLETED and save to localStorage
        const newCompletedBookings = [...completedBookings, bookingId]
        console.log('Adding to completed bookings:', newCompletedBookings)
        setCompletedBookings(newCompletedBookings)
        localStorage.setItem('completedBookings', JSON.stringify(newCompletedBookings))
        
        setBookings(prevBookings => 
          prevBookings.map(booking => 
            booking.id === bookingId 
              ? { ...booking, status: 'COMPLETED' }
              : booking
          )
        )
        toast.success('Booking marked as completed')
      } else if (action === 'cancel') {
        // Update booking status locally to CANCELLED and save to localStorage
        const newCancelledBookings = [...cancelledBookings, bookingId]
        console.log('Adding to cancelled bookings:', newCancelledBookings)
        setCancelledBookings(newCancelledBookings)
        localStorage.setItem('cancelledBookings', JSON.stringify(newCancelledBookings))
        
        setBookings(prevBookings => 
          prevBookings.map(booking => 
            booking.id === bookingId 
              ? { ...booking, status: 'CANCELLED' }
              : booking
          )
        )
        toast.success('Booking cancelled')
      }
    } catch (error) {
      console.error('Failed to update booking:', error)
      toast.error('Failed to update booking')
    }
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800'
      case 'PREPARING':
        return 'bg-purple-100 text-purple-800'
      case 'READY_FOR_SERVICE':
        return 'bg-green-100 text-green-800'
      case 'SERVED':
        return 'bg-gray-100 text-gray-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'BOOKED':
        return 'bg-blue-100 text-blue-800'
      case 'CANCELLED_BOOKING':
        return 'bg-red-100 text-red-800'
      case 'COMPLETED_BOOKING':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Add search filter logic
  const filteredOrders = orders.filter(order => {
    if (!searchTerm) return true
    
    const searchLower = searchTerm.toLowerCase()
    return (
      (order.customerName && order.customerName.toLowerCase().includes(searchLower)) ||
      order.id.toLowerCase().includes(searchLower) ||
      (order.tableNumber && order.tableNumber.toLowerCase().includes(searchLower)) ||
      order.items?.some(item => 
        item.productName && item.productName.toLowerCase().includes(searchLower)
      )
    )
  })

  const filteredBookings = bookings.filter(booking => {
    if (!searchTerm) return true
    
    const searchLower = searchTerm.toLowerCase()
    return (
      (booking.customerName && booking.customerName.toLowerCase().includes(searchLower)) ||
      booking.id.toLowerCase().includes(searchLower) ||
      (booking.tableNumber && booking.tableNumber.toLowerCase().includes(searchLower))
    )
  })

  // Sort orders by creation time (most recent first)
  filteredOrders.sort((a, b) => {
    const dateA = new Date(a.createdAt || a.orderDate || 0)
    const dateB = new Date(b.createdAt || b.orderDate || 0)
    return dateB.getTime() - dateA.getTime()
  })

  // Sort bookings by creation time (most recent first)
      filteredBookings.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.bookingDate || a.timeSlot || 0)
        const dateB = new Date(b.createdAt || b.bookingDate || b.timeSlot || 0)
        return dateB.getTime() - dateA.getTime()
      })

  const getActiveOrdersCount = () => orders.filter(order => ['CONFIRMED', 'PREPARING', 'READY_FOR_SERVICE'].includes(order.status)).length
  const getReadyOrdersCount = () => orders.filter(order => order.status === 'READY_FOR_SERVICE').length
  const getCompletedOrdersCount = () => orders.filter(order => order.status === 'SERVED').length
  const getCancelledOrdersCount = () => orders.filter(order => order.status === 'CANCELLED').length
  const getTodayBookingsCount = () => bookings.filter(booking => booking.status === 'BOOKED').length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Routes>
        {/* Waiter Routes */}
        <Route path="orders" element={<WaiterOrders />} />
        <Route path="tables" element={<WaiterTables />} />
        <Route path="delivery" element={<WaiterDelivery />} />
        
        {/* Default Dashboard */}
        <Route path="*" element={
          <>
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Waiter Dashboard</h1>
                <p className="text-gray-600">Manage orders and table bookings</p>
              </div>
              <div className="flex items-center space-x-4">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => {
                    if (activeTab === 'orders') {
                      fetchOrders()
                    } else if (activeTab === 'bookings') {
                      fetchBookings()
                    }
                    toast.success('Data refreshed!')
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center space-x-2"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active</p>
                    <p className="text-2xl font-bold text-blue-600">{getActiveOrdersCount()}</p>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-full">
                    <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Ready for Pickup</p>
                    <p className="text-2xl font-bold text-yellow-600">{getReadyOrdersCount()}</p>
                  </div>
                  <div className="p-2 bg-yellow-100 rounded-full">
                    <svg className="h-5 w-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-green-600">{getCompletedOrdersCount()}</p>
                  </div>
                  <div className="p-2 bg-green-100 rounded-full">
                    <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Cancelled</p>
                    <p className="text-2xl font-bold text-red-600">{getCancelledOrdersCount()}</p>
                  </div>
                  <div className="p-2 bg-red-100 rounded-full">
                    <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white rounded-lg shadow">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6" aria-label="Tabs">
                  <button
                    onClick={() => setActiveTab('orders')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'orders'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Orders ({orders.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('bookings')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'bookings'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Bookings ({bookings.length})
                  </button>
                </nav>
              </div>

              {/* Orders Tab */}
              {activeTab === 'orders' && (
                <div className="divide-y divide-gray-200">
                  {filteredOrders.length === 0 ? (
                    <div className="p-6 text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
                      <p className="mt-1 text-sm text-gray-500">{searchTerm ? 'No orders match your search.' : 'No orders assigned to you.'}</p>
                    </div>
                  ) : (
                    filteredOrders.map(order => (
                      <div key={order.id} className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <h3 className="text-lg font-medium text-gray-900">{order.customerName || `Order #${order.id}`}</h3>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                {order.status}
                              </span>
                            </div>
                            <div className="mt-2 flex items-center space-x-6 text-sm text-gray-500">
                              <span>Table: {order.tableNumber || 'N/A'}</span>
                              <span>Items: {order.items?.length || 0}</span>
                              <span>Total: ${order.totalPrice?.toFixed(2) || '0.00'}</span>
                              <span>{new Date(order.createdAt).toLocaleTimeString()}</span>
                            </div>
                            <div className="mt-2">
                              <div className="text-sm text-gray-600">
                                {order.items?.map((item, index) => (
                                  <span key={index}>
                                    {item.quantity}x {item.productName}
                                    {index < order.items.length - 1 && ', '}
                                  </span>
                                ))}
                              </div>
                              {order.notes && (
                                <p className="mt-1 text-sm text-gray-500 italic">Notes: {order.notes}</p>
                              )}
                            </div>
                          </div>
                          <div className="ml-6 flex space-x-2">
                            {order.status === 'READY_FOR_SERVICE' && (
                              <button
                                onClick={() => updateOrderStatus(order.id, 'COMPLETED')}
                                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                              >
                                Deliver
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Bookings Tab */}
              {activeTab === 'bookings' && (
                <div className="divide-y divide-gray-200">
                  {filteredBookings.length === 0 ? (
                    <div className="p-6 text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings found</h3>
                      <p className="mt-1 text-sm text-gray-500">{searchTerm ? 'No bookings match your search.' : 'No bookings for today.'}</p>
                    </div>
                  ) : (
                    filteredBookings.map(booking => (
                      <div key={booking.id} className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <h3 className="text-lg font-medium text-gray-900">Booking #{booking.id}</h3>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                                {booking.status}
                              </span>
                            </div>
                            <div className="mt-2 flex items-center space-x-6 text-sm text-gray-500">
                              <span>Table: {booking.tableNumber}</span>
                              <span>Guests: {booking.peopleCount}</span>
                              <span>Time: {new Date(booking.timeSlot).toLocaleString()}</span>
                            </div>
                          </div>
                          <div className="ml-6 flex space-x-2">
                            {booking.status === 'BOOKED' && (
                              <>
                                <button
                                  onClick={() => updateBookingStatus(booking.id, 'complete')}
                                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                                >
                                  Complete
                                </button>
                                <button
                                  onClick={() => updateBookingStatus(booking.id, 'cancel')}
                                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </>
        } />
      </Routes>
    </div>
  )
}

export default WaiterDashboard
