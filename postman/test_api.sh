#!/bin/bash

# Coffee Beat API Testing Script
# This script tests all major API endpoints

BASE_URL="http://localhost:8080/api"
AUTH_TOKEN=""
REFRESH_TOKEN=""

echo "🚀 Coffee Beat API Testing Script"
echo "=================================="

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local auth_required=$4
    
    echo ""
    echo "📍 Testing: $method $endpoint"
    
    if [ "$auth_required" = "true" ] && [ -n "$AUTH_TOKEN" ]; then
        curl -X $method "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $AUTH_TOKEN" \
            -d "$data" \
            -w "\nStatus: %{http_code}\nTime: %{time_total}s\n" \
            -s
    elif [ "$auth_required" = "false" ]; then
        curl -X $method "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data" \
            -w "\nStatus: %{http_code}\nTime: %{time_total}s\n" \
            -s
    else
        curl -X $method "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data" \
            -w "\nStatus: %{http_code}\nTime: %{time_total}s\n" \
            -s
    fi
    
    echo "----------------------------------------"
}

# 1. Health Check
echo "🏥 Testing Health Endpoint"
test_endpoint "GET" "/health" "" "false"

# 2. Login to get token
echo "🔐 Testing Login"
LOGIN_RESPONSE=$(curl -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email": "admin@coffee.test", "password": "Password123!"}' \
    -s)

echo "Login Response: $LOGIN_RESPONSE"

# Extract token from response
AUTH_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
REFRESH_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"refreshToken":"[^"]*"' | cut -d'"' -f4)

echo "Auth Token: ${AUTH_TOKEN:0:50}..."
echo "Refresh Token: ${REFRESH_TOKEN:0:50}..."

if [ -z "$AUTH_TOKEN" ]; then
    echo "❌ Login failed! Cannot continue with authenticated tests."
    exit 1
fi

echo "✅ Login successful!"

# 3. Test Products endpoints
echo ""
echo "☕ Testing Products Endpoints"

# Get all products
test_endpoint "GET" "/products?page=0&size=5" "" "true"

# Create a product
PRODUCT_DATA='{
    "name": "Test Coffee",
    "slug": "test-coffee-'$(date +%s)'",
    "price": 4.99,
    "stock": 100,
    "description": "A delicious test coffee",
    "category": "COFFEE"
}'
test_endpoint "POST" "/products" "$PRODUCT_DATA" "true"

# 4. Test Orders endpoints
echo ""
echo "📋 Testing Orders Endpoints"

# Get user orders
test_endpoint "GET" "/orders/my?page=0&size=5" "" "true"

# Create an order
ORDER_DATA='{
    "items": [
        {
            "productId": "test-product-id",
            "quantity": 2,
            "price": 4.99,
            "specialInstructions": "Extra sugar"
        }
    ],
    "totalAmount": 9.98,
    "orderType": "DINE_IN"
}'
test_endpoint "POST" "/orders" "$ORDER_DATA" "true"

# 5. Test User endpoints
echo ""
echo "👤 Testing User Endpoints"

# Get user profile
test_endpoint "GET" "/users/profile" "" "true"

# 6. Test Admin endpoints
echo ""
echo "👑 Testing Admin Endpoints"

# Get all users
test_endpoint "GET" "/admin/users?page=0&size=5" "" "true"

# Get dashboard stats
test_endpoint "GET" "/admin/dashboard/stats" "" "true"

# 7. Test Registration
echo ""
echo "📝 Testing Registration"

REGISTER_DATA='{
    "name": "Test User",
    "email": "testuser'$(date +%s)'@example.com",
    "password": "Password123!",
    "confirmPassword": "Password123!"
}'
test_endpoint "POST" "/auth/register" "$REGISTER_DATA" "false"

# 8. Test Token Refresh
echo ""
echo "🔄 Testing Token Refresh"
REFRESH_DATA='{"refreshToken": "'$REFRESH_TOKEN'"}'
test_endpoint "POST" "/auth/refresh" "$REFRESH_DATA" "false"

echo ""
echo "🎉 API Testing Complete!"
echo "======================"
echo "Check the responses above for any errors."
echo "Status codes 200/201 are successful."
echo "Status codes 4xx are client errors."
echo "Status codes 5xx are server errors."
