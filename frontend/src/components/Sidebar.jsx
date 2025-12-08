import { NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  Home, 
  User, 
  ShoppingCart, 
  Calendar,
  BarChart3,
  Settings,
  Coffee,
  Users,
  ClipboardList,
  Truck
} from 'lucide-react'

export const Sidebar = () => {
  const { user, logout } = useAuth()

  const getNavItems = () => {
    const role = user?.role

    const commonItems = [
      {
        name: 'Dashboard',
        href: '/dashboard',
        icon: Home,
      },
    ]

    const adminItems = [
      ...commonItems,
      {
        name: 'Analytics',
        href: '/dashboard/admin/analytics',
        icon: BarChart3,
      },
      {
        name: 'Users',
        href: '/dashboard/admin/users',
        icon: Users,
      },
      {
        name: 'Products',
        href: '/dashboard/admin/products',
        icon: Coffee,
      },
      {
        name: 'Orders',
        href: '/dashboard/admin/orders',
        icon: ShoppingCart,
      },
      {
        name: 'Bookings',
        href: '/dashboard/admin/bookings',
        icon: Calendar,
      },
      {
        name: 'Settings',
        href: '/dashboard/admin/settings',
        icon: Settings,
      },
    ]

    const chefItems = [
      ...commonItems,
      {
        name: 'Orders',
        href: '/dashboard/chef/orders',
        icon: ClipboardList,
      },
      {
        name: 'Menu Items',
        href: '/dashboard/chef/menu',
        icon: Coffee,
      },
    ]

    const waiterItems = [
      ...commonItems,
      {
        name: 'Orders',
        href: '/dashboard/waiter/orders',
        icon: ShoppingCart,
      },
      {
        name: 'Tables',
        href: '/dashboard/waiter/tables',
        icon: Calendar,
      },
      {
        name: 'Delivery',
        href: '/dashboard/waiter/delivery',
        icon: Truck,
      },
    ]

    const customerItems = [
      {
        name: 'Dashboard',
        href: '/dashboard/customer',
        icon: Home,
      },
      {
        name: 'My Orders',
        href: '/dashboard/customer/orders',
        icon: ShoppingCart,
      },
      {
        name: 'My Bookings',
        href: '/dashboard/customer/bookings',
        icon: Calendar,
      },
      {
        name: 'Profile',
        href: '/dashboard/customer/profile',
        icon: User,
      },
    ]

    switch (role) {
      case 'admin':
      case 'ROLE_ADMIN':
        return adminItems
      case 'chef':
      case 'ROLE_CHEF':
        return chefItems
      case 'waiter':
      case 'ROLE_WAITER':
        return waiterItems
      case 'customer':
      case 'ROLE_CUSTOMER':
        return customerItems
      default:
        return commonItems
    }
  }

  const navItems = getNavItems()

  return (
    <div className="flex flex-col w-64 bg-white shadow-lg">
      <div className="flex items-center justify-center h-16 bg-blue-600">
        <h1 className="text-xl font-bold text-white">Coffee Beat</h1>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`
            }
          >
            <item.icon className="mr-3 h-5 w-5" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-500">
              {user?.role?.replace('ROLE_', '').toLowerCase()}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  )
}
