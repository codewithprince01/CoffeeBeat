package com.coffeebeat.security;

import com.coffeebeat.util.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * JWT Authentication Filter
 * 
 * This filter processes incoming requests and validates JWT tokens.
 * It extracts the token from the Authorization header, validates it,
 * and sets the authentication in the security context.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String jwtToken = null;
        String username = null;

        // First try to get token from Authorization header
        final String requestTokenHeader = request.getHeader("Authorization");
        if (requestTokenHeader != null && requestTokenHeader.startsWith("Bearer ")) {
            jwtToken = requestTokenHeader.substring(7);
            logger.debug("JWT token found in Authorization header");
        } else {
            // If not in header, try to get from cookie
            jakarta.servlet.http.Cookie[] cookies = request.getCookies();
            if (cookies != null) {
                for (jakarta.servlet.http.Cookie cookie : cookies) {
                    if ("accessToken".equals(cookie.getName())) {
                        jwtToken = cookie.getValue();
                        logger.debug("JWT token found in cookie");
                        break;
                    }
                }
            }
        }

        if (jwtToken != null) {
            try {
                username = jwtUtil.extractUsername(jwtToken);
                logger.debug("Extracted username from JWT: {}", username);
            } catch (Exception e) {
                logger.error("Unable to get JWT Token or extract username: {}", e.getMessage());
            }
        } else {
            logger.debug("JWT Token not found in header or cookie");
        }

        // Validate token
        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails userDetails = this.userDetailsService.loadUserByUsername(username);

            // If token is valid, configure Spring Security to manually set authentication
            if (jwtUtil.validateToken(jwtToken, userDetails.getUsername())) {
                UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());
                authenticationToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                // After setting the Authentication in the context, we specify
                // that the current user is authenticated. So it passes the
                // Spring Security Configurations successfully.
                SecurityContextHolder.getContext().setAuthentication(authenticationToken);

                logger.debug("User {} authenticated successfully", username);
            } else {
                logger.debug("JWT Token validation failed for user: {}", username);
            }
        }

        filterChain.doFilter(request, response);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
        String path = request.getRequestURI();
        // Skip filtering for public endpoints (with /api prefix since context path is
        // not used)
        return path.startsWith("/api/auth/login") ||
                path.startsWith("/api/auth/register") ||
                path.startsWith("/api/auth/refresh") ||
                path.startsWith("/auth/login") ||
                path.startsWith("/auth/register") ||
                path.startsWith("/auth/refresh") ||
                path.startsWith("/api/test/") ||
                path.startsWith("/test/") ||
                path.startsWith("/swagger-ui/") ||
                path.startsWith("/v3/api-docs/") ||
                path.startsWith("/ws/") ||
                path.equals("/error") ||
                path.equals("/api/products") ||
                path.equals("/api/products/categories") ||
                (path.startsWith("/api/products") && !path.contains("/in-stock") && !path.contains("/admin")) ||
                (path.startsWith("/products") && !path.contains("/in-stock") && !path.contains("/admin"));
    }
}
