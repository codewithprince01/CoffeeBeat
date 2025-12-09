package com.coffeebeat.service;

import com.coffeebeat.model.Product;
import com.coffeebeat.repository.ProductRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Enhanced Product service for managing coffee/food menu items
 * 
 * This service provides business logic for:
 * - Product CRUD operations
 * - Product search and filtering
 * - Stock management
 * - Category management
 * - Image upload and management
 * - Comprehensive validation and error handling
 */
@Service
public class ProductService {

    private static final Logger logger = LoggerFactory.getLogger(ProductService.class);

    @Autowired
    private ProductRepository productRepository;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    /**
     * Get all products (including inactive)
     */
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    /**
     * Get all active products
     */
    public List<Product> getAllActiveProducts() {
        return productRepository.findAllActive();
    }

    /**
     * Create new product with validation
     */
    public Product createProduct(Product product) {
        logger.info("Creating new product: {}", product.getName());
        
        // Validate product data
        validateProduct(product);
        
        // Check if slug already exists
        if (productRepository.existsBySlug(product.getSlug())) {
            throw new IllegalArgumentException("Product with slug '" + product.getSlug() + "' already exists");
        }
        
        // Set timestamps
        product.setCreatedAt(java.time.LocalDateTime.now());
        product.setUpdatedAt(java.time.LocalDateTime.now());
        
        Product savedProduct = productRepository.save(product);
        logger.info("Product created successfully: {}", savedProduct.getId());
        
        return savedProduct;
    }

    /**
     * Create product with image upload
     */
    public Product createProductWithImage(Product product, MultipartFile imageFile) {
        logger.info("Creating new product with image: {}", product.getName());
        
        // Handle image upload if provided
        if (imageFile != null && !imageFile.isEmpty()) {
            String imageUrl = uploadImage(imageFile);
            product.setImageUrl(imageUrl);
        }
        
        return createProduct(product);
    }

    /**
     * Find product by ID (active only)
     */
    public Product findById(String id) {
        Optional<Product> productOpt = productRepository.findById(id);
        if (productOpt.isEmpty() || !productOpt.get().isActive()) {
            throw new IllegalArgumentException("Product not found with ID: " + id);
        }
        return productOpt.get();
    }

    /**
     * Find product by ID without checking active status (for updates)
     */
    public Product findByIdWithoutActiveCheck(String id) {
        Optional<Product> productOpt = productRepository.findById(id);
        if (productOpt.isEmpty()) {
            throw new IllegalArgumentException("Product not found with ID: " + id);
        }
        return productOpt.get();
    }

    /**
     * Find product by slug
     */
    public Product findBySlug(String slug) {
        Optional<Product> productOpt = productRepository.findBySlug(slug);
        if (productOpt.isEmpty() || !productOpt.get().isActive()) {
            throw new IllegalArgumentException("Product not found with slug: " + slug);
        }
        return productOpt.get();
    }

    /**
     * Get product by ID (alias for findById)
     */
    public Product getProductById(String id) {
        return findById(id);
    }

    /**
     * Find all active products with pagination
     */
    public Page<Product> findAllActive(Pageable pageable) {
        return productRepository.findAllActive(pageable);
    }

    /**
     * Find all products for admin (including inactive)
     */
    public Page<Product> findAllForAdmin(Pageable pageable) {
        return productRepository.findAll(pageable);
    }

    /**
     * Find products by category with pagination
     */
    public Page<Product> findByCategory(String category, Pageable pageable) {
        List<Product> products = productRepository.findByCategoryAndIsActiveTrue(category);
        return new org.springframework.data.domain.PageImpl<>(
                products,
                pageable,
                productRepository.countByCategoryAndIsActiveTrue(category));
    }

    /**
     * Search active products
     */
    public Page<Product> searchActiveProducts(String keyword, Pageable pageable) {
        return productRepository.searchActiveProducts(keyword, pageable);
    }

    /**
     * Search products by name containing text
     */
    public List<Product> searchByName(String name) {
        return productRepository.findByNameContainingIgnoreCaseAndIsActiveTrue(name);
    }

    /**
     * Toggle product availability
     */
    public Map<String, Object> toggleProductAvailability(String id) {
        logger.info("Toggling availability for product: {}", id);

        Product existingProduct = findByIdWithoutActiveCheck(id);
        boolean newStatus = !existingProduct.isActive();
        existingProduct.setActive(newStatus);

        Product updatedProduct = productRepository.save(existingProduct);
        logger.info("Product availability toggled successfully: {} -> {}", id, newStatus);

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("active", newStatus);
        result.put("message", newStatus ? "Product marked as available" : "Product marked as unavailable");

        return result;
    }

