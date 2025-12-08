# Package.json Setup Instructions

## 📦 Package.json Content

Copy the following content and create a `package.json` file in the `frontend/` directory:

```json
{
  "name": "coffee-beat-frontend",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint . --ext js,jsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.0",
    "axios": "^1.6.0",
    "react-hot-toast": "^2.4.1",
    "recharts": "^2.8.0",
    "sockjs-client": "^1.6.1",
    "@stomp/stompjs": "^7.0.0",
    "lucide-react": "^0.294.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0",
    "@reduxjs/toolkit": "^2.0.1",
    "react-redux": "^9.0.4"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@types/sockjs-client": "^1.5.4",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.3.6",
    "eslint": "^8.55.0",
    "eslint-plugin-react": "^7.33.2",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "vite": "^5.0.8"
  }
}
```

## 🚀 Quick Start Steps

### 1. Create the package.json file
```bash
cd frontend
# Copy the JSON content above into package.json
```

### 2. Install dependencies
```bash
npm install
```

### 3. Create environment file
```bash
cp .env.example .env
```

### 4. Start development server
```bash
npm run dev
```

## 📁 Complete Frontend Structure

Your frontend folder should now have:
```
frontend/
├── index.html                    ✅ Created
├── vite.config.js               ✅ Created
├── tailwind.config.js            ✅ Created
├── postcss.config.js            ✅ Created
├── .env.example                 ✅ Created
├── package.json                 📝 Create manually
└── src/
    ├── App.jsx                  ✅ Created
    ├── main.jsx                 ✅ Created
    ├── index.css                ✅ Created
    ├── components/              ✅ Created
    ├── contexts/                ✅ Created
    ├── pages/                   ✅ Created
    └── services/                ✅ Created
```

## 🔧 All Configuration Files Ready

✅ **index.html** - HTML entry point
✅ **vite.config.js** - Vite configuration with proxy
✅ **tailwind.config.js** - Tailwind CSS configuration
✅ **postcss.config.js** - PostCSS configuration
✅ **.env.example** - Environment variables template
📝 **package.json** - Dependencies and scripts (create manually)

## 🎯 Next Steps

After creating package.json and installing dependencies:

1. **Start the backend**: `docker-compose up -d` (from project root)
2. **Start the frontend**: `cd frontend && npm run dev`
3. **Access the app**: http://localhost:5173
4. **Login with demo accounts** (see FRONTEND_SETUP.md)

The application will be fully functional with:
- ✅ Complete authentication system
- ✅ Role-based dashboards
- ✅ Real-time WebSocket notifications
- ✅ Responsive UI with Tailwind CSS
- ✅ Full API integration
- ✅ Production-ready build setup
