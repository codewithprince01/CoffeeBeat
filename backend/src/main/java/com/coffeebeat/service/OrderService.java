package com.coffeebeat.service;

import com.coffeebeat.model.Order;
import com.coffeebeat.model.Product;
import com.coffeebeat.model.User;
import com.coffeebeat.repository.OrderRepository;
import com.coffeebeat.repository.ProductRepository;
import com.coffeebeat.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Order service for managing customer orders
 * 
 * This service provides business logic for:
 * - Order creation and validation
 * - Order status management
 * - Order assignment to staff
 * - Order analytics and statistics
 */
@Service
public class OrderService {

    private static final Logger logger = LoggerFactory.getLogger(OrderService.class);

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductService productService;

    @Autowired
    private NotificationService notificationService;

    @Transactional
    public Order createOrder(Order order, String userId) {
        logger.info("Creating order for userId: {} with {} items", userId,
                order.getItems() != null ? order.getItems().size() : 0);
        order.setUserId(userId);

        // Validate items and stock atomically
        validateOrderItemsAtomic(order.getItems());

        // Decrease stock atomically
        if (order.getItems() != null) {
            for (Order.OrderItem item : order.getItems()) {
                // Use atomic stock decrease
                productService.decreaseStockAtomic(item.getProductId(), item.getQuantity());
            }
        }

        Order savedOrder = orderRepository.save(order);

        // Populate customer name
        populateCustomerName(savedOrder);

        // Notify realtime listeners
        try {
            notificationService.notifyOrderCreated(savedOrder);
        } catch (Exception e) {
            logger.error("Failed to broadcast new order: {}", e.getMessage());
        }

        logger.info("Order saved to database with ID: {}", savedOrder.getId());

        return savedOrder;
    }

    @Transactional
    public Order createOrderFromDto(com.coffeebeat.dto.CreateOrderRequest request, String userIdentifier) {
        String userId = userIdentifier;

        // Logic for user resolution (kept for reference but userId passed to
        // createOrder matches logic)
        if (!"anonymous".equals(userIdentifier)) {
            Optional<User> userOpt = userRepository.findByEmail(userIdentifier);
            if (userOpt.isPresent()) {
                userId = userOpt.get().getId();
                // customerName = userOpt.get().getName(); // Not used here, populated later
            }
        }

        Order order = new Order();
        order.setUserId(userId);
        order.setNotes(request.getNotes());
        order.setTableBookingId(request.getTableBookingId());

        List<Order.OrderItem> items = new java.util.ArrayList<>();
        double totalPrice = 0.0;

        if (request.getItems() != null) {
            for (com.coffeebeat.dto.CreateOrderRequest.OrderItemRequest itemRequest : request.getItems()) {
                Product product = productRepository.findById(itemRequest.getProductId())
                        .orElseThrow(
                                () -> new IllegalArgumentException("Product not found: " + itemRequest.getProductId()));

                if (!product.isActive()) {
                    throw new IllegalArgumentException("Product is inactive: " + product.getName());
                }

                Order.OrderItem item = new Order.OrderItem();
                item.setProductId(product.getId());
                item.setProductName(product.getName());
                item.setPrice(product.getPrice());
                item.setQuantity(itemRequest.getQuantity());

                items.add(item);
                totalPrice += product.getPrice() * itemRequest.getQuantity();
            }
        }

        order.setItems(items);
        order.setTotalPrice(totalPrice);
        order.setStatus(Order.OrderStatus.PENDING);
        order.setPaymentStatus(Order.PaymentStatus.PENDING);

        return createOrder(order, userId);
    }

    public Order getOrderById(String id) {
        Order order = orderRepository.findById(id).orElse(null);
        if (order != null) {
            populateCustomerName(order);
        }
        return order;
    }

    public List<Order> findByUserId(String userId) {
        return orderRepository.findByUserId(userId);
    }