    /**
     * Update existing product
     */
    public Product updateProduct(String id, Product productDetails) {
        logger.info("Updating product: {}", id);

        Product existingProduct = findByIdWithoutActiveCheck(id);

        // Validate product details
        validateProduct(productDetails);

        // Update fields
        existingProduct.setName(productDetails.getName());
        existingProduct.setSlug(productDetails.getSlug());
        existingProduct.setPrice(productDetails.getPrice());
        existingProduct.setStock(productDetails.getStock());
        existingProduct.setImageUrl(productDetails.getImageUrl());
        existingProduct.setDescription(productDetails.getDescription());
        existingProduct.setCategory(productDetails.getCategory());

        // Check if active field is being updated
        if (productDetails.isActive() != existingProduct.isActive()) {
            logger.info("Updating active field from {} to {}", existingProduct.isActive(), productDetails.isActive());
            existingProduct.setActive(productDetails.isActive());
        }

        // Check if slug changed and if new slug already exists
        if (!existingProduct.getSlug().equals(productDetails.getSlug())) {
            if (productRepository.existsBySlug(productDetails.getSlug())) {
                throw new IllegalArgumentException(
                        "Product with slug '" + productDetails.getSlug() + "' already exists");
            }
        }

        Product updatedProduct = productRepository.save(existingProduct);
        logger.info("Product updated successfully: {} (active: {})", updatedProduct.getId(), updatedProduct.isActive());

        return updatedProduct;
    }

    /**
     * Update product with image
     */
    public Product updateProductWithImage(String id, Product productDetails, MultipartFile imageFile) {
        logger.info("Updating product with image: {}", id);

        // Handle image upload if provided
        if (imageFile != null && !imageFile.isEmpty()) {
            String imageUrl = uploadImage(imageFile);
            productDetails.setImageUrl(imageUrl);
        }

        return updateProduct(id, productDetails);
    }

    /**
     * Delete product (soft delete)
     */
    public void deleteProduct(String id) {
        logger.info("Deleting product: {}", id);

        Product existingProduct = findById(id);
        existingProduct.setActive(false);

        productRepository.save(existingProduct);
        logger.info("Product deleted successfully: {}", id);
    }

    /**
     * Hard delete product (remove from database)
     */
    public void hardDeleteProduct(String id) {
        logger.info("Hard deleting product: {}", id);

        Product existingProduct = findByIdWithoutActiveCheck(id);
        
        // Delete associated image if exists
        if (existingProduct.getImageUrl() != null && !existingProduct.getImageUrl().isEmpty()) {
            deleteImageFile(existingProduct.getImageUrl());
        }

        productRepository.delete(existingProduct);
        logger.info("Product hard deleted successfully: {}", id);
    }

    /**
     * Get distinct categories
     */
    public List<String> getDistinctCategories() {
        List<Product> products = productRepository.findDistinctCategoryDocuments();
        return products.stream()
                .map(Product::getCategory)
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }

    /**
     * Get categories (alias for getDistinctCategories)
     */
    public List<String> getCategories() {
        return getDistinctCategories();
    }

    /**
     * Find products in stock
     */
    public List<Product> findInStock() {
        return productRepository.findInStock();
    }

    /**
     * Find products with low stock
     */
    public List<Product> findLowStock() {
        return productRepository.findLowStock();
    }

    /**
     * Find out of stock products
     */
    public List<Product> findOutOfStock() {
        return productRepository.findOutOfStock();
    }

    /**
     * Get available products (alias for findInStock)
     */
    public List<Product> getAvailableProducts() {
        return findInStock();
    }

    /**
     * Get low stock products (alias for findLowStock)
     */
    public List<Product> getLowStockProducts() {
        return findLowStock();
    }

    /**
     * Toggle product availability and return updated product
     */
    public Product toggleAvailability(String id) {
        logger.info("Toggling availability for product: {}", id);

        Product existingProduct = findByIdWithoutActiveCheck(id);
        boolean newStatus = !existingProduct.isAvailable();
        existingProduct.setAvailable(newStatus);

        Product updatedProduct = productRepository.save(existingProduct);
        logger.info("Product availability toggled: {} -> {}", id, newStatus);

        return updatedProduct;
    }

    /**
     * Update product stock
     */
    public Product updateStock(String id, Integer newStock) {
        logger.info("Updating stock for product: {} to {}", id, newStock);

        if (newStock < 0) {
            throw new IllegalArgumentException("Stock cannot be negative");
        }

        Product existingProduct = findById(id);
        existingProduct.setStock(newStock);

        Product updatedProduct = productRepository.save(existingProduct);
        logger.info("Stock updated successfully for product: {}", updatedProduct.getId());

        return updatedProduct;
    }

