package com.coffeebeat.service;

import com.coffeebeat.model.Booking;
import com.coffeebeat.model.User;
import com.coffeebeat.repository.BookingRepository;
import com.coffeebeat.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Booking service for managing table reservations
 * 
 * This service provides business logic for:
 * - Booking creation and validation
 * - Booking status management
 * - Table availability checking
 * - Booking analytics and statistics
 */
@Service
public class BookingService {

    private static final Logger logger = LoggerFactory.getLogger(BookingService.class);

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private UserRepository userRepository;

    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    public Booking createBooking(Booking booking) {
        return bookingRepository.save(booking);
    }

    public Booking getBookingById(String id) {
        return bookingRepository.findById(id).orElse(null);
    }

    public List<Booking> getBookingsByUser(String userId) {
        return bookingRepository.findByUserId(userId);
    }

    public List<Booking> getBookingsByEmail(String email) {
        // Find user by email first, then get bookings
        com.coffeebeat.model.User user = userRepository.findByEmail(email).orElse(null);
        if (user != null) {
            return bookingRepository.findByUserId(user.getId());
        }
        return List.of(); // Return empty list if user not found
    }

    public Booking updateBooking(Booking booking) {
        return bookingRepository.save(booking);
    }

    /**
     * Create new booking
     */
    @Transactional
    public Booking createBookingForAdmin(Booking booking) {
        logger.info("Creating booking for admin user");

        // Set user ID for admin
        booking.setUserId("6931bb3ad41b96691ca6ad27");

        // Skip validation for admin
        // validateBooking(booking);

        // Check if time slot is in the future (skip for admin)
        // if (booking.getTimeSlot().isBefore(LocalDateTime.now())) {
        // throw new IllegalArgumentException("Time slot must be in the future");
        // }

        // Check table availability (skip for admin to allow overbooking)
        // if (!isTableAvailable(booking.getTableNumber(), booking.getTimeSlot())) {
        // throw new IllegalArgumentException("Table " + booking.getTableNumber() +
        // " is already booked at " + booking.getTimeSlot());
        // }

        // Set default status
        booking.setStatus(Booking.BookingStatus.BOOKED);

        Booking savedBooking = bookingRepository.save(booking);
        logger.info("Booking created successfully with ID: {}", savedBooking.getId());

        return savedBooking;
    }

    public Booking createBooking(Booking booking, String userEmail) {
        logger.info("Creating booking for user: {}", userEmail);

        // Get user
        Optional<User> userOpt = userRepository.findByEmail(userEmail);
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("User not found: " + userEmail);
        }

        User user = userOpt.get();
        booking.setUserId(user.getId());

        // Validate booking
        validateBooking(booking);

        // Check if time slot is in the future
        if (booking.getTimeSlot().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Time slot must be in the future");
        }

        // Check table availability
        if (!isTableAvailable(booking.getTableNumber(), booking.getTimeSlot())) {
            throw new IllegalArgumentException("Table " + booking.getTableNumber() +
                    " is already booked at " + booking.getTimeSlot());
        }

        // Set default status
        booking.setStatus(Booking.BookingStatus.BOOKED);

        Booking savedBooking = bookingRepository.save(booking);
        logger.info("Booking created successfully: {}", savedBooking.getId());

