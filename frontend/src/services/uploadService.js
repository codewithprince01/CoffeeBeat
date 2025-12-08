import axios from 'axios'

const API_BASE_URL = 'http://localhost:8080/api'

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('token')
}

export const uploadService = {
  // Upload image to backend
  uploadImage: async (file, productName) => {
    try {
      const token = getAuthToken()
      
      const formData = new FormData()
      formData.append('file', file)
      if (productName) {
        formData.append('productName', productName)
      }

      const response = await axios.post(`${API_BASE_URL}/upload/image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      })

      return response.data
    } catch (error) {
      console.error('Upload error:', error)
      throw error
    }
  },

  // Get image URL
  getImageUrl: (filename) => {
    return `http://localhost:8080/api/upload/images/${filename}`
  }
}
