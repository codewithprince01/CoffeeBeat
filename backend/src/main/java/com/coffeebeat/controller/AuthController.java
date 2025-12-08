package com.coffeebeat.controller;

import com.coffeebeat.dto.AuthRequest;
import com.coffeebeat.dto.AuthResponse;
import com.coffeebeat.dto.RegisterRequest;
import com.coffeebeat.model.User;
import com.coffeebeat.service.AuthService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    private AuthService authService;

    @Value("${frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
            @Valid @RequestBody RegisterRequest registerRequest,
            HttpServletResponse response) {

        logger.info("Registration request for email: {}", registerRequest.getEmail());

        try {
            AuthResponse authResponse = authService.register(registerRequest);

            // Set HTTP-only cookies
            setAuthCookies(response, authResponse);

            // Return response with tokens (frontend can use either cookies or header)
            // Return response with tokens (frontend can use either cookies or header)
            return ResponseEntity.ok(authResponse);

        } catch (Exception e) {
            logger.error("Registration failed: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Registration failed: " + e.getMessage());
            return ResponseEntity.badRequest().body(null);
        }
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody AuthRequest authRequest,
            HttpServletResponse response) {

        logger.info("Login request for email: {}", authRequest.getEmail());

        try {
            AuthResponse authResponse = authService.login(authRequest);

            // Set HTTP-only cookies
            setAuthCookies(response, authResponse);

            // Return response with tokens (frontend can use either cookies or header)
            // Return response with tokens (frontend can use either cookies or header)
            return ResponseEntity.ok(authResponse);

        } catch (Exception e) {
            logger.error("Login failed: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Login failed: " + e.getMessage());
            return ResponseEntity.badRequest().body(null);
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            // Check if user is authenticated
            if (userDetails == null) {
                logger.warn("Get current user failed: No authentication");
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "Not authenticated");
                return ResponseEntity.status(401).body(error);
            }

            User user = authService.getCurrentUser(userDetails.getUsername());

            // Return user data in the expected format
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", Map.of(
                    "id", user.getId(),
                    "email", user.getEmail(),
                    "name", user.getName(),
                    "role", user.getRole(),
                    "phone", user.getPhone(),
                    "address", user.getAddress(),
                    "avatarUrl", user.getAvatarUrl(),
                    "createdAt", user.getCreatedAt()));

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Get current user failed: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Authentication failed: " + e.getMessage());
            return ResponseEntity.status(401).body(error);
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refreshToken(
            @RequestBody Map<String, String> request,
            HttpServletResponse response) {
        try {
            String refreshToken = request.get("refreshToken");
            if (refreshToken == null || refreshToken.isEmpty()) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "Refresh token is required");
                return ResponseEntity.badRequest().body(null);
            }

            AuthResponse authResponse = authService.refreshToken(refreshToken);

            // Set new HTTP-only cookies
            setAuthCookies(response, authResponse);

            // Return response with tokens (frontend can use either cookies or header)
            // Return response with tokens (frontend can use either cookies or header)
            return ResponseEntity.ok(authResponse);

        } catch (Exception e) {
            logger.error("Token refresh failed: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Token refresh failed: " + e.getMessage());
            return ResponseEntity.status(401).body(null);
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {
        // Clear cookies
        clearAuthCookies(response);

        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("success", true);
        responseBody.put("message", "Logged out successfully");

        return ResponseEntity.ok(responseBody);
    }

    private void setAuthCookies(HttpServletResponse response, AuthResponse authResponse) {
        // Access token cookie (HTTP-only, Secure, SameSite=Strict)
        jakarta.servlet.http.Cookie accessTokenCookie = new jakarta.servlet.http.Cookie("accessToken",
                authResponse.getAccessToken());
        accessTokenCookie.setHttpOnly(true);
        accessTokenCookie.setSecure(false); // Set to true in production with HTTPS
        accessTokenCookie.setPath("/");
        accessTokenCookie.setMaxAge(24 * 60 * 60); // 24 hours
        accessTokenCookie.setAttribute("SameSite", "Lax");
        response.addCookie(accessTokenCookie);

        // Refresh token cookie (HTTP-only, Secure, SameSite=Strict)
        jakarta.servlet.http.Cookie refreshTokenCookie = new jakarta.servlet.http.Cookie("refreshToken",
                authResponse.getRefreshToken());
        refreshTokenCookie.setHttpOnly(true);
        refreshTokenCookie.setSecure(false); // Set to true in production with HTTPS
        refreshTokenCookie.setPath("/");
        refreshTokenCookie.setMaxAge(7 * 24 * 60 * 60); // 7 days
        refreshTokenCookie.setAttribute("SameSite", "Lax");
        response.addCookie(refreshTokenCookie);
    }

    @PutMapping("/change-password")
    public ResponseEntity<Map<String, String>> changePassword(
            @RequestBody Map<String, String> passwordRequest,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        try {
            String currentPassword = passwordRequest.get("currentPassword");
            String newPassword = passwordRequest.get("newPassword");
            
            if (currentPassword == null || newPassword == null) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Current password and new password are required");
                return ResponseEntity.badRequest().body(error);
            }
            
            logger.info("Password change request for user: {}", userDetails.getUsername());
            
            authService.changeUserPassword(userDetails.getUsername(), currentPassword, newPassword);
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Password changed successfully");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Password change failed: {}", e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to change password: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    private void clearAuthCookies(HttpServletResponse response) {
        // Clear access token cookie
        jakarta.servlet.http.Cookie accessTokenCookie = new jakarta.servlet.http.Cookie("accessToken", "");
        accessTokenCookie.setHttpOnly(true);
        accessTokenCookie.setSecure(false);
        accessTokenCookie.setPath("/");
        accessTokenCookie.setMaxAge(0);
        accessTokenCookie.setAttribute("SameSite", "Lax");
        response.addCookie(accessTokenCookie);

        // Clear refresh token cookie
        jakarta.servlet.http.Cookie refreshTokenCookie = new jakarta.servlet.http.Cookie("refreshToken", "");
        refreshTokenCookie.setHttpOnly(true);
        refreshTokenCookie.setSecure(false);
        refreshTokenCookie.setPath("/");
        refreshTokenCookie.setMaxAge(0);
        refreshTokenCookie.setAttribute("SameSite", "Lax");
        response.addCookie(refreshTokenCookie);
    }
}
