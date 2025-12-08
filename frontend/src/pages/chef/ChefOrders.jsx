import { useState, useEffect } from 'react'
import { orderService } from '../../services/orderService'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

const ChefOrders = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showOrderDetails, setShowOrderDetails] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchOrders()
    const interval = setInterval(fetchOrders, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      console.log('Fetching chef orders...')
      
      let ordersData = []
      try {
        const response = await orderService.getAllOrders({ size: 100 })
        ordersData = response.content || response || []
        console.log('Orders loaded:', ordersData.length)
      } catch (error) {
        console.error('API failed, using sample data:', error)
        toast.error('Failed to fetch orders. Using sample data.')
        
        // Sample data for testing
        ordersData = [
          {
            id: 'chef-order-1',
            customerName: 'John Doe',
            status: 'PENDING',
            tableBookingId: 'T1',
            items: [
              { productId: 'coffee-1', productName: 'Cappuccino', quantity: 2, price: 4.50 },
              { productId: 'pastry-1', productName: 'Croissant', quantity: 1, price: 3.00 }
            ],
            totalPrice: 12.00,
            createdAt: new Date().toISOString()
          },
          {
            id: 'chef-order-2',
            customerName: 'Jane Smith',
            status: 'CONFIRMED',
            tableBookingId: 'T2',
            items: [
              { productId: 'coffee-2', productName: 'Latte', quantity: 1, price: 5.00 }
            ],
            totalPrice: 5.00,
            createdAt: new Date(Date.now() - 3600000).toISOString()
          },
          {
            id: 'chef-order-3',
            customerName: 'Bob Johnson',
            status: 'PREPARING',
            tableBookingId: 'T3',
            items: [
              { productId: 'coffee-3', productName: 'Espresso', quantity: 3, price: 3.00 }
            ],
            totalPrice: 9.00,
            createdAt: new Date(Date.now() - 7200000).toISOString()
          }
        ]
      }

      // Sort by creation date desc
      ordersData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      
      setOrders(ordersData)
      console.log('Chef orders loaded:', ordersData.length)
      
    } catch (error) {
      console.error('Failed to fetch chef orders:', error)
      toast.error('Failed to load orders')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      // Use correct backend status names
      // Status mapping not strictly needed if we pass valid ENUM strings
      await orderService.updateOrderStatus(orderId, newStatus)

      toast.success(`Order status updated to ${newStatus}`)
      fetchOrders()

      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus })
      }

      // If completed/served, maybe close the modal
      if (newStatus === 'READY_FOR_SERVICE') {
        setShowOrderDetails(false)
        setSelectedOrder(null)
      }
    } catch (error) {
      console.error('Failed to update order status:', error)
      toast.error(`Failed to update status: ${error.message}`)
    }
  }

  const handleConfirmOrder = async (orderId) => {
    await handleUpdateOrderStatus(orderId, 'CONFIRMED')
  }

  const handleStartPreparation = async (orderId) => {
    await handleUpdateOrderStatus(orderId, 'PREPARING')
  }

  const handleCompletePreparation = async (orderId) => {
    await handleUpdateOrderStatus(orderId, 'READY_FOR_SERVICE')
  }

  const filteredOrders = orders.filter(order => {
    if (statusFilter === 'all') return true
    return order.status === statusFilter
  })

  // Helper for colors
  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800'
      case 'PREPARING': return 'bg-purple-100 text-purple-800'
      case 'READY_FOR_SERVICE': return 'bg-green-100 text-green-800'
      case 'SERVED': return 'bg-gray-100 text-gray-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
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

  if (loading && orders.length === 0) {
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
          <h1 className="text-2xl font-bold text-gray-900">Kitchen Orders</h1>
          <p className="text-gray-600">Manage and prepare customer orders</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
          <button
            onClick={fetchOrders}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Status Filter */}
      <div className="bg-white p-4 rounded-lg shadow overflow-x-auto">
        <div className="flex space-x-4 min-w-max">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${statusFilter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            All ({orders.length})
          </button>
          <button
            onClick={() => setStatusFilter('CONFIRMED')}
            className={`px-4 py-2 rounded-lg transition-colors ${statusFilter === 'CONFIRMED'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            To Start ({orders.filter(o => o.status === 'CONFIRMED').length})
          </button>
          <button
            onClick={() => setStatusFilter('PREPARING')}
            className={`px-4 py-2 rounded-lg transition-colors ${statusFilter === 'PREPARING'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            Preparing ({orders.filter(o => o.status === 'PREPARING').length})
          </button>
          <button
            onClick={() => setStatusFilter('READY_FOR_SERVICE')}
            className={`px-4 py-2 rounded-lg transition-colors ${statusFilter === 'READY_FOR_SERVICE'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            Ready ({orders.filter(o => o.status === 'READY_FOR_SERVICE').length})
          </button>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOrders.map((order) => (
          <div key={order.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="p-4">
              {/* Order Header */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{order.customerName || 'Customer'}</h3>
                  <p className="text-sm text-gray-500">{getTimeAgo(order.createdAt)}</p>
                </div>
                <div className="flex flex-col items-end space-y-1">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
              </div>

              {/* Order Items */}
              <div className="mb-4 bg-gray-50 p-3 rounded-lg">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Order Items</h4>
                <div className="space-y-2">
                  {order.items?.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-900 font-medium">
                        {item.quantity}x {item.productName || item.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Special Instructions */}
              {order.notes && (
                <div className="mb-4 p-2 bg-yellow-50 rounded border border-yellow-100">
                  <p className="text-xs text-yellow-800">
                    <strong>Note:</strong> {order.notes}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-2 mt-4 pt-4 border-t border-gray-100">
                {order.status === 'PENDING' && (
                  <button
                    onClick={() => handleConfirmOrder(order.id)}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    Confirm
                  </button>
                )}
                {order.status === 'CONFIRMED' && (
                  <button
                    onClick={() => handleStartPreparation(order.id)}
                    className="flex-1 px-3 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
                  >
                    Start Cooking
                  </button>
                )}
                {order.status === 'PREPARING' && (
                  <button
                    onClick={() => handleCompletePreparation(order.id)}
                    className="flex-1 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                  >
                    Mark Ready
                  </button>
                )}
                <button
                  onClick={() => {
                    setSelectedOrder(order)
                    setShowOrderDetails(true)
                  }}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors shadow-sm ${order.status === 'CONFIRMED' || order.status === 'PREPARING'
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'flex-1 bg-gray-600 text-white hover:bg-gray-700'
                    }`}
                >
                  Details
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredOrders.length === 0 && (
          <div className="col-span-full text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
            <p className="mt-1 text-sm text-gray-500">No orders match the current filter.</p>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Order #{selectedOrder.id.slice(-6)}</h2>
                <p className="text-sm text-gray-500">Placed {getTimeAgo(selectedOrder.createdAt)}</p>
              </div>
              <button
                onClick={() => {
                  setShowOrderDetails(false)
                  setSelectedOrder(null)
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Order Status</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Current Status</span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedOrder.status)}`}>
                        {selectedOrder.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Table</span>
                      <span className="font-medium">{selectedOrder.tableBookingId || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Customer</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name</span>
                      <span className="font-medium">{selectedOrder.customerName || 'Guest'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Order Items</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedOrder.items?.map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.productName || item.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                            {item.quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                            ${(item.price * item.quantity).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan="2" className="px-6 py-4 text-sm font-bold text-gray-900 text-right">Total:</td>
                        <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">
                          ${selectedOrder.totalPrice?.toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowOrderDetails(false)
                  setSelectedOrder(null)
                }}
                className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              {selectedOrder.status === 'CONFIRMED' && (
                <button
                  onClick={() => handleStartPreparation(selectedOrder.id)}
                  className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
                >
                  Start Cooking
                </button>
              )}
              {selectedOrder.status === 'PREPARING' && (
                <button
                  onClick={() => handleCompletePreparation(selectedOrder.id)}
                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                >
                  Mark Ready
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChefOrders
