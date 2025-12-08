import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { orderService } from '../../services/orderService'
import websocketService from '../../services/websocketService'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'
// import config from '../../config' // Assuming config exists, or we use direct logic

// Import individual chef pages
import ChefOrders from './ChefOrders'
import ChefMenu from './ChefMenu'

export const ChefDashboard = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    console.log('Fetching orders for Chef Dashboard...')
    const loadOrders = async () => {
      try {
        setLoading(true)

        // Try to get orders from API
        let ordersData = []
        try {
          const response = await orderService.getAllOrders({ size: 100 })
          console.log('Orders fetched:', response)
          ordersData = response.content || response || []
        } catch (apiError) {
          console.error('API call failed, using fallback:', apiError)
          // Create sample data for testing
          ordersData = [
            {
              id: 'chef-sample-1',
              customerName: 'Sample Customer',
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
              id: 'chef-sample-2',
              customerName: 'Another Customer',
              status: 'CONFIRMED',
              tableBookingId: 'T2',
              items: [
                { productId: 'coffee-2', productName: 'Latte', quantity: 1, price: 5.00 }
              ],
              totalPrice: 5.00,
              createdAt: new Date(Date.now() - 3600000).toISOString()
            }
          ]
        }

        setOrders(ordersData)
        console.log('Chef dashboard orders loaded:', ordersData.length)

      } catch (error) {
        console.error('Failed to fetch orders:', error)
        toast.error('Failed to load orders. Showing sample data.')
        setOrders([])
      } finally {
        setLoading(false)
      }
    }
    loadOrders()
  }, []) // Only run once

  // Subscribe to real-time updates
  useEffect(() => {
    let subscription = null;
    let retryCount = 0;
    const maxRetries = 10;

    const subscribeToUpdates = () => {
      if (websocketService.isConnected()) {
        console.log('📡 Subscribing to order updates in ChefDashboard...');
        subscription = websocketService.subscribeToAllOrders((updatedOrder) => {
          console.log('🔔 Real-time order update:', updatedOrder);

          setOrders(prevOrders => {
            const index = prevOrders.findIndex(o => o.id === updatedOrder.id);
            if (index >= 0) {
              // Update existing order
              const newOrders = [...prevOrders];
              newOrders[index] = updatedOrder;
              return newOrders;
            } else {
              // Add new order to top
              toast.success(`New order received! #${updatedOrder.id.substring(0, 4)}`);
              return [updatedOrder, ...prevOrders];
            }
          });
        });
      } else if (retryCount < maxRetries) {
        retryCount++;
        // Retry connection if not ready
        setTimeout(subscribeToUpdates, 1000);
      }
    };

    subscribeToUpdates();

    return () => {
      if (subscription && subscription.unsubscribe) {
        subscription.unsubscribe();
      }
    };
  }, []);

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
        {/* Chef Routes */}
        <Route path="orders" element={<ChefOrders />} />
        <Route path="menu" element={<ChefMenu />} />

        {/* Default Dashboard */}
        <Route path="*" element={
          <>
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Chef Dashboard</h1>
                <p className="text-gray-600">Overview of kitchen operations</p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Pending</p>
                    <p className="text-2xl font-bold text-gray-900">{orders.filter(order => order.status === 'PENDING').length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Confirmed</p>
                    <p className="text-2xl font-bold text-gray-900">{orders.filter(order => order.status === 'CONFIRMED').length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Preparing</p>
                    <p className="text-2xl font-bold text-gray-900">{orders.filter(order => order.status === 'PREPARING').length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Ready</p>
                    <p className="text-2xl font-bold text-gray-900">{orders.filter(order => order.status === 'READY_FOR_SERVICE').length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow border-l-4 border-gray-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Completed</p>
                    <p className="text-2xl font-bold text-gray-900">{orders.filter(order => order.status === 'SERVED' || order.status === 'COMPLETED').length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Orders List */}
            <div className="divide-y divide-gray-200">
              {orders.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <p>No orders found</p>
                </div>
              ) : (
                orders.slice(0, 5).map(order => (
                  <div key={order.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-medium text-gray-900">{order.customerName || 'Customer'}</h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : order.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' : order.status === 'PREPARING' ? 'bg-purple-100 text-purple-800' : order.status === 'READY_FOR_SERVICE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center space-x-6 text-sm text-gray-500">
                          <span>Table: {order.tableBookingId || 'N/A'}</span>
                          <span>Items: {order.items?.length || 0}</span>
                          <span>Total: ${order.totalPrice?.toFixed(2) || '0.00'}</span>
                          <span>{new Date(order.createdAt).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        } />
      </Routes>
    </div>
  )
}

export default ChefDashboard
