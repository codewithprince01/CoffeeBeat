import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import Layout from '../../components/Layout'
import toast from 'react-hot-toast'

const CheckoutAddress = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
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

  useEffect(() => {
    loadAddresses()
  }, [])

  const loadAddresses = () => {
    // Load addresses from user profile or localStorage
    const savedAddresses = localStorage.getItem('userAddresses')
    if (savedAddresses) {
      setAddresses(JSON.parse(savedAddresses))
    } else if (user?.address) {
      // Convert single address to array format
      setAddresses([{
        id: 'default',
        ...user.address,
        type: 'HOME'
      }])
    }
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
      
      // Also save to user profile (API call would go here)
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

  const handleProceedToPayment = () => {
    if (!selectedAddress) {
      toast.error('Please select a delivery address')
      return
    }

    // Save selected address to localStorage for payment page
    localStorage.setItem('selectedAddress', JSON.stringify(selectedAddress))
    navigate('/checkout/payment')
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">1</div>
            <span className="ml-2 text-sm font-medium text-gray-900">Cart</span>
          </div>
          <div className="w-16 h-1 bg-blue-600 mx-4"></div>
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">2</div>
            <span className="ml-2 text-sm font-medium text-gray-900">Address</span>
          </div>
          <div className="w-16 h-1 bg-gray-300 mx-4"></div>
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium">3</div>
            <span className="ml-2 text-sm text-gray-500">Payment</span>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-8">Select Delivery Address</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Address List */}
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
                          {address.id === 'default' && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Default</span>
                          )}
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
                      {address.id !== 'default' && (
                        <button
                          onClick={() => handleDeleteAddress(address.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
                      )}
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

          {/* Order Summary */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>$25.98</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span>$2.00</span>
                </div>
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>$27.98</span>
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
    </Layout>
  )
}

export default CheckoutAddress
