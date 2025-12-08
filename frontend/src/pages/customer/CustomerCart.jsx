import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { orderService } from '../../services/orderService'
import { authService } from '../../services/authService'
import toast from 'react-hot-toast'
import { getStoredImage, getUploadedImage } from '../../utils/imageUpload'

const CustomerCart = () => {
  const navigate = useNavigate()
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(false)
  const [userData, setUserData] = useState(null)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [addressData, setAddressData] = useState({
    houseNumber: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    phone: ''
  })
  const [cashOnDelivery, setCashOnDelivery] = useState(false)

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
    } else {
      // Add some test items for demonstration
      const testCart = [
        {
          id: '1',
          name: 'Test Coffee',
          price: 4.99,
          quantity: 2,
          imageUrl: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80"
        },
        {
          id: '2', 
          name: 'Test Sandwich',
          price: 6.99,
          quantity: 1,
          imageUrl: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80"
        }
      ]
      setCart(testCart)
      localStorage.setItem('cart', JSON.stringify(testCart))
    }
  }

  const loadUserData = async () => {
    try {
      // const user = await authService.getCurrentUser()
      // setUserData(user)
      // Load saved address if exists
      // if (user.address) {
      //   setAddressData(user.address)
      // }
      console.log('User data loading bypassed for testing')
    } catch (error) {
      console.error('Failed to load user data:', error)
    }
  }

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity === 0) {
      removeFromCart(productId)
      return
    }
    
    const newCart = cart.map(item => 
      item.id === productId ? { ...item, quantity: newQuantity } : item
    )
    setCart(newCart)
    localStorage.setItem('cart', JSON.stringify(newCart))
  }

  const removeFromCart = (productId) => {
    const newCart = cart.filter(item => item.id !== productId)
    setCart(newCart)
    localStorage.setItem('cart', JSON.stringify(newCart))
  }

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const handleAddressSubmit = async (e) => {
    e.preventDefault()
    
    try {
      // Save address to user profile
      // await authService.updateProfile({ address: addressData })
      toast.success('Address saved successfully!')
      setShowAddressForm(false)
      // Set userData manually for testing
      setUserData({ address: addressData })
    } catch (error) {
      console.error('Failed to save address:', error)
      toast.error('Failed to save address')
    }
  }

  const handlePlaceOrder = async () => {
    if (!userData || !userData.address) {
      toast.error('Please add your address first')
      setShowAddressForm(true)
      return
    }

    if (!cashOnDelivery) {
      toast.error('Please select Cash on Delivery')
      return
    }

    setLoading(true)
    
    try {
      const currentUser = JSON.parse(localStorage.getItem('user')) || 
                          JSON.parse(localStorage.getItem('currentUser')) || 
                          { id: 'default-user' }
      
      const orderData = {
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity
        })),
        specialInstructions: `Delivery to: ${userData.address}`,
        orderType: 'DELIVERY',
        deliveryAddress: userData.address
      }

      const order = await orderService.createOrder(orderData)
      
      // Clear cart
      setCart([])
      localStorage.removeItem('cart')
      
      toast.success(`Order placed successfully! Order #${order.id}`)
      navigate('/dashboard/customer/orders')
    } catch (error) {
      console.error('Failed to place order:', error)
      toast.error('Failed to place order')
    } finally {
      setLoading(false)
    }
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Your Cart</h1>
            <div className="bg-white rounded-lg shadow-sm p-8">
              <p className="text-gray-600 mb-6">Your cart is empty</p>
              <Link
                to="/dashboard/customer/menu"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center space-x-4">
                  <img
                    src={getProductImageUrl(item)}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    <p className="text-gray-600">${item.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                    >
                      -
                    </button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${getTotalPrice().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span>$2.00</span>
                </div>
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>${(getTotalPrice() + 2).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Address Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Delivery Address</h2>
                <button
                  onClick={() => setShowAddressForm(!showAddressForm)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  {userData?.address ? 'Edit' : 'Add'} Address
                </button>
              </div>
              
              {userData?.address && !showAddressForm && (
                <div className="text-sm text-gray-600">
                  <p>{userData.address.houseNumber}, {userData.address.street}</p>
                  <p>{userData.address.city}, {userData.address.state} {userData.address.postalCode}</p>
                  <p>Phone: {userData.address.phone}</p>
                </div>
              )}

              {showAddressForm && (
                <form onSubmit={handleAddressSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="House Number"
                      value={addressData.houseNumber}
                      onChange={(e) => setAddressData({...addressData, houseNumber: e.target.value})}
                      className="px-3 py-2 border rounded-lg"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Street"
                      value={addressData.street}
                      onChange={(e) => setAddressData({...addressData, street: e.target.value})}
                      className="px-3 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="City"
                      value={addressData.city}
                      onChange={(e) => setAddressData({...addressData, city: e.target.value})}
                      className="px-3 py-2 border rounded-lg"
                      required
                    />
                    <input
                      type="text"
                      placeholder="State"
                      value={addressData.state}
                      onChange={(e) => setAddressData({...addressData, state: e.target.value})}
                      className="px-3 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Postal Code"
                      value={addressData.postalCode}
                      onChange={(e) => setAddressData({...addressData, postalCode: e.target.value})}
                      className="px-3 py-2 border rounded-lg"
                      required
                    />
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      value={addressData.phone}
                      onChange={(e) => setAddressData({...addressData, phone: e.target.value})}
                      className="px-3 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Save Address
                  </button>
                </form>
              )}
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Payment Method</h2>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={cashOnDelivery}
                  onChange={(e) => setCashOnDelivery(e.target.checked)}
                  className="w-4 h-4 text-blue-600"
                />
                <span>Cash on Delivery</span>
              </label>
            </div>

            {/* Place Order Button */}
            <button
              onClick={handlePlaceOrder}
              disabled={loading || !userData?.address || !cashOnDelivery}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Placing Order...' : 'Place Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CustomerCart
