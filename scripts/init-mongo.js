// MongoDB initialization script
// This script creates the coffee-beat database and initial user

// Switch to coffee-beat database
db = db.getSiblingDB('coffee-beat');

// Create application user with read/write permissions
db.createUser({
  user: 'coffeeapp',
  pwd: 'coffeeapp123',
  roles: [
    {
      role: 'readWrite',
      db: 'coffee-beat'
    }
  ]
});

// Create collections with validation rules
db.createCollection('users');
db.createCollection('products');
db.createCollection('bookings');
db.createCollection('orders');
db.createCollection('inviteTokens');

// Create indexes for better performance
// Users collection indexes
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "role": 1 });
db.users.createIndex({ "isActive": 1 });

// Products collection indexes
db.products.createIndex({ "slug": 1 }, { unique: true });
db.products.createIndex({ "category": 1 });
db.products.createIndex({ "isActive": 1 });
db.products.createIndex({ "price": 1 });
db.products.createIndex({ "stock": 1 });

// Bookings collection indexes
db.bookings.createIndex({ "userId": 1 });
db.bookings.createIndex({ "tableNumber": 1 });
db.bookings.createIndex({ "timeSlot": 1 });
db.bookings.createIndex({ "status": 1 });
db.bookings.createIndex({ "createdAt": 1 });

// Orders collection indexes
db.orders.createIndex({ "userId": 1 });
db.orders.createIndex({ "status": 1 });
db.orders.createIndex({ "paymentStatus": 1 });
db.orders.createIndex({ "assignedChefId": 1 });
db.orders.createIndex({ "assignedWaiterId": 1 });
db.orders.createIndex({ "createdAt": 1 });
db.orders.createIndex({ "tableBookingId": 1 });

// InviteTokens collection indexes
db.inviteTokens.createIndex({ "token": 1 }, { unique: true });
db.inviteTokens.createIndex({ "email": 1 });
db.inviteTokens.createIndex({ "role": 1 });
db.inviteTokens.createIndex({ "expiresAt": 1 });
db.inviteTokens.createIndex({ "used": 1 });

// Text search indexes for products
db.products.createIndex({ 
  "name": "text", 
  "description": "text" 
}, { 
  name: "product_text_search" 
});

print('MongoDB initialization completed successfully!');
