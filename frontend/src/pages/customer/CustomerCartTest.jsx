import { Link } from 'react-router-dom'

const CustomerCartTest = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>
        
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-xl font-semibold mb-4">Cart Test Page</h2>
          <p className="text-gray-600 mb-6">This is a test cart page to verify routing works.</p>
          
          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-center p-4 border rounded">
              <span>Test Item 1</span>
              <span>$10.00</span>
            </div>
            <div className="flex justify-between items-center p-4 border rounded">
              <span>Test Item 2</span>
              <span>$15.00</span>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold">Total:</span>
              <span className="text-lg font-bold">$25.00</span>
            </div>
            
            <Link
              to="/dashboard/customer/menu"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mr-4"
            >
              Back to Menu
            </Link>
            
            <button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
              Place Order
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CustomerCartTest