    /**
     * Find order by ID with user validation
     */
    public Order findById(String id, String userEmail) {
        Optional<Order> orderOpt = orderRepository.findById(id);
        if (orderOpt.isEmpty()) {
            throw new IllegalArgumentException("Order not found: " + id);
        }

        Order order = orderOpt.get();

        // Check if user has access to this order
        Optional<User> userOpt = userRepository.findByEmail(userEmail);
        if (userOpt.isPresent()) {
            User user = userOpt.get();

            // Admin can see all orders, other users can only see their own orders
            if (!user.getRole().equals("ROLE_ADMIN") && !order.getUserId().equals(user.getId())) {
                throw new IllegalArgumentException("Access denied to order: " + id);
            }
        }

        populateCustomerName(order);

        return order;
    }

    /**
     * Find order for status update with relaxed access control for staff
     */
    public Order findOrderForStatusUpdate(String id, String userEmail) {
        Optional<Order> orderOpt = orderRepository.findById(id);
        if (orderOpt.isEmpty()) {
            throw new IllegalArgumentException("Order not found: " + id);
        }

        Order order = orderOpt.get();

        // Check if user has access to this order for status updates
        Optional<User> userOpt = userRepository.findByEmail(userEmail);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            String userRole = user.getRole();

            // Admin can update all orders
            // Chef and Waiter can update orders they have access to (based on workflow)
            // Customer can only update their own orders (for cancellation)
            if (userRole.equals("ROLE_ADMIN")) {
                // Admin can access all orders
                return order;
            } else if (userRole.equals("ROLE_CHEF") || userRole.equals("ROLE_WAITER")) {
                // Chef and Waiter can access all orders for status updates
                // This allows them to work with orders in the kitchen workflow
                return order;
            } else if (order.getUserId().equals(user.getId())) {
                // Customer can only access their own orders
                return order;
            } else {
                throw new IllegalArgumentException("Access denied to order: " + id);
            }
        }

