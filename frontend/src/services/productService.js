import api from './authService'

export const productService = {
  // Get all products with pagination
  getProducts: async (params = {}) => {
    console.log('Loading products from backend API...')
    const response = await api.get('/products', { params })
    console.log('Loaded products from backend:', response.data)
    return response.data
  },

  // Get product by ID
  getProductById: async (id) => {
    const response = await api.get(`/products/${id}`)
    return response.data
  },

  // Get product by slug
  getProductBySlug: async (slug) => {
    const response = await api.get(`/products/slug/${slug}`)
    return response.data
  },

  // Create product (admin only)
  createProduct: async (productData, imageFile = null) => {
    if (imageFile) {
      // Use multipart endpoint for image upload
      const formData = new FormData()
      
      // Create proper DTO structure that backend expects
      const createProductRequest = {
        name: productData.name,
        slug: productData.slug || productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') + '-' + Date.now(),
        price: productData.price,
        stock: productData.stock || 0,
        description: productData.description || '',
        category: productData.category,
        isActive: productData.active !== false
      }
      
      console.log('Sending createProductRequest:', createProductRequest)
      console.log('Image file:', imageFile.name, imageFile.type, imageFile.size)
      
      formData.append('product', new Blob([JSON.stringify(createProductRequest)], { type: 'application/json' }))
      formData.append('image', imageFile)
      
      // Log FormData contents for debugging
      console.log('FormData contents:')
      for (let [key, value] of formData.entries()) {
        console.log(key, value instanceof File ? `File: ${value.name}` : value)
      }
      
      try {
        const response = await api.post('/products/admin/create', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
        return response.data
      } catch (error) {
        console.error('Create product error details:', error.response?.data)
        throw error
      }
    } else {
      // Use simple JSON endpoint when no image
      const response = await api.post('/products/admin/create-simple', productData)
      return response.data
    }
  },

  // Update product (admin only)
  updateProduct: async (id, productData, imageFile = null) => {
    if (imageFile) {
      // Use multipart endpoint for image upload
      const formData = new FormData()
      formData.append('product', new Blob([JSON.stringify(productData)], { type: 'application/json' }))
      formData.append('image', imageFile)
      
      const response = await api.put(`/products/admin/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    } else {
      // Use simple JSON endpoint when no image
      const response = await api.put(`/products/${id}`, productData)
      return response.data
    }
  },

  // Delete product (admin only)
  deleteProduct: async (id) => {
    const response = await api.delete(`/products/admin/${id}`)
    return response.data
  },

  // Get product categories
  getCategories: async () => {
    const response = await api.get('/products/categories')
    return response.data
  },

  // Get in stock products
  getInStockProducts: async () => {
    const response = await api.get('/products/in-stock')
    return response.data
  },

  // Get low stock products (admin only)
  getLowStockProducts: async () => {
    const response = await api.get('/products/admin/low-stock')
    return response.data
  },

  // Update product stock (admin only)
  updateProductStock: async (id, stockData) => {
    const response = await api.patch(`/products/admin/${id}/stock`, stockData)
    return response.data
  },

  // Get product statistics (admin only)
  getProductStats: async () => {
    const response = await api.get('/products/admin/stats')
    return response.data
  },

  // Search products
  searchProducts: async (query, params = {}) => {
    const response = await api.get('/products/search', {
      params: { q: query, ...params },
    })
    return response.data
  },

  // Get all products (alias for getProducts)
  getAllProducts: async () => {
    const response = await api.get('/products')
    return response.data.content || response.data
  },

  // Toggle product availability
  toggleProductAvailability: async (productId) => {
    const response = await api.patch(`/products/admin/${productId}/toggle-availability`)
    return response.data
  },
}

export default productService
