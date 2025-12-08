import api from './authService'

export const orderService = {
  // Create order
  createOrder: async (orderData) => {
    console.log('Creating order via backend API...')
    
    // Transform order data to match backend CreateOrderRequest format
    const createOrderRequest = {
      items: orderData.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      })),
      notes: orderData.specialInstructions || orderData.notes || '',
      tableBookingId: orderData.tableBookingId || null
    }
    
    console.log('Sending order request:', createOrderRequest)
    const response = await api.post('/orders', createOrderRequest)
    console.log('Order created successfully:', response.data)
    return response.data
  },

  // Get all orders (admin only)
  getAllOrders: async (params = {}) => {
    const response = await api.get('/orders', { params })
    return response.data
  },

  // Get order by ID
  getOrderById: async (id) => {
    const response = await api.get(`/orders/${id}`)
    return response.data
  },

  // Get my orders
  getMyOrders: async (params = {}) => {
    console.log('Loading orders from backend API...')
    const response = await api.get('/orders/my-orders', { params })
    console.log('Loaded orders from backend:', response.data)
    return response.data
  },

  // Get customer orders (alias for getMyOrders)
  getCustomerOrders: async (params = {}) => {
    console.log('Loading customer orders from backend API...')
    const response = await api.get('/orders/my-orders', { params })
    console.log('Loaded customer orders from backend:', response.data)
    return response.data
  },

  // Update order status
  updateOrderStatus: async (id, status) => {
    console.log('Updating order status via backend API...', { id, status })
    try {
      const response = await api.put(`/orders/${id}/status`, { status })
      console.log('Order status updated successfully:', response.data)
      return response.data
    } catch (error) {
      console.error('Order status update failed:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        url: `/orders/${id}/status`
      })
      
      // Log the full error response for debugging
      if (error.response?.data) {
        console.error('Backend error details:', JSON.stringify(error.response.data, null, 2))
      }
      
      throw error
    }
  },

  // Cancel order
  cancelOrder: async (id) => {
    console.log('Cancelling order via backend API...')
    const response = await api.put(`/orders/${id}/cancel`)
    console.log('Order cancelled successfully:', response.data)
    return response.data
  },

  // Get chef orders
  getChefOrders: async () => {
    const response = await api.get('/orders/chef-orders')
    return response.data
  },

  // Get waiter orders
  getWaiterOrders: async () => {
    const response = await api.get('/orders/waiter-orders')
    return response.data
  },

  // Get orders needing chef
  getOrdersNeedingChef: async () => {
    const response = await api.get('/orders/needing-chef')
    return response.data
  },

  // Get orders needing waiter
  getOrdersNeedingWaiter: async () => {
    const response = await api.get('/orders/needing-waiter')
    return response.data
  },

  // Get order statistics (admin only)
  getOrderStats: async () => {
    const response = await api.get('/orders/stats')
    return response.data
  },

  // Get today's orders (admin only)
  getTodayOrders: async () => {
    const response = await api.get('/orders/today')
    return response.data
  },

  // Assign order to chef
  assignOrderToChef: async (id, chefId) => {
    const response = await api.put(`/orders/${id}/assign-chef`, { chefId })
    return response.data
  },

  // Assign order to waiter
  assignOrderToWaiter: async (id, waiterId) => {
    const response = await api.put(`/orders/${id}/assign-waiter`, { waiterId })
    return response.data
  },
}

export default orderService
