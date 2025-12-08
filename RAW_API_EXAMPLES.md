# Coffee Beat API - Raw Request Examples

## Quick Testing with curl

Copy these commands to test APIs directly from terminal:

### Authentication

#### Register
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Customer",
    "email": "customer@test.com",
    "password": "Password123!",
    "confirmPassword": "Password123!"
  }'
```

#### Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@coffee.test",
    "password": "Password123!"
  }'
```

#### Refresh Token
```bash
curl -X POST http://localhost:8080/api/auth/refresh \
  -H "Authorization: Bearer YOUR_REFRESH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

#### Get Current User
```bash
curl -X GET http://localhost:8080/api/auth/me \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

#### Update Profile
```bash
curl -X PUT http://localhost:8080/api/auth/profile \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated User Name",
    "phone": "+1234567890"
  }'
```

#### Change Password
```bash
curl -X PUT http://localhost:8080/api/auth/change-password \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "Password123!",
    "newPassword": "NewPassword123!"
  }'
```

#### Logout
```bash
curl -X POST http://localhost:8080/api/auth/logout \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

### Products

#### Get All Products
```bash
curl -X GET "http://localhost:8080/api/products?page=0&size=10&sortBy=name&sortDir=asc"
```

#### Get Product by ID
```bash
curl -X GET http://localhost:8080/api/products/PRODUCT_ID_HERE
```

#### Get Product by Slug
```bash
curl -X GET http://localhost:8080/api/products/slug/test-coffee
```

#### Create Product (Admin)
```bash
curl -X POST http://localhost:8080/api/products \
  -H "Authorization: Bearer ADMIN_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Coffee",
    "slug": "test-coffee",
    "price": 4.99,
    "stock": 100,
    "description": "A delicious test coffee",
    "category": "COFFEE",
    "imageUrl": "https://example.com/coffee.jpg",
    "ingredients": ["Coffee Beans", "Water"],
    "allergens": []
  }'
```

#### Update Product (Admin)
```bash
curl -X PUT http://localhost:8080/api/products/PRODUCT_ID_HERE \
  -H "Authorization: Bearer ADMIN_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Test Coffee",
    "slug": "test-coffee",
    "price": 5.99,
    "stock": 150,
    "description": "An updated delicious test coffee",
    "category": "COFFEE"
  }'
```

#### Update Product Stock (Admin)
```bash
curl -X PATCH http://localhost:8080/api/products/PRODUCT_ID_HERE/stock \
  -H "Authorization: Bearer ADMIN_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "stock": 200
  }'
```

#### Get Product Categories
```bash
curl -X GET http://localhost:8080/api/products/categories
```

#### Get In Stock Products
```bash
curl -X GET http://localhost:8080/api/products/in-stock
```

#### Get Low Stock Products (Admin)
```bash
curl -X GET http://localhost:8080/api/products/low-stock \
  -H "Authorization: Bearer ADMIN_AUTH_TOKEN"
```

#### Get Product Stats (Admin)
```bash
curl -X GET http://localhost:8080/api/products/stats \
  -H "Authorization: Bearer ADMIN_AUTH_TOKEN"
```

#### Search Products
```bash
curl -X GET "http://localhost:8080/api/products/search?q=coffee&page=0&size=10"
```

#### Delete Product (Admin)
```bash
curl -X DELETE http://localhost:8080/api/products/PRODUCT_ID_HERE \
  -H "Authorization: Bearer ADMIN_AUTH_TOKEN"
```

### Orders

#### Create Order
```bash
curl -X POST http://localhost:8080/api/orders \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "productId": "PRODUCT_ID_HERE",
        "quantity": 2,
        "price": 4.99,
        "specialInstructions": "Extra sugar"
      }
    ],
    "totalAmount": 9.98,
    "orderType": "DINE_IN",
    "tableNumber": "T1",
    "specialInstructions": "Order for table T1"
  }'
```

#### Get Order by ID
```bash
curl -X GET http://localhost:8080/api/orders/ORDER_ID_HERE \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

#### Get My Orders
```bash
curl -X GET "http://localhost:8080/api/orders/my-orders?page=0&size=10" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

#### Update Order Status
```bash
curl -X PUT http://localhost:8080/api/orders/ORDER_ID_HERE/status \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "PREPARING",
    "chefId": "CHEF_ID_HERE",
    "waiterId": "WAITER_ID_HERE"
  }'
```

#### Cancel Order
```bash
curl -X PUT http://localhost:8080/api/orders/ORDER_ID_HERE/cancel \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

#### Get All Orders (Admin)
```bash
curl -X GET "http://localhost:8080/api/orders?page=0&size=20&status=PENDING" \
  -H "Authorization: Bearer ADMIN_AUTH_TOKEN"
```

#### Get Chef Orders
```bash
curl -X GET http://localhost:8080/api/orders/chef-orders \
  -H "Authorization: Bearer CHEF_AUTH_TOKEN"
```

