# 🚀 Deploy Temple Tracker Anywhere

Deploy Temple Tracker on any system using Docker images from Docker Hub.

## ⚡ One-Click Deployment (Recommended)

### For Linux/Ubuntu/CentOS Servers:
```bash
# Download the script
curl -O https://raw.githubusercontent.com/vigneshr-codes/temple-tracker/main/deploy-anywhere.sh

# Make it executable
chmod +x deploy-anywhere.sh

# Run deployment
./deploy-anywhere.sh
```

### For macOS (requires Docker Desktop):
```bash
# Download the Mac script
curl -O https://raw.githubusercontent.com/vigneshr-codes/temple-tracker/main/deploy-mac.sh

# Make it executable
chmod +x deploy-mac.sh

# Run deployment
./deploy-mac.sh
```

**Note:** On macOS, you need Docker Desktop installed first. The script will guide you if it's not installed.

This will:
- ✅ Install Docker & Docker Compose (if needed)
- ✅ Pull Temple Tracker images from Docker Hub
- ✅ Generate secure passwords
- ✅ Start all services
- ✅ Create admin user
- ✅ Provide access URLs

## 📋 Manual Deployment

### Option 1: Using Docker Compose

1. **Download docker-compose file:**
   ```bash
   curl -O https://raw.githubusercontent.com/vigneshr-codes/temple-tracker/main/docker-compose.hub.yml
   ```

2. **Update passwords in the file:**
   - Change `change_this_password_123` to a secure MongoDB password
   - Change `change_this_jwt_secret_to_something_secure_32_chars_min` to a secure JWT secret

3. **Deploy:**
   ```bash
   docker-compose -f docker-compose.hub.yml up -d
   ```

4. **Create admin user:**
   ```bash
   docker exec temple-backend npm run seed:admin
   ```

### Option 2: Individual Docker Commands

```bash
# Create network
docker network create temple-network

# MongoDB
docker run -d \
  --name temple-mongodb \
  --network temple-network \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=your_secure_password \
  -v mongodb_data:/data/db \
  mongo:6.0

# Backend
docker run -d \
  --name temple-backend \
  --network temple-network \
  -p 3001:3001 \
  -e NODE_ENV=production \
  -e MONGO_URI=mongodb://admin:your_secure_password@temple-mongodb:27017/templetracker?authSource=admin \
  -e JWT_SECRET=your_jwt_secret_32_chars_minimum \
  vigneshr2011/temple-tracker-backend:latest

# Frontend
docker run -d \
  --name temple-frontend \
  --network temple-network \
  -p 80:80 \
  vigneshr2011/temple-tracker-frontend:latest

# Create admin user
docker exec temple-backend npm run seed:admin
```

## 🌐 Access Your Temple Tracker

After deployment:
- **Frontend**: http://your-server-ip
- **Backend API**: http://your-server-ip:3001
- **Admin Login**: 
  - Username: `admin`
  - Email: `admin@gmail.com`
  - Password: `admin123`

## 🔧 Management Commands

```bash
# View logs
docker-compose logs -f

# Stop application
docker-compose down

# Restart application
docker-compose restart

# Update to latest version
docker-compose pull
docker-compose up -d

# Backup database
docker exec temple-mongodb mongodump --out /backup
docker cp temple-mongodb:/backup ./backup-$(date +%Y%m%d)
```

## 🔒 Security Notes

1. **Change default passwords** after first login
2. **Update environment variables** with secure values
3. **Configure firewall** to allow only ports 80 and 443
4. **Set up SSL certificates** for production use

## 📱 Quick Mobile Test

After deployment, test on mobile:
- Open browser and go to `http://your-server-ip`
- Login with admin credentials
- Temple Tracker is responsive and works on all devices!

## 💡 Troubleshooting

**Services not starting?**
```bash
docker-compose logs
```

**Port conflicts?**
```bash
# Change ports in docker-compose.yml
ports:
  - "8080:80"    # Frontend on port 8080
  - "3002:3001"  # Backend on port 3002
```

**Database connection issues?**
```bash
# Check if MongoDB is running
docker ps | grep mongo

# Check backend logs
docker logs temple-backend
```

## 🌍 Deployment Tested On

- ✅ Ubuntu 20.04/22.04
- ✅ CentOS 7/8
- ✅ Amazon Linux 2
- ✅ DigitalOcean Droplets
- ✅ AWS EC2
- ✅ Google Cloud VM
- ✅ Azure VM
- ✅ Local development machines

---

**Need help?** Create an issue at: https://github.com/vigneshr-codes/temple-tracker/issues