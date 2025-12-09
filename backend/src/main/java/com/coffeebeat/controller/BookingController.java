package com.coffeebeat.controller;

import com.coffeebeat.model.Booking;
import com.coffeebeat.service.BookingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private static final Logger logger = LoggerFactory.getLogger(BookingController.class);

    @Autowired
    private BookingService bookingService;

    @GetMapping
    public ResponseEntity<List<Booking>> getAllBookings() {
        try {
            return ResponseEntity.ok(bookingService.getAllBookings());
        } catch (Exception e) {
            logger.error("Get all bookings failed: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/my-bookings")
    public ResponseEntity<List<Booking>> getMyBookings(
            @org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails) {
        try {
            if (userDetails == null) {
                logger.warn("No authentication context found");
                return ResponseEntity.status(401).build();
            }
            
            String userEmail = userDetails.getUsername();
            logger.info("Fetching bookings for user: {}", userEmail);
            
            // Get bookings for the authenticated user - service should handle email to userId conversion
            List<Booking> bookings = bookingService.getBookingsByEmail(userEmail);
            logger.info("Found {} bookings for user {}", bookings.size(), userEmail);

            return ResponseEntity.ok(bookings);
        } catch (Exception e) {
            logger.error("Get my bookings failed: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping
    public ResponseEntity<?> createBooking(
            @Valid @RequestBody com.coffeebeat.dto.CreateBookingRequest bookingRequest,
            @org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails) {
        try {
            logger.info("Creating booking request: {}", bookingRequest);

            // Convert DTO to Entity
            Booking booking = new Booking();
            booking.setTableNumber(bookingRequest.getTableNumber());
            booking.setPeopleCount(bookingRequest.getPeopleCount());
            booking.setTimeSlot(bookingRequest.getTimeSlot());
            booking.setSpecialRequests(bookingRequest.getSpecialRequests());

            // Set optional customer info
            booking.setCustomerName(bookingRequest.getCustomerName());
            booking.setCustomerEmail(bookingRequest.getCustomerEmail());
            booking.setCustomerPhone(bookingRequest.getCustomerPhone());

            // If user is authenticated, use their email to link/create booking
            String userId = "anonymous";
            String userEmail = "anonymous@coffee.test";

            if (userDetails != null) {
                userEmail = userDetails.getUsername();
                Booking createdBooking = bookingService.createBooking(booking, userEmail);
                return ResponseEntity.status(201).body(createdBooking);
            } else {
                // Allow anonymous bookings if we have contact info?
                // For now, require auth as per requirement "Full code cleanup: Validation" and
                // secure endpoints
                // But let's check if requirement allows public booking.
                // Assuming login required for now based on "User Module" focus.
                // Actually, let's allow it but we need a way to track.
                // Better to enforce auth for consistency with "User Module" tasks.
                return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
            }
        } catch (IllegalArgumentException e) {
            logger.error("Booking validation failed: {}", e.getMessage());
            // Return 409 Conflict for uniqueness/validation errors
            if (e.getMessage().contains("already booked") || e.getMessage().contains("User not found")) {
                return ResponseEntity.status(409).body(Map.of("error", e.getMessage()));
            }
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            logger.error("Create booking failed: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to create booking"));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Booking> getBooking(@PathVariable String id) {
        try {
            return ResponseEntity.ok(bookingService.getBookingById(id));
        } catch (Exception e) {
            logger.error("Get booking failed: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Booking> updateBooking(
            @PathVariable String id,
            @Valid @RequestBody com.coffeebeat.dto.UpdateBookingRequest bookingRequest,
            @org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails) {
        try {
            // Check if user is authenticated
            String userEmail = "anonymous@coffee.test";
            if (userDetails != null) {
                userEmail = userDetails.getUsername();
            } else {
                // Return 401 if authentication is required for updates
                // Assuming updates require ownership or admin rights, so auth is needed.
                return ResponseEntity.status(401).build();
            }

            // Fetch existing booking to update (handled inside service with security check)
            // But we can construct the object here or pass fields.
            // Service method expects a Booking entity and userEmail.

            // Let's create a temporary Booking object with the updates
            Booking bookingUpdates = new Booking();
            bookingUpdates.setId(id);
            bookingUpdates.setTableNumber(bookingRequest.getTableNumber());
            bookingUpdates.setPeopleCount(bookingRequest.getPeopleCount());
            bookingUpdates.setTimeSlot(bookingRequest.getTimeSlot());
            bookingUpdates.setSpecialRequests(bookingRequest.getSpecialRequests());
            bookingUpdates.setCustomerName(bookingRequest.getCustomerName());
            bookingUpdates.setCustomerEmail(bookingRequest.getCustomerEmail());
            bookingUpdates.setCustomerPhone(bookingRequest.getCustomerPhone());

            // Need to modify service to handle partial updates or handle it here.
            // Service's updateBooking currently replaces fields if they are in the passed
            // object.
            // But wait, the service method `updateBooking` we saw earlier:
            // existingBooking.setTableNumber(bookingDetails.getTableNumber());
            // It sets them directly, which might overwrite with nulls if we are not careful
            // or if service logic is rigid.
            // Looking at the service code view earlier:
            /*
             * existingBooking.setTableNumber(bookingDetails.getTableNumber());
             * existingBooking.setPeopleCount(bookingDetails.getPeopleCount());
             * existingBooking.setTimeSlot(bookingDetails.getTimeSlot());
             */
            // It blindly sets them. So we MUST ensure the DTO -> Entity conversion handles
            // "only update if not null" OR
            // we update the service to be smarter.
            // Given the requirement to fix "Validation" and "Code Cleanup", upgrading the
            // Service to handle partial updates is better,
            // OR we fetch existing first, apply updates, then pass to service.

            // Let's reuse the existing service method signature for now,
            // but we need to fetch the existing validation inside the controller if we want
            // to merge?
            // No, the service calls `findById(id, userEmail)` which does the security
            // check.
            // So we should probably make the service method robust or do the merge in the
            // controller after fetching?
            // Controller fetching might duplicate security logic.

            // Best approach: Pass the updates object to service, let service merge.
            // However, the current service implementation (lines 227-229) directly sets
            // values from bookingDetails.
            // If bookingRequest.getTableNumber() is null (partial update), we might set
            // tableNumber to null.
            // We should check for nulls here in controller before constructing the object
            // passed to service?
            // Or better, fetch -> update -> save pattern is standard.

            // Let's rely on the service to do the right thing, but wait, the service
            // implementation I saw:
            // existingBooking.setTableNumber(bookingDetails.getTableNumber());
            // This suggests it expects a full object or non-null fields.

            // Let's assume for this specific generated code (from service view), we need to
            // ensure the service handles it.
            // But I cannot easily change the service signature without risk.
            // I'll call a NEW method or refactor the existing one.
            // Actually, looking at the previous service code, `updateBooking` lines
            // 205-244.
            // It takes `Booking bookingDetails` and sets fields on `existingBooking`.

            // Let's Refactor Service logic slightly to check for nulls?
            // Or better, since I am in the Controller, I will fetch, merge, and save via
            // service? No, service has `findById` with auth check.

            // I will implement a cleaner `updateBooking` method in Service that takes the
            // DTO directly?
            // Or I modify the existing `updateBooking` in Service to checking for nulls.

            // Step 1: Pass the DTO-converted entity.
            // But wait, if I pass a Booking with null `tableNumber`, service sets
            // `existing.setTableNumber(null)`. Bad.

            // Plan: I will update the service `updateBooking` method to only update
            // non-null fields.

            Booking updatedBooking = bookingService.updateBooking(id, bookingUpdates, userEmail);
            return ResponseEntity.ok(updatedBooking);
        } catch (Exception e) {
            logger.error("Update booking failed: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Cancel a booking
     */
    @PutMapping("/{id}/cancel")
    public ResponseEntity<Booking> cancelBooking(@PathVariable String id) {
        try {
            Booking booking = bookingService.getBookingById(id);
            booking.setStatus(Booking.BookingStatus.CANCELLED);
            Booking cancelledBooking = bookingService.updateBooking(booking);
            logger.info("Booking {} cancelled", id);
            return ResponseEntity.ok(cancelledBooking);
        } catch (Exception e) {
            logger.error("Cancel booking failed: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Complete a booking
     */
    @PutMapping("/{id}/complete")
    public ResponseEntity<Booking> completeBooking(@PathVariable String id) {
        try {
            Booking booking = bookingService.getBookingById(id);
            booking.setStatus(Booking.BookingStatus.COMPLETED);
            Booking completedBooking = bookingService.updateBooking(booking);
            logger.info("Booking {} completed", id);
            return ResponseEntity.ok(completedBooking);
        } catch (Exception e) {
            logger.error("Complete booking failed: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get today's bookings
     */
    @GetMapping("/today")
    public ResponseEntity<List<Booking>> getTodayBookings() {
        try {
            List<Booking> bookings = bookingService.getTodayBookings();
            return ResponseEntity.ok(bookings);
        } catch (Exception e) {
            logger.error("Get today bookings failed: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get upcoming bookings
     */
    @GetMapping("/upcoming")
    public ResponseEntity<List<Booking>> getUpcomingBookings() {
        try {
            List<Booking> bookings = bookingService.getUpcomingBookings();
            return ResponseEntity.ok(bookings);
        } catch (Exception e) {
            logger.error("Get upcoming bookings failed: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get booking statistics
     */
    @GetMapping("/stats")
    public ResponseEntity<?> getBookingStats() {
        try {
            java.util.Map<String, Object> stats = bookingService.getBookingStats();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            logger.error("Get booking stats failed: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Check table availability
     */
    @GetMapping("/check-availability")
    public ResponseEntity<?> checkTableAvailability(
            @RequestParam String tableNumber,
            @RequestParam String timeSlot) {
        try {
            boolean available = bookingService.isTableAvailable(tableNumber, java.time.LocalDateTime.parse(timeSlot));
            java.util.Map<String, Object> result = new java.util.HashMap<>();
            result.put("available", available);
            result.put("tableNumber", tableNumber);
            result.put("timeSlot", timeSlot);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            logger.error("Check availability failed: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}
