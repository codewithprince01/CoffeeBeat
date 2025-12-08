package com.coffeebeat.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

/**
 * InviteToken entity representing staff invitation tokens
 * 
 * This class manages invitation tokens for staff members (chefs and waiters).
 * Admins can generate tokens that allow users to register with specific roles.
 */
@Document(collection = "invite_tokens")
public class InviteToken {
    
    @Id
    private String id;
    
    @Indexed(unique = true)
    @NotBlank(message = "Token is required")
    private String token;
    
    @Indexed
    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    private String email;
    
    @NotNull(message = "Role is required")
    private String role;
    
    @NotNull(message = "Expiration date is required")
    private LocalDateTime expiresAt;
    
    private boolean used = false;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime usedAt;
    
    // Default constructor
    public InviteToken() {
        this.createdAt = LocalDateTime.now();
    }
    
    // Constructor with essential fields
    public InviteToken(String token, String email, String role, LocalDateTime expiresAt) {
        this();
        this.token = token;
        this.email = email;
        this.role = role;
        this.expiresAt = expiresAt;
    }
    
    // Business logic methods
    public boolean isValid() {
        return !used && !isExpired();
    }
    
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }
    
    public void markAsUsed() {
        if (used) {
            throw new IllegalStateException("Token has already been used");
        }
        if (isExpired()) {
            throw new IllegalStateException("Token has expired");
        }
        this.used = true;
        this.usedAt = LocalDateTime.now();
    }
    
    // Static factory method to create token with 7-day expiration
    public static InviteToken create(String token, String email, String role) {
        return new InviteToken(token, email, role, LocalDateTime.now().plusDays(7));
    }
    
    // Getters and Setters
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
    public String getToken() {
        return token;
    }
    
    public void setToken(String token) {
        this.token = token;
    }
    
    public String getEmail() {
        return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
    
    public String getRole() {
        return role;
    }
    
    public void setRole(String role) {
        this.role = role;
    }
    
    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }
    
    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }
    
    public boolean isUsed() {
        return used;
    }
    
    public void setUsed(boolean used) {
        this.used = used;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUsedAt() {
        return usedAt;
    }
    
    public void setUsedAt(LocalDateTime usedAt) {
        this.usedAt = usedAt;
    }
    
    @Override
    public String toString() {
        return "InviteToken{" +
                "id='" + id + '\'' +
                ", token='" + token + '\'' +
                ", email='" + email + '\'' +
                ", role='" + role + '\'' +
                ", expiresAt=" + expiresAt +
                ", used=" + used +
                ", createdAt=" + createdAt +
                (usedAt != null ? ", usedAt=" + usedAt : "") +
                '}';
    }
}
