package com.coffeebeat.util;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

/**
 * JWT utility class for token generation and validation
 * 
 * This class handles JWT token operations including:
 * - Token generation for authentication
 * - Token validation and parsing
 * - Claims extraction
 * - Refresh token management
 */
@Component
public class JwtUtil {
    
    @Value("${jwt.secret}")
    private String jwtSecret;
    
    @Value("${jwt.expiration}")
    private Long jwtExpiration;
    
    @Value("${jwt.refresh-expiration}")
    private Long jwtRefreshExpiration;
    
    private SecretKey getSigningKey() {
        byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }
    
    /**
     * Extract username from JWT token
     */
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }
    
    /**
     * Extract expiration date from JWT token
     */
    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }
    
    /**
     * Extract specific claim from JWT token
     */
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }
    
    /**
     * Extract all claims from JWT token
     */
    private Claims extractAllClaims(String token) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
        } catch (ExpiredJwtException e) {
            throw new JwtException("Token has expired", e);
        } catch (UnsupportedJwtException e) {
            throw new JwtException("Token is unsupported", e);
        } catch (MalformedJwtException e) {
            throw new JwtException("Token is malformed", e);
        } catch (SecurityException e) {
            throw new JwtException("Token signature validation failed", e);
        } catch (IllegalArgumentException e) {
            throw new JwtException("Token is invalid", e);
        }
    }
    
    /**
     * Check if JWT token is expired
     */
    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }
    
    /**
     * Generate JWT token for user
     */
    public String generateToken(String username, String role) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", role);
        return createToken(claims, username, jwtExpiration);
    }
    
    /**
     * Generate refresh token for user
     */
    public String generateRefreshToken(String username, String role) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", role);
        claims.put("type", "refresh");
        return createToken(claims, username, jwtRefreshExpiration);
    }
    
    /**
     * Create JWT token with claims and expiration
     */
    private String createToken(Map<String, Object> claims, String subject, Long expiration) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expiration);
        
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(subject)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }
    
    /**
     * Validate JWT token
     */
    public Boolean validateToken(String token, String username) {
        try {
            final String extractedUsername = extractUsername(token);
            return (extractedUsername.equals(username) && !isTokenExpired(token));
        } catch (JwtException e) {
            return false;
        }
    }
    
    /**
     * Extract role from JWT token
     */
    public String extractRole(String token) {
        return extractClaim(token, claims -> claims.get("role", String.class));
    }
    
    /**
     * Check if token is a refresh token
     */
    public Boolean isRefreshToken(String token) {
        try {
            String type = extractClaim(token, claims -> claims.get("type", String.class));
            return "refresh".equals(type);
        } catch (Exception e) {
            return false;
        }
    }
    
    /**
     * Get token expiration time in milliseconds
     */
    public Long getTokenExpirationTime(String token) {
        Date expiration = extractExpiration(token);
        return expiration.getTime() - System.currentTimeMillis();
    }
    
    /**
     * Check if token is close to expiration (within 30 minutes)
     */
    public Boolean isTokenExpiringSoon(String token) {
        try {
            Long timeToExpire = getTokenExpirationTime(token);
            return timeToExpire < (30 * 60 * 1000); // 30 minutes in milliseconds
        } catch (Exception e) {
            return true;
        }
    }
    
    /**
     * Get remaining time until token expires in a human-readable format
     */
    public String getTimeUntilExpiration(String token) {
        try {
            Long timeToExpire = getTokenExpirationTime(token);
            if (timeToExpire <= 0) {
                return "Expired";
            }
            
            long hours = timeToExpire / (60 * 60 * 1000);
            long minutes = (timeToExpire % (60 * 60 * 1000)) / (60 * 1000);
            
            if (hours > 0) {
                return hours + " hour" + (hours > 1 ? "s" : "") + " " + minutes + " minute" + (minutes > 1 ? "s" : "");
            } else {
                return minutes + " minute" + (minutes > 1 ? "s" : "");
            }
        } catch (Exception e) {
            return "Unknown";
        }
    }
}
