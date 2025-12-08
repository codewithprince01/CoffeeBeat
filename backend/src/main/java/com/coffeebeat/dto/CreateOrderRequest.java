package com.coffeebeat.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public class CreateOrderRequest {

    @NotEmpty(message = "Order items cannot be empty")
    @Valid
    private List<OrderItemRequest> items;

    private String tableBookingId;
    private String notes;

    // We do NOT accept totalPrice from client, it must be calculated server-side

    public static class OrderItemRequest {
        @NotEmpty(message = "Product ID is required")
        private String productId;

        private Integer quantity;

        public String getProductId() {
            return productId;
        }

        public void setProductId(String productId) {
            this.productId = productId;
        }

        public Integer getQuantity() {
            return quantity;
        }

        public void setQuantity(Integer quantity) {
            this.quantity = quantity;
        }
    }

    public List<OrderItemRequest> getItems() {
        return items;
    }

    public void setItems(List<OrderItemRequest> items) {
        this.items = items;
    }

    public String getTableBookingId() {
        return tableBookingId;
    }

    public void setTableBookingId(String tableBookingId) {
        this.tableBookingId = tableBookingId;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
