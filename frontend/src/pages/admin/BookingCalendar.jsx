import React, { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const BookingCalendar = ({ bookings, onSelectDate }) => {
    const [currentDate, setCurrentDate] = useState(new Date())

    const getDaysInMonth = (date) => {
        const year = date.getFullYear()
        const month = date.getMonth()
        return new Date(year, month + 1, 0).getDate()
    }

    const getFirstDayOfMonth = (date) => {
        const year = date.getFullYear()
        const month = date.getMonth()
        return new Date(year, month, 1).getDay()
    }

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
    }

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
    }

    const daysInMonth = getDaysInMonth(currentDate)
    const firstDay = getFirstDayOfMonth(currentDate)
    const days = []

    // Empty cells for previous month
    for (let i = 0; i < firstDay; i++) {
        days.push(<div key={`empty-${i}`} className="h-24 bg-gray-50 border border-gray-100"></div>)
    }

    // Days of current month
    for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i)
        const dateString = date.toDateString()
        const dayBookings = bookings.filter(b => new Date(b.timeSlot).toDateString() === dateString)

        days.push(
            <div
                key={i}
                onClick={() => onSelectDate(date)}
                className="h-24 border border-gray-100 p-2 hover:bg-blue-50 cursor-pointer transition-colors relative group"
            >
                <span className={`text-sm font-medium ${date.toDateString() === new Date().toDateString()
                        ? 'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center'
                        : 'text-gray-700'
                    }`}>
                    {i}
                </span>

                <div className="mt-1 space-y-1 overflow-y-auto max-h-16 scrollbar-hide">
                    {dayBookings.map(booking => (
                        <div
                            key={booking.id}
                            className={`text-xs px-1 py-0.5 rounded truncate ${booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                                    booking.status === 'OCCUPIED' ? 'bg-orange-100 text-orange-800' :
                                        booking.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                                            'bg-gray-100 text-gray-800'
                                }`}
                            title={`${new Date(booking.timeSlot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - Table ${booking.tableNumber}`}
                        >
                            {new Date(booking.timeSlot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    ))}
                </div>

                {dayBookings.length > 0 && (
                    <div className="absolute bottom-1 right-1 bg-gray-900 text-white text-[10px] px-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        {dayBookings.length}
                    </div>
                )}
            </div>
        )
    }

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ]

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold text-gray-900">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <div className="flex space-x-2">
                    <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-full">
                        <ChevronLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-full">
                        <ChevronRight className="w-5 h-5 text-gray-600" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-0">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="h-10 flex items-center justify-center bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-500">
                        {day}
                    </div>
                ))}
                {days}
            </div>
        </div>
    )
}

export default BookingCalendar
