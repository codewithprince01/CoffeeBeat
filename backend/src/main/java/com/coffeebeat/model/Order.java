package com.coffeebeat.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;

/**
 * Order entity representing customer orders
 * 
 * This class manages the complete order lifecycle from creation to completion.
 * It supports multiple items, table associations, and staff assignments.
 */
@Document(collection = "orders")
public class Order {

    public enum OrderStatus {
        PENDING("PENDING"),
        CONFIRMED("CONFIRMED"),
        PREPARING("PREPARING"),
        READY_FOR_SERVICE("READY_FOR_SERVICE"),
        SERVED("SERVED"),
        CANCELLED("CANCELLED"),
        COMPLETED("COMPLETED");

        private final String status;

        OrderStatus(String status) {
            this.status = status;
        }

        public String getStatus() {
            return status;
        }

        public static OrderStatus fromString(String status) {
            for (OrderStatus os : OrderStatus.values()) {
                if (os.status.equalsIgnoreCase(status)) {
                    return os;
                }
            }
            throw new IllegalArgumentException("Unknown order status: " + status);
        }
    }

    public enum PaymentStatus {
        PENDING("PENDING"),
        PAID("PAID");

        private final String status;

        PaymentStatus(String status) {
            this.status = status;
        }

        public String getStatus() {
            return status;
        }

        public static PaymentStatus fromString(String status) {
            for (PaymentStatus ps : PaymentStatus.values()) {
                if (ps.status.equalsIgnoreCase(status)) {
                    return ps;
                }
            }
            throw new IllegalArgumentException("Unknown payment status: " + status);
        }
    }

    @Id
    private String id;

    @Indexed
    @NotNull(message = "User ID is required")
    private String userId;

    // Items list is optional for table bookings (can be empty for reservations)
    private List<OrderItem> items = new ArrayList<>();

    @Indexed
    private String tableBookingId;

    // Total price is optional for table bookings (can be 0 for reservations)
    private Double totalPrice;

    @NotNull(message = "Payment status is required")
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;

    @NotNull(message = "Order status is required")
    private OrderStatus status = OrderStatus.PENDING;

    @Indexed
    private String assignedChefId;

    @Indexed
    private String assignedWaiterId;

    @org.springframework.data.annotation.Transient
    private String customerName;

    private String notes;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    // Nested class for order items
    public static class OrderItem {
        private String productId;
        private String productName;
        private Double price;
        private Integer quantity;

        public OrderItem() {
        }

        public OrderItem(String productId, String productName, Double price, Integer quantity) {
            this.productId = productId;
            this.productName = productName;
            this.price = price;
            this.quantity = quantity;
        }

        public Double getSubtotal() {
            return price * quantity;
        }

        // Getters and Setters
        public String getProductId() {
            return productId;
        }

        public void setProductId(String productId) {
            this.productId = productId;
        }

        public String getProductName() {
            return productName;
        }

        public void setProductName(String productName) {
            this.productName = productName;
        }

        public Double getPrice() {
            return price;
        }

        public void setPrice(Double price) {
            this.price = price;
        }

        public Integer getQuantity() {
            return quantity;
        }

        public void setQuantity(Integer quantity) {
            this.quantity = quantity;
        }

        @Override
        public String toString() {
            return "OrderItem{" +
                    "productId='" + productId + '\'' +
                    ", productName='" + productName + '\'' +
                    ", price=" + price +
                    ", quantity=" + quantity +
                    '}';
        }
    }

    // Default constructor
    public Order() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    // Constructor with essential fields
    public Order(String userId, List<OrderItem> items, Double totalPrice) {
        this();
        this.userId = userId;
        this.items = items;
        this.totalPrice = totalPrice;
    }

    // Pre-update method
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Business logic methods
    public boolean canBeCancelled() {
        return status == OrderStatus.PENDING || status == OrderStatus.CONFIRMED;
    }

    public boolean canBeConfirmed() {
        return status == OrderStatus.PENDING;
    }

    public boolean canBePrepared() {
        return status == OrderStatus.CONFIRMED;
    }

    public boolean canBeMarkedReady() {
        return status == OrderStatus.PREPARING;
    }

    public boolean canBeServed() {
        return status == OrderStatus.READY_FOR_SERVICE;
    }

    public boolean canBeCompleted() {
        return status == OrderStatus.SERVED;
    }

    public void cancel() {
        if (canBeCancelled()) {
            this.status = OrderStatus.CANCELLED;
            this.updatedAt = LocalDateTime.now();
        } else {
            throw new IllegalStateException("Order cannot be cancelled in current status: " + status);
        }
    }

    public void confirm() {
        if (canBeConfirmed()) {
            this.status = OrderStatus.CONFIRMED;
            this.updatedAt = LocalDateTime.now();
        } else {
            throw new IllegalStateException("Order cannot be confirmed in current status: " + status);
        }
    }

    public void startPreparation() {
        if (canBePrepared()) {
            this.status = OrderStatus.PREPARING;
            this.updatedAt = LocalDateTime.now();
        } else {
            throw new IllegalStateException("Order cannot be prepared in current status: " + status);
        }
    }

    public void markReadyForService() {
        if (canBeMarkedReady()) {
            this.status = OrderStatus.READY_FOR_SERVICE;
            this.updatedAt = LocalDateTime.now();
        } else {
            throw new IllegalStateException("Order cannot be marked ready in current status: " + status);
        }
    }

    public void serve() {
        if (canBeServed()) {
            this.status = OrderStatus.SERVED;
            this.updatedAt = LocalDateTime.now();
        } else {
            throw new IllegalStateException("Order cannot be served in current status: " + status);
        }
    }

    public void complete() {
        if (canBeCompleted()) {
            this.status = OrderStatus.COMPLETED;
            this.paymentStatus = PaymentStatus.PAID;
            this.updatedAt = LocalDateTime.now();
        } else {
            throw new IllegalStateException("Order cannot be completed in current status: " + status);
        }
    }

    public void assignChef(String chefId) {
        this.assignedChefId = chefId;
        this.updatedAt = LocalDateTime.now();
    }

    public void assignWaiter(String waiterId) {
        this.assignedWaiterId = waiterId;
        this.updatedAt = LocalDateTime.now();
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

    public List<OrderItem> getItems() {
        return items;
    }

    public void setItems(List<OrderItem> items) {
        this.items = items;
        this.updatedAt = LocalDateTime.now();
    }

    public String getTableBookingId() {
        return tableBookingId;
    }

    public void setTableBookingId(String tableBookingId) {
        this.tableBookingId = tableBookingId;
        this.updatedAt = LocalDateTime.now();
    }

    public Double getTotalPrice() {
        return totalPrice;
    }

    public void setTotalPrice(Double totalPrice) {
        this.totalPrice = totalPrice;
        this.updatedAt = LocalDateTime.now();
    }

    public PaymentStatus getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(PaymentStatus paymentStatus) {
        this.paymentStatus = paymentStatus;
        this.updatedAt = LocalDateTime.now();
    }

    public OrderStatus getStatus() {
        return status;
    }

    public void setStatus(OrderStatus status) {
        this.status = status;
        this.updatedAt = LocalDateTime.now();
    }

    public String getAssignedChefId() {
        return assignedChefId;
    }

    public void setAssignedChefId(String assignedChefId) {
        this.assignedChefId = assignedChefId;
        this.updatedAt = LocalDateTime.now();
    }

    public String getAssignedWaiterId() {
        return assignedWaiterId;
    }

    public void setAssignedWaiterId(String assignedWaiterId) {
        this.assignedWaiterId = assignedWaiterId;
        this.updatedAt = LocalDateTime.now();
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
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

    @Override
    public String toString() {
        return "Order{" +
                "id='" + id + '\'' +
                ", userId='" + userId + '\'' +
                ", items=" + items +
                ", totalPrice=" + totalPrice +
                ", status=" + status +
                ", paymentStatus=" + paymentStatus +
                ", assignedChefId='" + assignedChefId + '\'' +
                ", assignedWaiterId='" + assignedWaiterId + '\'' +
                ", createdAt=" + createdAt +
                '}';
    }
}
