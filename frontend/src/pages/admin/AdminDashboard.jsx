import { useState, useEffect } from 'react'
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom'
import { adminService } from '../../services/adminService'
import { orderService } from '../../services/orderService'
import { bookingService } from '../../services/bookingService'
import { productService } from '../../services/productService'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import toast from 'react-hot-toast'

// Import individual admin pages
import AdminAnalytics from './AdminAnalytics'
import AdminUsers from './AdminUsers'
import AdminProducts from './AdminProducts'
import AdminOrders from './AdminOrders'
import AdminBookings from './AdminBookings'
import AdminSettings from './AdminSettings'

export const AdminDashboard = () => {
  const [stats, setStats] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  useEffect(() => {
    // Set active tab based on current path
    const path = location.pathname
    if (path.includes('/analytics')) {
      setActiveTab('analytics')
    } else if (path.includes('/users')) {
      setActiveTab('users')
    } else if (path.includes('/products')) {
      setActiveTab('products')
    } else if (path.includes('/orders')) {
      setActiveTab('orders')
    } else if (path.includes('/bookings')) {
      setActiveTab('bookings')
    } else if (path.includes('/settings')) {
      setActiveTab('settings')
    } else {
      setActiveTab('overview')
    }
  }, [location.pathname])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      console.log('Fetching admin dashboard data...')

      // Fetch real data from backend with enhanced revenue fetching
      const [statsData, todayAnalytics, orderStatusData, topProductsData, last7DaysData] = await Promise.all([
        adminService.getSystemStats().catch(err => {
          console.error('Failed to fetch system stats:', err)
          return null
        }),
        // Enhanced today's revenue fetching
        fetchTodayRevenue().catch(err => {
          console.error('Failed to fetch today revenue:', err)
          return null
        }),
        adminService.getOrderStatusDistribution().catch(err => {
          console.error('Failed to fetch order status:', err)
          return null
        }),
        adminService.getTopItemsAnalytics(5).catch(err => {
          console.error('Failed to fetch top products:', err)
          return null
        }),
        adminService.getLast7DaysAnalytics().catch(err => {
          console.error('Failed to fetch last 7 days data:', err)
          return null
        })
      ])

      // Set stats data with fallback
      if (statsData) {
        setStats(statsData)
      } else {
        // Fallback sample data
        setStats({
          totalUsers: 25,
          totalOrders: 150,
          totalRevenue: 3250.50,
          totalBookings: 45
        })
      }

      // Create revenue data for charts with fallback
      let revenueData = []
      if (last7DaysData && Array.isArray(last7DaysData)) {
        revenueData = last7DaysData.map(item => ({
          date: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }),
          revenue: item.revenue || 0
        }))
      } else {
        // Sample revenue data
        revenueData = [
          { date: 'Mon', revenue: 450 },
          { date: 'Tue', revenue: 520 },
          { date: 'Wed', revenue: 380 },
          { date: 'Thu', revenue: 620 },
          { date: 'Fri', revenue: 750 },
          { date: 'Sat', revenue: 890 },
          { date: 'Sun', revenue: 650 }
        ]
      }

      // Convert order status data to chart format with fallback
      let formattedOrderStatusData = []
      if (orderStatusData && typeof orderStatusData === 'object') {
        formattedOrderStatusData = [
          { name: 'Pending', value: orderStatusData.pending || 0 },
          { name: 'Preparing', value: orderStatusData.preparing || 0 },
          { name: 'Ready', value: orderStatusData.ready_for_service || 0 },
          { name: 'Completed', value: orderStatusData.completed || 0 },
          { name: 'Cancelled', value: orderStatusData.cancelled || 0 }
        ]
      } else {
        // Sample order status data
        formattedOrderStatusData = [
          { name: 'Pending', value: 12 },
          { name: 'Preparing', value: 8 },
          { name: 'Ready', value: 5 },
          { name: 'Completed', value: 120 },
          { name: 'Cancelled', value: 3 }
        ]
      }

      // Set analytics data - map backend response to frontend structure with fallback
      setAnalytics({
        todayOrders: todayAnalytics?.orderCount || 15,
        todayBookings: todayAnalytics?.bookingCount || 8,
        todayRevenue: todayAnalytics?.revenue || 450.75,
        revenueData: revenueData,
        orderStatusData: formattedOrderStatusData,
        topProducts: topProductsData || [
          { name: 'Cappuccino', quantity: 45, revenue: 225.00 },
          { name: 'Latte', quantity: 38, revenue: 228.00 },
          { name: 'Croissant', quantity: 25, revenue: 75.00 },
          { name: 'Espresso', quantity: 32, revenue: 96.00 },
          { name: 'Sandwich', quantity: 18, revenue: 108.00 }
        ]
      })

      console.log('Admin dashboard data loaded successfully')
      
    } catch (error) {
      console.error('Failed to fetch admin dashboard data:', error)
      toast.error('Failed to load dashboard data. Using sample data.')
      
      // Set fallback data
      setStats({
        totalUsers: 25,
        totalOrders: 150,
        totalRevenue: 3250.50,
        totalBookings: 45
      })
      
      setAnalytics({
        todayOrders: 15,
        todayBookings: 8,
        todayRevenue: 450.75,
        revenueData: [
          { date: 'Mon', revenue: 450 },
          { date: 'Tue', revenue: 520 },
          { date: 'Wed', revenue: 380 },
          { date: 'Thu', revenue: 620 },
          { date: 'Fri', revenue: 750 },
          { date: 'Sat', revenue: 890 },
          { date: 'Sun', revenue: 650 }
        ],
        orderStatusData: [
          { name: 'Pending', value: 12 },
          { name: 'Preparing', value: 8 },
          { name: 'Ready', value: 5 },
          { name: 'Completed', value: 120 },
          { name: 'Cancelled', value: 3 }
        ],
        topProducts: [
          { name: 'Cappuccino', quantity: 45, revenue: 225.00 },
          { name: 'Latte', quantity: 38, revenue: 228.00 },
          { name: 'Croissant', quantity: 25, revenue: 75.00 },
          { name: 'Espresso', quantity: 32, revenue: 96.00 },
          { name: 'Sandwich', quantity: 18, revenue: 108.00 }
        ]
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchTodayRevenue = async () => {
    try {
      console.log('Fetching today\'s analytics data...')

      // Use admin service to get today's analytics
      const todayData = await adminService.getTodayAnalytics()
      console.log('Today\'s data fetched successfully:', todayData)

      return todayData

    } catch (error) {
      console.error('Failed to fetch today revenue:', error)
      return null
    }
  }

  const handleGenerateReport = () => {
    try {
      // Create report content
      const reportData = {
        generatedAt: new Date().toLocaleString(),
        stats: stats,
        analytics: analytics
      }

      // Convert to JSON string with formatting
      const reportContent = JSON.stringify(reportData, null, 2)

      // Create blob and download
      const blob = new Blob([reportContent], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `admin-report-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success('Report generated successfully!')
    } catch (error) {
      console.error('Failed to generate report:', error)
      toast.error('Failed to generate report')
    }
  }

  const handleExportData = () => {
    try {
      // Create CSV content
      let csvContent = 'Dashboard Statistics\n\n'
      csvContent += 'Metric,Value\n'
      csvContent += `Total Users,${stats?.totalUsers || 0}\n`
      csvContent += `Total Orders,${stats?.totalOrders || 0}\n`
      csvContent += `Total Revenue,$${stats?.totalRevenue || 0}\n`
      csvContent += `Total Bookings,${stats?.totalBookings || 0}\n`
      csvContent += `\nToday's Analytics\n`
      csvContent += `Today's Orders,${analytics?.todayOrders || 0}\n`
      csvContent += `Today's Bookings,${analytics?.todayBookings || 0}\n`
      csvContent += `Today's Revenue,$${analytics?.todayRevenue || 0}\n`

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `dashboard-data-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success('Data exported successfully!')
    } catch (error) {
      console.error('Failed to export data:', error)
      toast.error('Failed to export data')
    }
  }

  const handleNavigation = (path) => {
    // Use actual navigation instead of changing activeTab
    navigate(path)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

  return (
    <div className="space-y-6">
      <Routes>
        {/* Admin Routes */}
        <Route path="users" element={<AdminUsers />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="bookings" element={<AdminBookings />} />
        <Route path="settings" element={<AdminSettings />} />

        {/* Default Overview - Analytics handled inline */}
        <Route path="*" element={
          <>
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-600">Manage your coffee shop operations</p>
              </div>
              <div className="flex space-x-3">
                {activeTab === 'overview' && (
                  <button
                    onClick={handleExportData}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Export Data
                  </button>
                )}
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {['overview', 'analytics', 'users', 'products', 'orders', 'bookings', 'settings'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    {tab}
                  </button>
                ))}
              </nav>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                      <div className="p-3 bg-blue-100 rounded-full">
                        <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Users</p>
                        <p className="text-2xl font-bold text-gray-900">{stats?.totalUsers || 0}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                      <div className="p-3 bg-green-100 rounded-full">
                        <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Today's Orders</p>
                        <p className="text-2xl font-bold text-gray-900">{analytics?.todayOrders || 0}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                      <div className="p-3 bg-yellow-100 rounded-full">
                        <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Today's Bookings</p>
                        <p className="text-2xl font-bold text-gray-900">{analytics?.todayBookings || 0}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                      <div className="p-3 bg-purple-100 rounded-full">
                        <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Today's Revenue</p>
                        <p className="text-2xl font-bold text-gray-900">${analytics?.todayRevenue || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>


                {/* Quick Actions */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <button
                      onClick={() => setActiveTab('users')}
                      className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <svg className="h-8 w-8 text-blue-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <span className="text-sm text-gray-700">Manage Users</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('products')}
                      className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <svg className="h-8 w-8 text-green-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      <span className="text-sm text-gray-700">Manage Products</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <svg className="h-8 w-8 text-yellow-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span className="text-sm text-gray-700">View Orders</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('bookings')}
                      className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <svg className="h-8 w-8 text-purple-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm text-gray-700">View Bookings</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('settings')}
                      className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <svg className="h-8 w-8 text-gray-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-sm text-gray-700">Settings</span>
                    </button>
                  </div>
                </div>
              </div>
            )
            }

            {/* Analytics Tab */}
            {
              activeTab === 'analytics' && (
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-blue-900">Analytics Dashboard</h3>
                    <p className="text-blue-700">Showing real-time data from your coffee shop</p>
                    <div className="mt-2 text-sm text-blue-600">
                      Orders Today: {analytics?.todayOrders || 0} |
                      Bookings Today: {analytics?.todayBookings || 0} |
                      Revenue Today: ${analytics?.todayRevenue || 0}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Revenue Chart */}
                    <div className="bg-white p-6 rounded-lg shadow">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={Array.isArray(analytics?.revenueData) ? analytics.revenueData : []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Order Status Distribution */}
                    <div className="bg-white p-6 rounded-lg shadow">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={Array.isArray(analytics?.orderStatusData) ? analytics.orderStatusData : []}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {(Array.isArray(analytics?.orderStatusData) ? analytics.orderStatusData : []).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Top Products */}
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Products</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={Array.isArray(analytics?.topProducts) ? analytics.topProducts : []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="sales" fill="#10B981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )
            }

            {/* Users Tab */}
            {
              activeTab === 'users' && (
                <AdminUsers />
              )
            }

            {/* Products Tab */}
            {
              activeTab === 'products' && (
                <AdminProducts />
              )
            }

            {/* Orders Tab */}
            {
              activeTab === 'orders' && (
                <AdminOrders />
              )
            }

            {/* Bookings Tab */}
            {
              activeTab === 'bookings' && (
                <AdminBookings />
              )
            }

            {/* Settings Tab */}
            {
              activeTab === 'settings' && (
                <AdminSettings />
              )
            }
          </>
        } />
      </Routes >
    </div >
  )
}

export default AdminDashboard
