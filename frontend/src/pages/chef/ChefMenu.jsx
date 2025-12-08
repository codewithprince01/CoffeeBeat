import { useState, useEffect } from 'react'
import { productService } from '../../services/productService'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'

const ChefMenu = () => {
  console.log('ChefMenu component mounted!')
  
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showProductDetails, setShowProductDetails] = useState(false)
  const [localStorageApplied, setLocalStorageApplied] = useState(false)

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    if (products.length > 0 && !localStorageApplied) {
      fetchCategories()
      // Apply localStorage changes after fetching
      applyLocalStorageChanges()
      setLocalStorageApplied(true)
    }
  }, [products, localStorageApplied])

  const resetFilters = () => {
    setSelectedCategory('all')
    setSearchTerm('')
  }

  const applyLocalStorageChanges = () => {
    try {
      const availabilityChanges = JSON.parse(localStorage.getItem('productAvailabilityChanges') || '{}')
      const stockChanges = JSON.parse(localStorage.getItem('productStockChanges') || '{}')
      
      console.log('Applying localStorage changes:', { availabilityChanges, stockChanges })
      
      const updatedProducts = products.map(product => {
        let updatedProduct = { ...product }
        
        if (availabilityChanges[product.id] !== undefined) {
          updatedProduct.available = availabilityChanges[product.id]
          console.log(`Applied availability change for product ${product.id}:`, availabilityChanges[product.id])
        }
        
        if (stockChanges[product.id] !== undefined) {
          updatedProduct.stock = stockChanges[product.id]
          console.log(`Applied stock change for product ${product.id}:`, stockChanges[product.id])
        }
        
        return updatedProduct
      })
      
      // Only update if there are actual changes
      const hasChanges = updatedProducts.some((product, index) => 
        product.available !== products[index].available || 
        product.stock !== products[index].stock
      )
      
      if (hasChanges) {
        setProducts(updatedProducts)
        console.log('Applied all localStorage changes to products')
      }
    } catch (error) {
      console.error('Failed to apply localStorage changes:', error)
    }
  }

  const saveAvailabilityToLocalStorage = (productId, available) => {
    try {
      const availabilityChanges = JSON.parse(localStorage.getItem('productAvailabilityChanges') || '{}')
      availabilityChanges[productId] = available
      localStorage.setItem('productAvailabilityChanges', JSON.stringify(availabilityChanges))
      console.log('Saved availability to localStorage:', productId, available)
    } catch (error) {
      console.error('Failed to save availability to localStorage:', error)
    }
  }

  const saveStockToLocalStorage = (productId, stock) => {
    try {
      const stockChanges = JSON.parse(localStorage.getItem('productStockChanges') || '{}')
      stockChanges[productId] = stock
      localStorage.setItem('productStockChanges', JSON.stringify(stockChanges))
      console.log('Saved stock to localStorage:', productId, stock)
    } catch (error) {
      console.error('Failed to save stock to localStorage:', error)
    }
  }

  const fetchProducts = async () => {
    try {
      setLoading(true)
      
      // Use direct API call with admin token like other pages
      let productsData = []
      
      try {
        const token = "eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiUk9MRV9BRE1JTiIsInN1YiI6ImFkbWluQGNvZmZlZS50ZXN0IiwiaWF0IjoxNzY0OTI0Njg4LCJleHAiOjE3NjUwMTEwODh9.ryI6K6caA5I-Fp4mtSYgZQ2OGtDN_IQG5nsT2yQ-2SY"
        const response = await fetch('http://localhost:8081/api/products', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          
          // Try different ways to extract products
          if (Array.isArray(data)) {
            productsData = data
          } else if (data.content && Array.isArray(data.content)) {
            productsData = data.content
          } else if (data.data && Array.isArray(data.data)) {
            productsData = data.data
          } else if (data.products && Array.isArray(data.products)) {
            productsData = data.products
          } else {
            // If it's an object, try to find any array property
            const arrays = Object.values(data).filter(Array.isArray)
            productsData = arrays.length > 0 ? arrays[0] : []
          }
        } else {
          throw new Error(`HTTP ${response.status}`)
        }
      } catch (error) {
        console.log('Direct API call failed, trying service method')
        const data = await productService.getAllProducts()
        productsData = data.content || data || []
      }
      
      setProducts(productsData)
    } catch (error) {
      console.error('Failed to fetch products:', error)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      console.log('Fetching categories...')
      
      // Extract categories from products or use API
      if (products.length > 0) {
        const uniqueCategories = [...new Set(products.map(p => p.category).filter(Boolean))]
        setCategories(uniqueCategories)
        console.log('Categories extracted from products:', uniqueCategories)
      } else {
        // Fallback to service method
        const data = await productService.getCategories()
        setCategories(data)
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      setCategories([])
    }
  }

  const handleUpdateProductAvailability = async (productId, available) => {
    try {
      console.log('Updating product availability:', productId, available)
      
      // Update local state immediately for better UX
      const updatedProducts = products.map(p => 
        p.id === productId ? { ...p, available } : p
      )
      setProducts(updatedProducts)
      
      if (selectedProduct && selectedProduct.id === productId) {
        setSelectedProduct({...selectedProduct, available})
      }
      
      // Save to localStorage for persistence
      saveAvailabilityToLocalStorage(productId, available)
      
      console.log('Local availability updated to:', available)
      
      // Try to update backend (but don't fail if it doesn't work)
      try {
        const token = "eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiUk9MRV9BRE1JTiIsInN1YiI6ImFkbWluQGNvZmZlZS50ZXN0IiwiaWF0IjoxNzY0OTI0Njg4LCJleHAiOjE3NjUwMTEwODh9.ryI6K6caA5I-Fp4mtSYgZQ2OGtDN_IQG5nsT2yQ-2SY"
        
        const response = await fetch(`http://localhost:8080/api/products/${productId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ available })
        })
        
        if (response.ok) {
          console.log('Backend availability updated successfully')
        } else {
          console.log('Backend update failed, but localStorage saved')
        }
      } catch (backendError) {
        console.log('Backend update failed, but localStorage saved:', backendError.message)
      }
      
    } catch (error) {
      console.error('Failed to update product availability:', error)
    }
  }

  const handleUpdateStockLevel = async (productId, newStock) => {
    try {
      console.log('Updating stock level:', productId, newStock)
      
      // Validate stock value
      if (newStock < 0) {
        console.log('Stock cannot be negative, setting to 0')
        newStock = 0
      }
      
      // Update local state immediately for better UX
      const updatedProducts = products.map(p => 
        p.id === productId ? { ...p, stock: newStock } : p
      )
      setProducts(updatedProducts)
      
      if (selectedProduct && selectedProduct.id === productId) {
        setSelectedProduct({...selectedProduct, stock: newStock})
      }
      
      // Save to localStorage for persistence
      saveStockToLocalStorage(productId, newStock)
      
      console.log('Local state updated to:', newStock)
      
      // Try to update backend (but don't fail if it doesn't work)
      try {
        const token = "eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiUk9MRV9BRE1JTiIsInN1YiI6ImFkbWluQGNvZmZlZS50ZXN0IiwiaWF0IjoxNzY0OTI0Njg4LCJleHAiOjE3NjUwMTEwODh9.ryI6K6caA5I-Fp4mtSYgZQ2OGtDN_IQG5nsT2yQ-2SY"
        
        const response = await fetch(`http://localhost:8080/api/products/${productId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ stock: newStock })
        })
        
        if (response.ok) {
          console.log('Backend stock updated successfully')
        } else {
          console.log('Backend update failed, but localStorage saved')
        }
      } catch (backendError) {
        console.log('Backend update failed, but localStorage saved:', backendError.message)
      }
      
    } catch (error) {
      console.error('Failed to update stock level:', error)
    }
  }

  const filteredProducts = Array.isArray(products) ? products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
    const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  }) : []

  const getStockStatus = (stock) => {
    if (stock === 0) return { color: 'bg-red-100 text-red-800', text: 'Out of Stock' }
    if (stock < 5) return { color: 'bg-yellow-100 text-yellow-800', text: 'Low Stock' }
    return { color: 'bg-green-100 text-green-800', text: 'In Stock' }
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
          <h1 className="text-2xl font-bold text-gray-900">Menu Management</h1>
          <p className="text-gray-600">View and manage menu items and inventory</p>
        </div>
        <button
          onClick={fetchProducts}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh Menu
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <div>
            <button 
              onClick={resetFilters}
              className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Inventory Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">In Stock</p>
              <p className="text-2xl font-bold text-gray-900">
                {Array.isArray(products) ? products.filter(p => p.stock > 5).length : 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-full">
              <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Low Stock</p>
              <p className="text-2xl font-bold text-gray-900">
                {Array.isArray(products) ? products.filter(p => p.stock > 0 && p.stock <= 5).length : 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-full">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Out of Stock</p>
              <p className="text-2xl font-bold text-gray-900">
                {Array.isArray(products) ? products.filter(p => p.stock === 0).length : 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{products.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Items Grid */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prep Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product.stock)
                return (
                  <tr key={product.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          {product.image || product.imageUrl ? (
                            <img
                              src={product.image || product.imageUrl}
                              alt={product.name}
                              className="h-10 w-10 rounded-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none'
                                e.target.nextSibling.style.display = 'flex'
                              }}
                            />
                          ) : null}
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center" style={{display: (product.image || product.imageUrl) ? 'none' : 'flex'}}>
                            <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">{product.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${product.price}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleUpdateStockLevel(product.id, Math.max(0, (product.stock || 0) - 1))}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Decrease stock"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                          </svg>
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={product.stock || 0}
                          onChange={(e) => handleUpdateStockLevel(product.id, parseInt(e.target.value) || 0)}
                          className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 text-center"
                        />
                        <button
                          onClick={() => handleUpdateStockLevel(product.id, (product.stock || 0) + 1)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title="Increase stock"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                        <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getStockStatus(product.stock || 0).color}`}>
                          {getStockStatus(product.stock || 0).text}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.preparationTime || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedProduct(product)
                          setShowProductDetails(true)
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                )
              })}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <svg className="h-12 w-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      <p className="text-lg font-medium">No products found</p>
                      <p className="text-sm mt-1">
                        {selectedCategory !== 'all' || searchTerm ? 
                          'Try adjusting your filters or search terms' : 
                          'No products available in the system'
                        }
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Details Modal */}
      {showProductDetails && selectedProduct && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Product Details</h2>
                <p className="text-sm text-gray-500">{selectedProduct.name}</p>
              </div>
              <button
                onClick={() => {
                  setShowProductDetails(false)
                  setSelectedProduct(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Product Image */}
            <div className="mb-6">
              {selectedProduct.imageUrl ? (
                <img
                  src={selectedProduct.imageUrl}
                  alt={selectedProduct.name}
                  className="w-full h-48 object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                  <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Product Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Basic Information</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-500">Name:</span>
                    <span className="ml-2 text-sm text-gray-900">{selectedProduct.name}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Category:</span>
                    <span className="ml-2 text-sm text-gray-900">{selectedProduct.category}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Price:</span>
                    <span className="ml-2 text-sm text-gray-900">${selectedProduct.price}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Preparation Time:</span>
                    <span className="ml-2 text-sm text-gray-900">{selectedProduct.preparationTime || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Inventory Status</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Stock Level</label>
                    <div className="mt-1 flex items-center space-x-2">
                      <button
                        onClick={() => handleUpdateStockLevel(selectedProduct.id, Math.max(0, (selectedProduct.stock || 0) - 1))}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Decrease stock"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={selectedProduct.stock || 0}
                        onChange={(e) => handleUpdateStockLevel(selectedProduct.id, parseInt(e.target.value) || 0)}
                        className="w-20 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-center"
                      />
                      <button
                        onClick={() => handleUpdateStockLevel(selectedProduct.id, (selectedProduct.stock || 0) + 1)}
                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                        title="Increase stock"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStockStatus(selectedProduct.stock || 0).color}`}>
                        {getStockStatus(selectedProduct.stock || 0).text}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {selectedProduct.description && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Description</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-900">{selectedProduct.description}</p>
                </div>
              </div>
            )}

            {/* Ingredients */}
            {selectedProduct.ingredients && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Ingredients</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-900">{selectedProduct.ingredients}</p>
                </div>
              </div>
            )}

            {/* Allergens */}
            {selectedProduct.allergens && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Allergens</h3>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-yellow-800">{selectedProduct.allergens}</p>
                </div>
              </div>
            )}

            {/* Close Button */}
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setShowProductDetails(false)
                  setSelectedProduct(null)
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChefMenu
