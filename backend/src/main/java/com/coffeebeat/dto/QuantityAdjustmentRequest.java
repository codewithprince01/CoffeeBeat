package com.coffeebeat.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * Data Transfer Object for quantity adjustment requests
 * 
 * This DTO provides validation for stock increase/decrease operations.
 */
public class QuantityAdjustmentRequest {

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;

    // Default constructor
    public QuantityAdjustmentRequest() {}

    // Constructor with quantity
    public QuantityAdjustmentRequest(Integer quantity) {
        this.quantity = quantity;
    }

    // Getters and Setters
    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    @Override
    public String toString() {
        return "QuantityAdjustmentRequest{" +
                "quantity=" + quantity +
                '}';
    }
}
