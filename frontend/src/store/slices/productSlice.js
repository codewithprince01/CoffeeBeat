import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import productService from '../../services/productService'

// Async thunks
export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await productService.getProducts(params)
      return response
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch products'
      )
    }
  }
)

export const fetchProductById = createAsyncThunk(
  'products/fetchProductById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await productService.getProductById(id)
      return response
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch product'
      )
    }
  }
)

export const fetchProductBySlug = createAsyncThunk(
  'products/fetchProductBySlug',
  async (slug, { rejectWithValue }) => {
    try {
      const response = await productService.getProductBySlug(slug)
      return response
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch product'
      )
    }
  }
)

export const createProduct = createAsyncThunk(
  'products/createProduct',
  async (productData, { rejectWithValue }) => {
    try {
      const response = await productService.createProduct(productData)
      return response
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create product'
      )
    }
  }
)

export const updateProduct = createAsyncThunk(
  'products/updateProduct',
  async ({ id, productData }, { rejectWithValue }) => {
    try {
      const response = await productService.updateProduct(id, productData)
      return response
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update product'
      )
    }
  }
)

export const deleteProduct = createAsyncThunk(
  'products/deleteProduct',
  async (id, { rejectWithValue }) => {
    try {
      await productService.deleteProduct(id)
      return id
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete product'
      )
    }
  }
)

export const fetchCategories = createAsyncThunk(
  'products/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await productService.getCategories()
      return response
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch categories'
      )
    }
  }
)

export const fetchInStockProducts = createAsyncThunk(
  'products/fetchInStockProducts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await productService.getInStockProducts()
      return response
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch in-stock products'
      )
    }
  }
)

export const fetchLowStockProducts = createAsyncThunk(
  'products/fetchLowStockProducts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await productService.getLowStockProducts()
      return response
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch low stock products'
      )
    }
  }
)

export const updateProductStock = createAsyncThunk(
  'products/updateProductStock',
  async ({ id, stock }, { rejectWithValue }) => {
    try {
      const response = await productService.updateStock(id, stock)
      return response
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update product stock'
      )
    }
  }
)

export const fetchProductStats = createAsyncThunk(
  'products/fetchProductStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await productService.getProductStats()
      return response
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch product statistics'
      )
    }
  }
)

// Initial state
const initialState = {
  products: [],
  currentProduct: null,
  categories: [],
  inStockProducts: [],
  lowStockProducts: [],
  stats: null,
  loading: false,
  error: null,
  pagination: {
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0,
  },
  filters: {
    category: '',
    search: '',
    sortBy: 'name',
    sortDir: 'asc',
  },
}

// Slice
const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    clearCurrentProduct: (state) => {
      state.currentProduct = null
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    resetFilters: (state) => {
      state.filters = initialState.filters
    },
    updateProductInList: (state, action) => {
      const { id, updates } = action.payload
      const index = state.products.findIndex(product => product.id === id)
      if (index !== -1) {
        state.products[index] = { ...state.products[index], ...updates }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch products
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false
        state.products = action.payload.content || action.payload
        state.pagination = {
          page: action.payload.number || 0,
          size: action.payload.size || 20,
          totalElements: action.payload.totalElements || 0,
          totalPages: action.payload.totalPages || 0,
        }
        state.error = null
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Fetch product by ID
      .addCase(fetchProductById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.loading = false
        state.currentProduct = action.payload
        state.error = null
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        state.currentProduct = null
      })
      // Fetch product by slug
      .addCase(fetchProductBySlug.fulfilled, (state, action) => {
        state.currentProduct = action.payload
      })
      // Create product
      .addCase(createProduct.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.loading = false
        state.products.unshift(action.payload)
        state.error = null
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Update product
      .addCase(updateProduct.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.loading = false
        const index = state.products.findIndex(product => product.id === action.payload.id)
        if (index !== -1) {
          state.products[index] = action.payload
        }
        if (state.currentProduct?.id === action.payload.id) {
          state.currentProduct = action.payload
        }
        state.error = null
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Delete product
      .addCase(deleteProduct.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.loading = false
        state.products = state.products.filter(product => product.id !== action.payload)
        if (state.currentProduct?.id === action.payload) {
          state.currentProduct = null
        }
        state.error = null
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Fetch categories
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload
      })
      // Fetch in-stock products
      .addCase(fetchInStockProducts.fulfilled, (state, action) => {
        state.inStockProducts = action.payload
      })
      // Fetch low stock products
      .addCase(fetchLowStockProducts.fulfilled, (state, action) => {
        state.lowStockProducts = action.payload
      })
      // Update product stock
      .addCase(updateProductStock.fulfilled, (state, action) => {
        const index = state.products.findIndex(product => product.id === action.payload.id)
        if (index !== -1) {
          state.products[index] = action.payload
        }
        if (state.currentProduct?.id === action.payload.id) {
          state.currentProduct = action.payload
        }
      })
      // Fetch product stats
      .addCase(fetchProductStats.fulfilled, (state, action) => {
        state.stats = action.payload
      })
  },
})

export const {
  clearError,
  clearCurrentProduct,
  setFilters,
  resetFilters,
  updateProductInList,
} = productSlice.actions

// Selectors
export const selectProducts = (state) => state.products.products
export const selectCurrentProduct = (state) => state.products.currentProduct
export const selectCategories = (state) => state.products.categories
export const selectInStockProducts = (state) => state.products.inStockProducts
export const selectLowStockProducts = (state) => state.products.lowStockProducts
export const selectProductStats = (state) => state.products.stats
export const selectProductsLoading = (state) => state.products.loading
export const selectProductsError = (state) => state.products.error
export const selectProductsPagination = (state) => state.products.pagination
export const selectProductsFilters = (state) => state.products.filters

export default productSlice.reducer
