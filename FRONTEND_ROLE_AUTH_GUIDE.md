# 🛡️ Role-Based Authorization Guide

## Overview
We have implemented a complete role-based access control (RBAC) system. This ensures users are redirected to their specific dashboards and cannot access unauthorized pages.

## 🔄 Authentication Flow

### 1. Login Redirects
When a user logs in, the `LoginPage` checks their role and redirects them:
- **Admin** (`ROLE_ADMIN`) → `/dashboard/admin`
- **Chef** (`ROLE_CHEF`) → `/dashboard/chef`
- **Waiter** (`ROLE_WAITER`) → `/dashboard/waiter`
- **Customer** (`ROLE_CUSTOMER`) → `/dashboard/customer`

### 2. Dashboard Routing (`App.jsx`)
The `/dashboard` route now acts as a smart router. If a user accesses `/dashboard` directly:
- It checks their role.
- Automatically redirects to the correct sub-dashboard.
- If not logged in, redirects to `/login`.

### 3. Protected Routes (`ProtectedRoute.jsx`)
We use a wrapper component to protect routes:
```jsx
<ProtectedRoute requiredRole="ROLE_ADMIN">
  <AdminDashboard />
</ProtectedRoute>
```
- Checks if user is authenticated.
- Checks if user has the `requiredRole`.
- Shows "Access Denied" if unauthorized.

## 📝 Registration & Roles
- **Customers:** Default role is `ROLE_CUSTOMER`.
- **Staff (Chef/Waiter):** Requires an **Invite Token**.
  - Admin generates token.
  - User enters token during registration.
  - Backend assigns `ROLE_CHEF` or `ROLE_WAITER` based on token.

## 🔧 Backend Configuration
- **User Model:** Stores role as `ROLE_USER`, `ROLE_ADMIN`, etc.
- **Auth Response:** Returns `accessToken`, `refreshToken`, and `role`.
- **Security Config:**
  - Password encoding: BCrypt
  - JWT Claims: Includes role for stateless verification.

## 🐛 Troubleshooting "Invalid Credentials"
If Chef/Waiter logins fail:
1. **Check Database:** Ensure roles are stored as `ROLE_CHEF` (case-sensitive).
2. **Check Password:** Passwords must be BCrypt encoded. Manually inserted plain text passwords **will not work**.
3. **Create New Account:** Use the registration page with an invite token to ensure correct encoding and role assignment.

## 🧪 How to Test
1. **Login as Admin:** Should go to Admin Dashboard.
2. **Login as Customer:** Should go to Customer Dashboard.
3. **Try Accessing Admin URL as Customer:** Should see "Access Denied".
4. **Register New User:** Should land on Customer Dashboard.
