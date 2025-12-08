import { useState, useEffect } from 'react'
import { orderService } from '../../services/orderService'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

const AdminOrders = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showOrderDetails, setShowOrderDetails] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      console.log('Fetching admin orders...')
      
      let ordersData = []
      try {
        const data = await orderService.getAllOrders({ size: 100 })
        ordersData = data.content || data || []
        console.log('Orders fetched:', ordersData.length)
      } catch (apiError) {
        console.error('API failed, using sample data:', apiError)
        toast.error('Failed to fetch orders. Using sample data.')
        
        // Sample data for testing
        ordersData = [
          {
            id: 'admin-order-1',
            userId: 'user-123',
            customerName: 'John Doe',
            items: [
              { productId: 'coffee-1', productName: 'Cappuccino', quantity: 2, price: 4.50 },
              { productId: 'pastry-1', productName: 'Croissant', quantity: 1, price: 3.00 }
            ],
            totalPrice: 12.00,
            status: 'PENDING',
            createdAt: new Date().toISOString()
          },
          {
            id: 'admin-order-2',
            userId: 'user-456',
            customerName: 'Jane Smith',
            items: [
              { productId: 'coffee-2', productName: 'Latte', quantity: 1, price: 5.00 }
            ],
            totalPrice: 5.00,
            status: 'CONFIRMED',
            createdAt: new Date(Date.now() - 3600000).toISOString()
          }
        ]
      }
      
      setOrders(ordersData)
      console.log('Admin orders loaded:', ordersData.length)
      
    } catch (error) {
      console.error('Failed to fetch orders:', error)
      toast.error('Failed to load orders')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await orderService.updateOrderStatus(orderId, newStatus)
      toast.success(`Order status updated to ${newStatus}!`)
      fetchOrders()
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus })
      }
    } catch (error) {
      console.error('Failed to update order status:', error)
      toast.error('Failed to update order status: ' + (error.response?.data?.message || error.message))
    }
  }

  const handleCancelOrder = async (orderId) => {
    try {
      await orderService.cancelOrder(orderId)
      toast.success('Order cancelled successfully!')
      fetchOrders()
      setShowOrderDetails(false)
      setSelectedOrder(null)
    } catch (error) {
      console.error('Failed to cancel order:', error)
      toast.error('Failed to cancel order: ' + (error.response?.data?.message || error.message))
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter

    let matchesDate = true
    if (dateFilter !== 'all') {
      const orderDate = new Date(order.createdAt)
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const lastWeek = new Date(today)
      lastWeek.setDate(lastWeek.getDate() - 7)

      switch (dateFilter) {
        case 'today':
          matchesDate = orderDate.toDateString() === today.toDateString()
          break
        case 'yesterday':
          matchesDate = orderDate.toDateString() === yesterday.toDateString()
          break
        case 'week':
          matchesDate = orderDate >= lastWeek
          break
        case 'month':
          matchesDate = orderDate.getMonth() === today.getMonth() && orderDate.getFullYear() === today.getFullYear()
          break
        default:
          matchesDate = true
      }
    }

    return matchesSearch && matchesStatus && matchesDate
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentOrders = filteredOrders.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)

  const paginate = (pageNumber) => setCurrentPage(pageNumber)

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800'
      case 'PREPARING': return 'bg-purple-100 text-purple-800'
      case 'READY_FOR_SERVICE': return 'bg-green-100 text-green-800'
      case 'SERVED': return 'bg-green-100 text-green-800'
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
          <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
          <p className="text-gray-600">View and manage all customer orders</p>
        </div>

      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <input
              type="text"
              placeholder="Search orders..."
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
              <option value="PREPARING">Preparing</option>
              <option value="READY">Ready</option>
              <option value="DELIVERED">Delivered</option>
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
              <option value="yesterday">Yesterday</option>
              <option value="week">Last Week</option>
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

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentOrders.map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{order.id?.slice(-8)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">Customer #{order.userId?.slice(-8)}</div>
                      <div className="text-sm text-gray-500">ID: {order.id?.slice(-8)}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.items?.length || 0} items
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${order.totalPrice || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(order.createdAt).toLocaleDateString()}
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
                      {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && order.status !== 'COMPLETED' && (
                        <button
                          onClick={() => handleCancelOrder(order.id)}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-4 space-x-2">
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

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-screen overflow-y-auto">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">Customer Information</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-500">Name:</span>
                    <span className="ml-2 text-sm text-gray-900">{selectedOrder.customerName}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Email:</span>
                    <span className="ml-2 text-sm text-gray-900">{selectedOrder.customerEmail}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Phone:</span>
                    <span className="ml-2 text-sm text-gray-900">{selectedOrder.customerPhone || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Order Info */}
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
                    <span className="text-sm text-gray-500">Date:</span>
                    <span className="ml-2 text-sm text-gray-900">{new Date(selectedOrder.createdAt).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Type:</span>
                    <span className="ml-2 text-sm text-gray-900">{selectedOrder.orderType || 'Dine-in'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="mt-6">
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
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">${item.price * item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Order Summary */}
            <div className="mt-6 bg-gray-50 p-4 rounded-lg">
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

            {/* Status Actions */}
            {selectedOrder.status !== 'DELIVERED' && selectedOrder.status !== 'CANCELLED' && selectedOrder.status !== 'COMPLETED' && (
              <div className="mt-6">
                <h3 className="font-semibold text-gray-900 mb-3">Update Status</h3>
                <div className="flex space-x-3">
                  {selectedOrder.status === 'PENDING' && (
                    <button
                      onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'CONFIRMED')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Confirm Order
                    </button>
                  )}
                  {selectedOrder.status === 'CONFIRMED' && (
                    <button
                      onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'PREPARING')}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Start Preparing
                    </button>
                  )}
                  {selectedOrder.status === 'PREPARING' && (
                    <button
                      onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'READY_FOR_SERVICE')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Mark as Ready
                    </button>
                  )}
                  {selectedOrder.status === 'READY_FOR_SERVICE' && (
                    <button
                      onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'SERVED')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Mark as Served
                    </button>
                  )}
                  {selectedOrder.status === 'SERVED' && (
                    <button
                      onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'COMPLETED')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Mark as Completed
                    </button>
                  )}
                  <button
                    onClick={() => handleCancelOrder(selectedOrder.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Cancel Order
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminOrders
