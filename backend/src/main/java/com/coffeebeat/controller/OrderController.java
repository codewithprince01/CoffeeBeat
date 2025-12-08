package com.coffeebeat.controller;

import com.coffeebeat.model.Order;
import com.coffeebeat.service.OrderService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private static final Logger logger = LoggerFactory.getLogger(OrderController.class);

    @Autowired
    private OrderService orderService;

    /**
     * Create a new order
     */
    /**
     * Create a new order
     */
    @PostMapping
    public ResponseEntity<Order> createOrder(
            @jakarta.validation.Valid @RequestBody com.coffeebeat.dto.CreateOrderRequest orderRequest,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            logger.info("Received order creation request for user: {}",
                    userDetails != null ? userDetails.getUsername() : "anonymous");

            String userId = "anonymous";
            if (userDetails != null) {
                // We need the actual ID, but userDetails only has username (email).
                // The service handles looking up user by email or we pass email.
                // Current service expects userId string.
                // Let's modify controller to pass email and let service resolve ID?
                // Or resolve it here.
                // Service `createOrder(Order order, String userId)` takes ID.
                // Let's resolve ID validation inside service or fetch it here.
                // Better: Update service to accept email or resolved user.
                // For now, let's assume we can get it from service or repo.
                // But wait, `populateCustomerName` uses Repository.

                // Let's pass the email to a new/overloaded createOrder method in Service?
                // Or fetch User here.
                userId = userDetails.getUsername(); // This is email usually in Spring Security defaults if we set it
                                                    // so.
                // Actually `userDetails.getUsername()` returns what we set as subject.
                // In `CustomUserDetailsService` (if we had one), we'd know.
                // Based on `JwtUtil` viewed earlier, subject is email.
            }

            Order createdOrder = orderService.createOrderFromDto(orderRequest, userId);
            logger.info("Order created successfully with ID: {}", createdOrder.getId());
            return ResponseEntity.ok(createdOrder);
        } catch (Exception e) {
            logger.error("Create order failed: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get order by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<Order> getOrder(@PathVariable String id) {
        try {
            Order order = orderService.getOrderById(id);
            if (order == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(order);
        } catch (Exception e) {
            logger.error("Get order failed: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Get all orders (admin only)
     */
    @GetMapping
    public ResponseEntity<?> getAllOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        try {
            Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
            Pageable pageable = PageRequest.of(page, size, sort);
            Page<Order> orders = orderService.findAll(pageable);
            return ResponseEntity.ok(orders);
        } catch (Exception e) {
            logger.error("Get all orders failed: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get my orders (for authenticated customer)
     */
    @GetMapping("/my-orders")
    public ResponseEntity<List<Order>> getMyOrders(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            String userEmail = userDetails != null ? userDetails.getUsername() : null;

            if (userEmail == null) {
                // For unauthenticated users, return sample data
                List<Order> ordersDefaultUser = orderService.findByUserId("default-user");
                List<Order> ordersAnonymous = orderService.findByUserId("anonymous");

                List<Order> allOrders = new java.util.ArrayList<>();
                allOrders.addAll(ordersDefaultUser);
                allOrders.addAll(ordersAnonymous);

                return ResponseEntity.ok(allOrders);
            }

            // Get orders for authenticated user
            Pageable pageable = PageRequest.of(0, 100, Sort.by("createdAt").descending());
            Page<Order> ordersPage = orderService.findByUser(userEmail, pageable);
            return ResponseEntity.ok(ordersPage.getContent());
        } catch (Exception e) {
            logger.error("Get my orders failed: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get order statistics (admin)
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getOrderStats() {
        try {
            Map<String, Object> stats = orderService.getOrderStats();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            logger.error("Get order stats failed: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get today's orders (admin)
     */
    @GetMapping("/today")
    public ResponseEntity<List<Order>> getTodayOrders() {
        try {
            List<Order> orders = orderService.getTodayOrders();
            return ResponseEntity.ok(orders);
        } catch (Exception e) {
            logger.error("Get today orders failed: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get chef orders (for chef dashboard)
     */
    @GetMapping("/chef-orders")
    public ResponseEntity<List<Order>> getChefOrders(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            if (userDetails == null) {
                return ResponseEntity.status(401).build();
            }
            List<Order> orders = orderService.getOrdersForChef(userDetails.getUsername());
            return ResponseEntity.ok(orders);
        } catch (Exception e) {
            logger.error("Get chef orders failed: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get waiter orders (for waiter dashboard)
     */
    @GetMapping("/waiter-orders")
    public ResponseEntity<List<Order>> getWaiterOrders(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            if (userDetails == null) {
                return ResponseEntity.status(401).build();
            }
            List<Order> orders = orderService.getOrdersForWaiter(userDetails.getUsername());
            return ResponseEntity.ok(orders);
        } catch (Exception e) {
            logger.error("Get waiter orders failed: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get orders needing chef attention
     */
    @GetMapping("/needing-chef")
    public ResponseEntity<List<Order>> getOrdersNeedingChef() {
        try {
            List<Order> orders = orderService.getOrdersNeedingChef();
            return ResponseEntity.ok(orders);
        } catch (Exception e) {
            logger.error("Get orders needing chef failed: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get orders needing waiter attention
     */
    @GetMapping("/needing-waiter")
    public ResponseEntity<List<Order>> getOrdersNeedingWaiter() {
        try {
            List<Order> orders = orderService.getOrdersNeedingWaiter();
            return ResponseEntity.ok(orders);
        } catch (Exception e) {
            logger.error("Get orders needing waiter failed: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Update order status
     */
    /**
     * Update order status
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<Order> updateOrderStatus(
            @PathVariable String id,
            @jakarta.validation.Valid @RequestBody com.coffeebeat.dto.UpdateOrderStatusRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            String userEmail = userDetails != null ? userDetails.getUsername() : "admin@coffee.test";

            Order.OrderStatus orderStatus;
            try {
                orderStatus = Order.OrderStatus.valueOf(request.getStatus().toUpperCase());
            } catch (IllegalArgumentException e) {
                logger.error("Invalid status: {}", request.getStatus());
                return ResponseEntity.badRequest().build();
            }

            Order updatedOrder = orderService.updateOrderStatus(
                    id,
                    orderStatus,
                    request.getChefId(),
                    request.getWaiterId(),
                    userEmail);

            return ResponseEntity.ok(updatedOrder);
        } catch (IllegalArgumentException e) {
            logger.error("Invalid status update: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            logger.error("Update order status failed: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Cancel order
     */
    @PutMapping("/{id}/cancel")
    public ResponseEntity<Order> cancelOrder(
            @PathVariable String id,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            String userEmail = userDetails != null ? userDetails.getUsername() : "admin@coffee.test";
            Order cancelledOrder = orderService.cancelOrder(id, userEmail);
            return ResponseEntity.ok(cancelledOrder);
        } catch (Exception e) {
            logger.error("Cancel order failed: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Assign order to chef
     */
    @PutMapping("/{id}/assign-chef")
    public ResponseEntity<Order> assignOrderToChef(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        try {
            String chefId = body.get("chefId");
            if (chefId == null || chefId.isEmpty()) {
                return ResponseEntity.badRequest().build();
            }
            Order assignedOrder = orderService.assignOrderToChef(id, chefId);
            return ResponseEntity.ok(assignedOrder);
        } catch (Exception e) {
            logger.error("Assign order to chef failed: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Assign order to waiter
     */
    @PutMapping("/{id}/assign-waiter")
    public ResponseEntity<Order> assignOrderToWaiter(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        try {
            String waiterId = body.get("waiterId");
            if (waiterId == null || waiterId.isEmpty()) {
                return ResponseEntity.badRequest().build();
            }
            Order assignedOrder = orderService.assignOrderToWaiter(id, waiterId);
            return ResponseEntity.ok(assignedOrder);
        } catch (Exception e) {
            logger.error("Assign order to waiter failed: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Test order creation endpoint
     */
    @PostMapping("/test")
    public ResponseEntity<String> testOrderCreation() {
        try {
            Order testOrder = new Order();
            testOrder.setUserId("test-user");
            testOrder.setTotalPrice(10.0);
            testOrder.setNotes("Test order");

            Order.OrderItem item = new Order.OrderItem("test-product", "Test Product", 5.0, 2);
            testOrder.setItems(List.of(item));

            Order savedOrder = orderService.createOrder(testOrder, "test-user");
            logger.info("Test order created with ID: {}", savedOrder.getId());
            return ResponseEntity.ok("Test order created with ID: " + savedOrder.getId());
        } catch (Exception e) {
            logger.error("Test order creation failed: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Test failed: " + e.getMessage());
        }
    }
}
