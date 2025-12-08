package com.coffeebeat.controller;

import com.coffeebeat.repository.OrderRepository;
import com.coffeebeat.repository.BookingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/test")
public class TestController {

    @Autowired
    private MongoTemplate mongoTemplate;
    
    @Autowired
    private OrderRepository orderRepository;
    
    @Autowired
    private BookingRepository bookingRepository;

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "OK");
        response.put("message", "Backend is running");
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/simple")
    public ResponseEntity<Map<String, String>> simple() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "Simple test works");
        response.put("timestamp", String.valueOf(System.currentTimeMillis()));
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/database")
    public ResponseEntity<Map<String, Object>> database() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Get database info
            String dbName = mongoTemplate.getDb().getName();
            response.put("database", dbName);
            response.put("connection", "MongoDB");
            
            // Count collections
            long orderCount = orderRepository.count();
            long bookingCount = bookingRepository.count();
            
            response.put("orders_count", orderCount);
            response.put("bookings_count", bookingCount);
            response.put("status", "Connected to MongoDB");
            
            // Get collection names
            response.put("collections", mongoTemplate.getCollectionNames());
            
        } catch (Exception e) {
            response.put("status", "Error connecting to database");
            response.put("error", e.getMessage());
        }
        
        return ResponseEntity.ok(response);
    }
}
