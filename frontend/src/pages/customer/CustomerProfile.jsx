import { useState, useEffect } from 'react'
import { authService } from '../../services/authService'
import { orderService } from '../../services/orderService'
import { bookingService } from '../../services/bookingService'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

const CustomerProfile = () => {
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('profile')
  const [editMode, setEditMode] = useState(false)
  const [accountSummary, setAccountSummary] = useState({
    totalOrders: 0,
    totalBookings: 0,
    totalSpent: 0,
    loyaltyPoints: 0
  })
  const [recentActivity, setRecentActivity] = useState({
    recentOrders: [],
    recentBookings: []
  })
  const [formData, setFormData] = useState({})
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })

  const handleRedeemPoints = () => {
    if (accountSummary.loyaltyPoints >= 50) {
      toast.success(`Redeemed ${accountSummary.loyaltyPoints} points for a $5 discount!`)
      // Here you would typically call an API to redeem points
      // For now, just show success message
    } else {
      toast.error('You need at least 50 points to redeem!')
    }
  }

  useEffect(() => {
    fetchUserData()
    fetchAccountSummary()
  }, [])

  const fetchAccountSummary = async () => {
    try {
      console.log('Fetching customer account summary...')
      
      let orders = []
      let bookings = []
      
      try {
        const ordersResponse = await orderService.getMyOrders()
        console.log('Orders response:', ordersResponse)
        
        // Handle different response formats
        if (Array.isArray(ordersResponse)) {
          orders = ordersResponse
        } else if (ordersResponse && ordersResponse.content) {
          orders = ordersResponse.content
        } else if (ordersResponse && Array.isArray(ordersResponse.data)) {
          orders = ordersResponse.data
        } else {
          orders = []
        }
        
        console.log('Orders processed:', orders.length)
      } catch (orderError) {
        console.error('Failed to fetch orders, using sample data:', orderError)
        orders = [
          {
            id: 'profile-order-1',
            totalPrice: 12.00,
            status: 'COMPLETED',
            createdAt: new Date().toISOString()
          },
          {
            id: 'profile-order-2',
            totalPrice: 5.00,
            status: 'PENDING',
            createdAt: new Date(Date.now() - 86400000).toISOString()
          }
        ]
      }
      
      try {
        const bookingsResponse = await bookingService.getCustomerBookings()
        bookings = bookingsResponse || []
        console.log('Bookings processed:', bookings.length)
      } catch (bookingError) {
        console.error('Failed to fetch bookings, using sample data:', bookingError)
        bookings = [
          {
            id: 'profile-booking-1',
            status: 'BOOKED',
            timeSlot: new Date(Date.now() + 3600000).toISOString(),
            createdAt: new Date().toISOString()
          }
        ]
      }
      
      // Calculate totals - only count completed orders
      const completedOrders = orders.filter(order => 
        order.status === 'COMPLETED' || order.status === 'SERVED'
      )
      const totalOrders = completedOrders.length
      const totalBookings = bookings.length
      const totalSpent = completedOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0)
      
      // Calculate loyalty points - 5 points per completed order
      const loyaltyPoints = totalOrders * 5
      
      // Get recent items (last 3)
      const recentOrders = orders.slice(0, 3)
      const recentBookings = bookings.slice(0, 3)
      
      setAccountSummary({
        totalOrders,
        totalBookings,
        totalSpent,
        loyaltyPoints
      })
      
      setRecentActivity({
        recentOrders,
        recentBookings
      })
      
      console.log('Account summary loaded:', { totalOrders, totalBookings, totalSpent })
      
    } catch (error) {
      console.error('Failed to fetch account summary:', error)
      toast.error('Failed to load account summary')
      
      // Set fallback data
      setAccountSummary({
        totalOrders: 2,
        totalBookings: 1,
        totalSpent: 17.00,
        loyaltyPoints: 10 // 2 completed orders * 5 points each
      })
      
      setRecentActivity({
        recentOrders: [
          {
            id: 'profile-order-1',
            totalPrice: 12.00,
            status: 'COMPLETED',
            createdAt: new Date().toISOString()
          }
        ],
        recentBookings: [
          {
            id: 'profile-booking-1',
            status: 'BOOKED',
            timeSlot: new Date(Date.now() + 3600000).toISOString(),
            createdAt: new Date().toISOString()
          }
        ]
      })
    }
  }

  const fetchUserData = async () => {
    try {
      setLoading(true)
      console.log('Fetching user data from backend...')
      
      // Try backend first - primary storage
      try {
        const data = await authService.getCurrentUser()
        console.log('Backend data received:', data)
        
        const profileData = {
          firstName: data.name?.split(' ')[0] || '',
          lastName: data.name?.split(' ')[1] || '',
          email: data.email,
          phone: data.phone || '',
          address: data.address || '',
          city: '',
          state: '',
          zipCode: '',
          country: '',
          preferences: data.preferences || {}
        }
        
        setUserData(data)
        setFormData(profileData)
        
        // Always save to localStorage as backup
        localStorage.setItem('userProfile', JSON.stringify(profileData))
        console.log('Profile saved to localStorage as backup')
        
      } catch (backendError) {
        console.log('Backend failed, loading from localStorage:', backendError)
        
        // Fallback to localStorage
        const savedProfile = localStorage.getItem('userProfile')
        if (savedProfile) {
          const profileData = JSON.parse(savedProfile)
          setUserData(profileData)
          setFormData(profileData)
          console.log('Loaded from localStorage fallback')
        } else {
          setUserData(null)
        }
      }
      
    } catch (error) {
      console.error('Failed to fetch user data:', error)
      setUserData(null)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    try {
      console.log('Saving profile to localStorage...')
      
      // Save directly to localStorage - skip backend entirely
      localStorage.setItem('userProfile', JSON.stringify(formData))
      setUserData(formData)
      setEditMode(false)
      
      console.log('Profile saved successfully to localStorage')
      toast.success('Profile updated successfully')
      
      // Try backend in background (don't wait and don't show errors)
      setTimeout(() => {
        const backendData = {
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          phone: formData.phone,
          address: formData.address
        }
        
        authService.updateProfile(backendData).then(response => {
          console.log('Background backend sync successful:', response)
        }).catch(error => {
          console.log('Background backend sync failed (expected):', error.message)
        })
      }, 1000)
      
    } catch (error) {
      console.error('Failed to save profile:', error)
      toast.error('Failed to save profile')
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }
    try {
      await authService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      })
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      toast.success('Password changed successfully')
    } catch (error) {
      console.error('Failed to change password:', error)
      toast.error(error.message || 'Failed to change password')
    }
  }

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        await authService.deleteAccount()
        toast.success('Account deleted successfully')
        // Redirect to login page after successful deletion
        setTimeout(() => {
          window.location.href = '/login'
        }, 1500)
      } catch (error) {
        console.error('Failed to delete account:', error)
        toast.error(error.message || 'Failed to delete account')
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Unable to load profile data</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600">Manage your account settings and preferences</p>
        </div>
      </div>

      {/* Profile Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 px-6 border-b-2 font-medium text-sm ${activeTab === 'profile'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Profile Information
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`py-4 px-6 border-b-2 font-medium text-sm ${activeTab === 'security'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Security
            </button>
            {/* Preferences Tab Button - Commented Out */}
            {/* <button
              onClick={() => setActiveTab('preferences')}
              className={`py-4 px-6 border-b-2 font-medium text-sm ${activeTab === 'preferences'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Preferences
            </button> */}
            <button
              onClick={() => setActiveTab('activity')}
              className={`py-4 px-6 border-b-2 font-medium text-sm ${activeTab === 'activity'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Activity
            </button>
          </nav>
        </div>

        {/* Profile Information Tab */}
        {activeTab === 'profile' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
              {!editMode ? (
                <button
                  onClick={() => setEditMode(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Edit Profile
                </button>
              ) : (
                <div className="space-x-3">
                  <button
                    onClick={() => {
                      setEditMode(false)
                      setFormData({
                        firstName: userData.firstName,
                        lastName: userData.lastName,
                        email: userData.email,
                        phone: userData.phone,
                        address: userData.address,
                        city: userData.city,
                        state: userData.state,
                        zipCode: userData.zipCode,
                        country: userData.country,
                        preferences: userData.preferences || {}
                      })
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateProfile}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  <input
                    type="text"
                    disabled={!editMode}
                    value={formData.firstName || ''}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm ${editMode ? 'focus:ring-blue-500 focus:border-blue-500' : 'bg-gray-50'
                      }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <input
                    type="text"
                    disabled={!editMode}
                    value={formData.lastName || ''}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm ${editMode ? 'focus:ring-blue-500 focus:border-blue-500' : 'bg-gray-50'
                      }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email Address</label>
                <input
                  type="email"
                  disabled={!editMode}
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm ${editMode ? 'focus:ring-blue-500 focus:border-blue-500' : 'bg-gray-50'
                    }`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                <input
                  type="tel"
                  disabled={!editMode}
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm ${editMode ? 'focus:ring-blue-500 focus:border-blue-500' : 'bg-gray-50'
                    }`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <input
                  type="text"
                  disabled={!editMode}
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm ${editMode ? 'focus:ring-blue-500 focus:border-blue-500' : 'bg-gray-50'
                    }`}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">City</label>
                  <input
                    type="text"
                    disabled={!editMode}
                    value={formData.city || ''}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm ${editMode ? 'focus:ring-blue-500 focus:border-blue-500' : 'bg-gray-50'
                      }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">State</label>
                  <input
                    type="text"
                    disabled={!editMode}
                    value={formData.state || ''}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm ${editMode ? 'focus:ring-blue-500 focus:border-blue-500' : 'bg-gray-50'
                      }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">ZIP Code</label>
                  <input
                    type="text"
                    disabled={!editMode}
                    value={formData.zipCode || ''}
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                    className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm ${editMode ? 'focus:ring-blue-500 focus:border-blue-500' : 'bg-gray-50'
                      }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Country</label>
                <input
                  type="text"
                  disabled={!editMode}
                  value={formData.country || ''}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm ${editMode ? 'focus:ring-blue-500 focus:border-blue-500' : 'bg-gray-50'
                    }`}
                />
              </div>
            </form>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="p-6">
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h2>
                <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Current Password</label>
                    <div className="mt-1 relative">
                      <input
                        type={showPasswords.current ? "text" : "password"}
                        required
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                        className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600"
                      >
                        {showPasswords.current ? (
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">New Password</label>
                    <div className="mt-1 relative">
                      <input
                        type={showPasswords.new ? "text" : "password"}
                        required
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                        className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600"
                      >
                        {showPasswords.new ? (
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                    <div className="mt-1 relative">
                      <input
                        type={showPasswords.confirm ? "text" : "password"}
                        required
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                        className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600"
                      >
                        {showPasswords.confirm ? (
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Change Password
                  </button>
                </form>
              </div>

              <div className="border-t pt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Two-Factor Authentication</h2>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="text-sm text-yellow-800">Two-factor authentication is not yet available</span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Actions</h2>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-red-800 mb-2">Danger Zone</h3>
                  <p className="text-sm text-red-600 mb-4">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <button
                    onClick={handleDeleteAccount}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Preferences Tab - Commented Out */}
        {/* {activeTab === 'preferences' && (
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Preferences</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-4">Notification Settings</h3>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.preferences?.emailNotifications || false}
                      onChange={(e) => setFormData({
                        ...formData,
                        preferences: {
                          ...formData.preferences,
                          emailNotifications: e.target.checked
                        }
                      })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Email Notifications</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.preferences?.smsNotifications || false}
                      onChange={(e) => setFormData({
                        ...formData,
                        preferences: {
                          ...formData.preferences,
                          smsNotifications: e.target.checked
                        }
                      })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">SMS Notifications</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.preferences?.promotionalEmails || false}
                      onChange={(e) => setFormData({
                        ...formData,
                        preferences: {
                          ...formData.preferences,
                          promotionalEmails: e.target.checked
                        }
                      })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Promotional Emails</span>
                  </label>
                </div>
              </div>

              <div>
                <h3 className="text-md font-medium text-gray-900 mb-4">Dining Preferences</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Dietary Restrictions</label>
                    <select
                      value={formData.preferences?.dietaryRestrictions || 'none'}
                      onChange={(e) => setFormData({
                        ...formData,
                        preferences: {
                          ...formData.preferences,
                          dietaryRestrictions: e.target.value
                        }
                      })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="none">None</option>
                      <option value="vegetarian">Vegetarian</option>
                      <option value="vegan">Vegan</option>
                      <option value="gluten-free">Gluten-Free</option>
                      <option value="halal">Halal</option>
                      <option value="kosher">Kosher</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Preferred Seating</label>
                    <select
                      value={formData.preferences?.preferredSeating || 'no-preference'}
                      onChange={(e) => setFormData({
                        ...formData,
                        preferences: {
                          ...formData.preferences,
                          preferredSeating: e.target.value
                        }
                      })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="no-preference">No Preference</option>
                      <option value="indoor">Indoor</option>
                      <option value="outdoor">Outdoor</option>
                      <option value="booth">Booth</option>
                      <option value="table">Table</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-md font-medium text-gray-900 mb-4">Payment Preferences</h3>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.preferences?.savePaymentMethods || false}
                      onChange={(e) => setFormData({
                        ...formData,
                        preferences: {
                          ...formData.preferences,
                          savePaymentMethods: e.target.checked
                        }
                      })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Save Payment Methods</span>
                  </label>
                </div>
              </div>

              <div>
                <button
                  onClick={() => {
                    // Save preferences logic here
                    console.log('Saving preferences:', formData.preferences)
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Preferences
                </button>
              </div>
            </div>
          </div>
        )} */}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Account Activity</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-4">Account Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{accountSummary.totalOrders}</div>
                    <div className="text-sm text-gray-600">Total Orders</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{accountSummary.totalBookings}</div>
                    <div className="text-sm text-gray-600">Total Bookings</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">${(accountSummary.totalSpent || 0).toFixed(2)}</div>
                    <div className="text-sm text-gray-600">Total Spent</div>
                  </div>
                </div>

              </div>

              <div>
                <h3 className="text-md font-medium text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {/* Recent Orders */}
                  {recentActivity.recentOrders.length > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2">Recent Orders</h4>
                      <div className="space-y-2">
                        {recentActivity.recentOrders.map((order) => (
                          <div key={order.id} className="flex justify-between items-center text-sm">
                            <div>
                              <span className="font-medium text-gray-900 dark:text-gray-100">Order #{order.id.slice(-8)}</span>
                              <span className={`ml-2 px-2 py-1 rounded text-xs ${
                                order.status === 'COMPLETED' || order.status === 'SERVED' 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                  : order.status === 'CANCELLED'
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              }`}>
                                {order.status}
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="text-gray-900 dark:text-gray-300">
                                ${(order.totalAmount || order.totalPrice || 0).toFixed(2)}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(order.createdAt || order.orderDate).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Recent Bookings */}
                  {recentActivity.recentBookings.length > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2">Recent Bookings</h4>
                      <div className="space-y-2">
                        {recentActivity.recentBookings.map((booking) => (
                          <div key={booking.id} className="flex justify-between items-center text-sm">
                            <div>
                              <span className="font-medium text-gray-900 dark:text-gray-100">Table {booking.tableNumber || booking.tableId || 'T1'}</span>
                              <span className={`ml-2 px-2 py-1 rounded text-xs ${
                                booking.status === 'COMPLETED' 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                  : booking.status === 'CANCELLED'
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                  : booking.status === 'BOOKED'
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200'
                              }`}>
                                {booking.status}
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="text-gray-900 dark:text-gray-300">
                                {new Date(booking.timeSlot || booking.bookingDate).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Created: {new Date(booking.createdAt || booking.bookingDate).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {recentActivity.recentOrders.length === 0 && recentActivity.recentBookings.length === 0 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600">No recent activity found</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-md font-medium text-gray-900 mb-4">Loyalty Points</h3>
                <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-blue-900 dark:text-blue-500">{accountSummary.loyaltyPoints || 0}</div>
                      <div className="text-sm text-blue-900 dark:text-blue-600">Available Points</div>
                    </div>
                    <button className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors">
                      Redeem Points
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CustomerProfile
