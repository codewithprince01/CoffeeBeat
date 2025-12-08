// Utility function to handle image uploads
import { simpleImageUpload, getSimpleStoredImage, getMemoryImage, storeMemoryImage } from './simpleImageUpload'

export const uploadImageToPublic = async (file, productName) => {
  try {
    // Try backend upload first
    const formData = new FormData()
    formData.append('file', file)
    formData.append('productName', productName)

    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8081'}/api/products/upload-image`, {
      method: 'POST',
      body: formData,
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        console.log('Backend upload successful:', result)
        return {
          success: true,
          imageUrl: result.imageUrl,
          filename: result.filename,
          message: result.message
        }
      } else {
        console.warn('Backend upload failed, using frontend storage:', result.message)
        return await simpleImageUpload(file, productName)
      }
    } else {
      throw new Error('Backend upload failed')
    }
  } catch (error) {
    console.error('Backend upload failed, using frontend storage:', error)
    // Fallback to frontend storage
    return await simpleImageUpload(file, productName)
  }
}

// Get stored image from frontend storage
export const getStoredImage = (filename) => {
  // Try localStorage first
  const storedImage = getSimpleStoredImage(filename)
  if (storedImage) {
    return storedImage
  }
  
  // Fallback to memory
  return getMemoryImage(filename)
}

// In-memory storage for uploaded images (fallback)
const uploadedImages = new Map()

export const storeUploadedImage = (filename, imageData) => {
  uploadedImages.set(filename, imageData)
}

export const getUploadedImage = (filename) => {
  return uploadedImages.get(filename)
}

// Load all stored images (not needed for frontend storage)
export const loadStoredImages = () => {
  console.log('Using frontend storage - no need to load from backend')
}
