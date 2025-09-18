# 🐳 Docker Hub Deployment Guide

Your Temple Tracker images are now available on Docker Hub! Deploy anywhere that supports Docker.

## 📦 Available Docker Images

- **Backend**: `vigneshr2011/temple-tracker-backend:latest` (290MB)
- **Frontend**: `vigneshr2011/temple-tracker-frontend:latest` (81.6MB)

## 🚀 Quick Deployment

### Option 1: Using Docker Compose (Recommended)

Create a `docker-compose.yml` file on your server:

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:6.0
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: your_secure_password
      MONGO_INITDB_DATABASE: templetracker
    volumes:
      - mongodb_data:/data/db
    networks:
      - temple-network

  backend:
    image: vigneshr2011/temple-tracker-backend:latest
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 3001
      MONGO_URI: mongodb://admin:your_secure_password@mongodb:27017/templetracker?authSource=admin
      JWT_SECRET: your_jwt_secret_here_min_32_chars
      JWT_EXPIRE: 30d
      JWT_COOKIE_EXPIRE: 30
    ports:
      - "3001:3001"
    depends_on:
      - mongodb
    networks:
      - temple-network

  frontend:
    image: vigneshr2011/temple-tracker-frontend:latest
    restart: unless-stopped
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - temple-network

networks:
  temple-network:
    driver: bridge

volumes:
  mongodb_data:
```

**Deploy with:**
```bash
docker-compose up -d
```

### Option 2: Individual Containers

```bash
# Create network
docker network create temple-network

# Run MongoDB
docker run -d \
  --name temple-mongodb \
  --network temple-network \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=your_secure_password \
  -e MONGO_INITDB_DATABASE=templetracker \
  -v mongodb_data:/data/db \
  mongo:6.0

# Run Backend
docker run -d \
  --name temple-backend \
  --network temple-network \
  -p 3001:3001 \
  -e NODE_ENV=production \
  -e MONGO_URI=mongodb://admin:your_secure_password@temple-mongodb:27017/templetracker?authSource=admin \
  -e JWT_SECRET=your_jwt_secret_here_min_32_chars \
  vigneshr2011/temple-tracker-backend:latest

# Run Frontend
docker run -d \
  --name temple-frontend \
  --network temple-network \
  -p 80:80 \
  vigneshr2011/temple-tracker-frontend:latest
```

### Option 3: Single Command (Development)

```bash
docker run -d -p 3001:3001 \
  -e MONGO_URI=your_mongodb_connection_string \
  -e JWT_SECRET=your_jwt_secret \
  vigneshr2011/temple-tracker-backend:latest
```

## 🌐 Platform-Specific Deployments

### DigitalOcean Droplet
1. Create Ubuntu 22.04 droplet ($12/month)
2. Install Docker: `curl -fsSL https://get.docker.com | sh`
3. Upload docker-compose.yml
4. Run: `docker-compose up -d`

### AWS EC2
1. Launch t3.micro instance (free tier)
2. Install Docker
3. Deploy using docker-compose

### Google Cloud Run
```bash
# Deploy backend
gcloud run deploy temple-tracker-backend \
  --image vigneshr2011/temple-tracker-backend:latest \
  --platform managed \
  --allow-unauthenticated

# Deploy frontend  
gcloud run deploy temple-tracker-frontend \
  --image vigneshr2011/temple-tracker-frontend:latest \
  --platform managed \
  --allow-unauthenticated
```

### Azure Container Instances
```bash
az container create \
  --resource-group myResourceGroup \
  --name temple-tracker-backend \
  --image vigneshr2011/temple-tracker-backend:latest \
  --ports 3001 \
  --environment-variables \
    MONGO_URI=your_connection_string \
    JWT_SECRET=your_secret
```

### Fly.io
```bash
# Install flyctl
fly auth login

# Deploy backend
fly launch --image vigneshr2011/temple-tracker-backend:latest

# Deploy frontend
fly launch --image vigneshr2011/temple-tracker-frontend:latest
```

## ⚙️ Environment Variables

### Required Backend Variables:
```env
NODE_ENV=production
PORT=3001
MONGO_URI=mongodb://username:password@host:27017/templetracker
JWT_SECRET=your_jwt_secret_at_least_32_characters_long
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30
```

### Optional Variables:
```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USERNAME=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# File Upload
MAX_FILE_SIZE=5mb
UPLOAD_PATH=/uploads
```

## 🗄️ Database Options

### 1. MongoDB Atlas (Recommended)
- Free 512MB cluster
- Get connection string from atlas
- Use in MONGO_URI variable

### 2. Docker MongoDB (As shown above)
- Runs alongside your app
- Good for development/small production

### 3. Managed Database Services
- DigitalOcean Managed MongoDB
- AWS DocumentDB
- Azure Cosmos DB

## 🔒 Security Setup

### 1. Update Environment Variables
```bash
# Generate secure JWT secret
openssl rand -base64 64

# Generate secure MongoDB password
openssl rand -base64 32
```

### 2. Firewall Configuration
```bash
# Allow only necessary ports
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw enable
```

### 3. SSL Certificate (Optional)
Use Caddy or nginx-proxy for automatic SSL:

```yaml
# Add to docker-compose.yml
  caddy:
    image: caddy:latest
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - caddy_data:/data
      - caddy_config:/config
      - ./Caddyfile:/etc/caddy/Caddyfile
```

## 🔄 Updates & Maintenance

### Update Images
```bash
# Pull latest images
docker pull vigneshr2011/temple-tracker-backend:latest
docker pull vigneshr2011/temple-tracker-frontend:latest

# Restart services
docker-compose up -d
```

### Backup Database
```bash
# Create backup
docker exec temple-mongodb mongodump --out /backup

# Copy backup
docker cp temple-mongodb:/backup ./backup-$(date +%Y%m%d)
```

## 📊 Monitoring

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker logs -f temple-backend
```

### Health Checks
```bash
# Backend health
curl http://localhost:3001/api/health

# Check container status
docker ps
```

## 🆘 Troubleshooting

### Common Issues:

1. **Port conflicts**: Change ports in docker-compose.yml
2. **Memory issues**: Increase server RAM or use swapfile
3. **Database connection**: Check MONGO_URI format
4. **Image not found**: Verify image names are correct

### Reset Everything:
```bash
docker-compose down -v
docker system prune -a
docker-compose up -d
```

## 💰 Cost Estimates

| Platform | Monthly Cost |
|----------|-------------|
| DigitalOcean Droplet | $12 |
| AWS t3.micro | $8-15 |
| Google Cloud Run | $0-10 |
| Fly.io | $0-5 |
| Azure Container | $10-20 |

## 🔗 Quick Links

- **Docker Hub Backend**: https://hub.docker.com/r/vigneshr2011/temple-tracker-backend
- **Docker Hub Frontend**: https://hub.docker.com/r/vigneshr2011/temple-tracker-frontend
- **GitHub Repository**: https://github.com/vigneshr-codes/temple-tracker

## 🎯 Next Steps

1. Choose your deployment platform
2. Set up environment variables
3. Deploy using one of the methods above
4. Configure your domain (optional)
5. Set up monitoring and backups

Your Temple Tracker is now ready to deploy anywhere! 🚀