#### Get Waiter Orders
```bash
curl -X GET http://localhost:8080/api/orders/waiter-orders \
  -H "Authorization: Bearer WAITER_AUTH_TOKEN"
```

#### Get Orders Needing Chef
```bash
curl -X GET http://localhost:8080/api/orders/needing-chef \
  -H "Authorization: Bearer CHEF_AUTH_TOKEN"
```

#### Get Orders Needing Waiter
```bash
curl -X GET http://localhost:8080/api/orders/needing-waiter \
  -H "Authorization: Bearer WAITER_AUTH_TOKEN"
```

#### Get Order Stats (Admin)
```bash
curl -X GET http://localhost:8080/api/orders/stats \
  -H "Authorization: Bearer ADMIN_AUTH_TOKEN"
```

#### Get Today's Orders (Admin)
```bash
curl -X GET http://localhost:8080/api/orders/today \
  -H "Authorization: Bearer ADMIN_AUTH_TOKEN"
```

#### Assign Order to Chef (Admin)
```bash
curl -X PUT http://localhost:8080/api/orders/ORDER_ID_HERE/assign-chef \
  -H "Authorization: Bearer ADMIN_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "chefId": "CHEF_ID_HERE"
  }'
```

#### Assign Order to Waiter (Admin)
```bash
curl -X PUT http://localhost:8080/api/orders/ORDER_ID_HERE/assign-waiter \
  -H "Authorization: Bearer ADMIN_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "waiterId": "WAITER_ID_HERE"
  }'
```

### Bookings

#### Create Booking
```bash
curl -X POST http://localhost:8080/api/bookings \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tableNumber": "T1",
    "timeSlot": "2024-12-25T18:00:00",
    "peopleCount": 4,
    "userId": "USER_ID_HERE"
  }'
```

#### Get Booking by ID
```bash
curl -X GET http://localhost:8080/api/bookings/BOOKING_ID_HERE \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

#### Get My Bookings
```bash
curl -X GET http://localhost:8080/api/bookings/my-bookings \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

#### Update Booking
```bash
curl -X PUT http://localhost:8080/api/bookings/BOOKING_ID_HERE \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tableNumber": "T2",
    "timeSlot": "2024-12-25T19:00:00",
    "peopleCount": 5
  }'
```

#### Cancel Booking
```bash
curl -X PUT http://localhost:8080/api/bookings/BOOKING_ID_HERE/cancel \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

#### Complete Booking
```bash
curl -X PUT http://localhost:8080/api/bookings/BOOKING_ID_HERE/complete \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

#### Check Table Availability
```bash
curl -X GET "http://localhost:8080/api/bookings/check-availability?tableNumber=T1&timeSlot=2024-12-25T18:00:00"
```

#### Get All Bookings (Admin)
```bash
curl -X GET "http://localhost:8080/api/bookings?status=CONFIRMED" \
  -H "Authorization: Bearer ADMIN_AUTH_TOKEN"
```

#### Get Today's Bookings (Admin)
```bash
curl -X GET http://localhost:8080/api/bookings/today \
  -H "Authorization: Bearer ADMIN_AUTH_TOKEN"
```

#### Get Upcoming Bookings
```bash
curl -X GET http://localhost:8080/api/bookings/upcoming \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

#### Get Booking Stats (Admin)
```bash
curl -X GET http://localhost:8080/api/bookings/stats \
  -H "Authorization: Bearer ADMIN_AUTH_TOKEN"
```

#### Get Available Time Slots
```bash
curl -X GET "http://localhost:8080/api/bookings/available-slots?tableNumber=T1&date=2024-12-25"
```

### Admin

#### Create Invite Token
```bash
curl -X POST "http://localhost:8080/api/admin/invite?email=staff@test.com&role=ROLE_CHEF" \
  -H "Authorization: Bearer ADMIN_AUTH_TOKEN"
```

#### Get All Users
```bash
curl -X GET "http://localhost:8080/api/admin/users?role=ROLE_CUSTOMER&active=true" \
  -H "Authorization: Bearer ADMIN_AUTH_TOKEN"
```

#### Get User by ID
```bash
curl -X GET http://localhost:8080/api/admin/users/USER_ID_HERE \
  -H "Authorization: Bearer ADMIN_AUTH_TOKEN"
```

#### Update User
```bash
curl -X PUT http://localhost:8080/api/admin/users/USER_ID_HERE \
  -H "Authorization: Bearer ADMIN_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated User",
    "phone": "+1234567890",
    "active": true
  }'
```

#### Deactivate User
```bash
curl -X PUT http://localhost:8080/api/admin/users/USER_ID_HERE/deactivate \
  -H "Authorization: Bearer ADMIN_AUTH_TOKEN"
```

#### Activate User
```bash
curl -X PUT http://localhost:8080/api/admin/users/USER_ID_HERE/activate \
  -H "Authorization: Bearer ADMIN_AUTH_TOKEN"
