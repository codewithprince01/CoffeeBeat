package com.coffeebeat.dto;

/**
 * Authentication response DTO for login success
 * Contains tokens and nested user object for frontend compatibility
 */
public class AuthResponse {

    private String accessToken;
    private String refreshToken;
    private String type = "Bearer";
    private UserDTO user;

    /**
     * Inner class representing user data in response
     */
    public static class UserDTO {
        private String id;
        private String email;
        private String name;
        private String role;

        public UserDTO() {
        }

        public UserDTO(String id, String email, String name, String role) {
            this.id = id;
            this.email = email;
            this.name = name;
            this.role = role;
        }

        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getRole() {
            return role;
        }

        public void setRole(String role) {
            this.role = role;
        }
    }

    public AuthResponse() {
    }

    public AuthResponse(String accessToken, String refreshToken, String id, String email, String name, String role) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.user = new UserDTO(id, email, name, role);
    }

    public String getAccessToken() {
        return accessToken;
    }

    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }

    public String getRefreshToken() {
        return refreshToken;
    }

    public void setRefreshToken(String refreshToken) {
        this.refreshToken = refreshToken;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public UserDTO getUser() {
        return user;
    }

    public void setUser(UserDTO user) {
        this.user = user;
    }
}
