import { useState, useEffect } from 'react'
import { orderService } from '../../services/orderService'
import { authService } from '../../services/authService'
import toast from 'react-hot-toast'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'

const WaiterOrders = () => {
  const [orders, setOrders] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showOrderDetails, setShowOrderDetails] = useState(false)
  const [statusFilter, setStatusFilter] = useState('active')
  const [showCreateOrder, setShowCreateOrder] = useState(false)

  useEffect(() => {
    fetchOrders()
    fetchBookings()
    const interval = setInterval(fetchOrders, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchBookings = async () => {
    try {
      // Get bookings from orders (dine-in)
      const token = authService.getAdminToken()
      const ordersResponse = await fetch('http://localhost:8080/api/orders', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json()
        const orders = ordersData.content || ordersData || []
        
        // Extract booking data from dine-in orders
        const bookingsData = orders
          .filter(order => order.tableNumber || order.bookingType === 'DINE_IN')
          .map(order => ({
            id: order.id,
            customerName: order.customerName || `Customer ${order.userId?.slice(-8)}`,
            tableNumber: order.tableNumber,
            status: order.status === 'COMPLETED' ? 'COMPLETED' : 'BOOKED',
            bookingDate: order.orderDate || new Date().toISOString().split('T')[0]
          }))
        
        setBookings(bookingsData)
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error)
      setBookings([])
    }
  }

  const fetchOrders = async () => {
    try {
      setLoading(true)
      
      // Use direct API call with admin token like WaiterDashboard
      const token = authService.getAdminToken()
      
      const response = await fetch('http://localhost:8080/api/orders', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        let ordersData = data.content || data || []
        
        // Product name mapping
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
        
        // Process orders to add product names and customer names
        ordersData = await Promise.all(ordersData.map(async order => {
          // Get product names using mapping
          const itemsWithNames = order.items?.map(item => ({
            ...item,
            name: productNames[item.productId] || item.productName || `Product ${item.productId?.slice(-8) || 'Unknown'}`
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
        
        console.log('WaiterOrders fetched and processed:', ordersData.length, ordersData)
        setOrders(ordersData)
      } else {
        console.log('Direct API failed, trying service')
        const data = await orderService.getWaiterOrders()
        setOrders(data.content || data)
      }
    } catch (error) {
      console.error('Failed to fetch waiter orders:', error)
      // Fallback to service
      try {
        const data = await orderService.getWaiterOrders()
        setOrders(data.content || data)
      } catch (serviceError) {
        console.error('Service also failed:', serviceError)
        setOrders([])
      }
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      console.log(`Updating order ${orderId} to status: ${newStatus}`)
      
      // Use admin token for API call
      const token = authService.getAdminToken()
      
      const response = await fetch(`http://localhost:8080/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          status: newStatus,
          waiterId: 'waiter123' // Add waiter ID
        })
      })
      
      if (response.ok) {
        console.log('Order status updated successfully')
        fetchOrders()
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({...selectedOrder, status: newStatus})
        }
      } else {
        console.error('Failed to update order status:', response.status)
      }
    } catch (error) {
      console.error('Failed to update order status:', error)
    }
  }

  const handleCompleteOrder = async (orderId) => {
    try {
      console.log(`Completing order ${orderId}`)
      
      // Use admin token for API call
      const token = authService.getAdminToken()
      
      const response = await fetch(`http://localhost:8080/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          status: 'SERVED',
          waiterId: 'waiter123' // Add waiter ID
        })
      })
      
      if (response.ok) {
        console.log('Order completed successfully')
        fetchOrders()
        setShowOrderDetails(false)
        setSelectedOrder(null)
      } else {
        console.error('Failed to complete order:', response.status)
      }
    } catch (error) {
      console.error('Failed to complete order:', error)
    }
  }

  const handleCreateOrder = async (orderData) => {
    try {
      // Use admin token and proper order format
      const token = authService.getAdminToken()
      
      // Create proper order structure for backend
      const backendOrderData = {
        customerName: orderData.customerName,
        customerPhone: orderData.customerPhone || null,
        customerEmail: orderData.customerEmail || null,
        orderType: orderData.orderType,
        tableNumber: orderData.tableNumber || null,
        specialInstructions: orderData.specialInstructions || null,
        items: orderData.items || [],
        totalAmount: orderData.totalAmount || 0.0,
        totalPrice: orderData.totalAmount || 0.0,
        userId: "6931bb3ad41b96691ca6ad27",
        status: 'PENDING'
      }
      
      console.log('Creating order with data:', backendOrderData)
      
      const response = await fetch('http://localhost:8080/api/orders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(backendOrderData)
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('Order created successfully:', result)
        fetchOrders()
        setShowCreateOrder(false)
        toast.success('Order created successfully!')
      } else {
        const errorData = await response.json()
        console.error('Order creation failed:', errorData)
        toast.error(`Failed to create order: ${errorData.message}`)
      }
    } catch (error) {
      console.error('Failed to create order:', error)
      toast.error('Failed to create order. Please try again.')
    }
  }

  const filteredOrders = orders.filter(order => {
    if (statusFilter === 'all') return true
    if (statusFilter === 'active') return ['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_SERVICE'].includes(order.status)
    if (statusFilter === 'completed') return order.status === 'SERVED'
    if (statusFilter === 'cancelled') return order.status === 'CANCELLED'
    return order.status === statusFilter
  })

  const getStatusColor = (status) => {
    switch(status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800'
      case 'PREPARING': return 'bg-purple-100 text-purple-800'
      case 'READY_FOR_SERVICE': return 'bg-green-100 text-green-800'
      case 'SERVED': return 'bg-gray-100 text-gray-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getOrderTypeColor = (type) => {
    switch(type) {
      case 'DINE_IN': return 'bg-blue-100 text-blue-800'
      case 'TAKEAWAY': return 'bg-green-100 text-green-800'
      case 'DELIVERY': return 'bg-purple-100 text-purple-800'
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
          <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
          <p className="text-gray-600">Manage customer orders and table service</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowCreateOrder(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Create Order
          </button>
          <button
            onClick={fetchOrders}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Status Filter */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex space-x-4">
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              statusFilter === 'active' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Active ({orders.filter(o => ['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_SERVICE'].includes(o.status)).length})
          </button>
          <button
            onClick={() => setStatusFilter('READY_FOR_SERVICE')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              statusFilter === 'READY_FOR_SERVICE' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Ready for Pickup ({orders.filter(o => o.status === 'READY_FOR_SERVICE').length})
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              statusFilter === 'completed' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Completed ({orders.filter(o => o.status === 'SERVED').length})
          </button>
          <button
            onClick={() => setStatusFilter('cancelled')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              statusFilter === 'cancelled' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Cancelled ({orders.filter(o => o.status === 'CANCELLED').length})
          </button>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOrders.map((order) => (
          <div key={order.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4">
              {/* Order Header */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{order.customerName || `Order #${order.id}`}</h3>
                  <p className="text-sm text-gray-500">{getTimeAgo(order.createdAt)}</p>
                </div>
                <div className="flex flex-col items-end space-y-1">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getOrderTypeColor(order.orderType)}`}>
                    {order.orderType?.replace('_', ' ') || 'Dine-in'}
                  </span>
                </div>
              </div>

              {/* Customer & Table Info */}
              <div className="mb-3">
                <p className="text-sm font-medium text-gray-700">{order.customerName}</p>
                {order.tableNumber && (
                  <p className="text-sm text-gray-500">Table {order.tableNumber}</p>
                )}
                {order.customerPhone && (
                  <p className="text-sm text-gray-500">{order.customerPhone}</p>
                )}
              </div>

              {/* Order Items */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Items:</h4>
                <div className="space-y-1">
                  {order.items?.slice(0, 3).map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-600">{item.quantity}x {item.name}</span>
                      <span className="text-gray-900">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  {order.items?.length > 3 && (
                    <p className="text-sm text-gray-500">+{order.items.length - 3} more items</p>
                  )}
                </div>
              </div>

              {/* Total */}
              <div className="mb-4 flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Total:</span>
                <span className="text-lg font-bold text-gray-900">${order.totalAmount}</span>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                {order.status === 'READY_FOR_SERVICE' && (
                  <button
                    onClick={() => handleCompleteOrder(order.id)}
                    className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Mark as Served
                  </button>
                )}
                <button
                  onClick={() => {
                    setSelectedOrder(order)
                    setShowOrderDetails(true)
                  }}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

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

            {/* Order Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">Order Information</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-500">Status:</span>
                    <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedOrder.status)}`}>
                      {selectedOrder.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Order Type:</span>
                    <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getOrderTypeColor(selectedOrder.orderType)}`}>
                      {selectedOrder.orderType?.replace('_', ' ') || 'Dine-in'}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Table:</span>
                    <span className="ml-2 text-sm text-gray-900">{selectedOrder.tableNumber || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Order Time:</span>
                    <span className="ml-2 text-sm text-gray-900">{new Date(selectedOrder.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">Customer Information</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-500">Name:</span>
                    <span className="ml-2 text-sm text-gray-900">{selectedOrder.customerName}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Phone:</span>
                    <span className="ml-2 text-sm text-gray-900">{selectedOrder.customerPhone || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Email:</span>
                    <span className="ml-2 text-sm text-gray-900">{selectedOrder.customerEmail || 'N/A'}</span>
                  </div>
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
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <div>
                            <div>{item.name}</div>
                            {item.specialInstructions && (
                              <div className="text-xs text-gray-500">Note: {item.specialInstructions}</div>
                            )}
                          </div>
                        </td>
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
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Tax:</span>
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
              {selectedOrder.status === 'READY_FOR_SERVICE' && (
                <button
                  onClick={() => handleCompleteOrder(selectedOrder.id)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Mark as Served
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

      {/* Create Order Modal */}
      {showCreateOrder && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Create New Order</h2>
                <p className="text-sm text-gray-500">Add a new customer order</p>
              </div>
              <button
                onClick={() => setShowCreateOrder(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <CreateOrderForm
              onSubmit={handleCreateOrder}
              onCancel={() => setShowCreateOrder(false)}
              existingBookings={bookings}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// CreateOrderForm Component
const CreateOrderForm = ({ onSubmit, onCancel, existingBookings = [] }) => {
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    orderType: 'DINE_IN',
    tableNumber: '',
    items: [],
    specialInstructions: ''
  })

  // State for real menu items and tables
  const [menuItems, setMenuItems] = useState([])
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch real products and tables from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch products from backend
        const response = await fetch('http://localhost:8080/api/products', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          const productsData = data.content || data || []
          
          // Transform products to menu items format
          const menuItemsData = productsData.map(product => ({
            id: product.id,
            name: product.name,
            price: product.price,
            category: product.category,
            inStock: product.inStock !== false
          }))
          
          setMenuItems(menuItemsData)
          console.log('Loaded menu items from backend:', menuItemsData.length)
        } else {
          // Fallback to sample menu items if API fails
          setMenuItems([
            { id: '692f03f93f72b23c91ffd882', name: 'Americano', price: 3.50, category: 'Coffee', inStock: true },
            { id: '692f03f93f72b23c91ffd880', name: 'Cappuccino', price: 4.00, category: 'Coffee', inStock: true },
            { id: '692f03f93f72b23c91ffd881', name: 'Latte', price: 4.50, category: 'Coffee', inStock: true },
            { id: '692f03f93f72b23c91ffd886', name: 'Black Tea', price: 2.50, category: 'Tea', inStock: true },
            { id: '692f03f93f72b23c91ffd88d', name: 'Cake Slice', price: 5.00, category: 'Dessert', inStock: true },
            { id: '692f03f93f72b23c91ffd88b', name: 'Sandwich', price: 6.00, category: 'Food', inStock: true },
            { id: '692f03f93f72b23c91ffd88a', name: 'Bagel', price: 3.00, category: 'Food', inStock: true },
            { id: '692f03f93f72b23c91ffd889', name: 'Croissant', price: 3.50, category: 'Food', inStock: true }
          ])
        }
        
        // Generate table numbers and filter out booked tables (same as booking system)
        const allTables = [
          { id: 1, number: 'T1', capacity: 4, status: 'AVAILABLE', location: 'Main Hall' },
          { id: 2, number: 'T2', capacity: 4, status: 'AVAILABLE', location: 'Main Hall' },
          { id: 3, number: 'T3', capacity: 2, status: 'AVAILABLE', location: 'Main Hall' },
          { id: 4, number: 'T4', capacity: 6, status: 'AVAILABLE', location: 'Main Hall' },
          { id: 5, number: 'T5', capacity: 4, status: 'AVAILABLE', location: 'Outdoor' },
          { id: 6, number: 'T6', capacity: 2, status: 'AVAILABLE', location: 'Outdoor' },
          { id: 7, number: 'T7', capacity: 8, status: 'AVAILABLE', location: 'Private Room' },
          { id: 8, number: 'T8', capacity: 4, status: 'AVAILABLE', location: 'Private Room' }
        ]
        
        // Filter out tables that are already booked
        const bookedTables = existingBookings
          .filter(booking => booking.status === 'BOOKED' && booking.tableNumber)
          .map(booking => booking.tableNumber)
        
        const availableTables = allTables.filter(table => !bookedTables.includes(table.number))
        setTables(availableTables.map(table => table.number))
        
      } catch (error) {
        console.error('Failed to fetch menu items:', error)
        // Fallback menu items
        setMenuItems([
          { id: '692f03f93f72b23c91ffd882', name: 'Americano', price: 3.50, category: 'Coffee', inStock: true },
          { id: '692f03f93f72b23c91ffd880', name: 'Cappuccino', price: 4.00, category: 'Coffee', inStock: true },
          { id: '692f03f93f72b23c91ffd881', name: 'Latte', price: 4.50, category: 'Coffee', inStock: true },
          { id: '692f03f93f72b23c91ffd886', name: 'Black Tea', price: 2.50, category: 'Tea', inStock: true },
          { id: '692f03f93f72b23c91ffd88d', name: 'Cake Slice', price: 5.00, category: 'Dessert', inStock: true },
          { id: '692f03f93f72b23c91ffd88b', name: 'Sandwich', price: 6.00, category: 'Food', inStock: true },
          { id: '692f03f93f72b23c91ffd88a', name: 'Bagel', price: 3.00, category: 'Food', inStock: true },
          { id: '692f03f93f72b23c91ffd889', name: 'Croissant', price: 3.50, category: 'Food', inStock: true }
        ])
        
        // Generate table numbers (same as booking system)
        const allTables = [
          { id: 1, number: 'T1', capacity: 4, status: 'AVAILABLE', location: 'Main Hall' },
          { id: 2, number: 'T2', capacity: 4, status: 'AVAILABLE', location: 'Main Hall' },
          { id: 3, number: 'T3', capacity: 2, status: 'AVAILABLE', location: 'Main Hall' },
          { id: 4, number: 'T4', capacity: 6, status: 'AVAILABLE', location: 'Main Hall' },
          { id: 5, number: 'T5', capacity: 4, status: 'AVAILABLE', location: 'Outdoor' },
          { id: 6, number: 'T6', capacity: 2, status: 'AVAILABLE', location: 'Outdoor' },
          { id: 7, number: 'T7', capacity: 8, status: 'AVAILABLE', location: 'Private Room' },
          { id: 8, number: 'T8', capacity: 4, status: 'AVAILABLE', location: 'Private Room' }
        ]
        setTables(allTables.map(table => table.number))
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [existingBookings])

  const addItem = (menuItem) => {
    const existingItem = formData.items.find(item => item.id === menuItem.id)
    if (existingItem) {
      setFormData({
        ...formData,
        items: formData.items.map(item =>
          item.id === menuItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      })
    } else {
      setFormData({
        ...formData,
        items: [...formData.items, { ...menuItem, quantity: 1 }]
      })
    }
  }

  const removeItem = (itemId) => {
    setFormData({
      ...formData,
      items: formData.items.filter(item => item.id !== itemId)
    })
  }

  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeItem(itemId)
    } else {
      setFormData({
        ...formData,
        items: formData.items.map(item =>
          item.id === itemId
            ? { ...item, quantity }
            : item
        )
      })
    }
  }

  const getTotalAmount = () => {
    return formData.items.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Add total amount to form data
    const orderData = {
      ...formData,
      totalAmount: getTotalAmount(),
      items: formData.items.map(item => ({
        productId: item.id,
        productName: item.name,
        quantity: item.quantity,
        price: item.price
      }))
    }
    
    onSubmit(orderData)
  }

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
          <label className="block text-sm font-medium text-gray-700">Order Type</label>
          <select
            value={formData.orderType}
            onChange={(e) => setFormData({...formData, orderType: e.target.value})}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="DINE_IN">Dine-in</option>
            <option value="TAKEAWAY">Takeaway</option>
            <option value="DELIVERY">Delivery</option>
          </select>
        </div>
      </div>

      {formData.orderType === 'DINE_IN' && (
        <div>
          <label className="block text-sm font-medium text-gray-700">Table Number</label>
          <select
            value={formData.tableNumber}
            onChange={(e) => setFormData({...formData, tableNumber: e.target.value})}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select a table</option>
            {tables.length > 0 ? (
              tables.map(table => (
                <option key={table} value={table}>{table} - Available</option>
              ))
            ) : (
              <option value="" disabled>All tables are currently booked</option>
            )}
          </select>
          {tables.length === 0 && (
            <p className="mt-1 text-sm text-red-600">All tables are currently booked. Please complete or cancel existing bookings first.</p>
          )}
        </div>
      )}

      {/* Order Items Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Order Items</label>
        
        {loading ? (
          <div className="text-center py-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Loading menu items...</p>
          </div>
        ) : (
          <>
            {/* Menu Items Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
              {menuItems.map((menuItem) => (
                <div key={menuItem.id} className={`border rounded-lg p-2 ${menuItem.inStock ? 'border-gray-200' : 'border-gray-100 opacity-50'}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">{menuItem.name}</span>
                    <span className="text-sm text-gray-500">${menuItem.price.toFixed(2)}</span>
                  </div>
                  <div className="text-xs text-gray-400 mb-1">{menuItem.category}</div>
                  <button
                    type="button"
                    onClick={() => addItem(menuItem)}
                    disabled={!menuItem.inStock}
                    className={`w-full px-2 py-1 text-sm rounded transition-colors ${
                      menuItem.inStock 
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {menuItem.inStock ? 'Add' : 'Out of Stock'}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Current Order Items */}
        {formData.items.length > 0 && (
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Current Order</h4>
            <div className="space-y-2">
              {formData.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center">
                  <div className="flex-1">
                    <span className="text-sm font-medium">{item.name}</span>
                    <span className="text-sm text-gray-500 ml-2">${item.price.toFixed(2)} each</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300"
                    >
                      -
                    </button>
                    <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="w-6 h-6 rounded-full bg-red-100 text-red-600 hover:bg-red-200"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Total Amount */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Total Amount:</span>
                <span className="text-lg font-bold text-gray-900">${getTotalAmount().toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
        
        {formData.items.length === 0 && (
          <div className="text-center py-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">No items added yet. Please add items from the menu above.</p>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Special Instructions</label>
        <textarea
          rows={3}
          value={formData.specialInstructions}
          onChange={(e) => setFormData({...formData, specialInstructions: e.target.value})}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder="Any special requests or notes..."
        />
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={formData.items.length === 0}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Create Order (${getTotalAmount().toFixed(2)})
        </button>
      </div>
    </form>
  )
}

export default WaiterOrders
