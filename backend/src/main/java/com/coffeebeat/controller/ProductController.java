package com.coffeebeat.controller;

import com.coffeebeat.dto.CreateProductRequest;
import com.coffeebeat.dto.QuantityAdjustmentRequest;
import com.coffeebeat.dto.StockUpdateRequest;
import com.coffeebeat.dto.UpdateProductRequest;
import com.coffeebeat.model.Product;
import com.coffeebeat.service.ProductService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Enhanced Product Controller for managing coffee/food menu items
 * 
 * This controller provides endpoints for:
 * - Product CRUD operations
 * - Product search and filtering
 * - Image upload and management
 * - Stock management
 * - Category management
 * - Product statistics
 */
@RestController
@RequestMapping("/api/products")

public class ProductController {

    private static final Logger logger = LoggerFactory.getLogger(ProductController.class);

    @Autowired
    private ProductService productService;

    /**
     * Get all active products (public endpoint) - lightweight version
     */
    @GetMapping
    public ResponseEntity<?> getAllActiveProducts() {
        try {
            List<Product> products = productService.getAllActiveProducts();
            logger.info("Returning {} active products", products.size());

            // Create lightweight response without images to avoid timeout
            List<Map<String, Object>> lightweightProducts = products.stream()
                .map(product -> {
                    Map<String, Object> productMap = new HashMap<>();
                    productMap.put("id", product.getId());
                    productMap.put("name", product.getName());
                    productMap.put("slug", product.getSlug());
                    productMap.put("price", product.getPrice());
                    productMap.put("stock", product.getStock());
                    productMap.put("stockThreshold", product.getStockThreshold());
                    productMap.put("isLowStock", product.isLowStock());
                    productMap.put("isOutOfStock", product.isOutOfStock());
                    productMap.put("isInStock", product.isInStock());
                    productMap.put("category", product.getCategory());
                    productMap.put("description", product.getDescription());
                    productMap.put("isActive", product.isActive());
                    // Include imageUrl but not the full base64 data
                    productMap.put("imageUrl", product.getImageUrl() != null ? 
                        product.getImageUrl().startsWith("data:") ? "data:image/..." : product.getImageUrl() : null);
                    return productMap;
                })
                .collect(Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", lightweightProducts);
            response.put("count", lightweightProducts.size());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Failed to get active products: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to retrieve products");
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Get all active products with full images (for individual product requests)
     */
    @GetMapping("/with-images")
    public ResponseEntity<?> getAllActiveProductsImages() {
        try {
            List<Product> products = productService.getAllActiveProducts();
            logger.info("Returning {} active products with full images", products.size());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", products);
            response.put("count", products.size());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Failed to get active products with images: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to retrieve products");
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Get all products (including inactive) - admin only
     */
    @GetMapping("/admin/all")
    public ResponseEntity<?> getAllProductsForAdmin(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {
        try {
            Sort.Direction direction = sortDir.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
            Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

            Page<Product> products = productService.findAllForAdmin(pageable);
            logger.info("Returning {} products for admin (page {})", products.getTotalElements(), page);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", products.getContent());
            response.put("pagination", Map.of(
                    "totalElements", products.getTotalElements(),
                    "totalPages", products.getTotalPages(),
                    "currentPage", products.getNumber(),
                    "pageSize", products.getSize(),
                    "hasNext", products.hasNext(),
                    "hasPrevious", products.hasPrevious()));

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Failed to get all products for admin: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to retrieve products");
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Get product by ID (public endpoint - active only)
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getProductById(@PathVariable String id) {
        try {
            Product product = productService.getProductById(id);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", product);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.warn("Product not found: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Product not found");
            return ResponseEntity.status(404).body(error);
        } catch (Exception e) {
            logger.error("Failed to get product {}: {}", id, e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to retrieve product");
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Get product by slug (public endpoint)
     */
    @GetMapping("/slug/{slug}")
    public ResponseEntity<?> getProductBySlug(@PathVariable String slug) {
        try {
            Product product = productService.findBySlug(slug);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", product);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.warn("Product not found by slug: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Product not found");
            return ResponseEntity.status(404).body(error);
        } catch (Exception e) {
            logger.error("Failed to get product by slug {}: {}", slug, e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to retrieve product");
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Update product (public endpoint)
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateProduct(
            @PathVariable String id,
            @Valid @RequestBody Product product) {
        try {
            Product updated = productService.updateProduct(id, product);
            logger.info("Product updated: {}", id);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", updated);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.warn("Product not found: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Product not found");
            return ResponseEntity.status(404).body(error);
        } catch (Exception e) {
            logger.error("Failed to update product: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to update product");
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Upload product image (temporary endpoint in ProductController)
     */
    @PostMapping("/upload-image")
    public ResponseEntity<?> uploadProductImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam("productName") String productName) {
        try {
            // Create upload directory if it doesn't exist
            java.nio.file.Path uploadPath = java.nio.file.Paths.get("uploads", "products");
            if (!java.nio.file.Files.exists(uploadPath)) {
                java.nio.file.Files.createDirectories(uploadPath);
            }

            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String fileExtension = originalFilename != null ? 
                originalFilename.substring(originalFilename.lastIndexOf(".")) : "";
            String uniqueFilename = productName.replaceAll("[^a-zA-Z0-9]", "_") + 
                "_" + java.util.UUID.randomUUID().toString().substring(0, 8) + fileExtension;

            // Save file
            java.nio.file.Path filePath = uploadPath.resolve(uniqueFilename);
            java.nio.file.Files.copy(file.getInputStream(), filePath);

            // Return response with file URL
            String fileUrl = "/uploads/products/" + uniqueFilename;
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Image uploaded successfully");
            response.put("filename", uniqueFilename);
            response.put("imageUrl", fileUrl);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Failed to upload image: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to upload image: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Serve uploaded product images
     */
    @GetMapping("/uploads/products/{filename}")
    public ResponseEntity<byte[]> getProductImage(@PathVariable String filename) {
        try {
            java.nio.file.Path filePath = java.nio.file.Paths.get("uploads", "products", filename);
            if (!java.nio.file.Files.exists(filePath)) {
                return ResponseEntity.notFound().build();
            }

            byte[] fileContent = java.nio.file.Files.readAllBytes(filePath);
            String contentType = java.nio.file.Files.probeContentType(filePath);
            if (contentType == null) {
                contentType = "image/jpeg";
            }

            return ResponseEntity.ok()
                .header("Content-Type", contentType)
                .body(fileContent);
        } catch (Exception e) {
            logger.error("Failed to serve image: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get product categories (public endpoint)
     */
    @GetMapping("/categories")
    public ResponseEntity<?> getCategories() {
        try {
            List<String> categories = productService.getCategories();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", categories);
            response.put("count", categories.size());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Failed to get categories: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to retrieve categories");
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Get in-stock products (public endpoint)
     */
    @GetMapping("/in-stock")
    public ResponseEntity<?> getInStockProducts() {
        try {
            List<Product> products = productService.getAvailableProducts();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", products);
            response.put("count", products.size());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Failed to get in-stock products: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to retrieve in-stock products");
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Get low stock products (admin only)
     */
    @GetMapping("/admin/low-stock")
    public ResponseEntity<?> getLowStockProducts() {
        try {
            List<Product> products = productService.getLowStockProducts();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", products);
            response.put("count", products.size());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Failed to get low-stock products: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to retrieve low-stock products");
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Get out of stock products (admin only)
     */
    @GetMapping("/admin/out-of-stock")
    public ResponseEntity<?> getOutOfStockProducts() {
        try {
            List<Product> products = productService.findOutOfStock();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", products);
            response.put("count", products.size());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Failed to get out-of-stock products: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to retrieve out-of-stock products");
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Get product statistics (admin only)
     */
    @GetMapping("/admin/stats")
    public ResponseEntity<?> getProductStats() {
        try {
            Map<String, Object> stats = productService.getProductStats();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", stats);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Failed to get product stats: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to retrieve product statistics");
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Search products (public endpoint)
     */
    @GetMapping("/search")
    public ResponseEntity<?> searchProducts(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<Product> products = productService.searchActiveProducts(keyword, pageable);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", products.getContent());
            response.put("pagination", Map.of(
                    "totalElements", products.getTotalElements(),
                    "totalPages", products.getTotalPages(),
                    "currentPage", products.getNumber(),
                    "pageSize", products.getSize(),
                    "hasNext", products.hasNext(),
                    "hasPrevious", products.hasPrevious()));
            response.put("keyword", keyword);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Failed to search products: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to search products");
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Get products by category (public endpoint)
     */
    @GetMapping("/category/{category}")
    public ResponseEntity<?> getProductsByCategory(
            @PathVariable String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<Product> products = productService.findByCategory(category, pageable);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", products.getContent());
            response.put("pagination", Map.of(
                    "totalElements", products.getTotalElements(),
                    "totalPages", products.getTotalPages(),
                    "currentPage", products.getNumber(),
                    "pageSize", products.getSize(),
                    "hasNext", products.hasNext(),
                    "hasPrevious", products.hasPrevious()));
            response.put("category", category);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Failed to get products by category {}: {}", category, e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to retrieve products by category");
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Get products by price range (public endpoint)
     */
    @GetMapping("/price-range")
    public ResponseEntity<?> getProductsByPriceRange(
            @RequestParam Double minPrice,
            @RequestParam Double maxPrice) {
        try {
            List<Product> products = productService.findByPriceRange(minPrice, maxPrice);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", products);
            response.put("count", products.size());
            response.put("priceRange", Map.of("min", minPrice, "max", maxPrice));

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Failed to get products by price range: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to retrieve products by price range");
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Create product with JSON data (admin only)
     */
    @PostMapping("/admin/create-simple")
    public ResponseEntity<?> createProductSimple(
            @RequestBody @Valid CreateProductRequest productRequest) {
        try {
            // Convert DTO to Product entity
            Product product = convertToProduct(productRequest);
            Product created = productService.createProduct(product);
            logger.info("Product created: {}", created.getId());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Product created successfully");
            response.put("data", created);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.warn("Product creation validation failed: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } catch (Exception e) {
            logger.error("Failed to create product: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to create product: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Create product with image upload (admin only)
     */
    @PostMapping("/admin/create")
    public ResponseEntity<?> createProductWithImage(
            @RequestPart("product") @Valid CreateProductRequest productRequest,
            @RequestPart(value = "image", required = false) MultipartFile imageFile) {
        try {
            // Convert DTO to Product entity
            Product product = convertToProduct(productRequest);
            Product created = productService.createProductWithImage(product, imageFile);
            logger.info("Product created with image: {}", created.getId());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Product created successfully");
            response.put("data", created);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.warn("Product creation validation failed: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } catch (Exception e) {
            logger.error("Failed to create product: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to create product");
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Update product with JSON data (admin only)
     */
    @PutMapping("/admin/{id}/simple")
    public ResponseEntity<?> updateProductSimple(
            @PathVariable String id,
            @RequestBody @Valid UpdateProductRequest productRequest) {
        try {
            // Convert DTO to Product entity
            Product product = convertToProduct(productRequest);
            Product updated = productService.updateProduct(id, product);
            logger.info("Product updated: {}", id);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Product updated successfully");
            response.put("data", updated);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.warn("Product update validation failed: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } catch (Exception e) {
            logger.error("Failed to update product: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to update product: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Update product with image upload (admin only)
     */
    @PutMapping("/admin/{id}")
    public ResponseEntity<?> updateProductWithImage(
            @PathVariable String id,
            @RequestPart("product") @Valid UpdateProductRequest productRequest,
            @RequestPart(value = "image", required = false) MultipartFile imageFile) {
        try {
            // Convert DTO to Product entity
            Product product = convertToProduct(productRequest);
            Product updated = productService.updateProductWithImage(id, product, imageFile);
            logger.info("Product updated with image: {}", id);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Product updated successfully");
            response.put("data", updated);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.warn("Product update validation failed: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } catch (Exception e) {
            logger.error("Failed to update product {}: {}", id, e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to update product");
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Delete product (soft delete, admin only)
     */
    @DeleteMapping("/admin/{id}")
    public ResponseEntity<?> deleteProduct(@PathVariable String id) {
        try {
            productService.deleteProduct(id);
            logger.info("Product deleted: {}", id);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Product deleted successfully");

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.warn("Product deletion failed: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.status(404).body(error);
        } catch (Exception e) {
            logger.error("Failed to delete product {}: {}", id, e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to delete product");
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Hard delete product (admin only)
     */
    @DeleteMapping("/admin/{id}/hard")
    public ResponseEntity<?> hardDeleteProduct(@PathVariable String id) {
        try {
            productService.hardDeleteProduct(id);
            logger.info("Product hard deleted: {}", id);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Product permanently deleted");

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.warn("Product hard deletion failed: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.status(404).body(error);
        } catch (Exception e) {
            logger.error("Failed to hard delete product {}: {}", id, e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to delete product");
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Update product stock (admin only)
     */
    @PatchMapping("/admin/{id}/stock")
    public ResponseEntity<?> updateProductStock(
            @PathVariable String id,
            @RequestBody @Valid StockUpdateRequest stockUpdate) {
        try {
            Product updated = productService.updateStock(id, stockUpdate.getStock());
            logger.info("Product stock updated: {} -> {}", id, stockUpdate.getStock());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Stock updated successfully");
            response.put("data", updated);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.warn("Stock update validation failed: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } catch (Exception e) {
            logger.error("Failed to update stock for {}: {}", id, e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to update stock");
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Toggle product availability (admin only)
     */
    @PatchMapping("/admin/{id}/toggle-availability")
    public ResponseEntity<?> toggleProductAvailability(@PathVariable String id) {
        try {
            Product updated = productService.toggleAvailability(id);
            logger.info("Product availability toggled: {} -> {}", id, updated.isAvailable());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Product availability updated successfully");
            response.put("data", updated);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.warn("Toggle availability failed: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.status(404).body(error);
        } catch (Exception e) {
            logger.error("Failed to toggle availability for {}: {}", id, e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to update product availability");
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Increase product stock (admin only)
     */
    @PatchMapping("/admin/{id}/increase-stock")
    public ResponseEntity<?> increaseProductStock(
            @PathVariable String id,
            @RequestBody @Valid QuantityAdjustmentRequest adjustment) {
        try {
            productService.increaseStock(id, adjustment.getQuantity());
            logger.info("Product stock increased: {} + {}", id, adjustment.getQuantity());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Stock increased successfully");

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.warn("Increase stock validation failed: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } catch (Exception e) {
            logger.error("Failed to increase stock for {}: {}", id, e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to increase stock");
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Decrease product stock (admin only)
     */
    @PatchMapping("/admin/{id}/decrease-stock")
    public ResponseEntity<?> decreaseProductStock(
            @PathVariable String id,
            @RequestBody @Valid QuantityAdjustmentRequest adjustment) {
        try {
            productService.decreaseStock(id, adjustment.getQuantity());
            logger.info("Product stock decreased: {} - {}", id, adjustment.getQuantity());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Stock decreased successfully");

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.warn("Decrease stock validation failed: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } catch (Exception e) {
            logger.error("Failed to decrease stock for {}: {}", id, e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to decrease stock");
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Convert CreateProductRequest to Product entity
     */
    private Product convertToProduct(CreateProductRequest request) {
        Product product = new Product();
        product.setName(request.getName());
        product.setSlug(request.getSlug());
        product.setPrice(request.getPrice().doubleValue());
        product.setStock(request.getStock());
        product.setDescription(request.getDescription());
        product.setCategory(request.getCategory());
        product.setActive(request.isActive());
        return product;
    }

    /**
     * Convert UpdateProductRequest to Product entity
     */
    private Product convertToProduct(UpdateProductRequest request) {
        Product product = new Product();
        product.setName(request.getName());
        product.setSlug(request.getSlug());
        if (request.getPrice() != null) {
            product.setPrice(request.getPrice().doubleValue());
        }
        if (request.getStock() != null) {
            product.setStock(request.getStock());
        }
        product.setDescription(request.getDescription());
        product.setCategory(request.getCategory());
        if (request.getIsActive() != null) {
            product.setActive(request.getIsActive());
        }
        product.setImageUrl(request.getImageUrl());
        return product;
    }
}
