# EduSynth Quick Start Guide

## Get Started in 5 Minutes

### Step 1: Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend (in a new terminal)
cd app
npm install
```

### Step 2: Configure Environment

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI and Gemini API Key

# Frontend
cd app
cp .env.example .env
# Edit .env with your backend URL
```

### Step 3: Start MongoDB

**Option A: Local MongoDB**
```bash
mongod --dbpath /path/to/data
```

**Option B: MongoDB Atlas**
- Create free cluster at mongodb.com
- Get connection string
- Add to backend .env

### Step 4: Run the Application

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd app
npm run dev
```

### Step 5: Create First Tenant

```bash
curl -X POST http://localhost:5000/api/branding/setup \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "org_001",
    "organizationName": "Demo Academy",
    "organizationCode": "DEMO2024",
    "setupToken": "dev-setup-token"
  }'
```

### Step 6: Register Admin User

Visit http://localhost:5173/register and create an account using:
- Organization Code: `DEMO2024`
- Role: Select admin

## Default Ports

| Service | Port | URL |
|---------|------|-----|
| Backend API | 5000 | http://localhost:5000 |
| Frontend | 5173 | http://localhost:5173 |
| MongoDB | 27017 | mongodb://localhost:27017 |

## Common Commands

```bash
# Reset database
mongo edusynth --eval "db.dropDatabase()"

# View logs
npm run dev  # Shows logs in terminal

# Build for production
cd app && npm run build
```

## Need Help?

- Check [README.md](README.md) for full documentation
- Review [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common issues
