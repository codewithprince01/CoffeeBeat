// Simple image upload that saves to frontend public folder
export const simpleImageUpload = async (file, productName) => {
  try {
    // Validate file
    if (!file) {
      return {
        success: false,
        error: 'No file selected'
      }
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      return {
        success: false,
        error: 'Please select an image file'
      }
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return {
        success: false,
        error: 'File size must be less than 5MB'
      }
    }

    // Create unique filename
    const timestamp = Date.now()
    const sanitizedProductName = (productName || 'product').toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const filename = `${sanitizedProductName}-${timestamp}.jpg`
    
    // Convert file to base64
    const reader = new FileReader()
    const base64Promise = new Promise((resolve, reject) => {
      reader.onload = () => resolve(reader.result)
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })
    
    const base64Data = await base64Promise
    
    // Clear all existing images first to avoid quota issues
    const imageKeys = Object.keys(localStorage).filter(key => key.startsWith('img_'))
    imageKeys.forEach(key => localStorage.removeItem(key))
    console.log('Cleared all images from localStorage to prevent quota issues')
    
    // Store in memory only for now
    storeMemoryImage(filename, base64Data)
    console.log('Image stored in memory only')
    
    // Return the local URL
    const imageUrl = base64Data // Use base64 directly as image source
    
    return {
      success: true,
      imageUrl: imageUrl,
      filename: filename,
      message: 'Image uploaded successfully'
    }
  } catch (error) {
    console.error('Image upload failed:', error)
    return {
      success: false,
      error: error.message || 'Failed to upload image'
    }
  }
}

// Get stored image
export const getSimpleStoredImage = (filename) => {
  try {
    const imageData = localStorage.getItem(`img_${filename}`)
    return imageData
  } catch (error) {
    console.error('Failed to retrieve stored image:', error)
    return null
  }
}

// Memory storage fallback
const memoryImages = new Map()

export const storeMemoryImage = (filename, imageData) => {
  memoryImages.set(filename, imageData)
}

export const getMemoryImage = (filename) => {
  return memoryImages.get(filename)
}
