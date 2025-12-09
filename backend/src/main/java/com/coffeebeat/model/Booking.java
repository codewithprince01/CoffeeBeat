package com.coffeebeat.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

/**
 * Booking entity representing table reservations
 * 
 * This class manages table bookings with time slots and capacity management.
 * Bookings can be in different states: BOOKED, CANCELLED, COMPLETED.
 */
@Document(collection = "bookings")
public class Booking {

    public enum BookingStatus {
        PENDING("PENDING"),
        CONFIRMED("CONFIRMED"),
        BOOKED("BOOKED"), // Legacy status for backward compatibility
        RESERVED("RESERVED"),
        OCCUPIED("OCCUPIED"),
        COMPLETED("COMPLETED"),
        CANCELLED("CANCELLED");

        private final String status;

        BookingStatus(String status) {
            this.status = status;
        }

        public String getStatus() {
            return status;
        }

        public static BookingStatus fromString(String status) {
            for (BookingStatus bs : BookingStatus.values()) {
                if (bs.status.equalsIgnoreCase(status)) {
                    return bs;
                }
            }
            throw new IllegalArgumentException("Unknown booking status: " + status);
        }
    }

    public enum TimeSlot {
        MORNING("MORNING"),
        AFTERNOON("AFTERNOON"), 
        EVENING("EVENING");

        private final String slot;

        TimeSlot(String slot) {
            this.slot = slot;
        }

        public String getSlot() {
            return slot;
        }

        public static TimeSlot fromString(String slot) {
            for (TimeSlot ts : TimeSlot.values()) {
                if (ts.slot.equalsIgnoreCase(slot)) {
                    return ts;
                }
            }
            throw new IllegalArgumentException("Unknown time slot: " + slot);
        }

        // Helper method to get slot from LocalDateTime
        public static TimeSlot fromDateTime(LocalDateTime dateTime) {
            int hour = dateTime.getHour();
            if (hour < 12) {
                return MORNING;
            } else if (hour < 17) {
                return AFTERNOON;
            } else {
                return EVENING;
            }
        }
    }

    @Id
    private String id;

    @Indexed
    @NotNull(message = "User ID is required")
    private String userId;

    @NotBlank(message = "Table number is required")
    private String tableNumber;

    @NotNull(message = "People count is required")
    @Min(value = 1, message = "At least 1 person is required")
    private Integer peopleCount;

    @NotNull(message = "Time slot is required")
    private LocalDateTime timeSlot;

    // New fields for better slot management
    @NotNull(message = "Booking date is required")
    private LocalDateTime bookingDate; // Date part of timeSlot for easier querying

    @NotNull(message = "Time slot is required")
    private TimeSlot slot; // Enum for MORNING, AFTERNOON, EVENING

    @NotNull(message = "Status is required")
    private BookingStatus status = BookingStatus.BOOKED;

    private String customerName;
    private String customerEmail;
    private String customerPhone;
    private String specialRequests;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Default constructor
    public Booking() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    // Constructor with essential fields
    public Booking(String userId, String tableNumber, Integer peopleCount, LocalDateTime timeSlot) {
        this();
        this.userId = userId;
        this.tableNumber = tableNumber;
        this.peopleCount = peopleCount;
        this.timeSlot = timeSlot;
        // Set derived fields
        this.bookingDate = timeSlot.toLocalDate().atStartOfDay();
        this.slot = TimeSlot.fromDateTime(timeSlot);
    }

    // Constructor with date and slot enum
    public Booking(String userId, String tableNumber, Integer peopleCount, LocalDateTime bookingDate, TimeSlot slot) {
        this();
        this.userId = userId;
        this.tableNumber = tableNumber;
        this.peopleCount = peopleCount;
        this.bookingDate = bookingDate;
        this.slot = slot;
        // Set timeSlot based on date and slot enum
        switch (slot) {
            case MORNING:
                this.timeSlot = bookingDate.plusHours(10); // 10:00 AM
                break;
            case AFTERNOON:
                this.timeSlot = bookingDate.plusHours(14); // 2:00 PM
                break;
            case EVENING:
                this.timeSlot = bookingDate.plusHours(19); // 7:00 PM
                break;
        }
    }

