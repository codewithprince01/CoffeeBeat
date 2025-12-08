import { useState, useEffect } from 'react'
import { adminService } from '../../services/adminService'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'

import toast from 'react-hot-toast'

const AdminUsers = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 8

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      console.log('Fetching admin users...')
      
      let usersData = []
      try {
        const data = await adminService.getAllUsers()
        usersData = data || []
        console.log('Users fetched:', usersData.length)
      } catch (apiError) {
        console.error('API failed, using sample data:', apiError)
        toast.error('Failed to fetch users. Using sample data.')
        
        // Sample data for testing
        usersData = [
          {
            id: 'admin-user-1',
            email: 'admin@coffeebeat.com',
            name: 'Admin User',
            role: 'ROLE_ADMIN',
            status: 'ACTIVE',
            createdAt: new Date().toISOString()
          },
          {
            id: 'chef-user-1',
            email: 'chef@coffeebeat.com',
            name: 'Chef User',
            role: 'ROLE_CHEF',
            status: 'ACTIVE',
            createdAt: new Date(Date.now() - 86400000).toISOString()
          },
          {
            id: 'waiter-user-1',
            email: 'waiter@coffeebeat.com',
            name: 'Waiter User',
            role: 'ROLE_WAITER',
            status: 'ACTIVE',
            createdAt: new Date(Date.now() - 172800000).toISOString()
          },
          {
            id: 'customer-user-1',
            email: 'customer@coffeebeat.com',
            name: 'Customer User',
            role: 'ROLE_CUSTOMER',
            status: 'ACTIVE',
            createdAt: new Date(Date.now() - 259200000).toISOString()
          }
        ]
      }
      
      setUsers(usersData)
      console.log('Admin users loaded:', usersData.length)
      
    } catch (error) {
      console.error('Failed to fetch users:', error)
      toast.error('Failed to load users')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const handleInviteStaff = async (inviteData) => {
    try {
      // Check if user is authenticated and has admin role
      const token = localStorage.getItem('token');
      let user = null;
      
      const userData = localStorage.getItem('user');
      if (userData && userData !== 'undefined' && userData !== 'null') {
        try {
          user = JSON.parse(userData);
        } catch (parseError) {
          console.error('Failed to parse user from localStorage:', parseError);
          user = {};
        }
      } else {
        user = {};
      }
      
      console.log('Current user:', user);
      console.log('Token exists:', !!token);
      console.log('User role:', user.role);
      console.log('Raw user data from localStorage:', userData);
      
      if (!token) {
        toast.error('Please login first');
        return;
      }
      
      // If user role is not found, try to get current user from API
      let userRole = user.role;
      if (!userRole) {
        try {
          const response = await fetch('http://localhost:8080/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const currentUser = await response.json();
            userRole = currentUser.role;
            user = currentUser;
            
            // Update localStorage with fresh user data
            localStorage.setItem('user', JSON.stringify(currentUser));
            console.log('Updated user from API:', currentUser);
          }
        } catch (apiError) {
          console.error('Failed to fetch current user:', apiError);
        }
      }
      
      // Check multiple role formats
      if (userRole !== 'ROLE_ADMIN' && userRole !== 'ADMIN') {
        toast.error(`Only admin users can invite staff. Your role: ${userRole || 'Not found'}. Please login as admin.`);
        return;
      }
      
      await adminService.createInviteToken(inviteData.email, inviteData.role)
      toast.success('Invite sent successfully! Email sent to ' + inviteData.email)
      setShowCreateModal(false)
    } catch (error) {
      console.error('Failed to invite staff:', error)
      
      if (error.response?.status === 401) {
        toast.error('Authentication failed. Please login again.')
        // Clear tokens and redirect to login
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        window.location.href = '/login'
      } else if (error.response?.status === 403) {
        toast.error('You do not have permission to invite staff.')
      } else {
        toast.error('Failed to invite staff. Please try again.')
      }
    }
  }

  const handleUpdateUser = async (userId, userData) => {
    try {
      await adminService.updateUser(userId, userData)
      fetchUsers()
      setShowEditModal(false)
      setSelectedUser(null)
    } catch (error) {
      console.error('Failed to update user:', error)
    }
  }

  // Delete user functionality removed as per requirements
  // const handleDeleteUser = async (userId) => { ... }

  const handleToggleUserStatus = async (userId, isActive) => {
    try {
      if (isActive) {
        await adminService.deactivateUser(userId)
      } else {
        await adminService.activateUser(userId)
      }
      fetchUsers()
    } catch (error) {
      console.error('Failed to toggle user status:', error)
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && user.active) ||
      (statusFilter === 'inactive' && !user.active)

    return matchesSearch && matchesRole && matchesStatus
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  // Pagination Logic
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  const handlePageChange = (page) => {
    setCurrentPage(page)
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
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage user accounts and permissions</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Invite Staff
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="ROLE_ADMIN">Admin</option>
              <option value="ROLE_CHEF">Chef</option>
              <option value="ROLE_WAITER">Waiter</option>
              <option value="ROLE_CUSTOMER">Customer</option>
            </select>
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div>
            <button className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Active</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedUsers.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {user.name?.charAt(0)?.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'ROLE_ADMIN' ? 'bg-purple-100 text-purple-800' :
                      user.role === 'ROLE_CHEF' ? 'bg-green-100 text-green-800' :
                        user.role === 'ROLE_WAITER' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                      }`}>
                      {user.role?.replace('ROLE_', '')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                      {user.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedUser(user)
                          setShowEditModal(true)
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleUserStatus(user.id, user.active)}
                        className={`${user.active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                      >
                        {user.active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-4 space-x-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded-md disabled:opacity-50 hover:bg-gray-100"
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-1 border rounded-md ${currentPage === page ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'
                }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded-md disabled:opacity-50 hover:bg-gray-100"
          >
            Next
          </button>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Invite New Staff</h2>
            <InviteStaffForm
              onSubmit={handleInviteStaff}
              onCancel={() => setShowCreateModal(false)}
            />
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Edit User</h2>
            <EditUserForm
              user={selectedUser}
              onSubmit={(userData) => handleUpdateUser(selectedUser.id, userData)}
              onCancel={() => {
                setShowEditModal(false)
                setSelectedUser(null)
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// InviteStaffForm Component
const InviteStaffForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    email: '',
    role: 'ROLE_WAITER'
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <input
          type="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Role</label>
        <select
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="ROLE_WAITER">Waiter</option>
          <option value="ROLE_CHEF">Chef</option>
          <option value="ROLE_ADMIN">Admin</option>
        </select>
      </div>
      <div className="bg-blue-50 p-4 rounded-md">
        <p className="text-sm text-blue-700">
          An invite token will be generated for this email. The user can use this token to register.
        </p>
      </div>
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          Send Invite
        </button>
      </div>
    </form>
  )
}

// EditUserForm Component
const EditUserForm = ({ user, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    role: user.role,
    active: user.active
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Name</label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <input
          type="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Role</label>
        <select
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="ROLE_CUSTOMER">Customer</option>
          <option value="ROLE_WAITER">Waiter</option>
          <option value="ROLE_CHEF">Chef</option>
          <option value="ROLE_ADMIN">Admin</option>
        </select>
      </div>
      <div className="flex items-center">
        <input
          type="checkbox"
          checked={formData.active}
          onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label className="ml-2 block text-sm text-gray-900">Active</label>
      </div>
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          Update User
        </button>
      </div>
    </form>
  )
}

export default AdminUsers