```

#### Get User Orders
```bash
curl -X GET http://localhost:8080/api/admin/users/USER_ID_HERE/orders \
  -H "Authorization: Bearer ADMIN_AUTH_TOKEN"
```

#### Get Invite Tokens
```bash
curl -X GET "http://localhost:8080/api/admin/invite-tokens?used=false&role=ROLE_CHEF" \
  -H "Authorization: Bearer ADMIN_AUTH_TOKEN"
```

#### Delete Expired Tokens
```bash
curl -X DELETE http://localhost:8080/api/admin/invite-tokens/expired \
  -H "Authorization: Bearer ADMIN_AUTH_TOKEN"
```

#### Get Today's Analytics
```bash
curl -X GET http://localhost:8080/api/admin/analytics/today \
  -H "Authorization: Bearer ADMIN_AUTH_TOKEN"
```

#### Get Last 7 Days Analytics
```bash
curl -X GET http://localhost:8080/api/admin/analytics/last7days \
  -H "Authorization: Bearer ADMIN_AUTH_TOKEN"
```

#### Get Top Items Analytics
```bash
curl -X GET "http://localhost:8080/api/admin/analytics/top-items?limit=10" \
  -H "Authorization: Bearer ADMIN_AUTH_TOKEN"
```

#### Get Monthly Analytics
```bash
curl -X GET "http://localhost:8080/api/admin/analytics/monthly?months=12" \
  -H "Authorization: Bearer ADMIN_AUTH_TOKEN"
```

#### Get System Stats
```bash
curl -X GET http://localhost:8080/api/admin/stats \
  -H "Authorization: Bearer ADMIN_AUTH_TOKEN"
```

#### Get Order Status Distribution
```bash
curl -X GET http://localhost:8080/api/admin/analytics/order-status \
  -H "Authorization: Bearer ADMIN_AUTH_TOKEN"
```

#### Get Revenue by Date Range
```bash
curl -X GET "http://localhost:8080/api/admin/analytics/revenue?startDate=2024-12-01T00:00:00&endDate=2024-12-31T23:59:59" \
  -H "Authorization: Bearer ADMIN_AUTH_TOKEN"
```

### Image Upload

#### Upload Product Image (Admin)
```bash
curl -X POST http://localhost:8080/api/images/upload/product \
  -H "Authorization: Bearer ADMIN_AUTH_TOKEN" \
  -F "file=@/path/to/your/image.jpg"
```

#### Upload User Avatar
```bash
curl -X POST http://localhost:8080/api/images/upload/avatar \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -F "file=@/path/to/your/avatar.jpg"
```

#### Delete Image (Admin)
```bash
curl -X DELETE http://localhost:8080/api/images/IMAGE_PUBLIC_ID_HERE \
  -H "Authorization: Bearer ADMIN_AUTH_TOKEN"
```

#### Get Optimized Image URLs
```bash
curl -X GET http://localhost:8080/api/images/url/IMAGE_PUBLIC_ID_HERE
```

## Testing Script

Create a test script to run all APIs:

```bash
#!/bin/bash

# Set base URL
BASE_URL="http://localhost:8080/api"

# Test Health Check
echo "Testing Health Check..."
curl -X GET $BASE_URL/health

echo -e "\n\n"

# Test Login
echo "Testing Login..."
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@coffee.test",
    "password": "Password123!"
  }')

echo $LOGIN_RESPONSE

# Extract token (requires jq)
AUTH_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')

echo -e "\n\n"

# Test Get Current User
echo "Testing Get Current User..."
curl -X GET $BASE_URL/auth/me \
  -H "Authorization: Bearer $AUTH_TOKEN"

echo -e "\n\n"

# Test Get Products
echo "Testing Get Products..."
curl -X GET "$BASE_URL/products?page=0&size=5"

echo -e "\n\n"

echo "Basic API tests completed!"
```

## Important Notes

1. **Replace placeholders**: 
   - `YOUR_AUTH_TOKEN` - Replace with actual JWT token from login response
   - `ADMIN_AUTH_TOKEN` - Replace with admin user token
   - `PRODUCT_ID_HERE` - Replace with actual product ID
   - `ORDER_ID_HERE` - Replace with actual order ID
   - `BOOKING_ID_HERE` - Replace with actual booking ID
   - `USER_ID_HERE` - Replace with actual user ID
   - `CHEF_ID_HERE` - Replace with actual chef user ID
   - `WAITER_ID_HERE` - Replace with actual waiter user ID

2. **Default Credentials**:
   - Admin: `admin@coffee.test` / `Password123!`
   - Customer: Register new account or use existing

3. **Server must be running**: Make sure backend is running on `localhost:8080`

4. **JSON Format**: All POST/PUT requests use JSON format

5. **Authentication Required**: Most endpoints require valid JWT token in Authorization header