    // Pre-update method
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Business logic methods
    public boolean isActive() {
        return status == BookingStatus.CONFIRMED || status == BookingStatus.RESERVED
                || status == BookingStatus.OCCUPIED;
    }

    public boolean canBeCancelled() {
        // Admin can cancel any booking that's not already cancelled or completed
        return status != BookingStatus.CANCELLED && status != BookingStatus.COMPLETED;
    }

    public void cancel() {
        if (canBeCancelled()) {
            this.status = BookingStatus.CANCELLED;
            this.updatedAt = LocalDateTime.now();
        } else {
            throw new IllegalStateException("Booking cannot be cancelled");
        }
    }

    public void complete() {
        if (status == BookingStatus.CONFIRMED || status == BookingStatus.RESERVED || status == BookingStatus.OCCUPIED
                || status == BookingStatus.BOOKED) {
            this.status = BookingStatus.COMPLETED;
            this.updatedAt = LocalDateTime.now();
        } else {
            throw new IllegalStateException("Only active reservations can be completed");
        }
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
        this.updatedAt = LocalDateTime.now();
    }

    public String getTableNumber() {
        return tableNumber;
    }

    public void setTableNumber(String tableNumber) {
        this.tableNumber = tableNumber;
        this.updatedAt = LocalDateTime.now();
    }

    public Integer getPeopleCount() {
        return peopleCount;
    }

    public void setPeopleCount(Integer peopleCount) {
        this.peopleCount = peopleCount;
        this.updatedAt = LocalDateTime.now();
    }

    public LocalDateTime getTimeSlot() {
        return timeSlot;
    }

    public void setTimeSlot(LocalDateTime timeSlot) {
        this.timeSlot = timeSlot;
        // Update derived fields
        this.bookingDate = timeSlot.toLocalDate().atStartOfDay();
        this.slot = TimeSlot.fromDateTime(timeSlot);
        this.updatedAt = LocalDateTime.now();
    }

    public LocalDateTime getBookingDate() {
        return bookingDate;
    }

    public void setBookingDate(LocalDateTime bookingDate) {
        this.bookingDate = bookingDate;
        this.updatedAt = LocalDateTime.now();
    }

    public TimeSlot getSlot() {
        return slot;
    }

    public void setSlot(TimeSlot slot) {
        this.slot = slot;
        // Update timeSlot based on new slot and existing date
        if (bookingDate != null) {
            switch (slot) {
                case MORNING:
                    this.timeSlot = bookingDate.plusHours(10); // 10:00 AM
                    break;
                case AFTERNOON:
                    this.timeSlot = bookingDate.plusHours(14); // 2:00 PM
                    break;
                case EVENING:
                    this.timeSlot = bookingDate.plusHours(19); // 7:00 PM
                    break;
            }
        }
        this.updatedAt = LocalDateTime.now();
    }

    public BookingStatus getStatus() {
        return status;
    }

    public void setStatus(BookingStatus status) {
        this.status = status;
        this.updatedAt = LocalDateTime.now();
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
        this.updatedAt = LocalDateTime.now();
    }

    public String getCustomerEmail() {
        return customerEmail;
    }

    public void setCustomerEmail(String customerEmail) {
        this.customerEmail = customerEmail;
        this.updatedAt = LocalDateTime.now();
    }

    public String getCustomerPhone() {
        return customerPhone;
    }

    public void setCustomerPhone(String customerPhone) {
        this.customerPhone = customerPhone;
        this.updatedAt = LocalDateTime.now();
    }

    public String getSpecialRequests() {
        return specialRequests;
    }

    public void setSpecialRequests(String specialRequests) {
        this.specialRequests = specialRequests;
        this.updatedAt = LocalDateTime.now();
    }

    @Override
    public String toString() {
        return "Booking{" +
                "id='" + id + '\'' +
                ", userId='" + userId + '\'' +
                ", tableNumber='" + tableNumber + '\'' +
                ", peopleCount=" + peopleCount +
                ", timeSlot=" + timeSlot +
                ", status=" + status +
                ", createdAt=" + createdAt +
                '}';
    }
}
