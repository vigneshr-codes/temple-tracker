#!/bin/bash

# Temple Tracker - Mac Deployment Script
# Deploy Temple Tracker on macOS with Docker Desktop

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🏛️ Temple Tracker - Mac Deployment${NC}"
echo "======================================"

# Check if we're on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo -e "${RED}❌ This script is for macOS only${NC}"
    echo "For other systems, use: deploy-anywhere.sh"
    exit 1
fi

# Check if Docker Desktop is installed
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}📦 Docker not found. Installing Docker Desktop...${NC}"
    echo ""
    echo -e "${BLUE}Please follow these steps:${NC}"
    echo "1. Go to: https://www.docker.com/products/docker-desktop"
    echo "2. Download Docker Desktop for Mac"
    echo "3. Install and start Docker Desktop"
    echo "4. Run this script again"
    echo ""
    # Open Docker Desktop download page
    open "https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo -e "${YELLOW}🐳 Docker Desktop is not running${NC}"
    echo "Please start Docker Desktop and try again"
    exit 1
fi

echo -e "${GREEN}✅ Docker Desktop is running${NC}"

# Check if Docker Compose is available (comes with Docker Desktop)
if ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose not available${NC}"
    echo "Please update Docker Desktop to the latest version"
    exit 1
fi

echo -e "${GREEN}✅ Docker Compose is available${NC}"

# Generate secure passwords and keys
echo -e "${YELLOW}🔐 Generating secure passwords and keys...${NC}"
MONGO_PASSWORD=$(openssl rand -base64 16 | tr -d /=+ | cut -c -12)
JWT_SECRET=$(openssl rand -base64 32 | tr -d /=+)
SETTINGS_ENCRYPTION_KEY=$(openssl rand -hex 32)

echo -e "${GREEN}✅ Passwords and keys generated${NC}"

# Create docker-compose.yml
echo -e "${YELLOW}📄 Creating deployment configuration...${NC}"

cat > docker-compose.yml << EOF
version: '3.8'

services:
  mongodb:
    image: mongo:6.0
    container_name: temple-mongodb
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
      MONGO_INITDB_DATABASE: templetracker
    volumes:
      - mongodb_data:/data/db
    networks:
      - temple-network
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')", "--quiet"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s

  backend:
    image: vigneshr2011/temple-tracker-backend:latest
    container_name: temple-backend
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 3001
      MONGODB_URI: mongodb://admin:${MONGO_PASSWORD}@mongodb:27017/templetracker?authSource=admin
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRE: 30d
      JWT_COOKIE_EXPIRE: 30
      FRONTEND_URL: http://localhost
      SETTINGS_ENCRYPTION_KEY: ${SETTINGS_ENCRYPTION_KEY}
    ports:
      - "3001:3001"
    depends_on:
      mongodb:
        condition: service_healthy
    networks:
      - temple-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    image: vigneshr2011/temple-tracker-frontend:latest
    container_name: temple-frontend
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
    driver: local
EOF

echo -e "${GREEN}✅ Configuration created${NC}"

# Pull images
echo -e "${YELLOW}📥 Pulling Docker images...${NC}"
docker compose pull

# Start services
echo -e "${YELLOW}🚀 Starting Temple Tracker services...${NC}"
docker compose up -d

# Wait for services to be ready
echo -e "${YELLOW}⏳ Waiting for services to start...${NC}"
sleep 30

# Health check
echo -e "${YELLOW}🔍 Checking service health...${NC}"

# Check if backend is running
if curl -f http://localhost:3001/api/health >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is running${NC}"
else
    echo -e "${RED}❌ Backend health check failed${NC}"
    echo "Checking logs..."
    docker compose logs backend
fi

# Create admin user
echo -e "${YELLOW}👤 Creating admin user...${NC}"
docker exec temple-backend npm run seed:admin

# Get local IP
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)

echo -e "${GREEN}🎉 Temple Tracker deployed successfully on Mac!${NC}"
echo ""
echo -e "${BLUE}📋 Access Information:${NC}"
echo -e "Local Frontend:  ${GREEN}http://localhost${NC}"
echo -e "Local Backend:   ${GREEN}http://localhost:3001${NC}"
if [ ! -z "$LOCAL_IP" ]; then
    echo -e "Network Frontend: ${GREEN}http://${LOCAL_IP}${NC}"
    echo -e "Network Backend:  ${GREEN}http://${LOCAL_IP}:3001${NC}"
fi
echo ""
echo -e "${BLUE}🔑 Admin Login Credentials:${NC}"
echo -e "Username: ${GREEN}admin${NC}"
echo -e "Email:    ${GREEN}admin@gmail.com${NC}"
echo -e "Password: ${GREEN}admin123${NC}"
echo ""
echo -e "${YELLOW}⚠️ Important: Change the admin password after first login!${NC}"
echo ""
echo -e "${BLUE}🔧 Management Commands:${NC}"
echo "View logs:    docker compose logs -f"
echo "Stop app:     docker compose down"
echo "Restart app:  docker compose restart"
echo "Update app:   docker compose pull && docker compose up -d"
echo ""
echo -e "${GREEN}✨ Enjoy managing your temple with Temple Tracker!${NC}"