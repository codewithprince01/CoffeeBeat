package com.coffeebeat.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

/**
 * Data Transfer Object for updating products
 * 
 * This DTO provides validation for product update requests
 * with optional fields for partial updates.
 */
public class UpdateProductRequest {

    @Size(min = 2, max = 100, message = "Product name must be between 2 and 100 characters")
    private String name;

    @Size(min = 2, max = 100, message = "Product slug must be between 2 and 100 characters")
    @Pattern(regexp = "^[a-z0-9-]+$", message = "Slug can only contain lowercase letters, numbers, and hyphens")
    private String slug;

    @DecimalMin(value = "0.01", message = "Price must be greater than 0")
    @Digits(integer = 10, fraction = 2, message = "Price must have at most 2 decimal places")
    private BigDecimal price;

    @Min(value = 0, message = "Stock cannot be negative")
    private Integer stock;

    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;

    @Size(min = 2, max = 50, message = "Category must be between 2 and 50 characters")
    private String category;

    private Boolean isActive;

    private String imageUrl;

    // Default constructor
    public UpdateProductRequest() {}

    // Constructor with all fields
    public UpdateProductRequest(String name, String slug, BigDecimal price, Integer stock, 
                              String description, String category, Boolean isActive, String imageUrl) {
        this.name = name;
        this.slug = slug;
        this.price = price;
        this.stock = stock;
        this.description = description;
        this.category = category;
        this.isActive = isActive;
        this.imageUrl = imageUrl;
    }

    // Getters and Setters
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSlug() {
        return slug;
    }

    public void setSlug(String slug) {
        this.slug = slug;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public Integer getStock() {
        return stock;
    }

    public void setStock(Integer stock) {
        this.stock = stock;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setActive(Boolean active) {
        isActive = active;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    @Override
    public String toString() {
        return "UpdateProductRequest{" +
                "name='" + name + '\'' +
                ", slug='" + slug + '\'' +
                ", price=" + price +
                ", stock=" + stock +
                ", description='" + description + '\'' +
                ", category='" + category + '\'' +
                ", isActive=" + isActive +
                ", imageUrl='" + imageUrl + '\'' +
                '}';
    }
}
