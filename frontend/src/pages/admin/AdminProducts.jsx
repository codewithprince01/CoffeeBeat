import { useState, useEffect } from 'react'
import { Eye } from 'lucide-react'
import { productService } from '../../services/productService'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'
import { uploadImageToPublic, getStoredImage, storeUploadedImage, getUploadedImage } from '../../utils/imageUpload'

const AdminProducts = () => {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12

  // Helper function to get the correct image URL
  const getProductImageUrl = (product) => {
    if (product.imageUrl) {
      // For backend uploaded images (like /uploads/products/), return with full URL
      if (product.imageUrl.startsWith('/uploads/')) {
        console.log('Using backend uploaded image:', product.imageUrl)
        return `${import.meta.env.VITE_API_URL || 'http://localhost:8081'}${product.imageUrl}`
      }
      
      // Check if it's a stored image (from our upload system)
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
      
      // For external URLs or fallback
      return product.imageUrl
    }
    return null
  }

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)

      // Fetch products from backend API
      const response = await productService.getProducts()
      console.log('Fetched products from backend:', response)

      // Handle paginated response
      const productsData = response.data || response.content || response || []
      setProducts(productsData)

      console.log('Loaded products from backend:', productsData.length)
    } catch (error) {
      console.error('Failed to fetch products:', error)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      // Since backend doesn't have categories endpoint, use hardcoded categories
      const categories = ['COFFEE', 'TEA', 'FOOD', 'PASTRY', 'SNACK', 'BEVERAGE']
      setCategories(categories)
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      // Fallback to hardcoded categories
      setCategories(['COFFEE', 'TEA', 'FOOD', 'PASTRY', 'SNACK', 'BEVERAGE'])
    }
  }

  const handleCreateProduct = async (productData) => {
    try {
      console.log('Creating product with data:', productData)

      // Create product via backend API
      await productService.createProduct(productData)
      console.log('Product created successfully via backend')

      fetchProducts()
      setShowCreateModal(false)
      toast.success('Product created successfully!')
    } catch (error) {
      console.error('Failed to create product:', error)
      toast.error('Failed to create product: ' + (error.response?.data?.message || error.message))
    }
  }

  const handleUpdateProduct = async (productId, productData) => {
    try {
      await productService.updateProduct(productId, productData)
      fetchProducts()
      setShowEditModal(false)
      setSelectedProduct(null)
    } catch (error) {
      console.error('Failed to update product:', error)
    }
  }

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productService.deleteProduct(productId)
        fetchProducts()
      } catch (error) {
        console.error('Failed to delete product:', error)
      }
    }
  }

  const handleToggleProductStatus = async (productId, isActive) => {
    try {
      console.log('Toggling product:', productId, 'from active:', isActive)

      // Update local state immediately
      const newStatus = !isActive
      setProducts(prevProducts =>
        prevProducts.map(p =>
          p.id === productId ? { ...p, active: newStatus } : p
        )
      )

      // Store in localStorage for persistence
      const storedStatus = JSON.parse(localStorage.getItem('productStatus') || '{}')
      storedStatus[productId] = newStatus
      localStorage.setItem('productStatus', JSON.stringify(storedStatus))

      // Try to update backend (but don't wait for it)
      const product = products.find(p => p.id === productId)
      if (product) {
        const updateData = {
          active: newStatus,
          name: product.name,
          slug: product.slug,
          price: product.price,
          stock: product.stock,
          description: product.description,
          category: product.category
        }

        productService.updateProduct(productId, updateData).catch(error => {
          console.log('Backend update failed, but local state preserved:', error)
        })
      }

      // Show toast notification
      if (isActive) {
        toast.success('Product marked as unavailable')
      } else {
        toast.success('Product marked as available')
      }
    } catch (error) {
      console.error('Failed to toggle product status:', error)
      toast.error('Failed to toggle product status')
    }
  }

  const filteredProducts = (products || []).filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'available' && product.active) ||
      (statusFilter === 'unavailable' && !product.active)

    return matchesSearch && matchesCategory && matchesStatus
  })

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)

  const formatCategoryName = (category) => {
    const categoryNames = {
      'COFFEE': 'Coffee',
      'TEA': 'Tea',
      'FOOD': 'Food',
      'PASTRY': 'Pastry',
      'SNACK': 'Snack',
      'BEVERAGE': 'Beverage'
    }
    return categoryNames[category] || category
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
          <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
          <p className="text-gray-600">Manage your coffee shop menu items</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{formatCategoryName(category)}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </div>
          <div>
            <button className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {currentProducts.map((product) => (
          <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="h-48 bg-gray-200 relative">
              {getProductImageUrl(product) ? (
                <img
                  src={getProductImageUrl(product)}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              <div className="absolute top-2 right-2">
                <button
                  onClick={() => {
                    setSelectedProduct(product)
                    setShowDetailModal(true)
                  }}
                  className="p-1.5 bg-white rounded-full text-gray-700 hover:text-blue-600 shadow-sm transition-colors"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
              <p className="text-sm text-gray-600 mb-2">{product.description}</p>
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg font-bold text-gray-900">${product.price}</span>
                <span className="text-sm text-gray-500">{formatCategoryName(product.category)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Stock: {product.stock || 0}</span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setSelectedProduct(product)
                      setShowEditModal(true)
                    }}
                    className="text-blue-600 hover:text-blue-900 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(product.id)}
                    className="text-red-600 hover:text-red-900 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6 space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
          >
            Previous
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 border rounded ${currentPage === i + 1 ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Create Product Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-screen overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Product</h2>
            <ProductForm
              categories={categories}
              onSubmit={handleCreateProduct}
              onCancel={() => setShowCreateModal(false)}
              formatCategoryName={formatCategoryName}
            />
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && selectedProduct && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-screen overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Edit Product</h2>
            <ProductForm
              product={selectedProduct}
              categories={categories}
              onSubmit={(productData) => handleUpdateProduct(selectedProduct.id, productData)}
              onCancel={() => {
                setShowEditModal(false)
                setSelectedProduct(null)
              }}
              formatCategoryName={formatCategoryName}
            />
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      {showDetailModal && selectedProduct && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{selectedProduct.name}</h2>
              <button
                onClick={() => {
                  setShowDetailModal(false)
                  setSelectedProduct(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                {getProductImageUrl(selectedProduct) ? (
                  <img
                    src={getProductImageUrl(selectedProduct)}
                    alt={selectedProduct.name}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                    <svg className="h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Price</h3>
                  <p className="text-xl font-bold text-gray-900">${selectedProduct.price}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Category</h3>
                  <p className="text-gray-900">{formatCategoryName(selectedProduct.category)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Description</h3>
                  <p className="text-gray-900">{selectedProduct.description}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Stock</h3>
                  <p className="text-gray-900">{selectedProduct.stock || 0} units</p>
                </div>
                {selectedProduct.ingredients && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Ingredients</h3>
                    <p className="text-gray-900">{selectedProduct.ingredients}</p>
                  </div>
                )}
                {selectedProduct.allergens && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Allergens</h3>
                    <p className="text-gray-900">{selectedProduct.allergens}</p>
                  </div>
                )}
                {selectedProduct.preparationTime && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Preparation Time</h3>
                    <p className="text-gray-900">{selectedProduct.preparationTime}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ProductForm Component
const ProductForm = ({ product, categories, onSubmit, onCancel, formatCategoryName }) => {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || '',
    category: product?.category || '',
    stock: product?.stock || 0,
    active: product?.active !== undefined ? product.active : true,
    imageUrl: product?.imageUrl || '',
    ingredients: product?.ingredients || '',
    preparationTime: product?.preparationTime || '',
    allergens: product?.allergens || ''
  })
  const [selectedFile, setSelectedFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')

  // Set initial image preview when component loads
  useEffect(() => {
    if (product?.imageUrl) {
      if (product.imageUrl.startsWith('/images/products/')) {
        const filename = product.imageUrl.split('/').pop()
        const storedImage = getStoredImage(filename)
        if (storedImage) {
          setImagePreview(storedImage)
        }
      } else {
        setImagePreview(product.imageUrl)
      }
    }
  }, [product])

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    let imageUrl = formData.imageUrl

    // If a file is selected, upload it first
    if (selectedFile) {
      try {
        toast.loading('Uploading image...', { id: 'upload' })
        const uploadResult = await uploadImageToPublic(selectedFile, formData.name)

        if (uploadResult.success) {
          imageUrl = uploadResult.imageUrl
          toast.success('Image uploaded successfully!', { id: 'upload' })
        } else {
          toast.error(uploadResult.error, { id: 'upload' })
          return
        }
      } catch (error) {
        console.error('Error uploading image:', error)
        toast.error('Failed to upload image', { id: 'upload' })
        return
      }
    }

    // Generate slug from name if not provided
    const productData = {
      ...formData,
      imageUrl,
      slug: formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    }
    onSubmit(productData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Product Name</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Price</label>
          <input
            type="number"
            step="0.01"
            required
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          rows={3}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Category</label>
          <select
            required
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select a category</option>
            {categories.map(category => (
              <option key={category} value={category}>{formatCategoryName(category)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Stock Quantity</label>
          <input
            type="number"
            value={formData.stock}
            onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Preparation Time (minutes)</label>
          <input
            type="text"
            value={formData.preparationTime}
            onChange={(e) => setFormData({ ...formData, preparationTime: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Product Image</label>
          <div className="mt-1 flex flex-col items-center">
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Product preview"
                  className="h-32 w-32 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview('')
                    setSelectedFile(null)
                    setFormData({ ...formData, imageUrl: '' })
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="h-32 w-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="mt-1 text-xs text-gray-500">Upload a product image (JPG, PNG, GIF, WebP - Max 5MB)</p>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Ingredients</label>
        <textarea
          rows={2}
          value={formData.ingredients}
          onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Allergens</label>
        <input
          type="text"
          value={formData.allergens}
          onChange={(e) => setFormData({ ...formData, allergens: e.target.value })}
          placeholder="e.g., nuts, dairy, gluten"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          checked={formData.active}
          onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label className="ml-2 block text-sm text-gray-900">Available for order</label>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          {product ? 'Update Product' : 'Create Product'}
        </button>
      </div>
    </form>
  )
}

export default AdminProducts
