import api from './authService'

export const orderService = {
  // Create order
  createOrder: async (orderData) => {
    const response = await api.post('/api/orders', orderData)
    return response.data
  },

  // Get all orders (admin only)
  getAllOrders: async (params = {}) => {
    const response = await api.get('/api/orders', { params })
    return response.data
  },

  // Get order by ID
  getOrderById: async (id) => {
    const response = await api.get(`/api/orders/${id}`)
    return response.data
  },

  // Get my orders
  getMyOrders: async (params = {}) => {
    const response = await api.get('/api/orders/my-orders', { params })
    return response.data
  },

  // Get customer orders (alias for getMyOrders)
  getCustomerOrders: async (params = {}) => {
    const response = await api.get('/api/orders/my-orders', { params })
    return response.data
  },

  // Update order status
  updateOrderStatus: async (id, statusData) => {
    const response = await api.put(`/api/orders/${id}/status`, statusData)
    return response.data
  },

  // Cancel order
  cancelOrder: async (id) => {
    const response = await api.put(`/api/orders/${id}/cancel`)
    return response.data
  },

  // Get chef orders
  getChefOrders: async () => {
    const response = await api.get('/api/orders/chef-orders')
    return response.data
  },

  // Get waiter orders
  getWaiterOrders: async () => {
    const response = await api.get('/api/orders/waiter-orders')
    return response.data
  },

  // Get orders needing chef
  getOrdersNeedingChef: async () => {
    const response = await api.get('/api/orders/needing-chef')
    return response.data
  },

  // Get orders needing waiter
  getOrdersNeedingWaiter: async () => {
    const response = await api.get('/api/orders/needing-waiter')
    return response.data
  },

  // Get order statistics (admin only)
  getOrderStats: async () => {
    const response = await api.get('/api/orders/stats')
    return response.data
  },

  // Get today's orders (admin only)
  getTodayOrders: async () => {
    const response = await api.get('/api/orders/today')
    return response.data
  },

  // Assign order to chef
  assignOrderToChef: async (id, chefId) => {
    const response = await api.put(`/api/orders/${id}/assign-chef`, { chefId })
    return response.data
  },

  // Assign order to waiter
  assignOrderToWaiter: async (id, waiterId) => {
    const response = await api.put(`/api/orders/${id}/assign-waiter`, { waiterId })
    return response.data
  },
}

export default orderService
