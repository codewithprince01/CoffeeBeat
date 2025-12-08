# 🔧 Backend Environment Setup Guide

## 📋 Overview

This guide explains the environment variables needed to run the Coffee Beat backend application.

## 🚀 Quick Setup

### 1. Copy the template
```bash
cp .env.example .env
```

### 2. Update required values
Edit the `.env` file and update the following **required** variables:

#### 🔐 **JWT Secrets** (Required)
```env
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
```

#### ☁️ **Cloudinary** (Required for image uploads)
```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

#### 🗄️ **MongoDB** (If using custom database)
```env
MONGODB_URI=mongodb://localhost:27017/coffee-beat
```

## 📦 Environment Variables Reference

### 📡 **Server Configuration**
| Variable | Default | Description |
|-----------|---------|-------------|
| `SERVER_PORT` | `8080` | Server port |
| `SERVER_HOST` | `localhost` | Server host |

### 🗄️ **Database Configuration**
| Variable | Default | Description |
|-----------|---------|-------------|
| `MONGODB_URI` | `mongodb://localhost:27017/coffee-beat` | MongoDB connection string |
| `MONGODB_DATABASE` | `coffee-beat` | Database name |

### 🔐 **Authentication Configuration**
| Variable | Default | Description |
|-----------|---------|-------------|
| `JWT_SECRET` | Required | JWT signing secret |
| `JWT_REFRESH_SECRET` | Required | JWT refresh token secret |
| `JWT_EXPIRATION` | `86400000` | Token expiration (ms) |
| `JWT_REFRESH_EXPIRATION` | `604800000` | Refresh token expiration (ms) |
| `BCRYPT_STRENGTH` | `12` | Password hashing strength |

### 🌐 **CORS Configuration**
| Variable | Default | Description |
|-----------|---------|-------------|
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173,http://localhost:5174` | Allowed frontend origins |
| `CORS_ALLOWED_METHODS` | `GET,POST,PUT,DELETE,OPTIONS` | Allowed HTTP methods |
| `CORS_ALLOWED_HEADERS` | `*` | Allowed headers |

### ☁️ **Cloudinary Configuration**
| Variable | Default | Description |
|-----------|---------|-------------|
| `CLOUDINARY_CLOUD_NAME` | Required | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Required | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Required | Cloudinary API secret |
| `CLOUDINARY_UPLOAD_FOLDER` | `coffee-beat` | Upload folder name |

### 📧 **Email Configuration** (Optional)
| Variable | Default | Description |
|-----------|---------|-------------|
| `MAIL_HOST` | `smtp.gmail.com` | SMTP server |
| `MAIL_PORT` | `587` | SMTP port |
| `MAIL_USERNAME` | Required for email | Email username |
| `MAIL_PASSWORD` | Required for email | Email password |
| `MAIL_FROM` | `noreply@coffeebeat.com` | From email address |

### 📱 **WebSocket Configuration**
| Variable | Default | Description |
|-----------|---------|-------------|
| `WEBSOCKET_ALLOWED_ORIGINS` | `http://localhost:5173,http://localhost:5174` | WebSocket allowed origins |
| `WEBSOCKET_PATH` | `/ws` | WebSocket endpoint path |

### 📊 **Documentation Configuration**
| Variable | Default | Description |
|-----------|---------|-------------|
| `SWAGGER_ENABLED` | `true` | Enable Swagger UI |
| `SWAGGER_PATH` | `/api-docs` | Swagger documentation path |

### 🎨 **File Upload Configuration**
| Variable | Default | Description |
|-----------|---------|-------------|
| `MAX_FILE_SIZE` | `5242880` | Max file size (bytes) |
| `ALLOWED_FILE_TYPES` | `jpg,jpeg,png,gif,webp` | Allowed file extensions |

## 🔧 **Getting Required Values**

### 🎯 **JWT Secrets**
Generate secure random strings:
```bash
# Using OpenSSL
openssl rand -base64 64

# Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"

# Using Python
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

### ☁️ **Cloudinary Setup**
1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Create a new account
3. Get your credentials from the dashboard
4. Update the `.env` file with your values

### 📧 **Email Setup** (Optional)
For Gmail:
1. Enable 2-factor authentication
2. Generate an app password
3. Use the app password in `MAIL_PASSWORD`

## 🚀 **Running the Application**

### With Docker (Recommended)
```bash
# Set environment variables in .env
docker-compose up -d
```

### Without Docker
```bash
# Make sure MongoDB is running
mongod

# Set environment variables
export $(cat .env | xargs)

# Run the application
./mvnw spring-boot:run
```

## 🔍 **Testing Configuration**

After setting up the `.env` file:

1. **Start the backend**: `./mvnw spring-boot:run`
2. **Check health**: `GET http://localhost:8080/api/health`
3. **Access docs**: `http://localhost:8080/api-docs`
4. **Test auth**: `POST http://localhost:8080/api/auth/login`

## 🛡️ **Security Notes**

- **Never commit `.env` files** to version control
- **Use different secrets** for development and production
- **Rotate secrets regularly** in production
- **Use environment-specific** configurations
- **Enable HTTPS** in production

## 🐛 **Troubleshooting**

### Common Issues

1. **JWT Token Errors**
   - Check JWT secrets are set
   - Ensure secrets are the same on restart

2. **Database Connection Errors**
   - Verify MongoDB is running
   - Check connection string format
   - Ensure database permissions

3. **Cloudinary Upload Errors**
   - Verify API credentials
   - Check cloud name is correct
   - Ensure API key has upload permissions

4. **CORS Errors**
   - Check frontend URL in allowed origins
   - Verify port numbers match
   - Ensure no trailing slashes

### Debug Mode
Enable debug logging:
```env
DEBUG=true
LOG_LEVEL=DEBUG
```

## 📚 **Additional Resources**

- [Spring Boot External Configuration](https://docs.spring.io/spring-boot/docs/current/reference/html/features.html#features.external-config)
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [JWT Best Practices](https://jwt.io/introduction/)

---

**🎉 Your backend is now ready to run!**
