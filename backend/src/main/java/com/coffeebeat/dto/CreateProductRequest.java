package com.coffeebeat.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

/**
 * Data Transfer Object for creating products
 * 
 * This DTO provides validation for product creation requests
 * including image upload functionality.
 */
public class CreateProductRequest {

    @NotBlank(message = "Product name is required")
    @Size(min = 2, max = 100, message = "Product name must be between 2 and 100 characters")
    private String name;

    @NotBlank(message = "Product slug is required")
    @Size(min = 2, max = 100, message = "Product slug must be between 2 and 100 characters")
    @Pattern(regexp = "^[a-z0-9-]+$", message = "Slug can only contain lowercase letters, numbers, and hyphens")
    private String slug;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.01", message = "Price must be greater than 0")
    @Digits(integer = 10, fraction = 2, message = "Price must have at most 2 decimal places")
    private BigDecimal price;

    @NotNull(message = "Stock is required")
    @Min(value = 0, message = "Stock cannot be negative")
    private Integer stock;

    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;

    @NotBlank(message = "Category is required")
    @Size(min = 2, max = 50, message = "Category must be between 2 and 50 characters")
    private String category;

    private boolean isActive = true;

    // Default constructor
    public CreateProductRequest() {}

    // Constructor with required fields
    public CreateProductRequest(String name, String slug, BigDecimal price, Integer stock, String category) {
        this.name = name;
        this.slug = slug;
        this.price = price;
        this.stock = stock;
        this.category = category;
    }

    // Constructor with all fields
    public CreateProductRequest(String name, String slug, BigDecimal price, Integer stock, 
                              String description, String category, boolean isActive) {
        this.name = name;
        this.slug = slug;
        this.price = price;
        this.stock = stock;
        this.description = description;
        this.category = category;
        this.isActive = isActive;
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

    public boolean isActive() {
        return isActive;
    }

    public void setActive(boolean active) {
        isActive = active;
    }

    @Override
    public String toString() {
        return "CreateProductRequest{" +
                "name='" + name + '\'' +
                ", slug='" + slug + '\'' +
                ", price=" + price +
                ", stock=" + stock +
                ", description='" + description + '\'' +
                ", category='" + category + '\'' +
                ", isActive=" + isActive +
                '}';
    }
}
