package com.coffeebeat.repository;

import com.coffeebeat.model.Booking;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository interface for Booking entity
 * 
 * This interface extends MongoRepository to provide CRUD operations
 * and custom queries for Booking entities.
 */
@Repository
public interface BookingRepository extends MongoRepository<Booking, String> {

    /**
     * Find bookings by user ID
     */
    List<Booking> findByUserId(String userId);

    /**
     * Find bookings by user ID and status
     */
    List<Booking> findByUserIdAndStatus(String userId, Booking.BookingStatus status);

    /**
     * Find bookings by table number
     */
    List<Booking> findByTableNumber(String tableNumber);

    /**
     * Find bookings by table number and time slot range (Active only)
     */
    @Query("{ 'tableNumber': ?0, 'timeSlot': { '$gte': ?1, '$lte': ?2 }, 'status': { '$in': ['BOOKED', 'CONFIRMED', 'RESERVED', 'OCCUPIED'] } }")
    List<Booking> findByTableNumberAndTimeSlotBetween(String tableNumber, LocalDateTime startTime,
            LocalDateTime endTime);

    /**
     * Find bookings by time slot range
     */
    @Query("{ 'timeSlot': { '$gte': ?0, '$lte': ?1 } }")
    List<Booking> findByTimeSlotBetween(LocalDateTime startTime, LocalDateTime endTime);

    /**
     * Find active bookings for a specific time slot and table
     * Checks for BOOKED, CONFIRMED, RESERVED, OCCUPIED
     */
    @Query("{ 'tableNumber': ?0, 'timeSlot': ?1, 'status': { '$in': ['BOOKED', 'CONFIRMED', 'RESERVED', 'OCCUPIED'] } }")
    Optional<Booking> findActiveBookingForTableAndTime(String tableNumber, LocalDateTime timeSlot);

    /**
     * Find bookings for today
     */
    @Query("{ 'timeSlot': { '$gte': ?0, '$lte': ?1 } }")
    List<Booking> findBookingsForToday(LocalDateTime startOfDay, LocalDateTime endOfDay);

    /**
     * Find upcoming bookings for a user
     */
    @Query("{ 'userId': ?0, 'timeSlot': { '$gte': ?1 }, 'status': { '$in': ['BOOKED', 'CONFIRMED', 'RESERVED'] } }")
    List<Booking> findUpcomingBookings(String userId, LocalDateTime now);

    /**
     * Find past bookings for a user
     */
    @Query("{ 'userId': ?0, 'timeSlot': { '$lt': ?1 } }")
    List<Booking> findPastBookings(String userId, LocalDateTime now);

    /**
     * Find bookings by status
     */
    List<Booking> findByStatus(Booking.BookingStatus status);

    /**
     * Count bookings by status
     */
    long countByStatus(Booking.BookingStatus status);

    /**
     * Count bookings by user and status
     */
    long countByUserIdAndStatus(String userId, Booking.BookingStatus status);

    /**
     * Count bookings for today by status
     */
    @Query("{ 'timeSlot': { '$gte': ?0, '$lte': ?1 }, 'status': ?2 }")
    long countBookingsForTodayByStatus(LocalDateTime startOfDay, LocalDateTime endOfDay, Booking.BookingStatus status);

    /**
     * Find bookings that need reminder (2 hours before)
     */
    @Query("{ 'timeSlot': { '$gte': ?0, '$lte': ?1 }, 'status': { '$in': ['BOOKED', 'CONFIRMED'] } }")
    List<Booking> findBookingsNeedingReminder(LocalDateTime reminderStart, LocalDateTime reminderEnd);

    /**
     * Find conflicting bookings for a table (excluding the current booking)
     */
    @Query("{ 'tableNumber': ?0, 'timeSlot': { '$gte': ?1, '$lte': ?2 }, 'status': { '$in': ['BOOKED', 'CONFIRMED', 'RESERVED', 'OCCUPIED'] }, '_id': { '$ne': ?3 } }")
    List<Booking> findConflictingBookings(String tableNumber, LocalDateTime startTime, LocalDateTime endTime,
            String excludeBookingId);
}
