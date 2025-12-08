package com.coffeebeat.repository;

import com.coffeebeat.model.InviteToken;
import org.springframework.data.mongodb.repository.DeleteQuery;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Repository interface for InviteToken entity
 * 
 * This interface extends MongoRepository to provide CRUD operations
 * and custom queries for InviteToken entities.
 */
@Repository
public interface InviteTokenRepository extends MongoRepository<InviteToken, String> {

    /**
     * Find invite token by token string
     */
    Optional<InviteToken> findByToken(String token);

    /**
     * Find invite token by email
     */
    Optional<InviteToken> findByEmail(String email);

    /**
     * Find invite token by token and check if it's valid (not used and not expired)
     */
    @Query("{ 'token': ?0, 'used': false, 'expiresAt': { '$gt': ?1 } }")
    Optional<InviteToken> findValidToken(String token, LocalDateTime now);

    /**
     * Find invite token by email and role
     */
    Optional<InviteToken> findByEmailAndRole(String email, String role);

    /**
     * Find all unused tokens
     */
    @Query("{ 'used': false }")
    java.util.List<InviteToken> findUnusedTokens();

    /**
     * Find all used tokens
     */
    @Query("{ 'used': true }")
    java.util.List<InviteToken> findUsedTokens();

    /**
     * Find expired tokens
     */
    @Query("{ 'expiresAt': { '$lt': ?0 } }")
    java.util.List<InviteToken> findExpiredTokens(LocalDateTime now);

    /**
     * Find tokens that expire soon (within 24 hours)
     */
    @Query("{ 'used': false, 'expiresAt': { '$gte': ?0, '$lte': ?1 } }")
    java.util.List<InviteToken> findTokensExpiringSoon(LocalDateTime now, LocalDateTime tomorrow);

    /**
     * Count unused tokens by role
     */
    @Query(value = "{ 'role': ?0, 'used': false }", count = true)
    long countUnusedTokensByRole(String role);

    /**
     * Count used tokens by role
     */
    @Query(value = "{ 'role': ?0, 'used': true }", count = true)
    long countUsedTokensByRole(String role);

    /**
     * Check if there's an existing valid token for email
     */
    @Query(value = "{ 'email': ?0, 'used': false, 'expiresAt': { '$gt': ?1 } }", exists = true)
    boolean existsValidTokenForEmail(String email, LocalDateTime now);

    /**
     * Find valid invite token by email
     */
    @Query("{ 'email': ?0, 'used': false, 'expiresAt': { '$gt': ?1 } }")
    Optional<InviteToken> findValidTokenByEmail(String email, LocalDateTime now);

    /**
     * Delete expired tokens (cleanup)
     */
    @DeleteQuery("{ 'expiresAt': { '$lt': ?0 } }")
    void deleteExpiredTokens(LocalDateTime cutoffDate);

    /**
     * Find tokens created within date range
     */
    @Query("{ 'createdAt': { '$gte': ?0, '$lte': ?1 } }")
    java.util.List<InviteToken> findByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate);

    /**
     * Find tokens by role and status
     */
    @Query("{ 'role': ?0, 'used': ?1 }")
    java.util.List<InviteToken> findByRoleAndUsed(String role, boolean used);
}
