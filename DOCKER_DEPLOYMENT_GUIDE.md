# Temple Tracker - Docker Deployment Guide

## 🐳 Docker Configuration Overview

This guide covers deploying Temple Tracker using Docker containers with the following architecture:
- **Frontend**: React app served by Nginx
- **Backend**: Node.js Express API
- **Database**: MongoDB with initialization script

## 📁 Docker Files Created

```
temple-tracker/
├── docker-compose.yml          # Multi-container orchestration
├── .dockerignore              # Docker ignore rules
├── init-mongo.js              # MongoDB initialization
├── backend/
│   └── Dockerfile            # Backend container
├── frontend/
│   ├── Dockerfile           # Frontend container  
│   └── nginx.conf           # Nginx configuration
└── DOCKER_DEPLOYMENT_GUIDE.md
```

## 🚀 Local Development with Docker

### Prerequisites
- Docker Desktop installed
- Docker Compose installed

### Quick Start

1. **Build and run all services:**
```bash
docker-compose up --build
```

2. **Run in detached mode:**
```bash
docker-compose up -d --build
```

3. **View logs:**
```bash
docker-compose logs -f
```

4. **Stop all services:**
```bash
docker-compose down
```

### Access Points
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **MongoDB**: localhost:27017

## 🌐 Free Docker Hosting Platforms

### 1. Railway (Recommended)
- **Free Credits**: $5/month
- **Deployment**: 
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### 2. Render
- **Free Tier**: Available with limitations
- **Features**: Auto-deploy from Git, custom domains
- **Deployment**: Connect GitHub repo, select Docker

### 3. Fly.io
- **Free Tier**: 3 small VMs (256MB RAM each)
- **Deployment**:
```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Deploy
flyctl launch
flyctl deploy
```

### 4. Google Cloud Run
- **Free Tier**: 2 million requests/month
- **Pay-per-use pricing**
- **Deployment**: Upload to Container Registry

## 🔧 Production Deployment Steps

### Step 1: Prepare Environment Variables

Create `.env` files for production:

**Backend (.env):**
```env
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb://admin:your-password@mongodb:27017/templetracker?authSource=admin
JWT_SECRET=your-super-secure-jwt-secret
FRONTEND_URL=https://your-frontend-domain.com
```

**Frontend (.env.production):**
```env
REACT_APP_API_URL=https://your-backend-domain.com
```

### Step 2: Build Production Images

```bash
# Build individual images
docker build -t temple-tracker-backend ./backend
docker build -t temple-tracker-frontend ./frontend

# Tag for registry
docker tag temple-tracker-backend your-registry/temple-tracker-backend:latest
docker tag temple-tracker-frontend your-registry/temple-tracker-frontend:latest

# Push to registry
docker push your-registry/temple-tracker-backend:latest
docker push your-registry/temple-tracker-frontend:latest
```

### Step 3: Platform-Specific Deployment

#### Railway Deployment
1. Create `railway.toml`:
```toml
[build]
builder = "dockerfile"

[deploy]
startCommand = "npm start"
```

#### Render Deployment
1. Create `render.yaml`:
```yaml
services:
  - type: web
    name: temple-tracker-backend
    env: docker
    dockerfilePath: ./backend/Dockerfile
    
  - type: web
    name: temple-tracker-frontend
    env: docker
    dockerfilePath: ./frontend/Dockerfile
```

## 🗄️ Database Options

### Option 1: MongoDB Atlas (Recommended)
- Free 512MB tier
- Replace MongoDB service in docker-compose.yml
- Update MONGODB_URI to Atlas connection string

### Option 2: Railway MongoDB
- Built-in database service
- Easy integration with Railway deployment

### Option 3: Container MongoDB (Development only)
- Included in docker-compose.yml
- Not recommended for production

## 🔍 Monitoring and Maintenance

### Health Checks
- Backend includes health check endpoint: `/api/health`
- Docker health checks configured
- Monitor container status

### Logs
```bash
# View all logs
docker-compose logs

# Follow specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb
```

### Updates
```bash
# Rebuild and redeploy
docker-compose build --no-cache
docker-compose up -d
```

## 💰 Cost Estimation

| Platform | Free Tier | Paid Tier |
|----------|-----------|-----------|
| **Railway** | $5 credit/month | $5/month after credit |
| **Render** | Limited free | $7/month |
| **Fly.io** | 3 small VMs free | $1.94/VM/month |
| **Google Cloud Run** | 2M requests free | Pay per use |
| **MongoDB Atlas** | 512MB free | $9/month (2GB) |

## 🛡️ Security Considerations

1. **Environment Variables**: Never commit secrets to Git
2. **JWT Secret**: Use strong, unique secrets in production
3. **Database**: Use strong passwords and authentication
4. **HTTPS**: Enable SSL/TLS in production
5. **CORS**: Configure proper CORS origins
6. **Rate Limiting**: Already implemented in backend

## 🚨 Troubleshooting

### Common Issues

1. **Container won't start:**
```bash
docker-compose logs service-name
```

2. **Database connection fails:**
- Check MongoDB URI format
- Verify network connectivity
- Check authentication credentials

3. **Frontend can't reach backend:**
- Verify REACT_APP_API_URL is correct
- Check CORS configuration
- Ensure backend is running

### Debugging Commands
```bash
# Enter running container
docker exec -it temple-tracker-backend sh

# Check container stats
docker stats

# Remove all containers and volumes
docker-compose down -v
docker system prune -a
```

## ✅ Deployment Checklist

- [ ] Docker files created and tested locally
- [ ] Environment variables configured
- [ ] Database connection tested
- [ ] Images built and pushed to registry
- [ ] Platform account created (Railway/Render/Fly.io)
- [ ] Domain configured (optional)
- [ ] SSL certificate configured
- [ ] Monitoring and logging set up
- [ ] Backup strategy implemented

Your Temple Tracker application is now ready for containerized deployment! 🎉