        throw new IllegalArgumentException("User not found: " + userEmail);
    }

    /**
     * Find all orders with pagination
     */
    public Page<Order> findAll(Pageable pageable) {
        Page<Order> page = orderRepository.findAll(pageable);
        page.getContent().forEach(this::populateCustomerName);
        return page;
    }

    /**
     * Find orders by user
     */
    public Page<Order> findByUser(String userEmail, Pageable pageable) {
        Optional<User> userOpt = userRepository.findByEmail(userEmail);
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("User not found: " + userEmail);
        }

        return orderRepository.findByUserId(userOpt.get().getId(), pageable);
    }

    /**
     * Find orders by user and status
     */
    public Page<Order> findByUserAndStatus(String userEmail, Order.OrderStatus status, Pageable pageable) {
        Optional<User> userOpt = userRepository.findByEmail(userEmail);
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("User not found: " + userEmail);
        }

        List<Order> orders = orderRepository.findByUserIdAndStatus(userOpt.get().getId(), status);

        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), orders.size());

        List<Order> pageContent = orders.subList(start, end);

        return new PageImpl<>(pageContent, pageable, orders.size());
    }

    /**
     * Find orders by status
     */
    public Page<Order> findByStatus(Order.OrderStatus status, Pageable pageable) {
        return orderRepository.findByStatus(status, pageable);
    }

    /**
     * Find orders by date range
     */
    public Page<Order> findByDateRange(LocalDateTime startDate, LocalDateTime endDate, Pageable pageable) {
        return orderRepository.findByDateRange(startDate, endDate, pageable);
    }

    /**
     * Update order status
     */
    @Transactional
    public Order updateOrderStatus(String orderId, Order.OrderStatus newStatus, String chefId, String waiterId,
            String userEmail) {
        logger.info("Updating order status: {} to {} by {}", orderId, newStatus, userEmail);

        // Use a different access check for status updates (chefs can update orders)
        Order order = findOrderForStatusUpdate(orderId, userEmail);

        // Validate status transition based on user role
        Optional<User> userOpt = userRepository.findByEmail(userEmail);
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("User not found: " + userEmail);
        }

        User user = userOpt.get();
        String userRole = user.getRole();

        // Validate status transition
        validateStatusTransition(order.getStatus(), newStatus, userRole);

        // Update status
        switch (newStatus) {
            case CONFIRMED:
                order.confirm();
                break;
            case PREPARING:
                order.startPreparation();
                if (chefId != null) {
                    order.assignChef(chefId);
                } else if ("ROLE_CHEF".equals(userRole)) {
                    order.assignChef(user.getId());
                }
                break;
            case READY_FOR_SERVICE:
                order.markReadyForService();
                break;
            case SERVED:
                order.serve();
                if (waiterId != null) {
                    order.assignWaiter(waiterId);
                } else if ("ROLE_WAITER".equals(userRole)) {
                    order.assignWaiter(user.getId());
                }
                break;
            case COMPLETED:
                order.complete();
                break;
            case CANCELLED:
                order.cancel();
                // Restore stock for cancelled orders
                restoreStock(order.getItems());
                break;
            default:
                throw new IllegalArgumentException("Invalid status transition");
        }

        Order updatedOrder = orderRepository.save(order);

        // Populate customer name before broadcasting
        populateCustomerName(updatedOrder);

        // Notify realtime listeners
        try {
            notificationService.notifyOrderStatusUpdate(updatedOrder);
        } catch (Exception e) {
            logger.error("Failed to broadcast order update: {}", e.getMessage());
        }

        logger.info("Order status updated successfully: {} -> {}", orderId, newStatus);

        return updatedOrder;
    }

    /**
     * Cancel order
     */
    @Transactional
    public Order cancelOrder(String orderId, String userEmail) {
        logger.info("Cancelling order: {} by user: {}", orderId, userEmail);

        Order order = findById(orderId, userEmail);

        // Check if user can cancel this order
        Optional<User> userOpt = userRepository.findByEmail(userEmail);
        if (userOpt.isPresent()) {
            User user = userOpt.get();

            // Only customer who placed the order or admin can cancel
            if (!user.getRole().equals("ROLE_ADMIN") && !order.getUserId().equals(user.getId())) {
                throw new IllegalArgumentException("Access denied to cancel order: " + orderId);
            }
        }

        order.cancel();

        // Restore stock
        restoreStock(order.getItems());

        Order cancelledOrder = orderRepository.save(order);
        logger.info("Order cancelled successfully: {}", orderId);

        return cancelledOrder;
    }

    /**
     * Get orders for chef
     */
    public List<Order> getOrdersForChef(String userEmail) {
        Optional<User> userOpt = userRepository.findByEmail(userEmail);
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("User not found: " + userEmail);
        }

        User user = userOpt.get();
        List<Order> orders = orderRepository.findByAssignedChefId(user.getId());
        orders.forEach(this::populateCustomerName);
        return orders;
    }

    /**
     * Get orders for waiter
     */
    public List<Order> getOrdersForWaiter(String userEmail) {
        Optional<User> userOpt = userRepository.findByEmail(userEmail);
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("User not found: " + userEmail);
        }

        User user = userOpt.get();
        return orderRepository.findByAssignedWaiterId(user.getId());
    }

    /**
     * Get orders needing chef attention
     */
    public List<Order> getOrdersNeedingChef() {
        return orderRepository.findOrdersNeedingChef();
    }

    /**
     * Get orders needing waiter attention
     */
    public List<Order> getOrdersNeedingWaiter() {
        return orderRepository.findOrdersNeedingWaiter();
    }

    /**
     * Get today's orders
     */
    public List<Order> getTodayOrders() {
        LocalDateTime startOfDay = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime endOfDay = startOfDay.plusDays(1);
        return orderRepository.findOrdersForToday(startOfDay, endOfDay);
    }

    /**
     * Get order statistics
     */
    public Map<String, Object> getOrderStats() {
        Map<String, Object> stats = new HashMap<>();

        LocalDateTime startOfDay = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime endOfDay = startOfDay.plusDays(1);

        // Today's stats
        long todayOrders = orderRepository.countOrdersForTodayByStatus(startOfDay, endOfDay, null);
        long todayPending = orderRepository.countOrdersForTodayByStatus(startOfDay, endOfDay,
                Order.OrderStatus.PENDING);
        long todayConfirmed = orderRepository.countOrdersForTodayByStatus(startOfDay, endOfDay,
                Order.OrderStatus.CONFIRMED);
        long todayPreparing = orderRepository.countOrdersForTodayByStatus(startOfDay, endOfDay,
                Order.OrderStatus.PREPARING);
        long todayCompleted = orderRepository.countOrdersForTodayByStatus(startOfDay, endOfDay,
                Order.OrderStatus.COMPLETED);

        stats.put("todayOrders", todayOrders);
        stats.put("todayPending", todayPending);
        stats.put("todayConfirmed", todayConfirmed);
        stats.put("todayPreparing", todayPreparing);
        stats.put("todayCompleted", todayCompleted);

        // Overall stats
        long totalOrders = orderRepository.count();
        long pendingOrders = orderRepository.countByStatus(Order.OrderStatus.PENDING);
        long confirmedOrders = orderRepository.countByStatus(Order.OrderStatus.CONFIRMED);
        long preparingOrders = orderRepository.countByStatus(Order.OrderStatus.PREPARING);
        long readyOrders = orderRepository.countByStatus(Order.OrderStatus.READY_FOR_SERVICE);
        long servedOrders = orderRepository.countByStatus(Order.OrderStatus.SERVED);
        long completedOrders = orderRepository.countByStatus(Order.OrderStatus.COMPLETED);
        long cancelledOrders = orderRepository.countByStatus(Order.OrderStatus.CANCELLED);

        stats.put("totalOrders", totalOrders);
        stats.put("pendingOrders", pendingOrders);
        stats.put("confirmedOrders", confirmedOrders);
        stats.put("preparingOrders", preparingOrders);
        stats.put("readyOrders", readyOrders);
        stats.put("servedOrders", servedOrders);
        stats.put("completedOrders", completedOrders);
        stats.put("cancelledOrders", cancelledOrders);

        return stats;
    }

    /**
     * Validate order items and stock atomically
     */
    private void validateOrderItemsAtomic(List<Order.OrderItem> items) {
        // Skip validation for table bookings (empty items allowed)
        if (items == null || items.isEmpty()) {
            return;
        }

        for (Order.OrderItem item : items) {
            // Check if product exists and is active
            if (!productService.isProductActive(item.getProductId())) {
                throw new IllegalArgumentException("Product not found or inactive: " + item.getProductId());
            }

            // Check stock atomically
            Product product = productRepository.findById(item.getProductId())
                    .orElseThrow(() -> new IllegalArgumentException("Product not found: " + item.getProductId()));

            if (!product.isActive()) {
                throw new IllegalArgumentException("Product is inactive: " + product.getName());
            }

            if (product.getStock() <= 0) {
                throw new IllegalArgumentException("Out of stock for product: " + product.getName());
            }

            if (product.getStock() < item.getQuantity()) {
                throw new IllegalArgumentException("Insufficient stock for product: " + product.getName() +
                        ". Available: " + product.getStock() + ", Requested: " + item.getQuantity());
            }
        }
    }

    /**
     * Validate order items and stock (legacy method)
     */
    private void validateOrderItems(List<Order.OrderItem> items) {
        validateOrderItemsAtomic(items);
    }

    /**
     * Restore stock for cancelled orders
     */
    private void restoreStock(List<Order.OrderItem> items) {
        for (Order.OrderItem item : items) {
            productService.increaseStock(item.getProductId(), item.getQuantity());
        }
    }

    /**
     * Validate status transition based on user role
     */
    private void validateStatusTransition(Order.OrderStatus currentStatus, Order.OrderStatus newStatus,
            String userRole) {
        switch (userRole) {
            case "ROLE_ADMIN":
                // Admin can do any valid transition
                break;
            case "ROLE_CHEF":
                // Chef can update to CONFIRMED, PREPARING, or READY_FOR_SERVICE
                if (newStatus != Order.OrderStatus.CONFIRMED &&
                        newStatus != Order.OrderStatus.PREPARING &&
                        newStatus != Order.OrderStatus.READY_FOR_SERVICE) {
                    throw new IllegalArgumentException(
                            "Chef can only update order to CONFIRMED, PREPARING or READY_FOR_SERVICE");
                }
                break;
            case "ROLE_WAITER":
                // Waiter can only update to SERVED
                if (newStatus != Order.OrderStatus.SERVED) {
                    throw new IllegalArgumentException("Waiter can only update order to SERVED");
                }
                break;
            case "ROLE_CUSTOMER":
                // Customer can only cancel their own orders
                if (newStatus != Order.OrderStatus.CANCELLED) {
                    throw new IllegalArgumentException("Customer can only cancel orders");
                }
                break;
            default:
                throw new IllegalArgumentException("Invalid user role");
        }

        // Additional validation for status transitions
        switch (currentStatus) {
            case PENDING:
                if (newStatus != Order.OrderStatus.CONFIRMED && newStatus != Order.OrderStatus.CANCELLED) {
                    throw new IllegalArgumentException("Invalid status transition from PENDING");
                }
                break;
            case CONFIRMED:
                if (newStatus != Order.OrderStatus.PREPARING && newStatus != Order.OrderStatus.CANCELLED) {
                    throw new IllegalArgumentException("Invalid status transition from CONFIRMED");
                }
                break;
            case PREPARING:
                if (newStatus != Order.OrderStatus.READY_FOR_SERVICE && newStatus != Order.OrderStatus.CANCELLED) {
                    throw new IllegalArgumentException("Invalid status transition from PREPARING");
                }
                break;
            case READY_FOR_SERVICE:
                if (newStatus != Order.OrderStatus.SERVED) {
                    throw new IllegalArgumentException("Invalid status transition from READY_FOR_SERVICE");
                }
                break;
            case SERVED:
                if (newStatus != Order.OrderStatus.COMPLETED) {
                    throw new IllegalArgumentException("Invalid status transition from SERVED");
                }
                break;
            case COMPLETED:
            case CANCELLED:
                throw new IllegalArgumentException("Cannot transition from final status");
        }
    }

    /**
     * Assign order to chef
     */
    @Transactional
    public Order assignOrderToChef(String orderId, String chefId) {
        try {
            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new IllegalArgumentException("Order not found"));

            User chef = userRepository.findById(chefId)
                    .orElseThrow(() -> new IllegalArgumentException("Chef not found"));

            if (!"ROLE_CHEF".equals(chef.getRole())) {
                throw new IllegalArgumentException("User is not a chef");
            }

            // Assign chef to order
            order.setAssignedChefId(chefId);

            // Update status to PREPARING if still CONFIRMED
            if (order.getStatus() == Order.OrderStatus.CONFIRMED) {
                order.setStatus(Order.OrderStatus.PREPARING);
            }

            Order savedOrder = orderRepository.save(order);

            logger.info("Order {} assigned to chef {}", orderId, chefId);
            return savedOrder;

        } catch (Exception e) {
            logger.error("Failed to assign order {} to chef {}", orderId, chefId, e);
            throw new RuntimeException("Failed to assign order to chef: " + e.getMessage());
        }
    }

    /**
     * Assign order to waiter
     */
    @Transactional
    public Order assignOrderToWaiter(String orderId, String waiterId) {
        try {
            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new IllegalArgumentException("Order not found"));

            // Validate waiter exists and has WAITER role
            User waiter = userRepository.findById(waiterId)
                    .orElseThrow(() -> new IllegalArgumentException("Waiter not found"));

            if (!"ROLE_WAITER".equals(waiter.getRole())) {
                throw new IllegalArgumentException("User is not a waiter");
            }

            // Assign waiter to order
            order.setAssignedWaiterId(waiterId);

            // Update status to READY_FOR_SERVICE if still PREPARING
            if (order.getStatus() == Order.OrderStatus.PREPARING) {
                order.setStatus(Order.OrderStatus.READY_FOR_SERVICE);
            }

            Order savedOrder = orderRepository.save(order);

            logger.info("Order {} assigned to waiter {}", orderId, waiterId);
            return savedOrder;

        } catch (Exception e) {
            logger.error("Failed to assign order {} to waiter {}", orderId, waiterId, e);
            throw new RuntimeException("Failed to assign order to waiter: " + e.getMessage());
        }
    }

    /**
     * Populate customer name for an order
     */
    private void populateCustomerName(Order order) {
        if (order.getUserId() != null) {
            userRepository.findById(order.getUserId()).ifPresent(user -> {
                String name = user.getName();
                if (name == null || name.isEmpty()) {
                    name = user.getUsername();
                }
                if (name == null || name.isEmpty()) {
                    name = "Customer";
                }
                order.setCustomerName(name);
            });
        }
    }
}
