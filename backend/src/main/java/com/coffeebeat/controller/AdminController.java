package com.coffeebeat.controller;

import com.coffeebeat.model.User;
import com.coffeebeat.service.AdminService;
import com.coffeebeat.service.OrderService;
import com.coffeebeat.service.ProductService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private static final Logger logger = LoggerFactory.getLogger(AdminController.class);

    @Autowired
    private AdminService adminService;

    @Autowired
    private OrderService orderService;

    @Autowired
    private ProductService productService;

    /**
     * Get dashboard statistics
     */
    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        try {
            Map<String, Object> stats = new HashMap<>();

            // Get order stats
            Map<String, Object> orderStats = orderService.getOrderStats();
            stats.put("orders", orderStats);

            // Get product stats
            Map<String, Object> productStats = productService.getProductStats();
            stats.put("products", productStats);

            // Get user stats
            List<User> allUsers = adminService.getAllUsers(null, null);
            long totalUsers = allUsers.size();
            long activeUsers = allUsers.stream().filter(User::isActive).count();
            long customerCount = allUsers.stream().filter(u -> "ROLE_CUSTOMER".equals(u.getRole())).count();
            long chefCount = allUsers.stream().filter(u -> "ROLE_CHEF".equals(u.getRole())).count();
            long waiterCount = allUsers.stream().filter(u -> "ROLE_WAITER".equals(u.getRole())).count();
            long adminCount = allUsers.stream().filter(u -> "ROLE_ADMIN".equals(u.getRole())).count();

            Map<String, Object> userStats = new HashMap<>();
            userStats.put("totalUsers", totalUsers);
            userStats.put("activeUsers", activeUsers);
            userStats.put("customers", customerCount);
            userStats.put("chefs", chefCount);
            userStats.put("waiters", waiterCount);
            userStats.put("admins", adminCount);
            stats.put("users", userStats);

            logger.info("Dashboard stats fetched successfully");
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            logger.error("Failed to get dashboard stats: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get all users
     */
    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean active) {
        try {
            List<User> users = adminService.getAllUsers(search, active);
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            logger.error("Failed to get users: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get user by ID
     */
    @GetMapping("/users/{id}")
    public ResponseEntity<User> getUserById(@PathVariable String id) {
        try {
            User user = adminService.getUserById(id);
            if (user == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            logger.error("Failed to get user {}: {}", id, e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Update user role
     */
    @PutMapping("/users/{id}/role")
    public ResponseEntity<User> updateUserRole(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        try {
            String newRole = body.get("role");
            if (newRole == null || newRole.isEmpty()) {
                return ResponseEntity.badRequest().build();
            }
            User updatedUser = adminService.updateUserRole(id, newRole);
            logger.info("User {} role updated to {}", id, newRole);
            return ResponseEntity.ok(updatedUser);
        } catch (Exception e) {
            logger.error("Failed to update user role {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Toggle user active status
     */
    @PutMapping("/users/{id}/toggle-active")
    public ResponseEntity<User> toggleUserActive(@PathVariable String id) {
        try {
            User updatedUser = adminService.toggleUserActive(id);
            logger.info("User {} active status toggled", id);
            return ResponseEntity.ok(updatedUser);
        } catch (Exception e) {
            logger.error("Failed to toggle user active {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Delete user
     */
    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable String id) {
        try {
            adminService.deleteUser(id);
            logger.info("User {} deleted", id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            logger.error("Failed to delete user {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get system statistics
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getSystemStats() {
        try {
            Map<String, Object> stats = adminService.getSystemStats();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            logger.error("Failed to get system stats: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get today's analytics
     */
    @GetMapping("/analytics/today")
    public ResponseEntity<Map<String, Object>> getTodayAnalytics() {
        try {
            Map<String, Object> analytics = adminService.getTodayAnalytics();
            return ResponseEntity.ok(analytics);
        } catch (Exception e) {
            logger.error("Failed to get today analytics: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get last 7 days analytics
     */
    @GetMapping("/analytics/last7days")
    public ResponseEntity<List<Map<String, Object>>> getLast7DaysAnalytics() {
        try {
            List<Map<String, Object>> analytics = adminService.getLast7DaysAnalytics();
            return ResponseEntity.ok(analytics);
        } catch (Exception e) {
            logger.error("Failed to get last 7 days analytics: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get top items analytics
     */
    @GetMapping("/analytics/top-items")
    public ResponseEntity<List<Map<String, Object>>> getTopItemsAnalytics(
            @RequestParam(defaultValue = "10") int limit) {
        try {
            List<Map<String, Object>> analytics = adminService.getTopItemsAnalytics(limit);
            return ResponseEntity.ok(analytics);
        } catch (Exception e) {
            logger.error("Failed to get top items analytics: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get order status distribution
     */
    @GetMapping("/analytics/order-status")
    public ResponseEntity<Map<String, Object>> getOrderStatusDistribution() {
        try {
            Map<String, Object> distribution = adminService.getOrderStatusDistribution();
            return ResponseEntity.ok(distribution);
        } catch (Exception e) {
            logger.error("Failed to get order status distribution: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get monthly analytics
     */
    @GetMapping("/analytics/monthly")
    public ResponseEntity<List<Map<String, Object>>> getMonthlyAnalytics(
            @RequestParam(defaultValue = "12") int months) {
        try {
            List<Map<String, Object>> analytics = adminService.getMonthlyAnalytics(months);
            return ResponseEntity.ok(analytics);
        } catch (Exception e) {
            logger.error("Failed to get monthly analytics: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get application settings
     */
    @GetMapping("/settings")
    public ResponseEntity<Map<String, Object>> getSettings() {
        try {
            Map<String, Object> settings = adminService.getSettings();
            return ResponseEntity.ok(settings);
        } catch (Exception e) {
            logger.error("Failed to get settings: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Update application settings
     */
    @PutMapping("/settings")
    public ResponseEntity<Map<String, Object>> updateSettings(@RequestBody Map<String, Object> settings) {
        try {
            Map<String, Object> updated = adminService.updateSettings(settings);
            logger.info("Settings updated");
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            logger.error("Failed to update settings: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}
