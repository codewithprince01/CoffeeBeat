@echo off
echo Starting Coffee Beat Backend...

set JAVA_OPTS=-Xmx512m -Xms256m
set SPRING_PROFILES_ACTIVE=dev

mvn spring-boot:run -Dspring-boot.run.jvmArguments="-Xmx512m -Xms256m"

if %errorlevel% neq 0 (
    echo.
    echo Failed to start the application. Press any key to exit.
    pause
    exit /b %errorlevel%
)

pause
