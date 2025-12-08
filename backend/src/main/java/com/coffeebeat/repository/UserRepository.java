package com.coffeebeat.repository;

import com.coffeebeat.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository interface for User entity
 * 
 * This interface extends MongoRepository to provide CRUD operations
 * and custom queries for User entities.
 */
@Repository
public interface UserRepository extends MongoRepository<User, String> {
    
    /**
     * Find user by email
     */
    Optional<User> findByEmail(String email);
    
    /**
     * Check if user exists by email
     */
    boolean existsByEmail(String email);
    
    /**
     * Find user by email and active status
     */
    Optional<User> findByEmailAndIsActiveTrue(String email);
    
    /**
     * Find users by role
     */
    @Query("{ 'role': ?0, 'isActive': true }")
    java.util.List<User> findByRoleAndIsActiveTrue(String role);
    
    /**
     * Find users by role (including inactive)
     */
    java.util.List<User> findByRole(String role);
    
    /**
     * Count users by role
     */
    long countByRole(String role);
    
    /**
     * Count active users by role
     */
    @Query(value = "{ 'role': ?0, 'isActive': true }", count = true)
    long countByRoleAndIsActiveTrue(String role);
    
    /**
     * Find all active users
     */
    @Query("{ 'isActive': true }")
    java.util.List<User> findAllActive();
    
    /**
     * Soft delete user by setting isActive to false
     */
    @Query("{ '$set': { 'isActive': false, 'updatedAt': ?0 } }")
    void softDeleteUser(String userId, java.time.LocalDateTime updatedAt);
}
