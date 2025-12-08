# ☕ Coffee Beat - Coffee Shop Management System

> A comprehensive, full-stack coffee shop management solution built with modern web technologies.

![Coffee Beat Banner](frontend/public/vite.svg)

## 📋 Overview

**Coffee Beat** is a production-ready web application designed to streamline coffee shop operations. It features role-based access control for Admins, Chefs, Waiters, and Customers, along with real-time order tracking and table booking capabilities.

### 🌟 Key Features

- **Role-Based Dashboards**: Custom interfaces for Admins, Chefs, Waiters, and Customers.
- **Real-Time Operations**: Instant order notifications and status updates via WebSockets.
- **Secure Authentication**: Robust JWT-based auth with refresh token rotation.
- **Menu Management**: Easy product management with image uploads.
- **Order & Booking System**: Complete workflow from customer order to kitchen fulfillment.
- **Analytics**: Admin insights into sales, orders, and performance.

---

## 🛠️ Tech Stack

### Backend
- **Java 17** & **Spring Boot 3**
- **MongoDB**
- **Spring Security (JWT Auth)**
- **WebSocket (STOMP Messaging)**
- **Docker**

### Frontend
- **React 18** & **Vite**
- **Tailwind CSS**
- **Redux Toolkit**
- **SockJS & STOMP** (Real-time)

---

## 🚀 Getting Started

### Prerequisites
- Java 17+
- Node.js 18+
- MongoDB
- Docker (Optional)

---

### ▶️ Option 1: Running Locally

#### 1. Start MongoDB
Ensure MongoDB is running on `27017`.

#### 2. Start Backend
```bash
cd backend
./mvnw spring-boot:run
