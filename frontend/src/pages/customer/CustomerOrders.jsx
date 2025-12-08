import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { orderService } from '../../services/orderService'
import { bookingService } from '../../services/bookingService'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

const CustomerOrders = () => {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  const [orders, setOrders] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showOrderDetails, setShowOrderDetails] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    console.log('CustomerOrders component mounted')
    console.log('CustomerOrders - User:', user, 'Authenticated:', isAuthenticated)
    // Only fetch if user is authenticated
    if (isAuthenticated && user) {
      console.log('CustomerOrders - Fetching data for user:', user.email)
      fetchOrdersAndBookings()
      const interval = setInterval(fetchOrdersAndBookings, 30000) // Refresh every 30 seconds
      return () => clearInterval(interval)
    } else {
      console.log('CustomerOrders - User not authenticated, skipping data fetch')
      setLoading(false)
    }
  }, [isAuthenticated, user])

  const fetchOrdersAndBookings = async () => {
    try {
      console.log('Fetching customer orders and bookings...')
      setLoading(true)
      
      let ordersData = []
      let bookingsData = []
      
      try {
        // Fetch both orders and bookings
        const [ordersResponse, bookingsResponse] = await Promise.all([
          orderService.getMyOrders(),
          bookingService.getCustomerBookings()
        ])
        
        console.log('Raw orders response:', ordersResponse)
        console.log('Raw bookings response:', bookingsResponse)
        
        // Handle orders data
        if (ordersResponse && ordersResponse.content) {
          ordersData = ordersResponse.content
        } else if (Array.isArray(ordersResponse)) {
          ordersData = ordersResponse
        } else if (ordersResponse && Array.isArray(ordersResponse.data)) {
          ordersData = ordersResponse.data
        } else {
          ordersData = []
        }
        
        // Handle bookings data
        bookingsData = bookingsResponse || []
        
        console.log('Orders fetched:', ordersData.length)
        console.log('Bookings fetched:', bookingsData.length)
        
      } catch (apiError) {
        console.error('API failed, using sample data:', apiError)
        toast.error('Failed to fetch data. Using sample data.')
        
        // Sample data for testing
        ordersData = [
          {
            id: 'customer-order-1',
            userId: 'customer-123',
            items: [
              { productId: 'coffee-1', productName: 'Cappuccino', quantity: 2, price: 4.50 },
              { productId: 'pastry-1', productName: 'Croissant', quantity: 1, price: 3.00 }
            ],
            totalPrice: 12.00,
            status: 'PENDING',
            notes: 'Sample customer order',
            createdAt: new Date().toISOString()
          },
          {
            id: 'customer-order-2',
            userId: 'customer-123',
            items: [
              { productId: 'coffee-2', productName: 'Latte', quantity: 1, price: 5.00 }
            ],
            totalPrice: 5.00,
            status: 'COMPLETED',
            notes: 'Completed order',
            createdAt: new Date(Date.now() - 86400000).toISOString()
          }
        ]
        
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
          }
        ]
      }
      
      setOrders(ordersData)
      setBookings(bookingsData)
      console.log('Customer orders and bookings loaded:', { orders: ordersData.length, bookings: bookingsData.length })
      
    } catch (error) {
      console.error('Failed to fetch customer data:', error)
      toast.error('Failed to load your orders and bookings')
      setOrders([])
      setBookings([])
    } finally {
      setLoading(false)
    }
  };

  const handleCancelOrder = async (orderId) => {
    try {
      await orderService.cancelOrder(orderId)
      toast.success('Order cancelled successfully')
      fetchOrdersAndBookings()
      if (selectedOrder && selectedOrder.id === orderId) {
        setShowOrderDetails(false)
        setSelectedOrder(null)
      }
    } catch (error) {
      console.error('Failed to cancel order:', error)
      toast.error('Failed to cancel order')
    }
  }

  const handleReorder = async (order) => {
    try {
      // Navigate to menu page for reordering
      console.log('Redirecting to menu for reorder of order:', order.id)
      navigate('/menu')
    } catch (error) {
      console.error('Failed to reorder:', error)
    }
  }

  const filteredOrders = (orders || []).filter(order => {
    if (statusFilter === 'all') return true
    if (statusFilter === 'COMPLETED') return ['COMPLETED', 'SERVED'].includes(order.status)
    return order.status === statusFilter
  })

  const getStatusColor = (status) => {
    switch(status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800'
      case 'PREPARING': return 'bg-purple-100 text-purple-800'
      case 'READY': return 'bg-green-100 text-green-800'
      case 'COMPLETED': return 'bg-gray-100 text-gray-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getDeliveryStatusColor = (deliveryStatus) => {
    switch(deliveryStatus) {
      case 'ASSIGNED': return 'bg-blue-100 text-blue-800'
      case 'OUT_FOR_DELIVERY': return 'bg-purple-100 text-purple-800'
      case 'DELIVERED': return 'bg-green-100 text-green-800'
      case 'FAILED': return 'bg-red-100 text-red-800'
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

  const canCancel = (order) => {
    return ['PENDING', 'CONFIRMED'].includes(order.status)
  }

  const canReorder = (order) => {
    return ['COMPLETED', 'CANCELLED'].includes(order.status)
  }

  if (loading) {
    console.log('Loading state:', loading)
    console.log('Current orders:', orders)
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  console.log('Rendering CustomerOrders - orders:', orders)
  console.log('Rendering CustomerOrders - loading:', loading)
  console.log('Rendering CustomerOrders - filteredOrders:', filteredOrders)

  return (
    <div className="space-y-6 page-container">
      {/* Header */}
      <div className="flex justify-between items-center animate-slideInLeft">
        <div>
          <h1 className="text-3xl font-bold text-coffee-dark-roast dark:text-coffee-cream mb-2">My Orders</h1>
          <p className="text-coffee-cinnamon dark:text-coffee-latte">View and manage your order history</p>
        </div>
        <button
          onClick={fetchOrdersAndBookings}
          className="btn-coffee-primary button-animate"
        >
          Refresh
        </button>
      </div>

      {/* Status Filter */}
      <div className="card-coffee p-6 section-animate">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 button-animate ${
              statusFilter === 'all' 
                ? 'bg-gray-800 text-white shadow-lg' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600'
            }`}
          >
            All Orders ({(orders || []).length})
          </button>
          <button
            onClick={() => setStatusFilter('PENDING')}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 button-animate ${
              statusFilter === 'PENDING' 
                ? 'bg-gray-800 text-white shadow-lg' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600'
            }`}
          >
            Pending ({(orders || []).filter(o => o.status === 'PENDING').length})
          </button>
          <button
            onClick={() => setStatusFilter('CONFIRMED')}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 button-animate ${
              statusFilter === 'CONFIRMED' 
                ? 'bg-gray-800 text-white shadow-lg' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600'
            }`}
          >
            Confirmed ({(orders || []).filter(o => o.status === 'CONFIRMED').length})
          </button>
          <button
            onClick={() => setStatusFilter('PREPARING')}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 button-animate ${
              statusFilter === 'PREPARING' 
                ? 'bg-gray-800 text-white shadow-lg' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600'
            }`}
          >
            Preparing ({(orders || []).filter(o => o.status === 'PREPARING').length})
          </button>
          <button
            onClick={() => setStatusFilter('COMPLETED')}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 button-animate ${
              statusFilter === 'COMPLETED' 
                ? 'bg-gray-800 text-white shadow-lg' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600'
            }`}
          >
            Completed ({(orders || []).filter(o => ['COMPLETED', 'SERVED'].includes(o.status)).length})
          </button>
        </div>
      </div>

      {/* Order Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card-coffee p-6 hover:scale-105 transform transition-all duration-300 animate-fadeInUp">
          <div className="flex items-center">
            <div className="p-3 bg-coffee-caramel/20 rounded-full">
              <svg className="h-6 w-6 text-coffee-caramel" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-coffee-cinnamon dark:text-coffee-latte">Pending</p>
              <p className="text-2xl font-bold text-coffee-espresso dark:text-coffee-cream">
                {(orders || []).filter(o => o.status === 'PENDING').length}
              </p>
            </div>
          </div>
        </div>

        <div className="card-coffee p-6 hover:scale-105 transform transition-all duration-300 animate-fadeInUp" style={{animationDelay: '0.1s'}}>
          <div className="flex items-center">
            <div className="p-3 bg-gray-200 rounded-full">
              <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Active</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {(orders || []).filter(o => ['CONFIRMED', 'PREPARING', 'READY'].includes(o.status)).length}
              </p>
            </div>
          </div>
        </div>

        <div className="card-coffee p-6 hover:scale-105 transform transition-all duration-300 animate-fadeInUp" style={{animationDelay: '0.2s'}}>
          <div className="flex items-center">
            <div className="p-3 bg-gray-200 rounded-full">
              <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Completed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {(orders || []).filter(o => ['COMPLETED', 'SERVED'].includes(o.status)).length}
              </p>
            </div>
          </div>
        </div>

        <div className="card-coffee p-6 hover:scale-105 transform transition-all duration-300 animate-fadeInUp" style={{animationDelay: '0.3s'}}>
          <div className="flex items-center">
            <div className="p-3 bg-gray-200 rounded-full">
              <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                ${(orders || []).reduce((total, order) => total + (['COMPLETED', 'SERVED'].includes(order.status) ? (parseFloat(order.totalAmount) || parseFloat(order.totalPrice) || 0) : 0), 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="card-coffee p-8 text-center">
          <div className="flex flex-col items-center">
            <div className="p-4 bg-gray-200 rounded-full mb-4">
              <svg className="h-8 w-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No orders found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {statusFilter === 'all' 
                ? "You haven't placed any orders yet. Start by ordering from our menu!"
                : `No ${statusFilter.toLowerCase()} orders found.`
              }
            </p>
            {statusFilter === 'all' && (
              <button
                onClick={() => navigate('/menu')}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Browse Menu
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="card-coffee overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Order #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Items</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{order.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(order.createdAt || order.orderDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        {order.orderType === 'DINE_IN' ? 'Dine In' : order.orderType === 'TAKEAWAY' ? 'Takeaway' : 'Delivery'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.items?.length || 0} items
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${order.totalAmount || order.totalPrice}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {order.status === 'SERVED' ? 'COMPLETED' : order.status}
                      </span>
                      {order.deliveryStatus && (
                        <div className="mt-1">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getDeliveryStatusColor(order.deliveryStatus)}`}>
                            {order.deliveryStatus.replace('_', ' ')}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedOrder(order)
                            setShowOrderDetails(true)
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </button>
                        {canCancel(order) && (
                          <button
                            onClick={() => handleCancelOrder(order.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Cancel
                          </button>
                        )}
                        {canReorder(order) && (
                          <button
                            onClick={() => handleReorder(order)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Reorder
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
      )}

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Order Details</h2>
                <p className="text-sm text-gray-500">Order #{selectedOrder.id}</p>
              </div>
              <button
                onClick={() => {
                  setShowOrderDetails(false)
                  setSelectedOrder(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Order Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">Order Information</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-500">Order Number:</span>
                    <span className="ml-2 text-sm text-gray-900">#{selectedOrder.id}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Order Type:</span>
                    <span className="ml-2 text-sm text-gray-900">
                      {selectedOrder.orderType === 'DINE_IN' ? 'Dine In' : selectedOrder.orderType === 'TAKEAWAY' ? 'Takeaway' : 'Delivery'}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Status:</span>
                    <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedOrder.status)}`}>
                      {selectedOrder.status === 'SERVED' ? 'COMPLETED' : selectedOrder.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Order Time:</span>
                    <span className="ml-2 text-sm text-gray-900">{new Date(selectedOrder.createdAt).toLocaleString()}</span>
                  </div>
                  {selectedOrder.estimatedTime && (
                    <div>
                      <span className="text-sm text-gray-500">Estimated Time:</span>
                      <span className="ml-2 text-sm text-gray-900">{selectedOrder.estimatedTime}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">Delivery/Dine-in Details</h3>
                <div className="space-y-2">
                  {selectedOrder.orderType === 'DELIVERY' ? (
                    <>
                      <div>
                        <span className="text-sm text-gray-500">Delivery Address:</span>
                        <span className="ml-2 text-sm text-gray-900">{selectedOrder.deliveryAddress}</span>
                      </div>
                      {selectedOrder.deliveryStatus && (
                        <div>
                          <span className="text-sm text-gray-500">Delivery Status:</span>
                          <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getDeliveryStatusColor(selectedOrder.deliveryStatus)}`}>
                            {selectedOrder.deliveryStatus.replace('_', ' ')}
                          </span>
                        </div>
                      )}
                    </>
                  ) : selectedOrder.orderType === 'DINE_IN' ? (
                    <>
                      <div>
                        <span className="text-sm text-gray-500">Table Number:</span>
                        <span className="ml-2 text-sm text-gray-900">{selectedOrder.tableNumber || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Guests:</span>
                        <span className="ml-2 text-sm text-gray-900">{selectedOrder.numberOfGuests || 'N/A'}</span>
                      </div>
                    </>
                  ) : (
                    <div>
                      <span className="text-sm text-gray-500">Pickup Time:</span>
                      <span className="ml-2 text-sm text-gray-900">{selectedOrder.pickupTime || 'ASAP'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Order Items</h3>
              <div className="bg-gray-50 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedOrder.items?.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.quantity}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">${item.price}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">${(item.price * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Order Summary */}
            <div className="mb-6 bg-gray-50 p-4 rounded-lg">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Subtotal:</span>
                  <span className="text-sm font-medium text-gray-900">${selectedOrder.subtotal || selectedOrder.totalAmount}</span>
                </div>
                {selectedOrder.deliveryFee && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Delivery Fee:</span>
                    <span className="text-sm font-medium text-gray-900">${selectedOrder.deliveryFee}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">ousel:</span>
                  <span className="text-sm font-medium text-gray-900">${selectedOrder.tax || 0}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-sm text-gray-900">Total:</span>
                  <span className="text-sm text-gray-900">${selectedOrder.totalAmount}</span>
                </div>
              </div>
            </div>

            {/* Special Instructions */}
            {selectedOrder.specialInstructions && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Special Instructions</h3>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-900">{selectedOrder.specialInstructions}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3">
              {canCancel(selectedOrder) && (
                <button
                  onClick={() => handleCancelOrder(selectedOrder.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Cancel Order
                </button>
              )}
              {canReorder(selectedOrder) && (
                <button
                  onClick={() => handleReorder(selectedOrder)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Reorder
                </button>
              )}
              <button
                onClick={() => {
                  setShowOrderDetails(false)
                  setSelectedOrder(null)
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CustomerOrders;
