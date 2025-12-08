import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { ShoppingCart, User, Menu, X, Sun, Moon, LogOut, Coffee } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

// Apply theme IMMEDIATELY when component mounts
const savedTheme = localStorage.getItem('theme')
const shouldBeDark = savedTheme === 'dark'
document.documentElement.classList.toggle('dark', shouldBeDark)
console.log('Navbar mount: Theme sync to', shouldBeDark ? 'dark' : 'light')

export const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(shouldBeDark) // Start with actual theme
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)
  const [cartItems, setCartItems] = useState([])

  // Re-sync theme on every render - BUT only if it's different
  useEffect(() => {
    const currentTheme = localStorage.getItem('theme')
    const shouldBeDark = currentTheme === 'dark'
    
    // Only update if theme is actually different
    if (isDarkMode !== shouldBeDark) {
      document.documentElement.classList.toggle('dark', shouldBeDark)
      setIsDarkMode(shouldBeDark)
      console.log('Navbar render: Theme corrected to', shouldBeDark ? 'dark' : 'light')
    }
  }, [location.pathname]) // Only run on route change

  // Load cart items from localStorage
  useEffect(() => {
    const loadCart = () => {
      const savedCart = localStorage.getItem('cart')
      if (savedCart) {
        try {
          const cart = JSON.parse(savedCart)
          setCartItems(cart)
        } catch (error) {
          console.error('Error parsing cart:', error)
          setCartItems([])
        }
      }
    }

    loadCart()
    
    // Listen for cart updates
    const handleStorageChange = () => {
      loadCart()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('cartUpdated', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('cartUpdated', handleStorageChange)
    }
  }, [])

  // Handle theme changes
  useEffect(() => {
    // Apply theme changes
    document.documentElement.classList.toggle('dark', isDarkMode)
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light')
    console.log('Navbar toggle: Theme changed to', isDarkMode ? 'dark' : 'light')
  }, [isDarkMode])

  const handleLogout = async () => {
    try {
      await logout()
      setIsProfileDropdownOpen(false)
      navigate('/')
      toast.success('Logged out successfully')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleCartClick = () => {
    if (!isAuthenticated) {
      toast.error('Please login to view cart')
      navigate('/login')
      return
    }
    // Navigate to cart page
    navigate('/cart')
  }

  const getCartItemCount = () => {
    return cartItems.reduce((total, item) => total + (item.quantity || 0), 0)
  }

  const isMenuPage = location.pathname === '/menu'
  const isDashboardPage = location.pathname.startsWith('/dashboard')

  return (
    <nav className="backdrop-blur-md bg-white dark:bg-gray-900 shadow-lg sticky top-0 z-50 border-b border-gray-200 dark:border-gray-700 animate-slideInLeft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 animate-coffee-steam">
            <Coffee className="w-8 h-8 text-gray-700 dark:text-gray-200" />
            <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Coffee Beat
            </span>
          </Link>

          {/* Desktop Navigation - Role Based */}
          <div className="hidden md:flex items-center space-x-8">
            {/* Customer/Public Navigation */}
            {(!isAuthenticated || user?.role === 'customer' || user?.role === 'ROLE_CUSTOMER') && (
              <>
                <Link
                  to="/"
                  className={`text-coffee-medium-roast dark:text-coffee-latte hover:text-coffee-caramel dark:hover:text-coffee-cream px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 hover:bg-coffee-cream/50 dark:hover:bg-coffee-mocha/50 ${
                    location.pathname === '/' ? 'text-coffee-caramel dark:text-coffee-cream bg-coffee-cream/50 dark:bg-coffee-mocha/50' : ''
                  }`}
                >
                  Home
                </Link>
                <Link
                  to="/menu"
                  className={`text-coffee-medium-roast dark:text-coffee-latte hover:text-coffee-caramel dark:hover:text-coffee-cream px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 hover:bg-coffee-cream/50 dark:hover:bg-coffee-mocha/50 ${
                    location.pathname === '/menu' ? 'text-coffee-caramel dark:text-coffee-cream bg-coffee-cream/50 dark:bg-coffee-mocha/50' : ''
                  }`}
                >
                  Menu
                </Link>
                <Link
                  to="/about"
                  className={`text-coffee-medium-roast dark:text-coffee-latte hover:text-coffee-caramel dark:hover:text-coffee-cream px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 hover:bg-coffee-cream/50 dark:hover:bg-coffee-mocha/50 ${
                    location.pathname === '/about' ? 'text-coffee-caramel dark:text-coffee-cream bg-coffee-cream/50 dark:bg-coffee-mocha/50' : ''
                  }`}
                >
                  About
                </Link>
              </>
            )}
            
            {/* Admin/Chef/Waiter Navigation - Only Dashboard */}
            {isAuthenticated && (user?.role === 'admin' || user?.role === 'ROLE_ADMIN' || user?.role === 'chef' || user?.role === 'ROLE_CHEF' || user?.role === 'waiter' || user?.role === 'ROLE_WAITER') && (
              <Link
                to="/dashboard"
                className={`text-coffee-medium-roast dark:text-coffee-latte hover:text-coffee-caramel dark:hover:text-coffee-cream px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 hover:bg-coffee-cream/50 dark:hover:bg-coffee-mocha/50 ${
                  location.pathname.startsWith('/dashboard') ? 'text-coffee-caramel dark:text-coffee-cream bg-coffee-cream/50 dark:bg-coffee-mocha/50' : ''
                }`}
              >
                Dashboard
              </Link>
            )}
            
                      </div>

          {/* Right side items */}
          <div className="flex items-center space-x-4">
            {/* Dark mode toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300"
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* Cart icon - show only when authenticated */}
            {isAuthenticated && (
              <button
                onClick={handleCartClick}
                className="relative p-2 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300"
              >
                <ShoppingCart className="h-5 w-5" />
                {getCartItemCount() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-coffee-caramel text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-coffee-steam">
                    {getCartItemCount()}
                  </span>
                )}
              </button>
            )}

            {/* Auth buttons */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                {/* Profile Section - Username + Profile Icon */}
                <div className="relative">
                  <button
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-coffee-medium-roast dark:text-coffee-latte hover:text-coffee-caramel dark:hover:text-coffee-cream hover:bg-coffee-cream/50 dark:hover:bg-black/50 transition-all duration-300"
                  >
                    <User className="h-4 w-4" />
                    <span>{user?.name || 'User'}</span>
                  </button>

                  {/* Profile Dropdown */}
                  {isProfileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-gray-100 dark:bg-gray-800 backdrop-blur-md rounded-lg shadow-xl py-2 z-50 border border-gray-300 dark:border-gray-600 animate-fadeInUp">
                      <Link
                        to="/dashboard/customer"
                        className="block px-4 py-2 text-sm text-coffee-medium-roast dark:text-coffee-latte hover:bg-coffee-cream/50 dark:hover:bg-black/50 hover:text-coffee-caramel dark:hover:text-coffee-cream transition-all duration-300"
                        onClick={() => setIsProfileDropdownOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-coffee-medium-roast dark:text-coffee-latte hover:bg-coffee-cream/50 dark:hover:bg-black/50 hover:text-coffee-caramel dark:hover:text-coffee-cream transition-all duration-300"
                      >
                        <div className="flex items-center space-x-2">
                          <LogOut className="h-4 w-4" />
                          <span>Logout</span>
                        </div>
                      </button>
                      
                                          </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="btn-coffee-primary text-coffee-cream px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
                >
                  Login / Sign In
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu - Role Based */}
        {isMobileMenuOpen && (
          <div className="md:hidden animate-fadeInUp">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {/* Customer/Public Navigation */}
              {(!isAuthenticated || user?.role === 'customer' || user?.role === 'ROLE_CUSTOMER') && (
                <>
                  <Link
                    to="/"
                    className="block px-3 py-2 rounded-md text-base font-medium text-coffee-medium-roast dark:text-coffee-latte hover:text-coffee-caramel dark:hover:text-coffee-cream hover:bg-coffee-cream/50 dark:hover:bg-black/50 transition-all duration-300"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Home
                  </Link>
                  <Link
                    to="/menu"
                    className="block px-3 py-2 rounded-md text-base font-medium text-coffee-medium-roast dark:text-coffee-latte hover:text-coffee-caramel dark:hover:text-coffee-cream hover:bg-coffee-cream/50 dark:hover:bg-black/50 transition-all duration-300"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Menu
                  </Link>
                  <Link
                    to="/about"
                    className="block px-3 py-2 rounded-md text-base font-medium text-coffee-medium-roast dark:text-coffee-latte hover:text-coffee-caramel dark:hover:text-coffee-cream hover:bg-coffee-cream/50 dark:hover:bg-black/50 transition-all duration-300"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    About
                  </Link>
                </>
              )}
              
              {/* Admin/Chef/Waiter Navigation - Only Dashboard */}
              {isAuthenticated && (user?.role === 'admin' || user?.role === 'ROLE_ADMIN' || user?.role === 'chef' || user?.role === 'ROLE_CHEF' || user?.role === 'waiter' || user?.role === 'ROLE_WAITER') && (
                <Link
                  to="/dashboard"
                  className="block px-3 py-2 rounded-md text-base font-medium text-coffee-medium-roast dark:text-coffee-latte hover:text-coffee-caramel dark:hover:text-coffee-cream hover:bg-coffee-cream/50 dark:hover:bg-black/50 transition-all duration-300"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
              )}
              
                            
              {isAuthenticated && (
                <>
                  <button
                    onClick={() => {
                      handleLogout()
                      setIsMobileMenuOpen(false)
                    }}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-coffee-medium-roast dark:text-coffee-latte hover:text-coffee-caramel dark:hover:text-coffee-cream hover:bg-coffee-cream/50 dark:hover:bg-black/50 transition-all duration-300"
                  >
                    Logout
                  </button>
                </>
              )}
              {!isAuthenticated && (
                <Link
                  to="/login"
                  className="block px-3 py-2 rounded-md text-base font-medium text-coffee-medium-roast dark:text-coffee-latte hover:text-coffee-caramel dark:hover:text-coffee-cream hover:bg-coffee-cream/50 dark:hover:bg-black/50 transition-all duration-300"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Login / Sign In
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
