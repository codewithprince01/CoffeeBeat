package com.coffeebeat.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * Data Transfer Object for stock update requests
 * 
 * This DTO provides validation for stock update operations.
 */
public class StockUpdateRequest {

    @NotNull(message = "Stock value is required")
    @Min(value = 0, message = "Stock cannot be negative")
    private Integer stock;

    // Default constructor
    public StockUpdateRequest() {}

    // Constructor with stock value
    public StockUpdateRequest(Integer stock) {
        this.stock = stock;
    }

    // Getters and Setters
    public Integer getStock() {
        return stock;
    }

    public void setStock(Integer stock) {
        this.stock = stock;
    }

    @Override
    public String toString() {
        return "StockUpdateRequest{" +
                "stock=" + stock +
                '}';
    }
}
