package com.coffeebeat.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import java.time.LocalDateTime;

/**
 * DTO for updating an existing booking.
 * Fields are optional to allow partial updates.
 */
public class UpdateBookingRequest {

    private String tableNumber;

    @Min(value = 1, message = "At least 1 person is required")
    private Integer peopleCount;

    @Future(message = "Time slot must be in the future")
    private LocalDateTime timeSlot;

    private String specialRequests;

    // Optional: Allow updating contact info
    private String customerName;
    private String customerEmail;
    private String customerPhone;

    public UpdateBookingRequest() {
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
