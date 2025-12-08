# Corrected Booking API Examples

## Problem Fixed
The original booking API examples had incorrect field names. The Booking model expects:
- `timeSlot` (not `bookingDate`)
- `peopleCount` (not `numberOfGuests`) 
- `userId` (not `customerName`, `customerPhone`)

## Corrected Postman Request

### Create Booking - Corrected Version

**Method:** POST  
**URL:** `{{baseUrl}}/bookings`  
**Headers:**
- Authorization: Bearer {{authToken}}
- Content-Type: application/json

**Raw Body (JSON):**
```json
{
    "tableNumber": "T1",
    "timeSlot": "2024-12-25T18:00:00",
    "peopleCount": 4,
    "userId": "USER_ID_HERE"
}
```

**Important Notes:**
1. **userId**: You need to provide the actual user ID. You can get this from the login response or from `/auth/me` endpoint
2. **timeSlot**: Must be in the future and in ISO format (YYYY-MM-DDTHH:MM:SS)
3. **peopleCount**: Must be at least 1

## How to Get User ID

First, login and get user info:

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@coffee.test",
    "password": "Password123!"
  }'
```

Then get current user info to extract user ID:

```bash
curl -X GET http://localhost:8080/api/auth/me \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

The response will contain the user ID that you should use in the booking request.

## Complete Working Example

```bash
# Step 1: Login
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@coffee.test", 
    "password": "Password123!"
  }')

# Step 2: Extract token and user ID
AUTH_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')
USER_ID=$(echo $LOGIN_RESPONSE | jq -r '.user.id')

# Step 3: Create booking with correct data
curl -X POST http://localhost:8080/api/bookings \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"tableNumber\": \"T1\",
    \"timeSlot\": \"2024-12-25T18:00:00\",
    \"peopleCount\": 4,
    \"userId\": \"$USER_ID\"
  }"
```

## Update Booking - Corrected Version

**Method:** PUT  
**URL:** `{{baseUrl}}/bookings/{{bookingId}}`  
**Headers:**
- Authorization: Bearer {{authToken}}
- Content-Type: application/json

**Raw Body (JSON):**
```json
{
    "tableNumber": "T2",
    "timeSlot": "2024-12-25T19:00:00",
    "peopleCount": 5
}
```

## Validation Rules

Based on the Booking model, these validations apply:

1. **userId**: Required, must be a valid user ID
2. **tableNumber**: Required, cannot be blank
3. **peopleCount**: Required, minimum 1 person
4. **timeSlot**: Required, must be in the future
5. **status**: Optional, defaults to "BOOKED"

## Common Errors and Solutions

| Error | Cause | Solution |
|-------|--------|----------|
| "User ID is required" | Missing or null userId field | Add valid userId from authenticated user |
| "People count is required" | Missing or null peopleCount field | Add peopleCount with value ≥ 1 |
| "Time slot is required" | Missing or null timeSlot field | Add future datetime in ISO format |
| "Time slot must be in the future" | timeSlot is in the past | Use a future date/time |

## Testing Checklist

- [ ] Login and get auth token
- [ ] Get user ID from `/auth/me` endpoint  
- [ ] Use future date for timeSlot
- [ ] Provide valid tableNumber
- [ ] Set peopleCount ≥ 1
- [ ] Include userId in request body
- [ ] Send request with Authorization header

## Sample Successful Response

```json
{
    "id": "booking_id_here",
    "userId": "user_id_here", 
    "tableNumber": "T1",
    "peopleCount": 4,
    "timeSlot": "2024-12-25T18:00:00",
    "status": "BOOKED",
    "createdAt": "2024-12-04T22:15:00.000Z",
    "updatedAt": "2024-12-04T22:15:00.000Z"
}
```
