package com.coffeebeat.repository;

import com.coffeebeat.model.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Enhanced Repository interface for Product entity
 * 
 * This interface extends MongoRepository to provide CRUD operations
 * and custom queries for Product entities.
 * 
 * Enhanced with comprehensive query methods for product management,
 * inventory tracking, and search functionality.
 */
@Repository
public interface ProductRepository extends MongoRepository<Product, String> {
    
    /**
     * Find product by slug
     */
    Optional<Product> findBySlug(String slug);
    
    /**
     * Check if product exists by slug
     */
    boolean existsBySlug(String slug);
    
    /**
     * Find products by category (active only)
     */
    List<Product> findByCategoryAndIsActiveTrue(String category);
    
    /**
     * Find products by category (including inactive)
     */
    List<Product> findByCategory(String category);
    
    /**
     * Find all active products
     */
    @Query("{ 'isActive': true }")
    List<Product> findAllActive();
    
    /**
     * Find all active products with pagination
     */
    @Query("{ 'isActive': true }")
    Page<Product> findAllActive(Pageable pageable);
    
    /**
     * Find all inactive products
     */
    @Query("{ 'isActive': false }")
    List<Product> findAllInactive();
    
    /**
     * Search products by name or description (text search)
     */
    @Query("{ '$and': [{ 'isActive': true }, { '$text': { '$search': ?0 } }] }")
    List<Product> searchActiveProducts(String keyword);
    
    /**
     * Search products by name or description with pagination
     */
    @Query("{ '$and': [{ 'isActive': true }, { '$text': { '$search': ?0 } }] }")
    Page<Product> searchActiveProducts(String keyword, Pageable pageable);
    
    /**
     * Search products by name containing text (case insensitive)
     */
    @Query("{ 'name': { '$regex': ?0, '$options': 'i' }, 'isActive': true }")
    List<Product> findByNameContainingIgnoreCaseAndIsActiveTrue(String name);
    
    /**
     * Find products in stock
     */
    @Query("{ 'isActive': true, 'stock': { '$gt': 0 } }")
    List<Product> findInStock();
    
    /**
     * Find products with low stock (less than specified threshold)
     */
    @Query("{ 'isActive': true, 'stock': { '$lt': ?0 } }")
    List<Product> findLowStock(int threshold);
    
    /**
     * Find products with low stock (default threshold: 10)
     */
    @Query("{ 'isActive': true, 'stock': { '$lt': 10 } }")
    List<Product> findLowStock();
    
    /**
     * Find out of stock products
     */
    @Query("{ 'isActive': true, 'stock': { '$eq': 0 } }")
    List<Product> findOutOfStock();
    
    /**
     * Count products by category
     */
    long countByCategoryAndIsActiveTrue(String category);
    
    /**
     * Count all active products
     */
    @Query(value = "{ 'isActive': true }", count = true)
    long countActive();
    
    /**
     * Count inactive products
     */
    @Query(value = "{ 'isActive': false }", count = true)
    long countInactive();
    
    /**
     * Count out of stock products
     */
    @Query(value = "{ 'isActive': true, 'stock': { '$eq': 0 } }", count = true)
    long countOutOfStock();
    
    /**
     * Find products by price range
     */
    @Query("{ 'isActive': true, 'price': { '$gte': ?0, '$lte': ?1 } }")
    List<Product> findByPriceRange(Double minPrice, Double maxPrice);
    
    /**
     * Find products by price range with pagination
     */
    @Query("{ 'isActive': true, 'price': { '$gte': ?0, '$lte': ?1 } }")
    Page<Product> findByPriceRange(Double minPrice, Double maxPrice, Pageable pageable);
    
    /**
     * Find products cheaper than specified price
     */
    @Query("{ 'isActive': true, 'price': { '$lte': ?0 } }")
    List<Product> findByPriceLessThanEqual(Double maxPrice);
    
    /**
     * Find products more expensive than specified price
     */
    @Query("{ 'isActive': true, 'price': { '$gte': ?0 } }")
    List<Product> findByPriceGreaterThanEqual(Double minPrice);
    
    /**
     * Get distinct categories
     */
    @Query(value = "{ 'isActive': true }", fields = "{ 'category': 1, '_id': 0 }")
    List<Product> findDistinctCategoryDocuments();
    
    /**
     * Get product statistics
     */
    @Query(value = "{ '$group': { '_id': '$category', 'count': { '$sum': 1 }, 'avgPrice': { '$avg': '$price' }, 'totalStock': { '$sum': '$stock' } } }")
    List<ProductStats> getProductStatsByCategory();
    
    /**
     * Update product stock
     */
    @Query("{ '$set': { 'stock': ?1, 'updatedAt': ?2 } }")
    void updateProductStock(String productId, Integer stock, java.time.LocalDateTime updatedAt);
    
    /**
     * Update product price
     */
    @Query("{ '$set': { 'price': ?1, 'updatedAt': ?2 } }")
    void updateProductPrice(String productId, Double price, java.time.LocalDateTime updatedAt);
    
    /**
     * Update product active status
     */
    @Query("{ '$set': { 'isActive': ?1, 'updatedAt': ?2 } }")
    void updateProductActiveStatus(String productId, boolean isActive, java.time.LocalDateTime updatedAt);
    
    /**
     * Find products created after a specific date
     */
    @Query("{ 'createdAt': { '$gte': ?0 } }")
    List<Product> findByCreatedAtAfter(java.time.LocalDateTime date);
    
    /**
     * Find products created within a date range
     */
    @Query("{ 'createdAt': { '$gte': ?0, '$lte': ?1 } }")
    List<Product> findByCreatedAtBetween(java.time.LocalDateTime startDate, java.time.LocalDateTime endDate);
    
    /**
     * Find products updated after a specific date
     */
    @Query("{ 'updatedAt': { '$gte': ?0 } }")
    List<Product> findByUpdatedAtAfter(java.time.LocalDateTime date);
    
    /**
     * Inner class for product statistics
     */
    class ProductStats {
        private String _id; // category
        private int count;
        private double avgPrice;
        private int totalStock;
        
        // Getters and Setters
        public String get_id() {
            return _id;
        }
        
        public void set_id(String _id) {
            this._id = _id;
        }
        
        public int getCount() {
            return count;
        }
        
        public void setCount(int count) {
            this.count = count;
        }
        
        public double getAvgPrice() {
            return avgPrice;
        }
        
        public void setAvgPrice(double avgPrice) {
            this.avgPrice = avgPrice;
        }
        
        public int getTotalStock() {
            return totalStock;
        }
        
        public void setTotalStock(int totalStock) {
            this.totalStock = totalStock;
        }
    }
}
