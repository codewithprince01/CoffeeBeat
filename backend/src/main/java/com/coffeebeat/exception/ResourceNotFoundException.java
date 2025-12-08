package com.coffeebeat.exception;

/**
 * Custom exception for resource not found scenarios
 * 
 * This exception is thrown when a requested resource (user, order, product, etc.)
 * is not found in the database.
 */
public class ResourceNotFoundException extends RuntimeException {
    
    public ResourceNotFoundException(String message) {
        super(message);
    }
    
    public ResourceNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}
