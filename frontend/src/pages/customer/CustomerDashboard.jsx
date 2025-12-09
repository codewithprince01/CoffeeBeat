import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { orderService } from '../../services/orderService'
import { bookingService } from '../../services/bookingService'
import { authService } from '../../services/authService'
import { productService } from '../../services/productService'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { Heart, ShoppingCart, Plus, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { getStoredImage, getUploadedImage } from '../../utils/imageUpload'

export const CustomerDashboard = () => {
  const { user, isAuthenticated } = useAuth()
  const [orders, setOrders] = useState([])
  const [bookings, setBookings] = useState([])
  const [favorites, setFavorites] = useState([])
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showProductModal, setShowProductModal] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Helper function to get the correct image URL
  const getProductImageUrl = (product) => {
    if (product && product.imageUrl) {
      // For backend uploaded images (like /uploads/products/), return with full URL
      if (product.imageUrl.startsWith('/uploads/')) {
        console.log('Using backend uploaded image:', product.imageUrl)
        return `${import.meta.env.VITE_API_URL || 'http://localhost:8081'}${product.imageUrl}`
      }
      
      // Check if it's a stored uploaded image
      if (product.imageUrl.startsWith('/images/products/')) {
        const filename = product.imageUrl.split('/').pop()
        // Try to get from memory storage first
        const uploadedImage = getUploadedImage(filename)
        if (uploadedImage) {
          return uploadedImage // Return the base64 data from memory
        }
        // Fallback to localStorage check
        const storedImage = getStoredImage(filename)
        if (storedImage) {
          return storedImage
        }
      }
      
      // For base64 images, check if it's valid
      if (product.imageUrl.startsWith('data:')) {
        // If it's the shortened "data:image/..." from backend, use default image
        if (product.imageUrl === 'data:image/...' || product.imageUrl.startsWith('data:image/...') || product.imageUrl.length < 50) {
          console.log('Using default image for invalid/short data URL')
          // Use placeholder images based on product category
          const category = product.category?.toLowerCase() || 'coffee'
          const placeholderImages = {
            'coffee': 'https://images.unsplash.com/photo-1561048021-3e5c8d5b7d7b?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80',
            'tea': 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cda9?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80',
            'food': 'https://images.unsplash.com/photo-1565299624946-b28f40a0fe38?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80',
            'pastry': 'https://images.unsplash.com/photo-1558969875-861e8f5f6e91?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80',
            'pastries': 'https://images.unsplash.com/photo-1558969875-861e8f5f6e91?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80'
          }
          return placeholderImages[category] || placeholderImages['coffee']
        }
        // Only return valid base64 images
        if (product.imageUrl.includes('base64,')) {
          return product.imageUrl
        }
      }
      
      // For other images, return directly
      return product.imageUrl
    }
    
    // If no imageUrl, use default
    return "https://images.unsplash.com/photo-1554118811-1e0d58224f24?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80"
  }

  // Sample data for fallback
  const getSampleOrders = () => [
    {
      id: 'sample-order-1',
      userId: 'default-user',
      items: [
        { productId: 'coffee-1', productName: 'Cappuccino', price: 4.50, quantity: 2 },
        { productId: 'pastry-1', productName: 'Croissant', price: 3.00, quantity: 1 }
      ],
      totalPrice: 12.00,
      status: 'PENDING',
      notes: 'Sample order for testing',
      createdAt: new Date().toISOString()
    }
  ]

  const getSampleBookings = () => [
    {
      id: 'sample-booking-1',
      userId: 'default-user',
      tableNumber: 'T1',
      peopleCount: 4,
      timeSlot: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      status: 'BOOKED',
      notes: 'Sample booking for testing',
      createdAt: new Date().toISOString()
    }
  ]

  useEffect(() => {
    fetchData()
    loadFavoritesFromStorage()
    loadCartFromStorage()
  }, [user])

  useEffect(() => {
    loadFavoritesFromStorage()
  }, [user])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      console.log('Fetching dashboard data...')
      
      // Use AuthContext isAuthenticated instead of authService check
      if (!isAuthenticated || !user) {
        console.log('User not authenticated, showing empty data')
        setOrders([])
        setBookings([])
        setLoading(false)
        return
      }
      
      let ordersData = []
      let bookingsData = []
      
      try {
        const [ordersResponse, bookingsResponse] = await Promise.all([
          orderService.getMyOrders().catch(err => {
            console.error('Failed to fetch orders:', err)
            return []
          }),
          bookingService.getCustomerBookings().catch(err => {
            console.error('Failed to fetch bookings:', err)
            return []
          })
        ])

        console.log('API responses:', { ordersResponse, bookingsResponse })

        // Use API data if available
        if (ordersResponse && (ordersResponse?.content || ordersResponse)?.length > 0) {
          ordersData = ordersResponse?.content || ordersResponse || []
        }
        
        if (bookingsResponse && bookingsResponse?.length > 0) {
          bookingsData = bookingsResponse || []
        }
        
      } catch (error) {
        console.error('API calls failed completely:', error)
        ordersData = []
        bookingsData = []
      }
      
      // Sort orders by time (newest first)
      const sortedOrders = [...ordersData].sort((a, b) => {
        const dateFields = ['createdAt', 'orderDate', 'time', 'created_at', 'timestamp', 'date']
        let dateA = 0, dateB = 0
        
        for (const field of dateFields) {
          if (a[field]) {
            dateA = new Date(a[field]).getTime()
            break
          }
        }
        for (const field of dateFields) {
          if (b[field]) {
            dateB = new Date(b[field]).getTime()
            break
          }
        }
        
        // If dates are the same or 0, sort by ID (assuming higher ID = newer)
        if (dateA === dateB) {
          return (b.id || 0) - (a.id || 0)
        }
        
        return dateB - dateA // Newest first
      })
      
      // Sort bookings by time (newest first)
      const sortedBookings = [...bookingsData].sort((a, b) => {
        const dateFields = ['createdAt', 'timeSlot', 'bookingDate', 'created_at', 'timestamp', 'date']
        let dateA = 0, dateB = 0
        
        for (const field of dateFields) {
          if (a[field]) {
            dateA = new Date(a[field]).getTime()
            break
          }
        }
        for (const field of dateFields) {
          if (b[field]) {
            dateB = new Date(b[field]).getTime()
            break
          }
        }
        
        // If dates are the same or 0, sort by ID (assuming higher ID = newer)
        if (dateA === dateB) {
          return (b.id || 0) - (a.id || 0)
        }
        
        return dateB - dateA // Newest first
      })

      console.log('Setting dashboard state:', { sortedOrders, sortedBookings, userData })
      
      // Format orders for better display
      const formattedOrders = sortedOrders.map(order => ({
        ...order,
        id: order.id || `order-${Date.now()}`,
        totalPrice: order.totalPrice || order.totalAmount || 0,
        status: order.status || 'PENDING',
        items: order.items || [],
        createdAt: order.createdAt || new Date().toISOString()
      }))
      
      // Format bookings for better display
      const formattedBookings = sortedBookings.map(booking => ({
        ...booking,
        id: booking.id || `booking-${Date.now()}`,
        tableNumber: booking.tableNumber || booking.tableId || 'T1',
        peopleCount: booking.peopleCount || booking.numberOfGuests || 2,
        timeSlot: booking.timeSlot || booking.bookingDate || new Date().toISOString(),
        status: booking.status || 'BOOKED',
        createdAt: booking.createdAt || new Date().toISOString()
      }))
      
      setOrders(formattedOrders)
      setBookings(formattedBookings)
      setUserData(userData)
      
            
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      toast.error('Failed to load dashboard data.')
      setOrders([])
      setBookings([])
      setUserData(null)
    } finally {
      setLoading(false)
    }
  }

  const loadFavoritesFromStorage = () => {
    try {
      // Use the same key as MenuPage for consistency
      const savedFavorites = localStorage.getItem('favorites')
      if (savedFavorites) {
        const favoriteIds = JSON.parse(savedFavorites)
        
        // Check if stored data is old format (full objects) or new format (IDs only)
        if (favoriteIds.length > 0 && typeof favoriteIds[0] === 'object') {
          // Old format - convert to new format and use directly
          const ids = favoriteIds.map(fav => fav.id)
          localStorage.setItem('favorites', JSON.stringify(ids))
          setFavorites(favoriteIds)
        } else {
          // New format - IDs only, need to fetch full product data
          console.log('Favorites loaded as IDs, fetching product details...')
          fetchFavoriteProducts(favoriteIds)
        }
      } else {
        setFavorites([])
      }
    } catch (error) {
      console.error('Failed to load favorites from storage:', error)
      setFavorites([])
    }
  }

  const loadCartFromStorage = () => {
    const savedCart = localStorage.getItem('cart')
    if (savedCart) {
      setCart(JSON.parse(savedCart))
    }
  }

  const fetchFavoriteProducts = async (favoriteIds) => {
    try {
      const favoriteProducts = []
      
      for (const id of favoriteIds) {
        try {
          const response = await productService.getProductById(id)
          if (response.success && response.data) {
            favoriteProducts.push(response.data)
          }
        } catch (error) {
          console.error(`Failed to fetch product ${id}:`, error)
        }
      }
      
      setFavorites(favoriteProducts)
      console.log(`Loaded ${favoriteProducts.length} favorite products`)
    } catch (error) {
      console.error('Failed to fetch favorite products:', error)
      // Create placeholder products as fallback
      const placeholderFavorites = favoriteIds.map(id => ({
        id: id,
        name: `Product ${id}`,
        price: 0,
        imageUrl: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80",
        description: "Product details unavailable"
      }))
      setFavorites(placeholderFavorites)
    }
  }

  const saveCartToStorage = (cartData) => {
    localStorage.setItem('cart', JSON.stringify(cartData))
  }

  const saveFavoritesToStorage = (favoritesData) => {
    try {
      // Store only product IDs to match MenuPage format
      const favoriteIds = favoritesData.map(fav => fav.id)
      localStorage.setItem('favorites', JSON.stringify(favoriteIds))
    } catch (error) {
      console.error('Failed to save favorites to storage:', error)
    }
  }

  const toggleFavorite = (product) => {
    const isFavorite = favorites.some(fav => fav.id === product.id)
    let newFavorites
    
    if (isFavorite) {
      // Remove from favorites
      newFavorites = favorites.filter(fav => fav.id !== product.id)
      toast.success(`${product.name} removed from favorites`)
    } else {
      // Add to favorites
      newFavorites = [...favorites, product]
      toast.success(`${product.name} added to favorites`)
    }
    
    setFavorites(newFavorites)
    saveFavoritesToStorage(newFavorites)
  }

  const isFavorite = (productId) => {
    return favorites.some(fav => fav.id === productId)
  }

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id)
    let newCart
    
    if (existingItem) {
      // Update quantity
      newCart = cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
      toast.success(`${product.name} quantity updated`)
    } else {
      // Add new item
      newCart = [...cart, { ...product, quantity: 1 }]
      toast.success(`${product.name} added to cart`)
    }
    
    setCart(newCart)
    saveCartToStorage(newCart)
  }

  const viewProductDetails = (product) => {
    setSelectedProduct(product)
    setShowProductModal(true)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800'
      case 'PREPARING': return 'bg-purple-100 text-purple-800'
      case 'READY': return 'bg-green-100 text-green-800'
      case 'DELIVERED': return 'bg-gray-100 text-gray-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      case 'BOOKED': return 'bg-blue-100 text-blue-800'
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Dashboard</h1>
          <p className="mt-1 text-gray-600">Manage your orders, bookings, and profile</p>
          {userData && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <span className="font-medium">Welcome back, {userData.name || userData.email}!</span>
                {userData.address && (
                  <span className="block mt-1">Delivery Address: {userData.address}</span>
                )}
              </p>
            </div>
          )}
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Link
          to="/dashboard/customer/orders"
          className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Orders</h3>
              <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
            </div>
          </div>
        </Link>

        <Link
          to="/dashboard/customer/bookings"
          className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Bookings</h3>
              <p className="text-2xl font-bold text-gray-900">{bookings.length}</p>
            </div>
          </div>
        </Link>

        <Link
          to="/dashboard/customer/profile"
          className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Profile</h3>
              <p className="text-sm text-gray-500">Manage account</p>
            </div>
          </div>
        </Link>

        <Link
          to="/menu"
          className="bg-gradient-to-r from-green-600 to-green-700 p-6 rounded-lg shadow hover:shadow-md transition-shadow text-white"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-white">Quick Order</h3>
              <p className="text-sm text-green-100">Place order now</p>
            </div>
          </div>
        </Link>
      </div>

      
      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Recent Orders</h3>
            <Link
              to="/dashboard/customer/orders"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {orders.slice(0, 3).length === 0 ? (
              <p className="text-gray-500 text-center py-4">No orders yet</p>
            ) : (
              orders.slice(0, 3).map((order, index) => (
                <div key={order.id || `order-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Order #{order.id}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()} • ${order.totalPrice?.toFixed(2)}
                    </p>
                    {order.items && order.items.length > 0 && (
                      <p className="text-xs text-gray-400 mt-1">
                        {order.items.length} items • {order.items[0]?.productName || 'Item'}
                        {order.items.length > 1 && ` +${order.items.length - 1} more`}
                      </p>
                    )}
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Recent Bookings</h3>
            <Link
              to="/dashboard/customer/bookings"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {bookings.slice(0, 3).length === 0 ? (
              <p className="text-gray-500 text-center py-4">No bookings yet</p>
            ) : (
              bookings.slice(0, 3).map((booking, index) => (
                <div key={booking.id || `booking-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Table {booking.tableNumber}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(booking.timeSlot).toLocaleDateString()} • {booking.peopleCount} guests
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(booking.timeSlot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                    {booking.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Favorite Products */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center mb-4">
          <Heart className="h-5 w-5 text-red-500 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Your Favorites</h3>
        </div>
        {favorites.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {favorites.map((product, index) => (
              <div key={product.id || `product-${index}`} className="bg-gray-50 rounded-lg overflow-hidden hover:bg-gray-100 transition-colors relative">
                <div className="relative">
                  <img
                    src={getProductImageUrl(product)}
                    alt={product.name}
                    className="w-full h-32 object-cover"
                  />
                  <button
                    onClick={() => toggleFavorite(product)}
                    className={`absolute top-2 right-2 p-2 backdrop-blur-sm rounded-full shadow-lg transition-colors ${
                      isFavorite(product.id) 
                        ? 'bg-red-500/90 text-white' 
                        : 'bg-white/90 text-gray-600 hover:bg-white'
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${isFavorite(product.id) ? 'fill-current' : ''}`} />
                  </button>
                </div>
                <div className="p-4">
                  <h4 className="font-medium text-gray-900">{product.name}</h4>
                  <p className="text-sm text-gray-500 mt-1">{product.description}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-lg font-bold text-blue-600">${product.price?.toFixed(2)}</span>
                    <span className="text-sm text-gray-500">{product.category}</span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => addToCart(product)}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add to Cart
                    </button>
                    <button
                      onClick={() => viewProductDetails(product)}
                      className="inline-flex items-center px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-colors"
                    >
                      View
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No favorite items yet</p>
            <Link 
              to="/menu"
              className="inline-flex items-center mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Browse Menu
            </Link>
          </div>
        )}
      </div>

      {/* Product Details Modal */}
      {showProductModal && selectedProduct && (
        <div className="fixed inset-0 backdrop-blur-sm bg-gray-500/25 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="relative">
              <img
                src={selectedProduct.imageUrl || "https://images.unsplash.com/photo-1554118811-1e0d58224f24?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"}
                alt={selectedProduct.name}
                className="w-full h-64 object-cover rounded-t-lg"
              />
              <button
                onClick={() => setShowProductModal(false)}
                className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors"
              >
                <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <button
                onClick={() => toggleFavorite(selectedProduct)}
                className={`absolute top-4 left-4 p-2 backdrop-blur-sm rounded-full shadow-lg transition-colors ${
                  isFavorite(selectedProduct.id) 
                    ? 'bg-red-500/90 text-white' 
                    : 'bg-white/90 text-gray-600 hover:bg-white'
                }`}
              >
                <Heart className={`h-5 w-5 ${isFavorite(selectedProduct.id) ? 'fill-current' : ''}`} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{selectedProduct.name}</h3>
                  <p className="text-lg text-gray-600 mt-1">{selectedProduct.category}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-blue-600">${selectedProduct.price?.toFixed(2)}</p>
                  <p className="text-sm text-gray-500 mt-1">In Stock: {selectedProduct.stock || 0}</p>
                </div>
              </div>
              
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Description</h4>
                <p className="text-gray-600">{selectedProduct.description}</p>
              </div>
              
              {selectedProduct.ingredients && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Ingredients</h4>
                  <p className="text-gray-600">{selectedProduct.ingredients}</p>
                </div>
              )}
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    addToCart(selectedProduct)
                    setShowProductModal(false)
                  }}
                  className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Plus className="h-5 w-5 inline mr-2" />
                  Add to Cart
                </button>
                <button
                  onClick={() => setShowProductModal(false)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CustomerDashboard
