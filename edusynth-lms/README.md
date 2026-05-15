# EduSynth Enterprise - Multi-Tenant AI LMS

A production-ready, multi-tenant Learning Management System powered by AI with predictive analytics, RAG-based tutoring, and secure document management.

![EduSynth](https://img.shields.io/badge/EduSynth-AI%20LMS-cyan)
![MERN Stack](https://img.shields.io/badge/Stack-MERN-green)
![License](https://img.shields.io/badge/License-MIT-blue)

## Features

### Core Capabilities

- **Multi-Tenant Architecture**: Strict TenantID isolation for data security across institutions
- **AI-Powered Tutoring**: Real-time chat with Gemini 1.5 Pro integration
- **Dual-Layer RAG Engine**: Public knowledge base + Restricted exam benchmarking
- **Predictive Analytics**: Weighted Moving Average + Linear Regression for exam readiness
- **Secure Document Vault**: Watermarked PDFs with copy/print protection
- **Glassmorphic UI**: Modern frosted-glass design with cyan/indigo gradients

### User Roles

- **Admin**: Full system access, user management, branding configuration
- **Teacher**: Content upload, quiz generation, student analytics
- **Student**: AI tutoring, document access, quiz taking, progress tracking

## Tech Stack

### Backend
- **Runtime**: Node.js + Express.js
- **Database**: MongoDB with Mongoose ODM
- **AI Service**: Google Gemini 1.5 Pro API
- **Real-time**: Socket.io for chat
- **Security**: JWT authentication, bcrypt, helmet, rate limiting
- **File Processing**: Multer, PDF-parse

### Frontend
- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS 3.4 + shadcn/ui
- **State Management**: React Context API
- **Real-time**: Socket.io-client
- **Routing**: React Router v6

## Project Structure

```
edusynth-lms/
├── backend/
│   ├── config/           # Database & app configuration
│   ├── middleware/       # Auth, tenant isolation, error handling
│   ├── models/           # MongoDB schemas (User, KnowledgeBase, Analytics, etc.)
│   ├── routes/           # API route handlers
│   ├── services/         # Business logic (RAG, Analytics, Chat)
│   ├── utils/            # Helpers (logger, text processor, vector store)
│   ├── uploads/          # Document storage
│   ├── .env.example      # Environment template
│   ├── package.json      # Backend dependencies
│   └── server.js         # Application entry point
│
└── frontend/ (app/)
    ├── src/
    │   ├── components/   # Reusable UI components
    │   ├── context/      # React contexts (Auth, Theme, Socket)
    │   ├── hooks/        # Custom React hooks
    │   ├── pages/        # Route pages (Dashboard, Chat, etc.)
    │   ├── services/     # API client functions
    │   ├── types/        # TypeScript type definitions
    │   ├── utils/        # Frontend utilities
    │   ├── App.tsx       # Root component
    │   └── index.css     # Global styles + glassmorphism
    ├── .env.example      # Frontend environment template
    └── package.json      # Frontend dependencies
```

## Prerequisites

### System Requirements (HP EliteBook or similar)

- **OS**: Windows 10/11, Ubuntu 20.04+, or macOS 12+
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 10GB free space
- **Node.js**: v20.x LTS
- **MongoDB**: v6.x or MongoDB Atlas
- **Git**: Latest version

### Required Accounts

1. **MongoDB**: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (free tier available)
2. **Google AI**: [Gemini API Key](https://ai.google.dev/)

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd edusynth-lms
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your credentials
# Required variables:
# - MONGODB_URI: Your MongoDB connection string
# - GEMINI_API_KEY: Your Google Gemini API key
# - JWT_SECRET: A random secret string
```

### 3. Frontend Setup

```bash
cd ../app  # or frontend/

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your API URL
# VITE_API_URL=http://localhost:5000/api
```

## Configuration

### Backend Environment Variables (.env)

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/edusynth

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
JWT_EXPIRE=7d

# Google Gemini AI Configuration
GEMINI_API_KEY=your-gemini-api-key-here

# File Upload Configuration
MAX_FILE_SIZE=52428800
UPLOAD_PATH=./uploads

# Security Configuration
BCRYPT_SALT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Socket.io Configuration
SOCKET_CORS_ORIGIN=http://localhost:5173
```

### Frontend Environment Variables (.env)

```env
# API Configuration
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000

# App Configuration
VITE_APP_NAME=EduSynth
VITE_APP_VERSION=1.0.0
```

## Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Server runs on http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd app
npm run dev
# App runs on http://localhost:5173
```

### Production Mode

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
cd app
npm run build
# Serve dist/ folder with your web server
```

## Initial Setup

### 1. Create First Tenant (Organization)

Use the setup endpoint or directly insert into MongoDB:

```bash
curl -X POST http://localhost:5000/api/branding/setup \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "org_001",
    "organizationName": "My Academy",
    "organizationCode": "ACADEMY2024",
    "setupToken": "your-setup-token"
  }'
```

### 2. Register First Admin User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@academy.com",
    "password": "SecurePass123!",
    "firstName": "Admin",
    "lastName": "User",
    "registrationId": "ADM001",
    "tenantCode": "ACADEMY2024",
    "role": "admin"
  }'
```

## API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/refresh` | Refresh JWT token |
| POST | `/api/auth/logout` | Logout user |

### Document Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/documents/upload` | Upload documents | Admin, Teacher |
| GET | `/api/documents` | List documents | All |
| GET | `/api/documents/:id` | Get document details | All |
| GET | `/api/documents/:id/download` | Download document | All |
| DELETE | `/api/documents/:id` | Delete document | Admin, Teacher |

### Chat Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat/sessions` | Create chat session |
| GET | `/api/chat/sessions` | List sessions |
| GET | `/api/chat/sessions/:id` | Get session history |
| POST | `/api/chat/sessions/:id/messages` | Send message |
| POST | `/api/chat/sessions/:id/actions` | Execute action |

### Quiz Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/quiz/generate` | Generate AI quiz |
| POST | `/api/quiz/submit` | Submit quiz attempt |
| POST | `/api/quiz/module` | Synthesize study module |

### Analytics Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/my` | Get my analytics |
| GET | `/api/analytics/readiness` | Get readiness score |
| GET | `/api/analytics/performance` | Get performance breakdown |
| GET | `/api/analytics/leaderboard` | Get leaderboard |

## Key Algorithms

### Ready-Score Predictive Engine

The readiness score uses a **Weighted Moving Average** with trend analysis:

```
Score = (Latest × 0.5) + (Previous × 0.3) + (Oldest × 0.2)
```

**Linear Regression** is applied to predict exam performance:

```javascript
// Trend calculation
const trend = calculateLinearRegression(attempts);
const predictedScore = currentScore + (trend.slope × 5);
```

### Document Classification

Documents are automatically classified using Gemini AI:

- **Public Tier**: Study materials, notes, textbooks
- **Restricted Tier**: Exams, answer keys, marking schemes

### RAG Retrieval

1. Text chunking with 1000-token segments
2. Vector embedding generation (768 dimensions)
3. Cosine similarity search
4. Context-aware response generation

## Security Features

### Document Protection
- **Canvas-based PDF rendering**: Prevents text selection
- **Dynamic watermarking**: User name + Registration ID overlay
- **Keyboard blocking**: Ctrl+P, Ctrl+S, Ctrl+C disabled
- **Right-click prevention**: Context menu disabled

### API Security
- JWT authentication with 7-day expiry
- Role-based access control (RBAC)
- Rate limiting (100 requests/15 min)
- Helmet.js security headers
- CORS configuration
- Tenant isolation on all queries

## Troubleshooting

### Common Issues

**1. MongoDB Connection Failed**
```
Error: connect ECONNREFUSED
```
- Check MongoDB URI in .env
- Ensure MongoDB is running (local) or IP is whitelisted (Atlas)

**2. Gemini API Errors**
```
Error: AI service temporarily unavailable
```
- Verify GEMINI_API_KEY is correct
- Check API quota on Google AI Studio

**3. File Upload Fails**
```
Error: File too large
```
- Adjust MAX_FILE_SIZE in backend .env
- Default limit: 50MB

**4. Socket.io Connection Issues**
```
Error: Connection refused
```
- Ensure backend is running on correct port
- Check CORS_ORIGIN matches frontend URL

### Development Tips

1. **Enable Debug Logging**
   ```env
   LOG_LEVEL=debug
   ```

2. **Reset Database**
   ```bash
   # Drop all collections
   mongo edusynth --eval "db.dropDatabase()"
   ```

3. **Clear Vector Store**
   ```bash
   # Restart backend to clear in-memory vectors
   # For production, use dedicated vector DB
   ```

## Deployment

### Docker (Coming Soon)

```dockerfile
# Dockerfile for backend
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

### Production Checklist

- [ ] Use MongoDB Atlas or dedicated MongoDB instance
- [ ] Set strong JWT_SECRET (min 32 characters)
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Configure rate limiting appropriately
- [ ] Set up log rotation
- [ ] Use PM2 or similar process manager
- [ ] Enable MongoDB backups
- [ ] Configure monitoring (e.g., New Relic, DataDog)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@edusynth.com or join our Slack community.

---

**Built with by the EduSynth Team**

*Empowering education through AI*
