package com.coffeebeat.service;

import com.coffeebeat.dto.AuthRequest;
import com.coffeebeat.dto.AuthResponse;
import com.coffeebeat.dto.RegisterRequest;
import com.coffeebeat.model.User;
import com.coffeebeat.repository.UserRepository;
import com.coffeebeat.util.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

/**
 * Authentication service for handling user registration and login
 * 
 * This service provides authentication functionality including:
 * - User registration
 * - User login and JWT token generation
 * - Token refresh functionality
 */
@Service
public class AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserDetailsService userDetailsService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    /**
     * Register a new user
     */
    @Autowired
    private com.coffeebeat.repository.InviteTokenRepository inviteTokenRepository;

    public AuthResponse register(RegisterRequest registerRequest) {
        logger.info("Registering user with email: {}", registerRequest.getEmail());

        // Check if user already exists
        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            throw new BadCredentialsException("Email already registered");
        }

        String role = "CUSTOMER";

        // Handle invite token for staff roles
        if (registerRequest.getInviteToken() != null && !registerRequest.getInviteToken().isEmpty()) {
            Optional<com.coffeebeat.model.InviteToken> tokenOpt = inviteTokenRepository
                    .findByToken(registerRequest.getInviteToken());

            if (tokenOpt.isEmpty()) {
                throw new BadCredentialsException("Invalid invite token");
            }

            com.coffeebeat.model.InviteToken token = tokenOpt.get();

            if (!token.isValid()) {
                throw new BadCredentialsException("Invite token is expired or already used");
            }

            // Validate email matches token email (optional but good security)
            if (!token.getEmail().equalsIgnoreCase(registerRequest.getEmail())) {
                throw new BadCredentialsException("Invite token is for a different email address");
            }

            role = token.getRole();
            logger.info("Valid invite token found. Assigning role: {}", role);

            // Mark token as used
            token.markAsUsed();
            inviteTokenRepository.save(token);
        } else {
            logger.info("No invite token provided. Registering new user with default role: {}", role);
        }

        // Create new user
        User user = new User(
                registerRequest.getName(),
                registerRequest.getEmail(),
                passwordEncoder.encode(registerRequest.getPassword()),
                role);

        logger.info("Creating user with role: {}", role);

        // Save user to database with error handling
        try {
            logger.info("Attempting to save user to database: {}", user.getEmail());
            logger.info("User role before save: {}", user.getRole());

            user = userRepository.save(user);

            logger.info("User successfully saved with ID: {}", user.getId());
            logger.info("User role after save: {}", user.getRole());
        } catch (Exception e) {
            logger.error("Database error while saving user: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to save user to database: " + e.getMessage(), e);
        }

        logger.info("User registered successfully: {}", user.getEmail());

        // Generate JWT tokens (with proper role format if needed, though
        // User.getAuthorities handles the prefix for security context)
        // Store raw role in token as JwtUtil expects
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole());
        String refreshToken = jwtUtil.generateRefreshToken(user.getEmail(), user.getRole());

        return new AuthResponse(
                token,
                refreshToken,
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getRole());
    }

    /**
     * Authenticate user and generate JWT tokens
     */
    public AuthResponse login(AuthRequest authRequest) {
        logger.info("Authenticating user: {}", authRequest.getEmail());

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            authRequest.getEmail(),
                            authRequest.getPassword()));

            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            User user = userRepository.findByEmail(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            logger.info("User authenticated successfully: {}", user.getEmail());

            // Generate JWT tokens
            String token = jwtUtil.generateToken(user.getEmail(), user.getRole());
            String refreshToken = jwtUtil.generateRefreshToken(user.getEmail(), user.getRole());

            return new AuthResponse(
                    token,
                    refreshToken,
                    user.getId(),
                    user.getEmail(),
                    user.getName(),
                    user.getRole());

        } catch (BadCredentialsException e) {
            logger.error("Authentication failed for {}: Invalid credentials", authRequest.getEmail());
            throw new BadCredentialsException("Invalid email or password");
        } catch (Exception e) {
            logger.error("Authentication failed for {}: {}", authRequest.getEmail(), e.getMessage());
            throw new RuntimeException("Authentication failed: " + e.getMessage());
        }
    }

    /**
     * Refresh JWT token
     */
    public AuthResponse refreshToken(String refreshToken) {
        logger.debug("Refreshing token");

        try {
            // Validate refresh token
            String username = jwtUtil.extractUsername(refreshToken);

            if (!jwtUtil.isRefreshToken(refreshToken)) {
                throw new BadCredentialsException("Invalid token type");
            }

            UserDetails userDetails = userDetailsService.loadUserByUsername(username);

            if (!jwtUtil.validateToken(refreshToken, userDetails.getUsername())) {
                throw new BadCredentialsException("Invalid refresh token");
            }

            Optional<User> userOpt = userRepository.findByEmail(username);
            if (userOpt.isEmpty()) {
                throw new BadCredentialsException("User not found");
            }

            User user = userOpt.get();

            if (!user.isActive()) {
                throw new BadCredentialsException("Account is deactivated");
            }

            // Generate new tokens
            String newToken = jwtUtil.generateToken(user.getEmail(), user.getRole());
            String newRefreshToken = jwtUtil.generateRefreshToken(user.getEmail(), user.getRole());

            logger.debug("Token refreshed successfully for user: {}", user.getEmail());

            return new AuthResponse(
                    newToken,
                    newRefreshToken,
                    user.getId(),
                    user.getEmail(),
                    user.getName(),
                    user.getRole());

        } catch (Exception e) {
            logger.warn("Token refresh failed: {}", e.getMessage());
            throw new BadCredentialsException("Token refresh failed");
        }
    }

    /**
     * Get current user details
     */
    public User getCurrentUser(String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            throw new BadCredentialsException("User not found");
        }

        User user = userOpt.get();
        if (!user.isActive()) {
            throw new BadCredentialsException("Account is deactivated");
        }

        return user;
    }

    /**
     * Update user profile
     */
    public User updateUserProfile(String email, User profileData) {
        logger.info("Updating profile for user: {}", email);

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            throw new BadCredentialsException("User not found");
        }

        User user = userOpt.get();

        // Update allowed fields
        if (profileData.getName() != null) {
            user.setName(profileData.getName());
        }
        if (profileData.getPhone() != null) {
            user.setPhone(profileData.getPhone());
        }
        if (profileData.getAddress() != null) {
            user.setAddress(profileData.getAddress());
        }

        User updatedUser = userRepository.save(user);
        logger.info("Profile updated successfully for user: {}", email);

        return updatedUser;
    }

    /**
     * Change user password
     */
    public void changeUserPassword(String email, String currentPassword, String newPassword) {
        logger.info("Changing password for user: {}", email);

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            throw new BadCredentialsException("User not found");
        }

        User user = userOpt.get();

        // Verify current password
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new BadCredentialsException("Current password is incorrect");
        }

        // Update password
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        logger.info("Password changed successfully for user: {}", email);
    }

    /**
     * Delete user account
     */
    public void deleteUserAccount(String email) {
        logger.info("Deleting account for user: {}", email);

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            throw new BadCredentialsException("User not found");
        }

        User user = userOpt.get();

        // Soft delete by deactivating the account
        user.setActive(false);
        userRepository.save(user);

        logger.info("Account deleted (deactivated) for user: {}", email);
    }
}
