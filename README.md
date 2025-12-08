# ☕ Coffee Beat - Coffee Shop Management System

> A comprehensive, full-stack coffee shop management solution built with modern web technologies.

![Coffee Beat Banner](frontend/public/vite.svg)

## 📋 Overview

**Coffee Beat** is a production-ready web application designed to streamline coffee shop operations. It features role-based access control for Admins, Chefs, Waiters, and Customers, along with real-time order tracking and generic table booking capabilities.

### 🌟 Key Features

*   **Role-Based Dashboards**: Custom interfaces for Admins, Chefs, Waiters, and Customers.
*   **Real-Time Ops**: Instant order notifications and status updates via WebSockets.
*   **Secure Authentication**: robust JWT-based auth with refresh token rotation.
*   **Menu Management**: Easy-to-use product management with image uploads.
*   **Order & Booking System**: Full workflow from customer placement to kitchen fulfillment and table reservation.
*   **Analytics**: Admin insights into sales and performance.

## 🛠️ Tech Stack

### Backend
*   **Java 17** & **Spring Boot 3**
*   **MongoDB** (Data Storage)
*   **Spring Security** (JWT Auth)
*   **WebSocket** (STOMP Messaging)
*   **Docker** (Containerization)

### Frontend
*   **React 18** & **Vite**
*   **Tailwind CSS** (Styling)
*   **Redux Toolkit** (State Management)
*   **SockJS & STOMP** (Real-time Client)

---

## 🚀 Getting Started

### Prerequisites
*   **Java 17+**
*   **Node.js 18+**
*   **MongoDB** (Running locally or via Docker)
*   **Docker** (Optional, for containerized run)

### Option 1: Running Locally (Development)

1.  **Start MongoDB**
    Ensure your local MongoDB is running on port `27017`.

2.  **Start the Backend**
    ```bash
    cd backend
    ./mvnw spring-boot:run
    ```
    The server will start on `http://localhost:8081`.

3.  **Start the Frontend**
    ```bash
    cd frontend
    npm install
    npm run dev
    ```
    The app will be available at `http://localhost:5173`.

### Option 2: Running with Docker (Recommended)

1.  **Build and Run**
    ```bash
    docker-compose up --build -d
    ```

2.  **Access the App**
    *   Frontend: `http://localhost:80`
    *   Backend API: `http://localhost:8081`

---

## 🔐 Default Credentials

Use these accounts to explore the different roles:

| Role     | Email                | Password      |
| :------- | :------------------- | :------------ |
| **Admin**    | `admin@coffee.test`    | `Password123!` |
| **Chef**     | `chef@coffee.test`     | `Password123!` |
| **Waiter**   | `waiter@coffee.test`   | `Password123!` |
| **Customer** | `customer@coffee.test` | `Password123!` |

---

## 📁 Project Structure

```
Coffee-Beat/
├── backend/            # Spring Boot Application
│   ├── src/            # Source code
│   ├── Dockerfile      # Backend container config
│   └── pom.xml         # Maven dependencies
├── frontend/           # React Application
│   ├── src/            # Source code
│   ├── Dockerfile      # Frontend container config
│   └── nginx.conf      # Nginx proxy config
├── scripts/            # Setup and utility scripts
├── docker-compose.yml  # Container orchestration
└── README.md           # This file
```

## 📚 Documentation

*   [Frontend Setup Guide](FRONTEND_SETUP.md)
*   [Backend Testing Guide](test-backend.md)
*   [API Documentation](http://localhost:8081/swagger-ui.html) (Run local server to view)

---

## 🤝 Contributing

 Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.
