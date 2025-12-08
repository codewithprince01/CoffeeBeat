# Frontend-Backend Communication Solutions

## 🎯 Quick Fix Summary

Your backend and frontend are **correctly configured**! The issue is likely one of these:

### 1. **CORS Preflight Requests**
- Your backend allows `http://localhost:5173` (Vite default port)
- Make sure your frontend is running on port 5173

### 2. **Request Headers**
- Backend allows: `Authorization`, `Content-Type`, `X-Requested-With`, `Accept`
- Frontend must use exactly these headers

### 3. **Credentials Handling**
- Backend has `allowCredentials: true`
- Frontend must use `withCredentials: true` (Axios) or `credentials: 'include'` (Fetch)

## 📝 Working Examples

### ✅ Axios Example (Recommended)

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

// Login
const login = async (email, password) => {
  const response = await api.post('/api/auth/login', {
    email,
    password
  });
  
  // Store tokens
  localStorage.setItem('token', response.data.accessToken);
  localStorage.setItem('refreshToken', response.data.refreshToken);
  
  return response.data;
};

// Register
const register = async (name, email, password) => {
  const response = await api.post('/api/auth/register', {
    name,
    email,
    password
  });
  
  localStorage.setItem('token', response.data.accessToken);
  localStorage.setItem('refreshToken', response.data.refreshToken);
  
  return response.data;
};
```

### ✅ Fetch API Example

```javascript
// Login
const login = async (email, password) => {
  const response = await fetch('http://localhost:8080/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ email, password })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Login failed');
  }
  
  const data = await response.json();
  
  localStorage.setItem('token', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
  
  return data;
};

// Register
const register = async (name, email, password) => {
  const response = await fetch('http://localhost:8080/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ name, email, password })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Registration failed');
  }
  
  const data = await response.json();
  
  localStorage.setItem('token', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
  
  return data;
};
```

## 🔧 Configuration Checklist

### Backend (Spring Boot)

✅ **application.properties**
```properties
server.port=8080
server.servlet.context-path=/api

cors.allowed-origins=http://localhost:5173,http://localhost:3000,http://localhost:5174
```

✅ **SecurityConfig.java**
```java
// Public endpoints
.requestMatchers("/auth/**").permitAll()

// CORS configuration
configuration.setAllowedOrigins(Arrays.asList(corsAllowedOrigins));
configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With", "Accept"));
configuration.setAllowCredentials(true);
```

### Frontend (React/Vite)

✅ **.env**
```env
VITE_API_URL=http://localhost:8080
```

✅ **Axios Configuration**
```javascript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});
```

## 🐛 Debugging Steps

### 1. Check Browser Console
```javascript
// Open browser DevTools (F12)
// Look for CORS errors like:
// "Access to fetch at 'http://localhost:8080/api/auth/login' from origin 'http://localhost:5173' has been blocked by CORS policy"
```

### 2. Check Network Tab
- Open DevTools → Network tab
- Look for the request to `/api/auth/login`
- Check:
  - Request URL (should be `http://localhost:8080/api/auth/login`)
  - Request Method (should be POST)
  - Request Headers (should include `Content-Type: application/json`)
  - Response Status (should be 200 for success, 401 for invalid credentials)

### 3. Check Backend Logs
```bash
# Look for incoming requests in your Spring Boot console
# Should see logs like:
# "Login request for email: admin@coffee.test"
```

### 4. Test with Provided Test Page
```bash
# Open in browser:
http://localhost:5173/comprehensive-test.html

# Or if using the public folder:
http://localhost:5173/test-login.html
```

## 🚨 Common Issues & Solutions

### Issue 1: CORS Error
**Error:** `Access to fetch has been blocked by CORS policy`

**Solution:**
1. Ensure frontend is running on `http://localhost:5173`
2. Check backend CORS configuration includes this origin
3. Restart backend after changing CORS settings

### Issue 2: 404 Not Found
**Error:** `404 Not Found` for `/api/auth/login`

**Solution:**
1. Verify backend is running on port 8080
2. Check context path is `/api` in application.properties
3. Ensure AuthController is mapped to `/auth`

### Issue 3: Network Error
**Error:** `Network Error` or `ERR_CONNECTION_REFUSED`

**Solution:**
1. Verify backend is running: `mvn spring-boot:run`
2. Check backend port: should be 8080
3. Test backend directly: `curl http://localhost:8080/api/auth/login`

### Issue 4: 401 Unauthorized (Valid Credentials)
**Error:** `401 Unauthorized` even with correct credentials

**Solution:**
1. Check password encoding matches (BCrypt)
2. Verify user exists in database
3. Check backend logs for authentication errors

### Issue 5: Request Payload Empty
**Error:** Backend receives empty request body

**Solution:**
1. Ensure `Content-Type: application/json` header is set
2. Use `JSON.stringify()` for Fetch API
3. Axios automatically handles JSON serialization

## 📦 Files Updated

1. ✅ `frontend/src/services/authService.js` - Fixed and enhanced
2. ✅ `frontend/public/comprehensive-test.html` - New test suite
3. ✅ Backend configuration verified

## 🧪 Test Credentials

```
Admin:    admin@coffee.test    / Password123!
Chef:     chef@coffee.test     / Password123!
Waiter:   waiter@coffee.test   / Password123!
Customer: customer@coffee.test / Password123!
```

## 📚 Additional Resources

### Making Authenticated Requests

After login, include the token in subsequent requests:

```javascript
// Axios (automatic with interceptor)
const response = await api.get('/api/orders');

// Fetch (manual)
const response = await fetch('http://localhost:8080/api/orders', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  }
});
```

### Token Refresh

The updated `authService.js` includes automatic token refresh on 401 errors.

### Error Handling

```javascript
try {
  const result = await authService.login({ email, password });
  console.log('Login successful:', result);
} catch (error) {
  console.error('Login failed:', error.message);
  // error.message contains user-friendly message
  // error.status contains HTTP status code
}
```
