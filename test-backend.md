# Backend Testing Guide

## Quick Start

### 1. Start MongoDB
```bash
docker run -d --name coffee-beat-mongodb -p 27017:27017 -e MONGO_INITDB_ROOT_USERNAME=admin -e MONGO_INITDB_ROOT_PASSWORD=password123 mongo:7.0
```

### 2. Start Backend
```bash
cd backend
./mvnw spring-boot:run
```

### 3. Test API Endpoints

#### Health Check
```bash
curl http://localhost:8080/actuator/health
```

#### Swagger UI
Open: http://localhost:8080/swagger-ui.html

#### Admin Login
```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@coffee.test", "password": "Password123!"}'
```

#### Get Products
```bash
curl http://localhost:8080/products
```

#### Create Product (Admin only)
```bash
curl -X POST http://localhost:8080/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"name": "Test Coffee", "slug": "test-coffee", "price": 4.50, "stock": 100, "description": "Test coffee", "category": "COFFEE"}'
```

#### Get System Stats (Admin only)
```bash
curl http://localhost:8080/admin/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. Using Docker Compose
```bash
docker-compose up -d
```

## Expected Results

1. **Admin User**: admin@coffee.test / Password123!
2. **Sample Products**: 18 products created automatically
3. **Invite Tokens**: 5 tokens for staff registration
4. **WebSocket**: Available at ws://localhost:8080/ws

## Common Issues

- **MongoDB Connection**: Ensure MongoDB is running on port 27017
- **JWT Token**: Copy the token from login response for authenticated requests
- **CORS**: Frontend requests allowed from localhost:3000 and localhost:5173
