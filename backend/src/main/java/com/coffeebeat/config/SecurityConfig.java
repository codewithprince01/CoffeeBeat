package com.coffeebeat.config;

import com.coffeebeat.security.JwtAuthenticationEntryPoint;
import com.coffeebeat.security.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * Spring Security configuration class
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

        @Autowired
        private JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;

        @Autowired
        private JwtAuthenticationFilter jwtAuthenticationFilter;

        @Value("#{'${cors.allowed-origins}'.split(',')}")
        private List<String> corsAllowedOrigins;

        @Bean
        public PasswordEncoder passwordEncoder() {
                return new BCryptPasswordEncoder();
        }

        @Bean
        public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
                return config.getAuthenticationManager();
        }

        @Bean
        public CorsConfigurationSource corsConfigurationSource() {
                CorsConfiguration configuration = new CorsConfiguration();
                configuration.setAllowedOrigins(corsAllowedOrigins);
                configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
                configuration.setAllowedHeaders(
                                Arrays.asList("Authorization", "Content-Type", "X-Requested-With", "Accept"));
                configuration.setExposedHeaders(Arrays.asList("Authorization", "Content-Type"));
                configuration.setAllowCredentials(true);
                configuration.setMaxAge(3600L);

                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
                source.registerCorsConfiguration("/**", configuration);
                return source;
        }

        @Bean
        public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
                http
                                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                                .csrf(csrf -> csrf.disable())
                                .exceptionHandling(exception -> exception
                                                .authenticationEntryPoint(jwtAuthenticationEntryPoint))
                                .sessionManagement(session -> session
                                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                                .authorizeHttpRequests(authz -> authz
                                                // Public endpoints - allow without authentication
                                                .requestMatchers(
                                                               "/api/auth/login",
                                                               "/api/auth/register",
                                                               "/api/auth/refresh",
                                                               "/api/products/**",
                                                               "/api/uploads/**",
                                                               "/api/upload/**",
                                                               "/uploads/**",
                                                               "/ws/**",
                                                               "/error",
                                                               "/v3/api-docs/**",
                                                               "/swagger-ui/**",
                                                               "/swagger-ui.html",
                                                               "/actuator/health",
                                                               "/actuator/info",
                                                               "/api/test/**")
                                               .permitAll()

                                                // Admin endpoints
                                                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                                                .requestMatchers("/api/users/**").hasRole("ADMIN")

                                                // Role specific endpoints
                                                .requestMatchers("/api/chef/**").hasRole("CHEF")
                                                .requestMatchers("/api/waiter/**").hasRole("WAITER")
                                                .requestMatchers("/api/customer/**").hasRole("CUSTOMER")

                                                // All other endpoints require authentication
                                                .anyRequest().authenticated()
                                )
                                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

                return http.build();
        }
}
