package com.coffeebeat.service;

import com.coffeebeat.model.*;
import com.coffeebeat.repository.*;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Admin service for administrative functions
 * 
 * This service provides business logic for:
 * - User management
 * - Staff invitation management
 * - Analytics and reporting
 * - System administration
 */
@Service
public class AdminService {

    private static final Logger logger = LoggerFactory.getLogger(AdminService.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private InviteTokenRepository inviteTokenRepository;

    @Autowired
    private SettingsRepository settingsRepository;

    @Autowired
    private ObjectMapper objectMapper;

    public List<User> getAllUsers(String search, Boolean active) {
        if (search != null && !search.isEmpty()) {
            return userRepository.findAll().stream()
                    .filter(user -> user.getName().toLowerCase().contains(search.toLowerCase()))
                    .collect(java.util.stream.Collectors.toList());
        }
        if (active != null) {
            return userRepository.findAll().stream()
                    .filter(user -> user.isActive() == active)
                    .collect(java.util.stream.Collectors.toList());
        }
        return userRepository.findAll();
    }

    public void deleteUser(String userId) {
        userRepository.deleteById(userId);
    }

    /**
     * Get user by ID
     */
    public User getUserById(String id) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("User not found: " + id);
        }
        return userOpt.get();
    }

    /**
     * Update user
     */
    public User updateUser(String id, User userDetails) {
        User existingUser = getUserById(id);

        // Update allowed fields
        if (userDetails.getName() != null) {
            existingUser.setName(userDetails.getName());
        }
        if (userDetails.getRole() != null) {
            existingUser.setRole(userDetails.getRole());
        }
        if (userDetails.getAvatarUrl() != null) {
            existingUser.setAvatarUrl(userDetails.getAvatarUrl());
        }

        return userRepository.save(existingUser);
    }

    /**
     * Deactivate user
     */
    public void deactivateUser(String id) {
        User user = getUserById(id);
        user.setActive(false);
        userRepository.save(user);
        logger.info("User deactivated: {}", id);
    }

    /**
     * Activate user
     */
    public void activateUser(String id) {
        User user = getUserById(id);
        user.setActive(true);
        userRepository.save(user);
        logger.info("User activated: {}", id);
    }

    /**
     * Update user role
     */
    public User updateUserRole(String id, String role) {
        User user = getUserById(id);
        user.setRole(role);
        User updated = userRepository.save(user);
        logger.info("User {} role updated to {}", id, role);
        return updated;
    }

    /**
     * Toggle user active status
     */
    public User toggleUserActive(String id) {
        User user = getUserById(id);
        user.setActive(!user.isActive());
        User updated = userRepository.save(user);
        logger.info("User {} active status toggled to {}", id, user.isActive());
        return updated;
    }

    /**
     * Get user orders
     */
    public List<Order> getUserOrders(String userId) {
        return orderRepository.findByUserId(userId);
    }

    /**
     * Get invite tokens with optional filtering
     */
    public List<InviteToken> getInviteTokens(Boolean used, String role) {
        List<InviteToken> tokens;

        if (used != null) {
            tokens = used ? inviteTokenRepository.findUsedTokens() : inviteTokenRepository.findUnusedTokens();
        } else {
            tokens = inviteTokenRepository.findAll();
        }

        if (role != null && !role.isEmpty()) {
            tokens = tokens.stream()
                    .filter(token -> token.getRole().equals(role))
                    .collect(Collectors.toList());
        }

        // Sort by creation date (newest first)
        tokens.sort((t1, t2) -> t2.getCreatedAt().compareTo(t1.getCreatedAt()));

        return tokens;
    }

    /**
     * Delete expired invite tokens
     */
    public int deleteExpiredTokens() {
        List<InviteToken> expiredTokens = inviteTokenRepository.findExpiredTokens(LocalDateTime.now());

        for (InviteToken token : expiredTokens) {
            inviteTokenRepository.delete(token);
        }

        logger.info("Deleted {} expired invite tokens", expiredTokens.size());
        return expiredTokens.size();
    }

    /**
     * Get today's analytics
     */
    public Map<String, Object> getTodayAnalytics() {
        Map<String, Object> analytics = new HashMap<>();

        LocalDateTime startOfDay = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime endOfDay = startOfDay.plusDays(1);

        // Today's orders
        List<Order> todayOrders = orderRepository.findOrdersForToday(startOfDay, endOfDay);
        long todayOrderCount = todayOrders.size();
        
        logger.info("Found {} total orders for today", todayOrderCount);

        // Only completed orders for revenue
        List<Order> completedOrders = todayOrders.stream()
                .filter(order -> order.getStatus() == Order.OrderStatus.COMPLETED)
                .collect(Collectors.toList());
        
        long completedOrderCount = completedOrders.size();
        logger.info("Found {} completed orders for today", completedOrderCount);

        // Today's revenue (from completed orders only)
        double completedOrdersRevenue = completedOrders.stream()
                .filter(order -> order.getPaymentStatus() == Order.PaymentStatus.PAID)
                .mapToDouble(Order::getTotalPrice)
                .sum();
        
        logger.info("Today's revenue from completed orders: {}", completedOrdersRevenue);

        // Today's bookings
        List<Booking> todayBookings = bookingRepository.findBookingsForToday(startOfDay, endOfDay);
        long todayBookingCount = todayBookings.size();

        // Today's new users
        long todayNewUsers = userRepository.findAll().stream()
                .filter(user -> user.getCreatedAt().isAfter(startOfDay) && user.getCreatedAt().isBefore(endOfDay))
                .count();

        analytics.put("orderCount", todayOrderCount);
        analytics.put("completedOrdersCount", completedOrderCount);
        analytics.put("completedOrdersRevenue", completedOrdersRevenue);
        analytics.put("revenue", completedOrdersRevenue); // Only completed orders revenue
        analytics.put("bookingCount", todayBookingCount);
        analytics.put("newUsers", todayNewUsers);
        analytics.put("date", startOfDay.toLocalDate());

        logger.info("Today's analytics: {}", analytics);
        return analytics;
    }

    /**
     * Get last 7 days analytics
     */
    public List<Map<String, Object>> getLast7DaysAnalytics() {
        List<Map<String, Object>> analytics = new ArrayList<>();

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfDay = now.withHour(0).withMinute(0).withSecond(0).withNano(0);

        for (int i = 6; i >= 0; i--) {
            LocalDateTime dayStart = startOfDay.minusDays(i);
            LocalDateTime dayEnd = dayStart.plusDays(1);

            List<Order> dayOrders = orderRepository.findOrdersForToday(dayStart, dayEnd);
            long orderCount = dayOrders.size();
            double revenue = dayOrders.stream()
                    .filter(order -> order.getPaymentStatus() == Order.PaymentStatus.PAID)
                    .mapToDouble(Order::getTotalPrice)
                    .sum();

            Map<String, Object> dayData = new HashMap<>();
            dayData.put("date", dayStart.toLocalDate());
            dayData.put("orderCount", orderCount);
            dayData.put("revenue", revenue);

            analytics.add(dayData);
        }

        return analytics;
    }

    /**
     * Get top items analytics
     */
    public List<Map<String, Object>> getTopItemsAnalytics(int limit) {
        List<Order> allOrders = orderRepository.findAll();
        Map<String, Map<String, Object>> itemStats = new HashMap<>();

        // Aggregate item statistics
        for (Order order : allOrders) {
            for (Order.OrderItem item : order.getItems()) {
                String productId = item.getProductId();

                if (!itemStats.containsKey(productId)) {
                    Map<String, Object> stats = new HashMap<>();
                    stats.put("productId", productId);
                    stats.put("productName", item.getProductName());
                    stats.put("quantity", 0);
                    stats.put("revenue", 0.0);
                    itemStats.put(productId, stats);
                }

                Map<String, Object> stats = itemStats.get(productId);
                stats.put("quantity", (Integer) stats.get("quantity") + item.getQuantity());
                stats.put("revenue", (Double) stats.get("revenue") + (item.getPrice() * item.getQuantity()));
            }
        }

        // Sort by quantity and limit
        return itemStats.values().stream()
                .sorted((a, b) -> Integer.compare((Integer) b.get("quantity"), (Integer) a.get("quantity")))
                .limit(limit)
                .collect(Collectors.toList());
    }

    /**
     * Get monthly analytics
     */
    public List<Map<String, Object>> getMonthlyAnalytics(int months) {
        List<Map<String, Object>> analytics = new ArrayList<>();

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfMonth = now.withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);

        for (int i = months - 1; i >= 0; i--) {
            LocalDateTime monthStart = startOfMonth.minusMonths(i);
            LocalDateTime monthEnd = monthStart.plusMonths(1);

            List<Order> monthOrders = orderRepository.findByDateRange(monthStart, monthEnd);
            long orderCount = monthOrders.size();
            double revenue = monthOrders.stream()
                    .filter(order -> order.getPaymentStatus() == Order.PaymentStatus.PAID)
                    .mapToDouble(Order::getTotalPrice)
                    .sum();

            Map<String, Object> monthData = new HashMap<>();
            monthData.put("month", monthStart.getYear() + "-" + String.format("%02d", monthStart.getMonthValue()));
            monthData.put("orderCount", orderCount);
            monthData.put("revenue", revenue);

            analytics.add(monthData);
        }

        return analytics;
    }

    /**
     * Get system statistics
     */
    public Map<String, Object> getSystemStats() {
        Map<String, Object> stats = new HashMap<>();

        // User statistics
        long totalUsers = userRepository.count();
        long activeUsers = userRepository.findAllActive().size();
        long adminUsers = userRepository.countByRoleAndIsActiveTrue("ROLE_ADMIN");
        long chefUsers = userRepository.countByRoleAndIsActiveTrue("ROLE_CHEF");
        long waiterUsers = userRepository.countByRoleAndIsActiveTrue("ROLE_WAITER");
        long customerUsers = userRepository.countByRoleAndIsActiveTrue("ROLE_CUSTOMER");

        stats.put("totalUsers", totalUsers);
        stats.put("activeUsers", activeUsers);
        stats.put("adminUsers", adminUsers);
        stats.put("chefUsers", chefUsers);
        stats.put("waiterUsers", waiterUsers);
        stats.put("customerUsers", customerUsers);

        // Order statistics
        long totalOrders = orderRepository.count();
        long pendingOrders = orderRepository.countByStatus(Order.OrderStatus.PENDING);
        long completedOrders = orderRepository.countByStatus(Order.OrderStatus.COMPLETED);
        double totalRevenue = orderRepository.findAll().stream()
                .filter(order -> order.getPaymentStatus() == Order.PaymentStatus.PAID)
                .mapToDouble(Order::getTotalPrice)
                .sum();

        stats.put("totalOrders", totalOrders);
        stats.put("pendingOrders", pendingOrders);
        stats.put("completedOrders", completedOrders);
        stats.put("totalRevenue", totalRevenue);

        // Product statistics
        long totalProducts = productRepository.countActive();
        long inStockProducts = productRepository.findInStock().size();
        long lowStockProducts = productRepository.findLowStock().size();

        stats.put("totalProducts", totalProducts);
        stats.put("inStockProducts", inStockProducts);
        stats.put("lowStockProducts", lowStockProducts);

        // Booking statistics
        long totalBookings = bookingRepository.count();
        long activeBookings = bookingRepository.countByStatus(Booking.BookingStatus.BOOKED);

        stats.put("totalBookings", totalBookings);
        stats.put("activeBookings", activeBookings);

        // Invite token statistics
        long totalInviteTokens = inviteTokenRepository.findAll().size();
        long usedInviteTokens = inviteTokenRepository.findUsedTokens().size();
        long expiredInviteTokens = inviteTokenRepository.findExpiredTokens(LocalDateTime.now()).size();

        stats.put("totalInviteTokens", totalInviteTokens);
        stats.put("usedInviteTokens", usedInviteTokens);
        stats.put("expiredInviteTokens", expiredInviteTokens);

        return stats;
    }

    /**
     * Get order status distribution
     */
    public Map<String, Object> getOrderStatusDistribution() {
        Map<String, Object> distribution = new HashMap<>();

        for (Order.OrderStatus status : Order.OrderStatus.values()) {
            long count = orderRepository.countByStatus(status);
            distribution.put(status.name().toLowerCase(), count);
        }

        return distribution;
    }

    /**
     * Get revenue by date range
     */
    public Map<String, Object> getRevenueByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        Map<String, Object> analytics = new HashMap<>();

        List<Order> orders = orderRepository.findByDateRange(startDate, endDate);

        // Total revenue
        double totalRevenue = orders.stream()
                .filter(order -> order.getPaymentStatus() == Order.PaymentStatus.PAID)
                .mapToDouble(Order::getTotalPrice)
                .sum();

        // Order count
        long totalOrders = orders.size();
        long paidOrders = orders.stream()
                .filter(order -> order.getPaymentStatus() == Order.PaymentStatus.PAID)
                .count();

        // Average order value
        double averageOrderValue = paidOrders > 0 ? totalRevenue / paidOrders : 0.0;

        analytics.put("totalRevenue", totalRevenue);
        analytics.put("totalOrders", totalOrders);
        analytics.put("paidOrders", paidOrders);
        analytics.put("averageOrderValue", averageOrderValue);
        analytics.put("startDate", startDate);
        analytics.put("endDate", endDate);

        return analytics;
    }

    /**
     * Get application settings
     */
    public Map<String, Object> getSettings() {
        try {
            Settings settings = settingsRepository.findById("shop_settings")
                    .orElse(new Settings("shop_settings", "{}"));

            if (settings.getValue() == null || settings.getValue().isEmpty()) {
                return new HashMap<>();
            }

            return objectMapper.readValue(settings.getValue(), Map.class);
        } catch (JsonProcessingException e) {
            logger.error("Failed to parse settings JSON", e);
            return new HashMap<>();
        }
    }

    /**
     * Update application settings
     */
    public Map<String, Object> updateSettings(Map<String, Object> newSettings) {
        try {
            String jsonValue = objectMapper.writeValueAsString(newSettings);
            Settings settings = new Settings("shop_settings", jsonValue);
            settingsRepository.save(settings);
            return newSettings;
        } catch (JsonProcessingException e) {
            logger.error("Failed to serialize settings to JSON", e);
            throw new RuntimeException("Failed to save settings", e);
        }
    }
}
