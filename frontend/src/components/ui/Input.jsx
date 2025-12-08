import React from 'react'

export const Input = ({ 
  label,
  type = 'text',
  placeholder = '',
  value = '',
  onChange,
  error = '',
  disabled = false,
  required = false,
  className = '',
  ...props 
}) => {
  const baseClasses = 'block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm'
  const errorClasses = error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
  const disabledClasses = disabled ? 'bg-gray-100 cursor-not-allowed' : ''
  
  const classes = `${baseClasses} ${errorClasses} ${disabledClasses} ${className}`
  
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={classes}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}

export default Input
