package com.coffeebeat.repository;

import com.coffeebeat.model.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository interface for Order entity
 * 
 * This interface extends MongoRepository to provide CRUD operations
 * and custom queries for Order entities.
 */
@Repository
public interface OrderRepository extends MongoRepository<Order, String> {
    
    /**
     * Find orders by user ID
     */
    List<Order> findByUserId(String userId);
    
    /**
     * Find orders by user ID and status
     */
    List<Order> findByUserIdAndStatus(String userId, Order.OrderStatus status);
    
    /**
     * Find orders by user ID with pagination
     */
    Page<Order> findByUserId(String userId, Pageable pageable);
    
    /**
     * Find orders by status
     */
    List<Order> findByStatus(Order.OrderStatus status);
    
    /**
     * Find orders by status with pagination
     */
    Page<Order> findByStatus(Order.OrderStatus status, Pageable pageable);
    
    /**
     * Find orders by assigned chef ID
     */
    List<Order> findByAssignedChefId(String chefId);
    
    /**
     * Find orders by assigned waiter ID
     */
    List<Order> findByAssignedWaiterId(String waiterId);
    
    /**
     * Find orders by table booking ID
     */
    List<Order> findByTableBookingId(String tableBookingId);
    
    /**
     * Find orders by date range
     */
    @Query("{ 'createdAt': { '$gte': ?0, '$lte': ?1 } }")
    List<Order> findByDateRange(LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Find orders by date range with pagination
     */
    @Query("{ 'createdAt': { '$gte': ?0, '$lte': ?1 } }")
    Page<Order> findByDateRange(LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);
    
    /**
     * Find orders for today
     */
    @Query("{ 'createdAt': { '$gte': ?0, '$lte': ?1 } }")
    List<Order> findOrdersForToday(LocalDateTime startOfDay, LocalDateTime endOfDay);
    
    /**
     * Find orders by status and assigned chef
     */
    List<Order> findByStatusAndAssignedChefId(Order.OrderStatus status, String chefId);
    
    /**
     * Find orders by status and assigned waiter
     */
    List<Order> findByStatusAndAssignedWaiterId(Order.OrderStatus status, String waiterId);
    
    /**
     * Find orders that need chef attention (CONFIRMED status)
     */
    @Query("{ 'status': 'CONFIRMED', 'assignedChefId': null }")
    List<Order> findOrdersNeedingChef();
    
    /**
     * Find orders that need waiter attention (READY_FOR_SERVICE status)
     */
    @Query("{ 'status': 'READY_FOR_SERVICE', 'assignedWaiterId': null }")
    List<Order> findOrdersNeedingWaiter();
    
    /**
     * Count orders by status
     */
    long countByStatus(Order.OrderStatus status);
    
    /**
     * Count orders by user and status
     */
    long countByUserIdAndStatus(String userId, Order.OrderStatus status);
    
    /**
     * Count orders for today by status
     */
    @Query("{ 'createdAt': { '$gte': ?0, '$lte': ?1 }, 'status': ?2 }")
    long countOrdersForTodayByStatus(LocalDateTime startOfDay, LocalDateTime endOfDay, Order.OrderStatus status);
    
    /**
     * Find orders by payment status
     */
    List<Order> findByPaymentStatus(Order.PaymentStatus paymentStatus);
    
    /**
     * Calculate total revenue for date range
     */
    @Query(value = "{ 'createdAt': { '$gte': ?0, '$lte': ?1 }, 'paymentStatus': 'PAID' }", count = true)
    long countPaidOrders(LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Find recent orders for a user
     */
    @Query("{ 'userId': ?0 }")
    List<Order> findRecentOrdersByUser(String userId, Pageable pageable);
    
    /**
     * Find orders with specific product
     */
    @Query("{ 'items.productId': ?0 }")
    List<Order> findOrdersContainingProduct(String productId);
    
    /**
     * Find orders by multiple statuses
     */
    @Query("{ 'status': { '$in': ?0 } }")
    List<Order> findByStatusIn(List<Order.OrderStatus> statuses);
}
