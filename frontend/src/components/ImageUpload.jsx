import { useState, useRef } from 'react';
import { Upload, X, Camera, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { validateImageFile, validateAvatarFile, createImagePreview, compressImage } from '../services/imageService';

export const ImageUpload = ({
  onUpload,
  onRemove,
  currentImage,
  type = 'product', // 'product' or 'avatar'
  className = '',
  disabled = false,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState(currentImage || null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    const validation = type === 'avatar' ? validateAvatarFile(file) : validateImageFile(file);
    if (!validation.isValid) {
      toast.error(validation.error);
      return false;
    }
    return true;
  };

  const handleFileSelect = async (file) => {
    if (!validateFile(file)) return;

    setIsUploading(true);
    try {
      // Create preview
      const previewUrl = await createImagePreview(file);
      setPreview(previewUrl);

      // Compress image if it's a product image
      const processedFile = type === 'product' 
        ? await compressImage(file, 800, 600, 0.8)
        : file;

      // Upload file
      await onUpload(processedFile);
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload image');
      // Reset preview on error
      setPreview(currentImage || null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleRemove = async () => {
    if (onRemove) {
      try {
        await onRemove();
        setPreview(null);
        toast.success('Image removed');
      } catch (error) {
        console.error('Remove error:', error);
        toast.error('Failed to remove image');
      }
    } else {
      setPreview(null);
    }
  };

  const openFileDialog = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className={`relative ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {preview ? (
        // Image preview
        <div className="relative group">
          <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden bg-gray-100">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          </div>
          
          {!disabled && (
            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-2">
              <button
                onClick={openFileDialog}
                disabled={isUploading}
                className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                title="Change image"
              >
                {isUploading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Camera className="h-5 w-5 text-gray-700" />
                )}
              </button>
              
              {onRemove && (
                <button
                  onClick={handleRemove}
                  disabled={isUploading}
                  className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                  title="Remove image"
                >
                  <X className="h-5 w-5 text-red-600" />
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        // Upload area
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400 bg-white'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={openFileDialog}
        >
          {isUploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
              <p className="text-sm text-gray-600">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Upload className="h-12 w-12 text-gray-400 mb-4" />
              <div className="text-sm text-gray-600">
                <p className="font-medium">Click to upload or drag and drop</p>
                <p className="text-gray-500">
                  {type === 'avatar' ? 'Avatar (PNG, JPG, GIF up to 2MB)' : 'Image (PNG, JPG, GIF up to 5MB)'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {isUploading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 rounded-lg flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
