package com.coffeebeat.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

/**
 * Data Transfer Object for creating bookings
 */
public class CreateBookingRequest {

    @NotBlank(message = "Table number is required")
    private String tableNumber;

    @NotNull(message = "People count is required")
    @Min(value = 1, message = "At least 1 person is required")
    private Integer peopleCount;

    @NotNull(message = "Time slot is required")
    @Future(message = "Time slot must be in the future")
    private LocalDateTime timeSlot;

    private String specialRequests;

    // Optional contact info if not authenticated or booking for someone else
    private String customerName;
    private String customerEmail;
    private String customerPhone;

    public CreateBookingRequest() {
    }

    public CreateBookingRequest(String tableNumber, Integer peopleCount, LocalDateTime timeSlot) {
        this.tableNumber = tableNumber;
        this.peopleCount = peopleCount;
        this.timeSlot = timeSlot;
    }

    public String getTableNumber() {
        return tableNumber;
    }

    public void setTableNumber(String tableNumber) {
        this.tableNumber = tableNumber;
    }

    public Integer getPeopleCount() {
        return peopleCount;
    }

    public void setPeopleCount(Integer peopleCount) {
        this.peopleCount = peopleCount;
    }

    public LocalDateTime getTimeSlot() {
        return timeSlot;
    }

    public void setTimeSlot(LocalDateTime timeSlot) {
        this.timeSlot = timeSlot;
    }

    public String getSpecialRequests() {
        return specialRequests;
    }

    public void setSpecialRequests(String specialRequests) {
        this.specialRequests = specialRequests;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getCustomerEmail() {
        return customerEmail;
    }

    public void setCustomerEmail(String customerEmail) {
        this.customerEmail = customerEmail;
    }

    public String getCustomerPhone() {
        return customerPhone;
    }

    public void setCustomerPhone(String customerPhone) {
        this.customerPhone = customerPhone;
    }
}