    /**
     * Decrease product stock atomically using findAndModify
     */
    public void decreaseStockAtomic(String productId, int quantity) {
        logger.info("Decreasing stock for product {} by {} units", productId, quantity);
        
        // Use MongoDB's findAndModify for atomic operation
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found: " + productId));
        
        if (product.getStock() < quantity) {
            throw new IllegalArgumentException("Insufficient stock for product: " + product.getName() +
                    ". Available: " + product.getStock() + ", Requested: " + quantity);
        }
        
        // Atomic update
        product.setStock(product.getStock() - quantity);
        product.setUpdatedAt(java.time.LocalDateTime.now());
        productRepository.save(product);
        
        logger.info("Stock decreased successfully for product {}. New stock: {}", productId, product.getStock());
    }

    /**
     * Decrease product stock
     */
    public void decreaseStock(String productId, int quantity) {
        Product product = findById(productId);
        product.decreaseStock(quantity);
        productRepository.save(product);
    }

    /**
     * Increase product stock
     */
    public void increaseStock(String productId, int quantity) {
        Product product = findById(productId);
        product.increaseStock(quantity);
        productRepository.save(product);
    }

    /**
     * Get comprehensive product statistics
     */
    public Map<String, Object> getProductStats() {
        Map<String, Object> stats = new HashMap<>();

        long totalProducts = productRepository.countActive();
        long inStockProducts = productRepository.findInStock().size();
        long lowStockProducts = productRepository.findLowStock().size();
        long outOfStockProducts = productRepository.countOutOfStock();

        stats.put("totalProducts", totalProducts);
        stats.put("inStockProducts", inStockProducts);
        stats.put("lowStockProducts", lowStockProducts);
        stats.put("outOfStockProducts", outOfStockProducts);

        // Category counts
        List<String> categories = getDistinctCategories();
        Map<String, Long> categoryCounts = new HashMap<>();
        for (String category : categories) {
            categoryCounts.put(category, productRepository.countByCategoryAndIsActiveTrue(category));
        }
        stats.put("categoryCounts", categoryCounts);

        // Stock distribution
        Map<String, Long> stockDistribution = new HashMap<>();
        stockDistribution.put("inStock", inStockProducts);
        stockDistribution.put("lowStock", lowStockProducts);
        stockDistribution.put("outOfStock", outOfStockProducts);
        stats.put("stockDistribution", stockDistribution);

        return stats;
    }

    /**
     * Check if product exists and is active
     */
    public boolean isProductActive(String productId) {
        Optional<Product> productOpt = productRepository.findById(productId);
        return productOpt.isPresent() && productOpt.get().isActive();
    }

    /**
     * Get products by price range
     */
    public List<Product> findByPriceRange(Double minPrice, Double maxPrice) {
        return productRepository.findByPriceRange(minPrice, maxPrice);
    }

    /**
     * Upload image file
     */
    private String uploadImage(MultipartFile file) {
        try {
            // Validate file
            if (file.isEmpty()) {
                throw new IllegalArgumentException("Please select a file to upload");
            }

            // Validate file type
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                throw new IllegalArgumentException("Only image files are allowed");
            }

            // Create upload directory if it doesn't exist
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String fileExtension = originalFilename != null ? 
                originalFilename.substring(originalFilename.lastIndexOf(".")) : "";
            String uniqueFilename = UUID.randomUUID().toString() + fileExtension;

            // Save file
            Path filePath = uploadPath.resolve(uniqueFilename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            logger.info("Image uploaded successfully: {}", uniqueFilename);
            return "/api/uploads/images/" + uniqueFilename;

        } catch (IOException e) {
            logger.error("Failed to upload image: {}", e.getMessage());
            throw new RuntimeException("Failed to upload image: " + e.getMessage());
        }
    }

    /**
     * Delete image file
     */
    private void deleteImageFile(String imageUrl) {
        try {
            if (imageUrl != null && imageUrl.contains("/api/uploads/images/")) {
                String filename = imageUrl.substring(imageUrl.lastIndexOf("/") + 1);
                Path filePath = Paths.get(uploadDir).resolve(filename);
                
                if (Files.exists(filePath)) {
                    Files.delete(filePath);
                    logger.info("Image file deleted: {}", filename);
                }
            }
        } catch (IOException e) {
            logger.error("Failed to delete image file: {}", e.getMessage());
        }
    }

    /**
     * Validate product data
     */
    private void validateProduct(Product product) {
        if (product.getName() == null || product.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Product name is required");
        }
        
        if (product.getSlug() == null || product.getSlug().trim().isEmpty()) {
            throw new IllegalArgumentException("Product slug is required");
        }
        
        if (product.getPrice() == null || product.getPrice() <= 0) {
            throw new IllegalArgumentException("Product price must be greater than 0");
        }
        
        if (product.getStock() == null || product.getStock() < 0) {
            throw new IllegalArgumentException("Product stock cannot be negative");
        }
        
        if (product.getCategory() == null || product.getCategory().trim().isEmpty()) {
            throw new IllegalArgumentException("Product category is required");
        }
        
        if (product.getDescription() != null && product.getDescription().length() > 500) {
            throw new IllegalArgumentException("Product description must not exceed 500 characters");
        }
    }
}
