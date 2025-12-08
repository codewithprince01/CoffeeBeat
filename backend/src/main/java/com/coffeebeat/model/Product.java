package com.coffeebeat.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.index.TextIndexed;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

/**
 * Product entity representing coffee/food items in the menu
 * 
 * This class represents menu items that can be ordered by customers.
 * It includes pricing, inventory, and categorization information.
 */
@Document(collection = "products")
public class Product {

    @Id
    private String id;

    @NotBlank(message = "Product name is required")
    @Size(min = 2, max = 100, message = "Product name must be between 2 and 100 characters")
    @TextIndexed
    private String name;

    @Indexed(unique = true)
    @NotBlank(message = "Slug is required")
    @Size(min = 2, max = 100, message = "Slug must be between 2 and 100 characters")
    private String slug;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Price must be greater than 0")
    private Double price;

    @NotNull(message = "Stock is required")
    @Positive(message = "Stock must be positive")
    private Integer stock;

    private String imageUrl;

    // Cloudinary specific fields
    private String imagePublicId;
    private String imageThumbnailUrl;
    private String imageOptimizedUrl;

    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;

    @NotBlank(message = "Category is required")
    private String category;

    @JsonProperty("active")
    private boolean isActive = true;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    // Default constructor
    public Product() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    // Constructor with essential fields
    public Product(String name, String slug, Double price, Integer stock, String category) {
        this();
        this.name = name;
        this.slug = slug;
        this.price = price;
        this.stock = stock;
        this.category = category;
    }

    // Constructor with description
    public Product(String name, String slug, Double price, Integer stock, String description, String category) {
        this();
        this.name = name;
        this.slug = slug;
        this.price = price;
        this.stock = stock;
        this.description = description;
        this.category = category;
    }

    // Pre-update method
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Business logic methods
    public boolean isInStock() {
        return stock > 0 && isActive;
    }

    public void decreaseStock(int quantity) {
        if (stock >= quantity) {
            this.stock -= quantity;
            this.updatedAt = LocalDateTime.now();
        } else {
            throw new IllegalArgumentException("Insufficient stock. Available: " + stock + ", Requested: " + quantity);
        }
    }

    public void increaseStock(int quantity) {
        this.stock += quantity;
        this.updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
        this.updatedAt = LocalDateTime.now();
    }

    public String getSlug() {
        return slug;
    }

    public void setSlug(String slug) {
        this.slug = slug;
        this.updatedAt = LocalDateTime.now();
    }

    public Double getPrice() {
        return price;
    }

    public void setPrice(Double price) {
        this.price = price;
        this.updatedAt = LocalDateTime.now();
    }

    public Integer getStock() {
        return stock;
    }

    public void setStock(Integer stock) {
        this.stock = stock;
        this.updatedAt = LocalDateTime.now();
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
        this.updatedAt = LocalDateTime.now();
    }

    public String getImagePublicId() {
        return imagePublicId;
    }

    public void setImagePublicId(String imagePublicId) {
        this.imagePublicId = imagePublicId;
        this.updatedAt = LocalDateTime.now();
    }

    public String getImageThumbnailUrl() {
        return imageThumbnailUrl;
    }

    public void setImageThumbnailUrl(String imageThumbnailUrl) {
        this.imageThumbnailUrl = imageThumbnailUrl;
        this.updatedAt = LocalDateTime.now();
    }

    public String getImageOptimizedUrl() {
        return imageOptimizedUrl;
    }

    public void setImageOptimizedUrl(String imageOptimizedUrl) {
        this.imageOptimizedUrl = imageOptimizedUrl;
        this.updatedAt = LocalDateTime.now();
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
        this.updatedAt = LocalDateTime.now();
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
        this.updatedAt = LocalDateTime.now();
    }

    public boolean isActive() {
        return isActive;
    }

    public void setActive(boolean active) {
        isActive = active;
        this.updatedAt = LocalDateTime.now();
    }

    public boolean isAvailable() {
        return isActive && isInStock();
    }

    public void setAvailable(boolean available) {
        setActive(available);
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
        return "Product{" +
                "id='" + id + '\'' +
                ", name='" + name + '\'' +
                ", slug='" + slug + '\'' +
                ", price=" + price +
                ", stock=" + stock +
                ", category='" + category + '\'' +
                ", isActive=" + isActive +
                ", createdAt=" + createdAt +
                '}';
    }
}
