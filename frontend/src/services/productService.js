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
  createProduct: async (productData) => {
    const response = await api.post('/products', productData)
    return response.data
  },

  // Update product (admin only)
  updateProduct: async (id, productData) => {
    const response = await api.put(`/products/${id}`, productData)
    return response.data
  },

  // Delete product (admin only)
  deleteProduct: async (id) => {
    const response = await api.delete(`/products/${id}`)
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
    const response = await api.get('/products/low-stock')
    return response.data
  },

  // Update product stock (admin only)
  updateProductStock: async (id, stockData) => {
    const response = await api.patch(`/products/${id}/stock`, stockData)
    return response.data
  },

  // Get product statistics (admin only)
  getProductStats: async () => {
    const response = await api.get('/products/stats')
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
    const response = await api.patch(`/products/${productId}/toggle-availability`)
    return response.data
  },
}

export default productService
