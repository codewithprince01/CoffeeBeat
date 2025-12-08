import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// Create axios instance for image uploads with larger timeout
const imageApi = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 seconds timeout for image uploads
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

// Add auth token to requests
imageApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
imageApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/**
 * Upload product image (Admin only)
 */
export const uploadProductImage = async (productId, file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await imageApi.post(`/api/products/${productId}/image`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

/**
 * Remove product image (Admin only)
 */
export const removeProductImage = async (productId) => {
  const response = await imageApi.delete(`/api/products/${productId}/image`);
  return response.data;
};

/**
 * Upload user avatar
 */
export const uploadUserAvatar = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await imageApi.post('/api/images/upload/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

/**
 * Delete image (Admin only)
 */
export const deleteImage = async (publicId) => {
  const response = await imageApi.delete(`/api/images/${publicId}`);
  return response.data;
};

/**
 * Get optimized image URL
 */
export const getOptimizedUrl = async (publicId) => {
  const response = await imageApi.get(`/api/images/url/${publicId}`);
  return response.data;
};

/**
 * Validate image file
 */
export const validateImageFile = (file) => {
  // Check if file is an image
  if (!file.type.startsWith('image/')) {
    return {
      isValid: false,
      error: 'Please upload a valid image file (JPEG, PNG, GIF, WebP)',
    };
  }

  // Check file size (5MB for products, 2MB for avatars)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'File size must be less than 5MB',
    };
  }

  // Check file types
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Only JPEG, PNG, GIF, and WebP images are allowed',
    };
  }

  return { isValid: true };
};

/**
 * Validate avatar file
 */
export const validateAvatarFile = (file) => {
  // Check if file is an image
  if (!file.type.startsWith('image/')) {
    return {
      isValid: false,
      error: 'Please upload a valid image file (JPEG, PNG, GIF, WebP)',
    };
  }

  // Check file size (2MB for avatars)
  const maxSize = 2 * 1024 * 1024; // 2MB
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'Avatar file size must be less than 2MB',
    };
  }

  // Check file types
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Only JPEG, PNG, GIF, and WebP images are allowed',
    };
  }

  return { isValid: true };
};

/**
 * Create image preview from file
 */
export const createImagePreview = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
};

/**
 * Compress image before upload
 */
export const compressImage = async (file, maxWidth = 800, maxHeight = 600, quality = 0.8) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          resolve(new File([blob], file.name, { type: 'image/jpeg' }));
        },
        'image/jpeg',
        quality
      );
    };

    img.src = URL.createObjectURL(file);
  });
};

export default imageApi;
