@echo off
REM Coffee Beat Backend Setup Script for Windows

echo 🚀 Setting up Coffee Beat Backend...

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed. Please install Docker first.
    pause
    exit /b 1
)

REM Check if Maven is installed
mvn --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Maven is not installed. Please install Maven first.
    pause
    exit /b 1
)

REM Start MongoDB if not running
docker ps | findstr coffee-beat-mongodb >nul 2>&1
if %errorlevel% neq 0 (
    echo 📦 Starting MongoDB...
    docker run -d --name coffee-beat-mongodb -p 27017:27017 -e MONGO_INITDB_ROOT_USERNAME=admin -e MONGO_INITDB_ROOT_PASSWORD=password123 mongo:7.0
    if %errorlevel% equ 0 (
        echo ✅ MongoDB started successfully
    ) else (
        echo ❌ Failed to start MongoDB
        pause
        exit /b 1
    )
) else (
    echo ✅ MongoDB is already running
)

REM Wait for MongoDB to be ready
echo ⏳ Waiting for MongoDB to be ready...
timeout /t 10 /nobreak >nul

REM Build the backend
echo 🔨 Building backend...
cd backend
call mvnw.cmd clean package -DskipTests
if %errorlevel% equ 0 (
    echo ✅ Backend built successfully
) else (
    echo ❌ Backend build failed
    pause
    exit /b 1
)

REM Start the backend
echo 🚀 Starting backend...
start "Coffee Beat Backend" cmd /c "mvnw.cmd spring-boot:run"

REM Wait for backend to start
echo ⏳ Waiting for backend to start...
timeout /t 30 /nobreak >nul

REM Test the backend
echo 🧪 Testing backend...

REM Test health endpoint
curl -s http://localhost:8080/actuator/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Health check passed
) else (
    echo ❌ Health check failed
)

echo.
echo 🎉 Backend setup complete!
echo.
echo 📋 Next steps:
echo 1. Open Swagger UI: http://localhost:8080/swagger-ui.html
echo 2. Test admin login with: admin@coffee.test / Password123!
echo 3. Use the JWT token for authenticated requests
echo.
echo 🔧 To stop the backend: Close the backend window
echo 🔧 To stop MongoDB: docker stop coffee-beat-mongodb
echo.
pause
