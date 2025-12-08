import api from './authService'

export const adminService = {
  // User Management
  getAllUsers: async (params = {}) => {
    const response = await api.get('/admin/users', { params })
    return response.data
  },

  getUserById: async (id) => {
    const response = await api.get(`/admin/users/${id}`)
    return response.data
  },

  updateUser: async (id, userData) => {
    const response = await api.put(`/admin/users/${id}`, userData)
    return response.data
  },

  deactivateUser: async (id) => {
    const response = await api.put(`/admin/users/${id}/toggle-active`)
    return response.data
  },

  activateUser: async (id) => {
    const response = await api.put(`/admin/users/${id}/toggle-active`)
    return response.data
  },

  getUserOrders: async (id) => {
    const response = await api.get(`/admin/users/${id}/orders`)
    return response.data
  },

  // Invite Token Management
  getInviteTokens: async (params = {}) => {
    const response = await api.get('/admin/invite-tokens', { params })
    return response.data
  },

  createInviteToken: async (email, role) => {
    const response = await api.post('/admin/invite', null, {
      params: { email, role },
    })
    return response.data
  },

  deleteExpiredTokens: async () => {
    const response = await api.delete('/admin/invite-tokens/expired')
    return response.data
  },

  // Analytics
  getAnalytics: async (dateRange) => {
    try {
      // Fetch all required data in parallel
      const [stats, topItems, orderStatus, last7Days] = await Promise.all([
        api.get('/admin/stats').then(res => res.data),
        api.get('/admin/analytics/top-items?limit=5').then(res => res.data),
        api.get('/admin/analytics/order-status').then(res => res.data),
        api.get('/admin/analytics/last7days').then(res => res.data)
      ])

      // Process and format the data
      return {
        totalRevenue: stats.totalRevenue,
        revenueGrowth: 12.5, // Mocked growth for now
        totalOrders: stats.totalOrders,
        ordersGrowth: 8.2,
        totalBookings: stats.totalBookings,
        bookingsGrowth: 5.1,
        activeUsers: stats.activeUsers,
        usersGrowth: 3.4,

        revenueData: last7Days.map(d => ({
          date: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
          revenue: d.revenue
        })),

        ordersData: last7Days.map(d => ({
          date: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
          orders: d.orderCount,
          bookings: Math.floor(d.orderCount * 0.4) // Mocked bookings trend
        })),

        orderStatusData: Object.entries(orderStatus).map(([key, value]) => ({
          name: key.charAt(0).toUpperCase() + key.slice(1).toLowerCase(),
          value: value
        })),

        topProducts: topItems.map(item => ({
          name: item.productName,
          sales: item.quantity,
          revenue: item.revenue
        })),

        performanceMetrics: [
          { name: 'Revenue', current: `$${stats.totalRevenue}`, previous: '$12,450', change: 12.5, trend: 'Increasing' },
          { name: 'Orders', current: stats.totalOrders, previous: '1,150', change: 8.2, trend: 'Increasing' },
          { name: 'Avg Order Value', current: `$${(stats.totalRevenue / (stats.totalOrders || 1)).toFixed(2)}`, previous: '$24.50', change: 2.1, trend: 'Stable' },
        ]
      }
    } catch (error) {
      console.error('Error fetching aggregated analytics:', error)
      throw error
    }
  },

  getTodayAnalytics: async () => {
    try {
      const response = await api.get('/admin/analytics/today')
      const data = response.data
      
      // Return completed orders revenue but total orders count
      return {
        ...data,
        revenue: data.completedOrdersRevenue || 0,
        orderCount: data.orderCount || 0, // Total orders (all statuses)
        bookingCount: data.bookingCount || 0
      }
    } catch (error) {
      console.error('Error fetching today analytics:', error)
      throw error
    }
  },

  getLast7DaysAnalytics: async () => {
    const response = await api.get('/admin/analytics/last7days')
    return response.data
  },

  getTopItemsAnalytics: async (limit = 10) => {
    const response = await api.get('/admin/analytics/top-items', {
      params: { limit },
    })
    return response.data
  },

  getMonthlyAnalytics: async (months = 12) => {
    const response = await api.get('/admin/analytics/monthly', {
      params: { months },
    })
    return response.data
  },

  getSystemStats: async () => {
    const response = await api.get('/admin/stats')
    return response.data
  },

  getOrderStatusDistribution: async () => {
    const response = await api.get('/admin/analytics/order-status')
    return response.data
  },

  getRevenueByDateRange: async (startDate, endDate) => {
    const response = await api.get('/admin/analytics/revenue', {
      params: { startDate, endDate },
    })
    return response.data
  },

  // Settings
  getSettings: async () => {
    const response = await api.get('/admin/settings')
    return response.data
  },

  updateSettings: async (settings) => {
    const response = await api.put('/admin/settings', settings)
    return response.data
  },
}
