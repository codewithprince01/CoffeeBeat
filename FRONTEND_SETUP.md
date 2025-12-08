# Frontend Setup Guide

## 🚀 Complete Frontend Structure Created

The complete React frontend has been created with the following structure:

```
frontend/
├── src/
│   ├── components/
│   │   ├── Layout.jsx
│   │   ├── ProtectedRoute.jsx
│   │   ├── Sidebar.jsx
│   │   ├── Header.jsx
│   │   └── ui/
│   │       └── LoadingSpinner.jsx
│   ├── contexts/
│   │   └── AuthContext.jsx
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── LoginPage.jsx
│   │   │   └── RegisterPage.jsx
│   │   ├── admin/
│   │   │   └── AdminDashboard.jsx
│   │   ├── chef/
│   │   │   └── ChefDashboard.jsx
│   │   ├── waiter/
│   │   │   └── WaiterDashboard.jsx
│   │   ├── customer/
│   │   │   └── CustomerDashboard.jsx
│   │   ├── HomePage.jsx
│   │   ├── MenuPage.jsx
│   │   └── AboutPage.jsx
│   ├── services/
│   │   ├── authService.js
│   │   ├── productService.js
│   │   ├── orderService.js
│   │   ├── bookingService.js
│   │   ├── adminService.js
│   │   └── websocketService.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
└── [package.json - to be added manually]
```

## 📋 Features Implemented

### ✅ Authentication System
- JWT-based authentication with refresh tokens
- Role-based access control (Admin, Chef, Waiter, Customer)
- Protected routes with role validation
- Login, Register, Logout functionality
- Invite token system for staff registration

### ✅ Dashboard Pages
- **Admin Dashboard**: System overview, analytics, user management, product management
- **Chef Dashboard**: Order management, status updates, kitchen operations
- **Waiter Dashboard**: Order delivery, table management, booking management
- **Customer Dashboard**: Order history, booking management, featured items

### ✅ Public Pages
- **HomePage**: Landing page with features overview
- **MenuPage**: Product browsing, cart functionality, search/filter
- **AboutPage**: Company information, team, values

### ✅ UI Components
- Responsive layout with sidebar navigation
- Loading states and error handling
- Toast notifications
- Forms with validation
- Data tables and cards
- Charts and analytics (using Recharts)

### ✅ API Integration
- Complete service layer for all backend APIs
- WebSocket integration for real-time updates
- Axios interceptors for automatic token handling
- Error handling and retry logic

### ✅ Real-time Features
- WebSocket connection management
- Order status notifications
- Booking notifications
- Admin analytics updates
- Role-based notification routing

## 🔧 JSON Configuration Files (Copy these manually)

### package.json
```json
{"name": "coffee-beat-frontend", "private": true, "version": "1.0.0", "type": "module", "scripts": {"dev": "vite", "build": "vite build", "lint": "eslint . --ext js,jsx --report-unused-disable-directives --max-warnings 0", "preview": "vite preview"}, "dependencies": {"react": "^18.2.0", "react-dom": "^18.2.0", "react-router-dom": "^6.8.0", "axios": "^1.6.0", "react-hot-toast": "^2.4.1", "recharts": "^2.8.0", "sockjs-client": "^1.6.1", "@stomp/stompjs": "^7.0.0", "lucide-react": "^0.294.0", "clsx": "^2.0.0", "tailwind-merge": "^2.0.0"}, "devDependencies": {"@types/react": "^18.2.43", "@types/react-dom": "^18.2.17", "@types/sockjs-client": "^1.5.4", "@vitejs/plugin-react": "^4.2.1", "autoprefixer": "^10.4.16", "eslint": "^8.55.0", "eslint-plugin-react": "^7.33.2", "eslint-plugin-react-hooks": "^4.6.0", "eslint-plugin-react-refresh": "^0.4.5", "postcss": "^8.4.32", "tailwindcss": "^3.4.0", "vite": "^5.0.8"}}
```

### vite.config.js
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
```

### tailwind.config.js
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

### postcss.config.js
```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### .env.example
```
VITE_API_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080/ws
```

## 🚀 Getting Started

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Create Environment File
```bash
cp .env.example .env
```

### 3. Start Development Server
```bash
npm run dev
```

### 4. Access the Application
- Frontend: http://localhost:5173
- Backend: http://localhost:8080 (must be running)

## 🔐 Demo Accounts

### Admin
- Email: admin@coffee.test
- Password: Password123!

### Chef
- Email: chef@coffee.test
- Password: Password123!

### Waiter
- Email: waiter@coffee.test
- Password: Password123!

### Customer
- Email: customer@coffee.test
- Password: Password123!

## 📱 Features by Role

### Admin
- System analytics and statistics
- User management and invite tokens
- Product and inventory management
- Order and booking oversight
- Revenue tracking and reporting

### Chef
- Order management and status updates
- Kitchen operations dashboard
- Real-time order notifications
- Menu item preparation tracking

### Waiter
- Order delivery management
- Table booking management
- Customer service operations
- Real-time notifications

### Customer
- Online ordering with cart
- Table booking system
- Order history tracking
- Personal dashboard

## 🔄 Real-time Features

The application includes WebSocket integration for:
- Order status updates
- New order notifications
- Booking confirmations
- Admin analytics updates
- Role-based notification routing

## 🎨 UI/UX Features

- Responsive design for all screen sizes
- Modern Tailwind CSS styling
- Loading states and error handling
- Toast notifications for user feedback
- Intuitive navigation and layout
- Accessible form components
- Interactive data visualizations

## 📊 Analytics Dashboard

- Revenue tracking with charts
- Order status distribution
- Top selling products
- User activity metrics
- Real-time data updates

## 🔧 Development Notes

- Uses React 18 with hooks
- Vite for fast development
- Tailwind CSS for styling
- Recharts for data visualization
- React Hot Toast for notifications
- SockJS + STOMP for WebSockets

## 🚀 Production Deployment

```bash
npm run build
npm run preview
```

The build output will be in the `dist` folder, ready for deployment to any static hosting service.
