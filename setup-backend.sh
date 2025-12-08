#!/bin/bash

# Coffee Beat Backend Setup Script

echo "🚀 Setting up Coffee Beat Backend..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Maven is installed
if ! command -v mvn &> /dev/null; then
    echo "❌ Maven is not installed. Please install Maven first."
    exit 1
fi

# Start MongoDB if not running
if ! docker ps | grep -q coffee-beat-mongodb; then
    echo "📦 Starting MongoDB..."
    docker run -d --name coffee-beat-mongodb -p 27017:27017 \
        -e MONGO_INITDB_ROOT_USERNAME=admin \
        -e MONGO_INITDB_ROOT_PASSWORD=password123 \
        mongo:7.0
    echo "✅ MongoDB started successfully"
else
    echo "✅ MongoDB is already running"
fi

# Wait for MongoDB to be ready
echo "⏳ Waiting for MongoDB to be ready..."
sleep 10

# Build the backend
echo "🔨 Building backend..."
cd backend
./mvnw clean package -DskipTests

if [ $? -eq 0 ]; then
    echo "✅ Backend built successfully"
else
    echo "❌ Backend build failed"
    exit 1
fi

# Start the backend
echo "🚀 Starting backend..."
./mvnw spring-boot:run &

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 30

# Test the backend
echo "🧪 Testing backend..."

# Test health endpoint
if curl -s http://localhost:8080/actuator/health > /dev/null; then
    echo "✅ Health check passed"
else
    echo "❌ Health check failed"
fi

# Test admin login
echo "🔐 Testing admin login..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8080/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email": "admin@coffee.test", "password": "Password123!"}')

if echo "$LOGIN_RESPONSE" | grep -q "accessToken"; then
    echo "✅ Admin login successful"
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
    echo "🔑 JWT Token: ${TOKEN:0:50}..."
else
    echo "❌ Admin login failed"
fi

# Test products endpoint
echo "📦 Testing products endpoint..."
if curl -s http://localhost:8080/products | grep -q "espresso"; then
    echo "✅ Products endpoint working"
else
    echo "❌ Products endpoint failed"
fi

echo ""
echo "🎉 Backend setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Open Swagger UI: http://localhost:8080/swagger-ui.html"
echo "2. Use the JWT token for authenticated requests"
echo "3. Test other endpoints using the token"
echo ""
echo "🔧 To stop the backend: Press Ctrl+C"
echo "🔧 To stop MongoDB: docker stop coffee-beat-mongodb"
