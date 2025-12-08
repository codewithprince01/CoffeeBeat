@echo off
echo 🚀 Coffee Beat API Testing Script
echo ==================================

set BASE_URL=http://localhost:8080/api
set AUTH_TOKEN=

echo.
echo 🏥 Testing Health Endpoint...
powershell -Command "Invoke-WebRequest -Uri '%BASE_URL%/health' -Method GET"

echo.
echo 🔐 Testing Login...
set LOGIN_RESPONSE=powershell -Command "Invoke-WebRequest -Uri '%BASE_URL%/auth/login' -Method POST -ContentType 'application/json' -Body '{\"email\": \"admin@coffee.test\", \"password\": \"Password123!\"}' | Select-Object -ExpandProperty Content"
echo Login Response: %LOGIN_RESPONSE%

echo.
echo ☕ Testing Products Endpoint...
powershell -Command "Invoke-WebRequest -Uri '%BASE_URL%/products?page=0&size=5' -Method GET -Headers @{'Authorization'='Bearer eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiUk9MRV9BRE1JTiIsInN1YiI6ImFkbWluQGNvZmZlZS50ZXN0IiwiaWF0IjoxNzY0Njg1OTA1LCJleHAiOjE3NjQ3NzIzMDV9.pnDk8lp6VWuV4M3t67K4Tbvw3NkUo7jSyOZ1EZVVCKI'}"

echo.
echo 🎉 API Testing Complete!
echo ======================
echo Check the responses above for any errors.
echo Status codes 200/201 are successful.
echo.
echo 📋 POSTMAN SETUP INSTRUCTIONS:
echo 1. Open POSTMAN_COLLECTION.txt file
echo 2. Copy the JSON content
echo 3. Import into Postman
echo 4. Set up environment variables
echo 5. Test all endpoints
echo.
pause
