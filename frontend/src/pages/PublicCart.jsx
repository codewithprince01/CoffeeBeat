import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import Navbar from '../components/Navbar'
import toast from 'react-hot-toast'
import { orderService } from '../services/orderService'

const PublicCart = () => {
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState(1) // 1: Cart, 2: Address, 3: Payment
  const [addresses, setAddresses] = useState([])
  const [selectedAddress, setSelectedAddress] = useState(null)
  const [showAddAddress, setShowAddAddress] = useState(false)
  const [editingAddress, setEditingAddress] = useState(null)
  const [addressForm, setAddressForm] = useState({
    houseNumber: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    phone: '',
    type: 'HOME'
  })
  const [cashOnDelivery, setCashOnDelivery] = useState(false)

  // Helper function to get correct image URL for products
  const getImageUrl = (product) => {
    console.log('Getting image for product:', product.name, 'imageUrl:', product.imageUrl)
    
    // If product has actual imageUrl, use it (uploaded product image)
    if (product.imageUrl) {
      // Handle base64 images
      if (product.imageUrl.startsWith('data:image/')) {
        return product.imageUrl
      }
      // Handle relative URLs
      if (product.imageUrl.startsWith('/')) {
        return `http://localhost:8081${product.imageUrl}`
      }
      // Handle full URLs
      if (product.imageUrl.startsWith('http')) {
        return product.imageUrl
      }
    }
    
    // Fallback to placeholder if no actual image
    const name = product.name?.toLowerCase() || ''
    if (name.includes('chai') || name.includes('tea')) {
      return 'https://picsum.photos/seed/tea/200/200.jpg'
    } else if (name.includes('coffee') || name.includes('cappuccino')) {
      return 'https://picsum.photos/seed/coffee/200/200.jpg'
    } else if (name.includes('sandwich') || name.includes('food') || name.includes('burger')) {
      return 'https://picsum.photos/seed/food/200/200.jpg'
    } else if (name.includes('pastry') || name.includes('cake') || name.includes('croissant')) {
      return 'https://picsum.photos/seed/pastry/200/200.jpg'
    }
    
    return 'https://picsum.photos/seed/product/200/200.jpg'
  }

  useEffect(() => {
    loadCartFromStorage()
    loadAddresses()
  }, [])

  const loadAddresses = () => {
    // Load addresses from user profile or localStorage
    const savedAddresses = localStorage.getItem('userAddresses')
    if (savedAddresses) {
      setAddresses(JSON.parse(savedAddresses))
    }
  }

  const loadCartFromStorage = () => {
    const savedCart = localStorage.getItem('cart')
    if (savedCart) {
      setCart(JSON.parse(savedCart))
    } else {
      // Add some test items for demonstration
      const testCart = [
        {
          id: '1',
          name: 'Masala Chai',
          price: 1.00,
          quantity: 2,
          category: 'tea'
        },
        {
          id: '2', 
          name: 'Coffee',
          price: 4.99,
          quantity: 1,
          category: 'coffee'
        }
      ]
      setCart(testCart)
      localStorage.setItem('cart', JSON.stringify(testCart))
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
    setLoading(true)

    try {
      const newAddress = {
        id: editingAddress?.id || Date.now().toString(),
        ...addressForm
      }

      let updatedAddresses
      if (editingAddress) {
        // Update existing address
        updatedAddresses = addresses.map(addr => 
          addr.id === editingAddress.id ? newAddress : addr
        )
      } else {
        // Add new address
        updatedAddresses = [...addresses, newAddress]
      }

      setAddresses(updatedAddresses)
      localStorage.setItem('userAddresses', JSON.stringify(updatedAddresses))
      
      toast.success(editingAddress ? 'Address updated successfully!' : 'Address added successfully!')
      
      // Reset form
      setAddressForm({
        houseNumber: '',
        street: '',
        city: '',
        state: '',
        postalCode: '',
        phone: '',
        type: 'HOME'
      })
      setShowAddAddress(false)
      setEditingAddress(null)
    } catch (error) {
      toast.error('Failed to save address')
    } finally {
      setLoading(false)
    }
  }

  const handleEditAddress = (address) => {
    setEditingAddress(address)
    setAddressForm(address)
    setShowAddAddress(true)
  }

  const handleDeleteAddress = (addressId) => {
    const updatedAddresses = addresses.filter(addr => addr.id !== addressId)
    setAddresses(updatedAddresses)
    localStorage.setItem('userAddresses', JSON.stringify(updatedAddresses))
    toast.success('Address deleted successfully!')
  }

  const handlePlaceOrder = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to place order')
      navigate('/login')
      return
    }

    if (!selectedAddress) {
      toast.error('Please select a delivery address')
      return
    }

    if (!cashOnDelivery) {
      toast.error('Please select Cash on Delivery')
      return
    }

    if (cart.length === 0) {
      toast.error('Your cart is empty')
      return
    }

    setLoading(true)
    
    try {
      // Create minimal order data for backend (exact API format)
      const orderData = {
        userId: user?.id || user?.email || 'anonymous',
        items: cart.map(item => ({
          productId: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          specialInstructions: ""
        })),
        totalPrice: getTotalPrice() + 2, // Including delivery fee
        deliveryAddress: {
          houseNumber: selectedAddress.houseNumber,
          street: selectedAddress.street,
          city: selectedAddress.city,
          state: selectedAddress.state,
          postalCode: selectedAddress.postalCode,
          phone: selectedAddress.phone
        },
        paymentStatus: 'PENDING',
        status: 'PENDING',
        orderType: 'DELIVERY'
      }

      console.log('Order data being sent:', JSON.stringify(orderData, null, 2))
      console.log('Cart items:', cart)
      console.log('Selected address:', selectedAddress)

      // Save order to backend
      const response = await orderService.createOrder(orderData)
      console.log('Order saved to backend:', response)
      console.log('Order response data:', response.data)
      
      // Check if order was successfully created
      if (response && (response.id || response.data?.id)) {
        console.log('Order successfully created with ID:', response.id || response.data?.id)
      } else {
        console.log('Order creation response format unexpected:', response)
      }

      // Clear cart and checkout data
      setCart([])
      localStorage.removeItem('cart')

      toast.success('Order placed successfully!')
      
      // Navigate to orders page in dashboard
      navigate('/dashboard/customer/orders')
    } catch (error) {
      console.error('Failed to place order:', error)
      console.error('Error response:', error.response?.data)
      
      // Show more detailed error message
      if (error.response?.data?.errors) {
        console.error('Validation errors:', error.response.data.errors)
        const validationErrors = Object.values(error.response.data.errors).flat().join(', ')
        toast.error(`Validation failed: ${validationErrors}`)
      } else {
        const errorMessage = error.response?.data?.message || error.message || 'Unknown error'
        toast.error(`Failed to place order: ${errorMessage}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleProceedToAddress = () => {
    if (cart.length === 0) {
      toast.error('Your cart is empty')
      return
    }
    setCurrentStep(2)
  }

  const handleProceedToPayment = () => {
    if (!selectedAddress) {
      toast.error('Please select a delivery address')
      return
    }
    setCurrentStep(3)
  }

  const renderProgressBar = () => {
    return (
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center">
          <div className={`w-8 h-8 ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'} rounded-full flex items-center justify-center text-sm font-medium`}>
            1
          </div>
          <span className={`ml-2 text-sm font-medium ${currentStep >= 1 ? 'text-gray-900' : 'text-gray-500'}`}>Cart</span>
        </div>
        <div className={`w-16 h-1 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-300'} mx-4`}></div>
        <div className="flex items-center">
          <div className={`w-8 h-8 ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'} rounded-full flex items-center justify-center text-sm font-medium`}>
            2
          </div>
          <span className={`ml-2 text-sm font-medium ${currentStep >= 2 ? 'text-gray-900' : 'text-gray-500'}`}>Address</span>
        </div>
        <div className={`w-16 h-1 ${currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-300'} mx-4`}></div>
        <div className="flex items-center">
          <div className={`w-8 h-8 ${currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'} rounded-full flex items-center justify-center text-sm font-medium`}>
            3
          </div>
          <span className={`ml-2 text-sm font-medium ${currentStep >= 3 ? 'text-gray-900' : 'text-gray-500'}`}>Payment</span>
        </div>
      </div>
    )
  }

  if (cart.length === 0) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 py-12">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Your Cart</h1>
              <div className="bg-white rounded-lg shadow-sm p-8">
                <p className="text-gray-600 mb-6">Your cart is empty</p>
                <Link
                  to="/menu"
                  className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>
          
          {renderProgressBar()}

          {/* Step 1: Cart Items */}
          {currentStep === 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {cart.map((item) => (
                  <div key={item.id} className="bg-white rounded-lg shadow-sm p-4">
                    <div className="flex items-center space-x-4">
                      <img
                        src={getImageUrl(item)}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded-lg"
                        onError={(e) => {
                          console.log('Backend image failed to load for:', item.name, 'using fallback')
                          // Use fallback image based on product name
                          const name = item.name?.toLowerCase() || ''
                          if (name.includes('chai') || name.includes('tea')) {
                            e.target.src = 'https://picsum.photos/seed/tea/200/200.jpg'
                          } else if (name.includes('coffee') || name.includes('cappuccino')) {
                            e.target.src = 'https://picsum.photos/seed/coffee/200/200.jpg'
                          } else if (name.includes('sandwich') || name.includes('food') || name.includes('burger')) {
                            e.target.src = 'https://picsum.photos/seed/food/200/200.jpg'
                          } else if (name.includes('pastry') || name.includes('cake') || name.includes('croissant')) {
                            e.target.src = 'https://picsum.photos/seed/pastry/200/200.jpg'
                          } else {
                            e.target.src = 'https://picsum.photos/seed/product/200/200.jpg'
                          }
                        }}
                        onLoad={() => {
                          console.log('Image loaded successfully for:', item.name)
                        }}
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

                <button
                  onClick={handleProceedToAddress}
                  disabled={cart.length === 0}
                  className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Buy
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Address Selection */}
          {currentStep === 2 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {addresses.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                    <p className="text-gray-600 mb-4">No saved addresses</p>
                    <button
                      onClick={() => setShowAddAddress(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Add New Address
                    </button>
                  </div>
                ) : (
                  addresses.map((address) => (
                    <div key={address.id} className="bg-white rounded-lg shadow-sm p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <input
                            type="radio"
                            name="address"
                            checked={selectedAddress?.id === address.id}
                            onChange={() => setSelectedAddress(address)}
                            className="mt-1 w-4 h-4 text-blue-600"
                          />
                          <div>
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-sm font-medium text-gray-900">{address.type}</span>
                            </div>
                            <p className="text-gray-700">
                              {address.houseNumber}, {address.street}<br />
                              {address.city}, {address.state} {address.postalCode}<br />
                              Phone: {address.phone}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditAddress(address)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteAddress(address.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                
                {addresses.length > 0 && (
                  <button
                    onClick={() => setShowAddAddress(true)}
                    className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700"
                  >
                    + Add New Address
                  </button>
                )}
              </div>

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

                <button
                  onClick={handleProceedToPayment}
                  disabled={!selectedAddress || addresses.length === 0}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Proceed to Payment
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Payment */}
          {currentStep === 3 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold mb-4">Payment Method</h2>
                  <div className="space-y-4">
                    <label className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="payment"
                        checked={cashOnDelivery}
                        onChange={(e) => setCashOnDelivery(e.target.checked)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div>
                        <div className="font-medium">Cash on Delivery</div>
                        <div className="text-sm text-gray-500">Pay when you receive your order</div>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
                  <h2 className="text-lg font-semibold mb-4">Delivery Address</h2>
                  {selectedAddress && (
                    <div className="text-gray-700">
                      <p>{selectedAddress.houseNumber}, {selectedAddress.street}</p>
                      <p>{selectedAddress.city}, {selectedAddress.state} {selectedAddress.postalCode}</p>
                      <p>Phone: {selectedAddress.phone}</p>
                    </div>
                  )}
                </div>
              </div>

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

                <button
                  onClick={handlePlaceOrder}
                  disabled={loading || !cashOnDelivery}
                  className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? 'Placing Order...' : 'Place Order'}
                </button>
              </div>
            </div>
          )}

          {/* Add/Edit Address Modal */}
          {showAddAddress && (
            <div className="fixed inset-0 z-50 overflow-hidden">
              <div className="absolute inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowAddAddress(false)} />
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <h2 className="text-lg font-semibold mb-4">
                      {editingAddress ? 'Edit Address' : 'Add New Address'}
                    </h2>
                    
                    <form onSubmit={handleAddressSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Address Type</label>
                        <select
                          value={addressForm.type}
                          onChange={(e) => setAddressForm({...addressForm, type: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        >
                          <option value="HOME">Home</option>
                          <option value="WORK">Work</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="text"
                          placeholder="House Number"
                          value={addressForm.houseNumber}
                          onChange={(e) => setAddressForm({...addressForm, houseNumber: e.target.value})}
                          className="px-3 py-2 border border-gray-300 rounded-lg"
                          required
                        />
                        <input
                          type="text"
                          placeholder="Street"
                          value={addressForm.street}
                          onChange={(e) => setAddressForm({...addressForm, street: e.target.value})}
                          className="px-3 py-2 border border-gray-300 rounded-lg"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="text"
                          placeholder="City"
                          value={addressForm.city}
                          onChange={(e) => setAddressForm({...addressForm, city: e.target.value})}
                          className="px-3 py-2 border border-gray-300 rounded-lg"
                          required
                        />
                        <input
                          type="text"
                          placeholder="State"
                          value={addressForm.state}
                          onChange={(e) => setAddressForm({...addressForm, state: e.target.value})}
                          className="px-3 py-2 border border-gray-300 rounded-lg"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="text"
                          placeholder="Postal Code"
                          value={addressForm.postalCode}
                          onChange={(e) => setAddressForm({...addressForm, postalCode: e.target.value})}
                          className="px-3 py-2 border border-gray-300 rounded-lg"
                          required
                        />
                        <input
                          type="tel"
                          placeholder="Phone Number"
                          value={addressForm.phone}
                          onChange={(e) => setAddressForm({...addressForm, phone: e.target.value})}
                          className="px-3 py-2 border border-gray-300 rounded-lg"
                          required
                        />
                      </div>

                      <div className="flex space-x-3 pt-4">
                        <button
                          type="button"
                          onClick={() => setShowAddAddress(false)}
                          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                        >
                          {loading ? 'Saving...' : (editingAddress ? 'Update Address' : 'Save Address')}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default PublicCart
