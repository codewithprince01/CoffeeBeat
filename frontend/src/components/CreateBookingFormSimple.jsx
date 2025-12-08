import { useState } from 'react'
import { bookingService } from '../services/bookingService'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

const CreateBookingForm = ({ onSubmit, onCancel }) => {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    customerName: user?.name || user?.email || '',
    customerEmail: user?.email || '',
    customerPhone: '',
    tableId: '',
    numberOfGuests: 2,
    bookingDate: '',
    bookingTimeSlot: '', // Changed from bookingTime to bookingTimeSlot
    specialRequests: ''
  })
  const [loading, setLoading] = useState(false)

  // Generate default tables like waiter form
  const tables = [
    { id: 1, number: 'T1', capacity: 4, status: 'AVAILABLE', location: 'Main Hall' },
    { id: 2, number: 'T2', capacity: 4, status: 'AVAILABLE', location: 'Main Hall' },
    { id: 3, number: 'T3', capacity: 2, status: 'AVAILABLE', location: 'Main Hall' },
    { id: 4, number: 'T4', capacity: 6, status: 'AVAILABLE', location: 'Main Hall' },
    { id: 5, number: 'T5', capacity: 4, status: 'AVAILABLE', location: 'Outdoor' },
    { id: 6, number: 'T6', capacity: 2, status: 'AVAILABLE', location: 'Outdoor' },
    { id: 7, number: 'T7', capacity: 8, status: 'AVAILABLE', location: 'Private Room' },
    { id: 8, number: 'T8', capacity: 4, status: 'AVAILABLE', location: 'Private Room' },
  ]

  const availableTables = tables.filter(table => {
    const tableStatus = table.status
    return tableStatus === 'AVAILABLE'
  })

  const getMinDateTime = () => {
    const now = new Date()
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
    return now.toISOString().slice(0, 16)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.customerName || !formData.tableId || !formData.bookingDate || !formData.bookingTimeSlot || !formData.numberOfGuests) {
      toast.error('Please fill all required fields')
      return
    }

    // Validate date is in future
    const selectedDate = new Date(formData.bookingDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (selectedDate <= today) {
      toast.error('Please select a future date')
      return
    }

    setLoading(true)
    
    try {
      // Create booking data object to pass to parent
      const bookingData = {
        customerName: formData.customerName,
        customerEmail: formData.customerEmail || null,
        customerPhone: formData.customerPhone || null,
        tableId: formData.tableId,
        tableNumber: tables.find(t => t.id === parseInt(formData.tableId))?.number || 'T1',
        numberOfGuests: formData.numberOfGuests,
        bookingDate: formData.bookingDate,
        bookingTimeSlot: formData.bookingTimeSlot,
        specialRequests: formData.specialRequests || null
      }

      // Pass data to parent component
      onSubmit && onSubmit(bookingData)
      
      // Reset form
      setFormData({
        customerName: user?.name || user?.email || '',
        customerEmail: user?.email || '',
        customerPhone: '',
        tableId: '',
        numberOfGuests: 2,
        bookingDate: '',
        bookingTimeSlot: '',
        specialRequests: ''
      })
    } catch (error) {
      console.error('Error creating booking:', error)
      toast.error(error.response?.data?.message || 'Failed to create booking')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Customer Name</label>
          <input
            type="text"
            required
            value={formData.customerName}
            onChange={(e) => setFormData({...formData, customerName: e.target.value})}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Phone Number</label>
          <input
            type="tel"
            value={formData.customerPhone}
            onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={formData.customerEmail}
            onChange={(e) => setFormData({...formData, customerEmail: e.target.value})}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Number of Guests</label>
          <input
            type="number"
            min="1"
            max="12"
            required
            value={formData.numberOfGuests}
            onChange={(e) => setFormData({...formData, numberOfGuests: parseInt(e.target.value)})}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Table</label>
          <select
            required
            value={formData.tableId}
            onChange={(e) => setFormData({...formData, tableId: parseInt(e.target.value)})}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select a table</option>
            {availableTables.map(table => (
              <option key={table.id} value={table.id}>
                {table.number} - {table.capacity} seats - {table.location}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Booking Date</label>
          <input
            type="date"
            required
            value={formData.bookingDate}
            onChange={(e) => setFormData({...formData, bookingDate: e.target.value})}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Time Slot</label>
        <select
          required
          value={formData.bookingTimeSlot}
          onChange={(e) => setFormData({...formData, bookingTimeSlot: e.target.value})}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select a time slot</option>
          <option value="MORNING">Morning (8:00 AM - 12:00 PM)</option>
          <option value="AFTERNOON">Afternoon (12:00 PM - 5:00 PM)</option>
          <option value="EVENING">Evening (5:00 PM - 10:00 PM)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Special Requests</label>
        <textarea
          rows={3}
          value={formData.specialRequests}
          onChange={(e) => setFormData({...formData, specialRequests: e.target.value})}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !formData.customerName || !formData.tableId || !formData.bookingDate || !formData.bookingTimeSlot}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Creating...' : 'Create Booking'}
        </button>
      </div>
    </form>
  )
}

export default CreateBookingForm
