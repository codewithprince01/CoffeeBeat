import { useState, useEffect } from 'react'
import { orderService } from '../services/orderService'
import { authService } from '../services/authService'
import { getStoredImage, getUploadedImage } from '../utils/imageUpload'

const Cart = () => {
  const [cart, setCart] = useState([])
  const [orderType, setOrderType] = useState('DINE_IN')
  const [tableNumber, setTableNumber] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [showCheckout, setShowCheckout] = useState(false)
  const [loading, setLoading] = useState(false)
  const [userData, setUserData] = useState(null)

  // Helper function to get the correct image URL
  const getProductImageUrl = (item) => {
    if (item && item.imageUrl) {
      // For backend uploaded images (like /uploads/products/), return with full URL
      if (item.imageUrl.startsWith('/uploads/')) {
        return `${import.meta.env.VITE_API_URL || 'http://localhost:8081'}${item.imageUrl}`
      }
      
      // Check if it's a stored uploaded image
      if (item.imageUrl.startsWith('/images/products/')) {
        const filename = item.imageUrl.split('/').pop()
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
      if (item.imageUrl.startsWith('data:')) {
        // If it's the shortened "data:image/..." from backend, use default image
        if (item.imageUrl === 'data:image/...' || item.imageUrl.startsWith('data:image/...') || item.imageUrl.length < 50) {
          // Use placeholder images based on product category
          const category = item.category?.toLowerCase() || 'coffee'
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
        if (item.imageUrl.includes('base64,')) {
          return item.imageUrl
        }
      }
      
      // For other images, return directly
      return item.imageUrl
    }
    
    // If no imageUrl, use default
    return "https://images.unsplash.com/photo-1554118811-1e0d58224f24?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80"
  }

  useEffect(() => {
    loadCartFromStorage()
    loadUserData()
  }, [])

  const loadCartFromStorage = () => {
    const savedCart = localStorage.getItem('cart')
    if (savedCart) {
      setCart(JSON.parse(savedCart))
    }
  }

  const loadUserData = async () => {
    try {
      const user = await authService.getCurrentUser()
      setUserData(user)
      if (user.address) {
        setDeliveryAddress(user.address)
      }
    } catch (error) {
      console.error('Failed to load user data:', error)
    }
  }

  const updateCart = (newCart) => {
    setCart(newCart)
    localStorage.setItem('cart', JSON.stringify(newCart))
  }

  const removeFromCart = (productId) => {
    const newCart = cart.filter(item => item.id !== productId)
    updateCart(newCart)
  }

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }
    const newCart = cart.map(item => 
      item.id === productId ? { ...item, quantity } : item
    )
    updateCart(newCart)
  }

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      alert('Your cart is empty')
      return
    }

    if (orderType === 'DINE_IN' && !tableNumber) {
      alert('Please enter a table number')
      return
    }

    if (orderType === 'DELIVERY' && !deliveryAddress) {
      alert('Please enter a delivery address')
      return
    }

    setLoading(true)
    try {
      // Get current user ID
      const currentUser = JSON.parse(localStorage.getItem('user')) || 
                          JSON.parse(localStorage.getItem('currentUser')) || 
                          { id: 'anonymous' }
      
      const orderData = {
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity
        })),
        specialInstructions: specialInstructions,
        orderType: orderType,
        ...(orderType === 'DINE_IN' && { tableNumber: parseInt(tableNumber) }),
        ...(orderType === 'DELIVERY' && { deliveryAddress }),
        ...(orderType === 'TAKEAWAY' && { pickupTime: 'ASAP' })
      }

      const order = await orderService.createOrder(orderData)
      updateCart([])
      setShowCheckout(false)
      alert(`Order placed successfully! Order #${order.id}`)
      
      // Reset form
      setTableNumber('')
      setSpecialInstructions('')
      
    } catch (error) {
      console.error('Failed to place order:', error)
      alert('Failed to place order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (cart.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Cart</h2>
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <p className="mt-2 text-gray-500">Your cart is empty</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Cart ({cart.length} items)</h2>
        
        {/* Cart Items */}
        <div className="space-y-4 mb-6">
          {cart.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4 flex-1">
                <img
                  src={getProductImageUrl(item)}
                  alt={item.name}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div>
                  <h3 className="font-medium text-gray-900">{item.name}</h3>
                  <p className="text-sm text-gray-500">${item.price.toFixed(2)} each</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                >
                  -
                </button>
                <span className="w-8 text-center font-medium">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                >
                  +
                </button>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="ml-2 text-red-500 hover:text-red-700"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              <div className="ml-4 text-right">
                <p className="font-semibold text-gray-900">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="border-t pt-4 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-900">Total:</span>
            <span className="text-2xl font-bold text-blue-600">${getTotalPrice().toFixed(2)}</span>
          </div>
        </div>

        {/* Checkout Button */}
        {!showCheckout ? (
          <button
            onClick={() => setShowCheckout(true)}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Proceed to Checkout
          </button>
        ) : (
          <div className="space-y-4">
            {/* Order Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Order Type</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setOrderType('DINE_IN')}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                    orderType === 'DINE_IN'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  Dine In
                </button>
                <button
                  onClick={() => setOrderType('TAKEAWAY')}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                    orderType === 'TAKEAWAY'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  Takeaway
                </button>
                <button
                  onClick={() => setOrderType('DELIVERY')}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                    orderType === 'DELIVERY'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  Delivery
                </button>
              </div>
            </div>

            {/* Conditional Fields */}
            {orderType === 'DINE_IN' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Table Number</label>
                <input
                  type="text"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="Enter table number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}

            {orderType === 'DELIVERY' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Address</label>
                <textarea
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Enter your delivery address"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}

            {/* Special Instructions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Special Instructions (Optional)</label>
              <textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="Any special requests or dietary requirements..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={() => setShowCheckout(false)}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back to Cart
              </button>
              <button
                onClick={handlePlaceOrder}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
              >
                {loading ? 'Placing Order...' : `Place Order - $${getTotalPrice().toFixed(2)}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Cart
