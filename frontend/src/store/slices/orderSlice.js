import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import orderService from '../../services/orderService'

// Async thunks
export const fetchOrders = createAsyncThunk(
  'orders/fetchOrders',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await orderService.getOrders(params)
      return response
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch orders'
      )
    }
  }
)

export const fetchOrderById = createAsyncThunk(
  'orders/fetchOrderById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await orderService.getOrderById(id)
      return response
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch order'
      )
    }
  }
)

export const createOrder = createAsyncThunk(
  'orders/createOrder',
  async (orderData, { rejectWithValue }) => {
    try {
      const response = await orderService.createOrder(orderData)
      return response
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create order'
      )
    }
  }
)

export const updateOrder = createAsyncThunk(
  'orders/updateOrder',
  async ({ id, orderData }, { rejectWithValue }) => {
    try {
      const response = await orderService.updateOrder(id, orderData)
      return response
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update order'
      )
    }
  }
)

export const updateOrderStatus = createAsyncThunk(
  'orders/updateOrderStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await orderService.updateOrderStatus(id, { status })
      return response
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update order status'
      )
    }
  }
)

export const cancelOrder = createAsyncThunk(
  'orders/cancelOrder',
  async (id, { rejectWithValue }) => {
    try {
      const response = await orderService.cancelOrder(id)
      return response
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to cancel order'
      )
    }
  }
)

export const fetchMyOrders = createAsyncThunk(
  'orders/fetchMyOrders',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await orderService.getMyOrders(params)
      return response
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch my orders'
      )
    }
  }
)

export const fetchChefOrders = createAsyncThunk(
  'orders/fetchChefOrders',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await orderService.getChefOrders(params)
      return response
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch chef orders'
      )
    }
  }
)

export const fetchWaiterOrders = createAsyncThunk(
  'orders/fetchWaiterOrders',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await orderService.getWaiterOrders(params)
      return response
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch waiter orders'
      )
    }
  }
)

export const fetchAdminOrders = createAsyncThunk(
  'orders/fetchAdminOrders',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await orderService.getAdminOrders(params)
      return response
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch admin orders'
      )
    }
  }
)

export const fetchOrderStats = createAsyncThunk(
  'orders/fetchOrderStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await orderService.getOrderStats()
      return response
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch order statistics'
      )
    }
  }
)

// Initial state
const initialState = {
  orders: [],
  currentOrder: null,
  myOrders: [],
  chefOrders: [],
  waiterOrders: [],
  adminOrders: [],
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
    status: '',
    dateFrom: '',
    dateTo: '',
    sortBy: 'createdAt',
    sortDir: 'desc',
  },
}

// Slice
const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    clearCurrentOrder: (state) => {
      state.currentOrder = null
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    resetFilters: (state) => {
      state.filters = initialState.filters
    },
    updateOrderInList: (state, action) => {
      const { id, updates } = action.payload
      const updateOrderList = (orderList) => {
        const index = orderList.findIndex(order => order.id === id)
        if (index !== -1) {
          orderList[index] = { ...orderList[index], ...updates }
        }
      }
      updateOrderList(state.orders)
      updateOrderList(state.myOrders)
      updateOrderList(state.chefOrders)
      updateOrderList(state.waiterOrders)
      updateOrderList(state.adminOrders)
      
      if (state.currentOrder?.id === id) {
        state.currentOrder = { ...state.currentOrder, ...updates }
      }
    },
    addNewOrder: (state, action) => {
      const newOrder = action.payload
      state.orders.unshift(newOrder)
      
      // Add to appropriate role-specific lists based on current user role
      // This would need to be handled based on user context
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch orders
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false
        state.orders = action.payload.content || action.payload
        state.pagination = {
          page: action.payload.number || 0,
          size: action.payload.size || 20,
          totalElements: action.payload.totalElements || 0,
          totalPages: action.payload.totalPages || 0,
        }
        state.error = null
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Fetch order by ID
      .addCase(fetchOrderById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.loading = false
        state.currentOrder = action.payload
        state.error = null
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        state.currentOrder = null
      })
      // Create order
      .addCase(createOrder.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.loading = false
        state.orders.unshift(action.payload)
        state.myOrders.unshift(action.payload)
        state.error = null
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Update order
      .addCase(updateOrder.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateOrder.fulfilled, (state, action) => {
        state.loading = false
        const updateOrderList = (orderList) => {
          const index = orderList.findIndex(order => order.id === action.payload.id)
          if (index !== -1) {
            orderList[index] = action.payload
          }
        }
        updateOrderList(state.orders)
        updateOrderList(state.myOrders)
        updateOrderList(state.chefOrders)
        updateOrderList(state.waiterOrders)
        updateOrderList(state.adminOrders)
        
        if (state.currentOrder?.id === action.payload.id) {
          state.currentProduct = action.payload
        }
        state.error = null
      })
      .addCase(updateOrder.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Update order status
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        const updateOrderList = (orderList) => {
          const index = orderList.findIndex(order => order.id === action.payload.id)
          if (index !== -1) {
            orderList[index] = action.payload
          }
        }
        updateOrderList(state.orders)
        updateOrderList(state.myOrders)
        updateOrderList(state.chefOrders)
        updateOrderList(state.waiterOrders)
        updateOrderList(state.adminOrders)
        
        if (state.currentOrder?.id === action.payload.id) {
          state.currentOrder = action.payload
        }
      })
      // Cancel order
      .addCase(cancelOrder.fulfilled, (state, action) => {
        const updateOrderList = (orderList) => {
          const index = orderList.findIndex(order => order.id === action.payload.id)
          if (index !== -1) {
            orderList[index] = action.payload
          }
        }
        updateOrderList(state.orders)
        updateOrderList(state.myOrders)
        updateOrderList(state.chefOrders)
        updateOrderList(state.waiterOrders)
        updateOrderList(state.adminOrders)
        
        if (state.currentOrder?.id === action.payload.id) {
          state.currentOrder = action.payload
        }
      })
      // Fetch my orders
      .addCase(fetchMyOrders.fulfilled, (state, action) => {
        state.myOrders = action.payload.content || action.payload
      })
      // Fetch chef orders
      .addCase(fetchChefOrders.fulfilled, (state, action) => {
        state.chefOrders = action.payload.content || action.payload
      })
      // Fetch waiter orders
      .addCase(fetchWaiterOrders.fulfilled, (state, action) => {
        state.waiterOrders = action.payload.content || action.payload
      })
      // Fetch admin orders
      .addCase(fetchAdminOrders.fulfilled, (state, action) => {
        state.adminOrders = action.payload.content || action.payload
      })
      // Fetch order stats
      .addCase(fetchOrderStats.fulfilled, (state, action) => {
        state.stats = action.payload
      })
  },
})

export const {
  clearError,
  clearCurrentOrder,
  setFilters,
  resetFilters,
  updateOrderInList,
  addNewOrder,
} = orderSlice.actions

// Selectors
export const selectOrders = (state) => state.orders.orders
export const selectCurrentOrder = (state) => state.orders.currentOrder
export const selectMyOrders = (state) => state.orders.myOrders
export const selectChefOrders = (state) => state.orders.chefOrders
export const selectWaiterOrders = (state) => state.orders.waiterOrders
export const selectAdminOrders = (state) => state.orders.adminOrders
export const selectOrderStats = (state) => state.orders.stats
export const selectOrdersLoading = (state) => state.orders.loading
export const selectOrdersError = (state) => state.orders.error
export const selectOrdersPagination = (state) => state.orders.pagination
export const selectOrdersFilters = (state) => state.orders.filters

export default orderSlice.reducer
