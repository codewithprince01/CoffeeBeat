import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { productService } from '../services/productService'
import { orderService } from '../services/orderService'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import Navbar from '../components/Navbar'
import toast from 'react-hot-toast'
import { Search, Heart } from 'lucide-react'
import { getStoredImage, getUploadedImage, loadStoredImages } from '../utils/imageUpload'
import { getAllProducts } from '../utils/productLoader'

export const MenuPage = () => {
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showProductModal, setShowProductModal] = useState(false)
  const [pendingProduct, setPendingProduct] = useState(null)
  const [address, setAddress] = useState('')
  const [showAddressInput, setShowAddressInput] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [favorites, setFavorites] = useState([])

  // Helper function to get the correct image URL
  const getProductImageUrl = (product) => {
    console.log('getProductImageUrl called with:', product); // Debug
    if (product && product.imageUrl) {
      console.log('Using imageUrl:', product.imageUrl); // Debug

      // Check if it's a stored uploaded image
      if (product.imageUrl.startsWith('/images/products/')) {
        const filename = product.imageUrl.split('/').pop()
        console.log('Looking for stored image:', filename); // Debug
        // Try to get from memory storage first
        const uploadedImage = getUploadedImage(filename)
        if (uploadedImage) {
          console.log('Found uploaded image in memory'); // Debug
          return uploadedImage // Return the base64 data from memory
        }
        // Fallback to localStorage check
        const storedImage = getStoredImage(filename)
        console.log('Stored image found:', !!storedImage); // Debug
        if (storedImage) {
          return storedImage
        }
      }

      // For menu images (like /images/menu/), return directly
      if (product.imageUrl && product.imageUrl.startsWith('/images/menu/')) {
        console.log('Using menu image directly:', product.imageUrl); // Debug
        return product.imageUrl
      }

      // For backend uploaded images (like /uploads/products/), return with full URL
      if (product.imageUrl && product.imageUrl.startsWith('/uploads/')) {
        console.log('Using backend uploaded image:', product.imageUrl); // Debug
        return `${import.meta.env.VITE_API_URL || 'http://localhost:8081'}${product.imageUrl}`
      }

      // For base64 images, check if it's valid
      if (product.imageUrl && product.imageUrl.startsWith('data:')) {
        console.log('Checking base64 image:', product.imageUrl.substring(0, 30)); // Debug
        // If it's the shortened "data:image/..." from backend, use default image
        if (product.imageUrl === 'data:image/...' || product.imageUrl.startsWith('data:image/...') || product.imageUrl.length < 50) {
          console.log('Using default image for invalid/short data URL'); // Debug
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
    console.log('Using default image'); // Debug
    return '/images/menu/espresso.svg'
  }

  // Helper function for cart items (use same logic as menu products)
  const getCartItemImageUrl = (item) => {
    console.log('Cart item in getCartItemImageUrl:', item); // Debug
    console.log('Cart item imageUrl:', item?.imageUrl); // Debug
    console.log('Cart item name:', item?.name); // Debug
    // Use the same logic as getProductImageUrl for consistency
    return getProductImageUrl(item)
  }

  useEffect(() => {
    // Load stored images from localStorage on app start
    loadStoredImages()

    fetchProducts()
    fetchCategories()
    loadCartFromStorage()
    // Don't load favorites here - load them after products are fetched

    // Check if there's a pending product to add after login
    if (isAuthenticated && pendingProduct) {
      addToCart(pendingProduct)
      setPendingProduct(null)
    }

    // Listen for cart open event from Navbar
    const handleOpenCart = () => {
      setIsCartOpen(true)
    }

    window.addEventListener('openCart', handleOpenCart)

    // Ensure sample categories are always available
    setTimeout(() => {
      if (categories.length === 0) {
        console.log('📋 Setting sample categories as fallback')
        setCategories(['Coffee', 'Tea', 'Food', 'Pastry'])
      }
    }, 1000)

    return () => {
      window.removeEventListener('openCart', handleOpenCart)
    }
  }, [isAuthenticated, pendingProduct])

  const fetchProducts = async () => {
    try {
      console.log('🔍 Fetching products from backend API...')
      const response = await productService.getProducts()
      console.log('📦 Products response:', response)
      const productsData = response.data || response.content || response || []

      // If no products from API, use sample data
      if (!productsData || productsData.length === 0) {
        console.log('⚠️ No products returned from API, using sample products')
        const sampleProducts = [
          {
            id: '1',
            name: 'Cappuccino',
            description: 'Rich espresso with steamed milk foam',
            price: 4.50,
            category: 'Coffee',
            stock: 50,
            available: true,
            imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80'
          },
          {
            id: '2',
            name: 'Espresso',
            description: 'Strong black coffee shot',
            price: 3.00,
            category: 'Coffee',
            stock: 100,
            available: true,
            imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80'
          },
          {
            id: '3',
            name: 'Latte',
            description: 'Smooth espresso with steamed milk',
            price: 5.00,
            category: 'Coffee',
            stock: 30,
            available: true,
            imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80'
          },
          {
            id: '4',
            name: 'Croissant',
            description: 'Buttery French pastry',
            price: 3.50,
            category: 'Pastries',
            stock: 20,
            available: true,
            imageUrl: 'https://images.unsplash.com/photo-1559183007-84df0313c84f?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80'
          },
          {
            id: '5',
            name: 'Muffin',
            description: 'Fresh baked blueberry muffin',
            price: 3.00,
            category: 'Pastries',
            stock: 15,
            available: true,
            imageUrl: 'https://images.unsplash.com/photo-1559183007-84df0313c84f?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80'
          },
          {
            id: '6',
            name: 'Sandwich',
            description: 'Club sandwich with fries',
            price: 8.50,
            category: 'Food',
            stock: 10,
            available: true,
            imageUrl: 'https://images.unsplash.com/photo-1568901346406-9ace603c5ae0?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80'
          }
        ]
        setProducts(sampleProducts)
        setCategories(['Coffee', 'Pastries', 'Food'])
        toast('No products in database, showing sample menu')
      } else {
        console.log('✅ Successfully loaded', productsData.length, 'products from backend')
        setProducts(productsData)
      }

      console.log('📋 Products set successfully')
    } catch (error) {
      console.error('❌ Failed to load menu items:', error)
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      })

      // Use sample data on error
      const sampleProducts = [
        {
          id: '1',
          name: 'Cappuccino',
          description: 'Rich espresso with steamed milk foam',
          price: 4.50,
          category: 'Coffee',
          stock: 50,
          available: true,
          imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80'
        }
      ]
      setProducts(sampleProducts)
      setCategories(['Coffee'])

      // Show more helpful error message
      const errorMsg = error.response?.data?.message || error.message || 'Unknown error'
      toast.error(`Failed to load products: ${errorMsg}. Using sample data.`)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      console.log('🔍 Fetching categories...')
      const response = await productService.getCategories()
      console.log('📂 Categories response:', response)
      setCategories(Array.isArray(response) ? response : (response?.data || response?.categories || []))
      console.log('📋 Categories set:', response)
    } catch (error) {
      console.error('Failed to load categories:', error)
      // Set sample categories on error
      setCategories(['Coffee', 'Tea', 'Food', 'Pastry'])
    }
  }

  const loadCartFromStorage = () => {
    const savedCart = localStorage.getItem('cart')
    if (savedCart) {
      setCart(JSON.parse(savedCart))
    }
  }

  // Load favorites after products are loaded
  useEffect(() => {
    if (products.length > 0) {
      loadFavoritesFromStorage()
    }
  }, [products])

  const saveCartToStorage = (cartData) => {
    try {
      localStorage.setItem('cart', JSON.stringify(cartData))
    } catch (error) {
      console.error('Failed to save cart to storage:', error)
      // If storage is full, clear some old data and try again
      if (error.name === 'QuotaExceededError') {
        try {
          // Clear all localStorage data except essential auth data
          const keysToKeep = ['token', 'refreshToken', 'user']
          const allKeys = Object.keys(localStorage)
          const keysToRemove = allKeys.filter(key => !keysToKeep.includes(key))
          
          keysToRemove.forEach(key => {
            localStorage.removeItem(key)
          })
          
          // Try saving minimal cart data
          const minimalCart = cartData.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity
          }))
          localStorage.setItem('cart', JSON.stringify(minimalCart))
          toast.error('Storage was full, data has been cleaned up')
        } catch (retryError) {
          console.error('Failed to save cart even after cleanup:', retryError)
          // If still fails, don't save to localStorage but keep cart in memory
          toast.error('Cart saved in memory only due to storage limitations')
        }
      }
    }
  }

  const loadFavoritesFromStorage = () => {
    try {
      const savedFavorites = localStorage.getItem('favorites')
      if (savedFavorites) {
        const favoriteIds = JSON.parse(savedFavorites)
        
        // Check if stored data is old format (full objects) or new format (IDs only)
        if (favoriteIds.length > 0 && typeof favoriteIds[0] === 'object') {
          // Old format - convert to new format
          const ids = favoriteIds.map(fav => fav.id)
          localStorage.setItem('favorites', JSON.stringify(ids))
          setFavorites(favoriteIds)
        } else {
          // New format - reconstruct full product objects from IDs
          const fullFavorites = favoriteIds
            .map(id => products.find(product => product.id === id))
            .filter(product => product !== undefined)
          setFavorites(fullFavorites)
        }
      }
    } catch (error) {
      console.error('Failed to load favorites from storage:', error)
      // Clear corrupted data
      localStorage.removeItem('favorites')
    }
  }

  const saveFavoritesToStorage = (favoritesData) => {
    try {
      // Store only product IDs to save space
      const favoriteIds = favoritesData.map(fav => fav.id)
      localStorage.setItem('favorites', JSON.stringify(favoriteIds))
    } catch (error) {
      console.error('Failed to save favorites to storage:', error)
      // If storage is full, clear some old data and try again
      if (error.name === 'QuotaExceededError') {
        try {
          localStorage.removeItem('favorites')
          // Try saving just the IDs again
          const favoriteIds = favoritesData.map(fav => fav.id)
          localStorage.setItem('favorites', JSON.stringify(favoriteIds))
          toast.error('Storage was full, favorites have been reset')
        } catch (retryError) {
          console.error('Failed to save favorites even after cleanup:', retryError)
          toast.error('Unable to save favorites due to storage limitations')
        }
      }
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

  const filteredProducts = (products || []).filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category?.toLowerCase() === selectedCategory.toLowerCase()
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase())

    // Temporarily remove availability filter to debug
    const isAvailable = true // product.available && product.stock > 0

    console.log('🔍 Filtering product:', {
      name: product.name,
      available: product.available,
      stock: product.stock,
      matchesCategory,
      matchesSearch,
      isAvailable,
      willShow: matchesCategory && matchesSearch && isAvailable
    })

    return matchesCategory && matchesSearch && isAvailable
  })

  const addToCart = (product, quantity = 1) => {
    if (!isAuthenticated) {
      // Show normal toast message and redirect immediately
      toast('Please login first')
      setPendingProduct(product)
      navigate('/login')
      return
    }

    // Add to cart if authenticated
    const existingItem = cart.find(item => item.id === product.id)
    let newCart

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity
      if (newQuantity > product.stock) {
        toast.error(`Only ${product.stock} items available in stock`)
        return
      }
      newCart = cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: newQuantity }
          : item
      )
    } else {
      if (quantity > product.stock) {
        toast.error(`Only ${product.stock} items available in stock`)
        return
      }
      newCart = [...cart, { ...product, quantity }]
    }

    setCart(newCart)
    saveCartToStorage(newCart)
    toast.success(`${product.name} added to cart`)
  }

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(productId)
      return
    }

    const product = products.find(p => p.id === productId)
    if (newQuantity > product.stock) {
      toast.error(`Only ${product.stock} items available in stock`)
      return
    }

    const newCart = cart.map(item =>
      item.id === productId
        ? { ...item, quantity: newQuantity }
        : item
    )
    setCart(newCart)
    saveCartToStorage(newCart)
  }

  const removeFromCart = (productId) => {
    const product = cart.find(item => item.id === productId)
    const newCart = cart.filter(item => item.id !== productId)
    setCart(newCart)
    saveCartToStorage(newCart)
    toast.success(`${product.name} removed from cart`)
  }

  const clearCart = () => {
    setCart([])
    saveCartToStorage([])
    toast.success('Cart cleared')
  }

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const handlePlaceOrder = async () => {
    if (!showAddressInput) {
      setShowAddressInput(true)
      return
    }

    if (!address.trim()) {
      toast.error('Please enter your delivery address')
      return
    }

    // Check if user is authenticated
    if (!isAuthenticated || !user) {
      toast.error('Please login to place an order')
      navigate('/login')
      return
    }

    try {
      // Prepare order data
      const orderItems = cart.map(item => ({
        productId: item.id,
        productName: item.name,
        price: item.price,
        quantity: item.quantity
      }))

      const subtotal = getTotalPrice()
      const deliveryFee = 2.00
      const tax = subtotal * 0.08
      const totalPrice = subtotal + deliveryFee + tax

      const orderData = {
        userId: user?.id || user?.sub || 'anonymous', // Use user ID from auth context
        items: orderItems,
        totalPrice: totalPrice,
        paymentStatus: 'PENDING',
        status: 'PENDING',
        orderType: 'DELIVERY',
        notes: `Delivery Address: ${address}`
      }

      console.log('Creating order with data:', orderData)
      console.log('User object:', user)
      console.log('User ID:', user?.id || user?.sub || 'anonymous')
      console.log('Is authenticated:', isAuthenticated)
      console.log('Token in localStorage:', localStorage.getItem('token'))
      
      // Save order to database
      const response = await orderService.createOrder(orderData)
      console.log('Order created successfully:', response)
      console.log('Order response ID:', response.id)
      
      // Verify order was saved by checking if it has an ID
      if (!response.id) {
        throw new Error('Order was not saved properly - no ID returned')
      }
      
      // Show order confirmation
      setOrderPlaced(true)
      
      setTimeout(() => {
        clearCart()
        setIsCartOpen(false)
        setShowAddressInput(false)
        setAddress('')
        setOrderPlaced(false)
        toast.success(`Order placed successfully! Order ID: ${response.id}. Cash on Delivery.`)
      }, 3000)
      
    } catch (error) {
      console.error('Failed to place order:', error)
      console.error('Error response:', error.response?.data)
      console.error('Error status:', error.response?.status)
      console.error('Error message:', error.message)
      
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.')
        navigate('/login')
      } else if (error.response?.status === 400) {
        toast.error('Invalid order data. Please try again.')
      } else if (error.response?.status === 403) {
        toast.error('Access denied. Please login with proper credentials.')
        navigate('/login')
      } else {
        toast.error('Failed to place order. Please try again.')
      }
    }
  }

  const viewProductDetails = (product) => {
    setSelectedProduct(product)
    setShowProductModal(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Our Menu</h1>
                <p className="mt-2 text-gray-600">Discover our delicious coffee and food options</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search menu..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <svg className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-2 py-4 overflow-x-auto">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-6 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === 'all'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
              >
                All Items
              </button>
              {(() => {
                const uniqueCategories = [...new Set(
                  (Array.isArray(categories) ? categories : []).map(cat => {
                    if (typeof cat === 'string') return cat;
                    if (cat && cat.category) return cat.category;
                    if (cat && cat.name) return cat.name;
                    return 'Unknown';
                  })
                )];
                return uniqueCategories.map(categoryName => (
                  <button
                    key={categoryName}
                    onClick={() => setSelectedCategory(categoryName)}
                    className={`px-6 py-2 rounded-full text-sm font-medium whitespace-nowrap capitalize transition-colors ${selectedCategory === categoryName
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                  >
                    {categoryName}
                  </button>
                ));
              })()}
            </div>
          </div>
        </div>

        {/* Menu Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.562M15 6.5a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No items found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={
                        getProductImageUrl(product) ||
                        "/images/menu/cappuccino.svg"
                      }
                      alt={product.name || "Product Image"}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                    <button
                      onClick={() => viewProductDetails(product)}
                      className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors"
                    >
                      <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => toggleFavorite(product)}
                      className={`absolute top-3 left-3 p-2 backdrop-blur-sm rounded-full shadow-lg transition-colors ${isFavorite(product.id)
                        ? 'bg-red-500/90 text-white'
                        : 'bg-white/90 text-gray-600 hover:bg-white'
                        }`}
                    >
                      <Heart className={`h-4 w-4 ${isFavorite(product.id) ? 'fill-current' : ''}`} />
                    </button>
                    <div className="absolute bottom-3 left-3">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500 text-white shadow-lg">
                        In Stock ({product.stock})
                      </span>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{product.name}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2 mt-1">{product.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl font-bold text-blue-600">
                        ${product.price.toFixed(2)}
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {product.category}
                      </span>
                    </div>

                    <button
                      onClick={() => addToCart(product)}
                      disabled={product.stock === 0}
                      className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-md hover:shadow-lg"
                    >
                      {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Sidebar */}
        {isCartOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 bg-gray-500 bg-opacity-75" onClick={() => setIsCartOpen(false)} />
            <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-4 border-b">
                  <h2 className="text-lg font-medium text-gray-900">Shopping Cart</h2>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  {cart.length === 0 ? (
                    <div className="text-center py-8">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      <p className="mt-2 text-gray-500">Your cart is empty</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {cart.map((item) => (
                        <div key={item.id} className="flex items-center space-x-4 bg-gray-50 p-3 rounded-lg">
                          <img
                            src={getCartItemImageUrl(item) || "/images/menu/cappuccino.svg"}
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded-lg"
                            onError={(e) => {
                              console.log('Cart image failed to load:', item.imageUrl);
                              e.target.src = "/images/menu/cappuccino.svg";
                            }}
                          />
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900">{item.name}</h4>
                            <p className="text-sm text-gray-500">${item.price.toFixed(2)}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="p-1 text-gray-400 hover:text-gray-600"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                              </svg>
                            </button>
                            <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="p-1 text-gray-400 hover:text-gray-600"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                            </button>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="p-1 text-red-400 hover:text-red-600"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {cart.length > 0 && !orderPlaced && (
                  <div className="border-t p-4 space-y-4">
                    {/* Address Field */}
                    {showAddressInput && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Delivery Address
                        </label>
                        <textarea
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="Enter your delivery address"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows={2}
                        />
                      </div>
                    )}

                    {/* Order Summary */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal</span>
                        <span>${getTotalPrice().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Delivery Fee</span>
                        <span>$2.00</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Tax</span>
                        <span>${(getTotalPrice() * 0.08).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span>Total</span>
                        <span>${(getTotalPrice() + 2 + getTotalPrice() * 0.08).toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Buy/Place Order Button */}
                    <button
                      onClick={handlePlaceOrder}
                      disabled={showAddressInput && !address.trim()}
                      className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      {!showAddressInput ? 'Buy / Place Order' : 'Save Address & Continue'}
                    </button>

                    {showAddressInput && (
                      <div className="text-xs text-gray-500 text-center">
                        💳 Cash on Delivery
                      </div>
                    )}
                  </div>
                )}

                {/* Order Confirmation */}
                {orderPlaced && (
                  <div className="border-t p-4 text-center">
                    <div className="mb-4">
                      <svg className="mx-auto h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Order Placed!</h3>
                    <p className="text-gray-600 mb-2">Cash on Delivery</p>
                    <p className="text-sm text-gray-500">Delivery to: {address}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Product Details Modal */}
        {showProductModal && selectedProduct && (
          <div className="fixed inset-0 backdrop-blur-sm bg-gray-500/25 z-50 overflow-hidden p-4">
            <div className="absolute inset-0" onClick={() => setShowProductModal(false)} />
            <div className="absolute inset-x-4 top-4 bottom-4 md:inset-x-auto md:left-1/2 md:right-auto md:w-full md:max-w-2xl md:transform md:-translate-x-1/2 bg-white rounded-lg shadow-xl">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-4 border-b">
                  <h2 className="text-lg font-medium text-gray-900">Product Details</h2>
                  <button
                    onClick={() => setShowProductModal(false)}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-6">
                    <img
                      src={getProductImageUrl(selectedProduct) || "/images/menu/cappuccino.svg"}
                      alt={selectedProduct.name}
                      className="w-full h-64 object-cover rounded-lg"
                    />

                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{selectedProduct.name}</h3>
                      <p className="text-2xl font-bold text-blue-600 mt-2">${selectedProduct.price.toFixed(2)}</p>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                      <p className="text-gray-600">{selectedProduct.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Category</h4>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {selectedProduct.category}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Availability</h4>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          In Stock ({selectedProduct.stock})
                        </span>
                      </div>
                    </div>

                    {selectedProduct.ingredients && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Ingredients</h4>
                        <p className="text-gray-600">{selectedProduct.ingredients}</p>
                      </div>
                    )}

                    {selectedProduct.allergens && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Allergens</h4>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <p className="text-yellow-800 text-sm">{selectedProduct.allergens}</p>
                        </div>
                      </div>
                    )}

                    {selectedProduct.preparationTime && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Preparation Time</h4>
                        <p className="text-gray-600">{selectedProduct.preparationTime}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t p-4">
                  <button
                    onClick={() => {
                      addToCart(selectedProduct)
                      setShowProductModal(false)
                    }}
                    disabled={selectedProduct.stock === 0}
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    Add to Cart - ${selectedProduct.price.toFixed(2)}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MenuPage