        return savedBooking;
    }

    /**
     * Find booking by ID with user validation
     */
    public Booking findById(String id, String userEmail) {
        Optional<Booking> bookingOpt = bookingRepository.findById(id);
        if (bookingOpt.isEmpty()) {
            throw new IllegalArgumentException("Booking not found: " + id);
        }

        Booking booking = bookingOpt.get();

        // Check if user has access to this booking
        Optional<User> userOpt = userRepository.findByEmail(userEmail);
        if (userOpt.isPresent()) {
            User user = userOpt.get();

            // Admin can see all bookings, other users can only see their own bookings
            if (!user.getRole().equals("ROLE_ADMIN") && !booking.getUserId().equals(user.getId())) {
                throw new IllegalArgumentException("Access denied to booking: " + id);
            }
        }

        return booking;
    }

    /**
     * Find all bookings
     */
    public List<Booking> findAll() {
        return bookingRepository.findAll();
    }

    /**
     * Find bookings by user
     */
    public List<Booking> findByUser(String userEmail) {
        Optional<User> userOpt = userRepository.findByEmail(userEmail);
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("User not found: " + userEmail);
        }

        return bookingRepository.findByUserId(userOpt.get().getId());
    }

    /**
     * Find bookings by user and status
     */
    public List<Booking> findByUserAndStatus(String userEmail, Booking.BookingStatus status) {
        Optional<User> userOpt = userRepository.findByEmail(userEmail);
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("User not found: " + userEmail);
        }

        return bookingRepository.findByUserIdAndStatus(userOpt.get().getId(), status);
    }

    /**
     * Find bookings by status
     */
    public List<Booking> findByStatus(Booking.BookingStatus status) {
        return bookingRepository.findByStatus(status);
    }

    /**
     * Find bookings by date range
     */
    public List<Booking> findByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        return bookingRepository.findByTimeSlotBetween(startDate, endDate);
    }

    /**
     * Update booking
     */
    @Transactional
    public Booking updateBooking(String id, Booking bookingDetails, String userEmail) {
        logger.info("Updating booking: {} by user: {}", id, userEmail);

        Booking existingBooking = findById(id, userEmail);

        // Check if user can update this booking
        Optional<User> userOpt = userRepository.findByEmail(userEmail);
        if (userOpt.isPresent()) {
            User user = userOpt.get();

            // Only admin can update other users' bookings
            if (!user.getRole().equals("ROLE_ADMIN") && !existingBooking.getUserId().equals(user.getId())) {
                throw new IllegalArgumentException("Access denied to update booking: " + id);
            }
        }

        // Check if booking can be updated (only BOOKED status can be updated)
        if (existingBooking.getStatus() != Booking.BookingStatus.BOOKED) {
            throw new IllegalArgumentException("Cannot update booking with status: " + existingBooking.getStatus());
        }

        // Update fields (only if not null)
        if (bookingDetails.getTableNumber() != null) {
            existingBooking.setTableNumber(bookingDetails.getTableNumber());
        }
        if (bookingDetails.getPeopleCount() != null) {
            existingBooking.setPeopleCount(bookingDetails.getPeopleCount());
        }
        if (bookingDetails.getTimeSlot() != null) {
            existingBooking.setTimeSlot(bookingDetails.getTimeSlot());
        }
        if (bookingDetails.getSpecialRequests() != null) {
            existingBooking.setSpecialRequests(bookingDetails.getSpecialRequests());
        }
        if (bookingDetails.getCustomerName() != null) {
            existingBooking.setCustomerName(bookingDetails.getCustomerName());
        }
        if (bookingDetails.getCustomerEmail() != null) {
            existingBooking.setCustomerEmail(bookingDetails.getCustomerEmail());
        }
        if (bookingDetails.getCustomerPhone() != null) {
            existingBooking.setCustomerPhone(bookingDetails.getCustomerPhone());
        }

        // Re-validate booking
        validateBooking(existingBooking);

        // Check table availability (exclude current booking)
        if (!isTableAvailableForUpdate(existingBooking.getTableNumber(), existingBooking.getTimeSlot(), id)) {
            throw new IllegalArgumentException("Table " + existingBooking.getTableNumber() +
                    " is already booked at " + existingBooking.getTimeSlot());
        }

        Booking updatedBooking = bookingRepository.save(existingBooking);
        logger.info("Booking updated successfully: {}", updatedBooking.getId());

        return updatedBooking;
    }

    /**
     * Cancel booking
     */
    @Transactional
    public Booking cancelBooking(String id, String userEmail) {
        logger.info("Cancelling booking: {} by user: {}", id, userEmail);

        Booking booking = findById(id, userEmail);

        // Check if user can cancel this booking
        Optional<User> userOpt = userRepository.findByEmail(userEmail);
        if (userOpt.isPresent()) {
            User user = userOpt.get();

            // Only customer who placed the booking or admin can cancel
            if (!user.getRole().equals("ROLE_ADMIN") && !booking.getUserId().equals(user.getId())) {
                throw new IllegalArgumentException("Access denied to cancel booking: " + id);
            }
        }

        booking.cancel();

        Booking cancelledBooking = bookingRepository.save(booking);
        logger.info("Booking cancelled successfully: {}", id);

        return cancelledBooking;
    }

    /**
     * Complete booking
     */
    @Transactional
    public Booking completeBooking(String id, String userEmail) {
        logger.info("Completing booking: {} by user: {}", id, userEmail);

        Booking booking = findById(id, userEmail);

        // Only admin can complete bookings
        Optional<User> userOpt = userRepository.findByEmail(userEmail);
        if (userOpt.isEmpty() || !userOpt.get().getRole().equals("ROLE_ADMIN")) {
            throw new IllegalArgumentException("Access denied to complete booking: " + id);
        }

        booking.complete();

        Booking completedBooking = bookingRepository.save(booking);
        logger.info("Booking completed successfully: {}", id);

        return completedBooking;
    }

    /**
     * Check table availability
     */
    public boolean isTableAvailable(String tableNumber, LocalDateTime timeSlot) {
        Optional<Booking> existingBooking = bookingRepository.findActiveBookingForTableAndTime(tableNumber, timeSlot);
        return existingBooking.isEmpty();
    }

    /**
     * Check table availability for update (exclude current booking)
     */
    public boolean isTableAvailableForUpdate(String tableNumber, LocalDateTime timeSlot, String excludeBookingId) {
        List<Booking> conflictingBookings = bookingRepository.findConflictingBookings(tableNumber, timeSlot, timeSlot,
                excludeBookingId);
        return conflictingBookings.isEmpty();
    }

    /**
     * Get today's bookings
     */
    public List<Booking> getTodayBookings() {
        LocalDateTime startOfDay = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime endOfDay = startOfDay.plusDays(1);
        return bookingRepository.findBookingsForToday(startOfDay, endOfDay);
    }

    /**
     * Get all upcoming bookings (admin)
     */
    public List<Booking> getUpcomingBookings() {
        LocalDateTime now = LocalDateTime.now();
        return bookingRepository.findAll().stream()
                .filter(booking -> booking.getTimeSlot().isAfter(now))
                .filter(booking -> booking.getStatus() == Booking.BookingStatus.BOOKED)
                .sorted((a, b) -> a.getTimeSlot().compareTo(b.getTimeSlot()))
                .toList();
    }

    /**
     * Get upcoming bookings for user
     */
    public List<Booking> getUpcomingBookings(String userEmail) {
        Optional<User> userOpt = userRepository.findByEmail(userEmail);
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("User not found: " + userEmail);
        }

        return bookingRepository.findUpcomingBookings(userOpt.get().getId(), LocalDateTime.now());
    }

    /**
     * Get booking statistics
     */
    public Map<String, Object> getBookingStats() {
        Map<String, Object> stats = new HashMap<>();

        LocalDateTime startOfDay = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime endOfDay = startOfDay.plusDays(1);

        // Today's stats
        long todayBookings = bookingRepository.countBookingsForTodayByStatus(startOfDay, endOfDay, null);
        long todayBooked = bookingRepository.countBookingsForTodayByStatus(startOfDay, endOfDay,
                Booking.BookingStatus.BOOKED);
        long todayCancelled = bookingRepository.countBookingsForTodayByStatus(startOfDay, endOfDay,
                Booking.BookingStatus.CANCELLED);
        long todayCompleted = bookingRepository.countBookingsForTodayByStatus(startOfDay, endOfDay,
                Booking.BookingStatus.COMPLETED);

        stats.put("todayBookings", todayBookings);
        stats.put("todayBooked", todayBooked);
        stats.put("todayCancelled", todayCancelled);
        stats.put("todayCompleted", todayCompleted);

        // Overall stats
        long totalBookings = bookingRepository.count();
        long bookedBookings = bookingRepository.countByStatus(Booking.BookingStatus.BOOKED);
        long cancelledBookings = bookingRepository.countByStatus(Booking.BookingStatus.CANCELLED);
        long completedBookings = bookingRepository.countByStatus(Booking.BookingStatus.COMPLETED);

        stats.put("totalBookings", totalBookings);
        stats.put("bookedBookings", bookedBookings);
        stats.put("cancelledBookings", cancelledBookings);
        stats.put("completedBookings", completedBookings);

        return stats;
    }

    /**
     * Validate booking
     */
    private void validateBooking(Booking booking) {
        // Check if people count is reasonable
        if (booking.getPeopleCount() < 1 || booking.getPeopleCount() > 20) {
            throw new IllegalArgumentException("People count must be between 1 and 20");
        }

        // Check if table number is valid
        if (booking.getTableNumber() == null || booking.getTableNumber().trim().isEmpty()) {
            throw new IllegalArgumentException("Table number is required");
        }

        // Check if time slot is during business hours (example: 8 AM to 10 PM)
        int hour = booking.getTimeSlot().getHour();
        if (hour < 8 || hour >= 22) {
            throw new IllegalArgumentException("Bookings must be between 8 AM and 10 PM");
        }

        // Check if booking is not too far in the future (example: max 30 days)
        LocalDateTime maxFutureDate = LocalDateTime.now().plusDays(30);
        if (booking.getTimeSlot().isAfter(maxFutureDate)) {
            throw new IllegalArgumentException("Bookings cannot be made more than 30 days in advance");
        }
    }

    /**
     * Get available time slots for a specific table on a specific date
     */
    public List<String> getAvailableTimeSlots(String tableNumber, String date) {
        try {
            // Parse the date
            LocalDate bookingDate = LocalDate.parse(date);
            LocalDateTime startOfDay = bookingDate.atStartOfDay();
            LocalDateTime endOfDay = bookingDate.atTime(23, 59, 59);

            // Get existing bookings for the table on that date
            List<Booking> existingBookings = bookingRepository.findByTableNumberAndTimeSlotBetween(
                    tableNumber, startOfDay, endOfDay);

            // Generate time slots (every 30 minutes from 8 AM to 10 PM)
            List<String> timeSlots = new ArrayList<>();
            LocalTime startTime = LocalTime.of(8, 0);
            LocalTime endTime = LocalTime.of(22, 0);

            LocalTime currentTime = startTime;
            while (currentTime.isBefore(endTime)) {
                LocalDateTime slotDateTime = bookingDate.atTime(currentTime);

                // Check if this slot is available (not booked and in the future)
                boolean isAvailable = slotDateTime.isAfter(LocalDateTime.now().minusMinutes(30)) &&
                        existingBookings.stream().noneMatch(booking -> {
                            LocalDateTime bookingTime = booking.getTimeSlot();
                            // Check if booking is within 30 minutes of this slot
                            return Math.abs(Duration.between(bookingTime, slotDateTime).toMinutes()) < 30;
                        });

                if (isAvailable) {
                    timeSlots.add(currentTime.toString());
                }

                currentTime = currentTime.plusMinutes(30);
            }

            return timeSlots;

        } catch (Exception e) {
            logger.error("Error getting available time slots for table {} on date {}", tableNumber, date, e);
            throw new RuntimeException("Failed to get available time slots: " + e.getMessage());
        }
    }
}
