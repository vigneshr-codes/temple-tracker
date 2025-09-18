#!/bin/bash

# Temple Tracker - One-Click Deployment Script
# Deploy Temple Tracker anywhere with Docker

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🏛️ Temple Tracker - One-Click Deployment${NC}"
echo "========================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}📦 Installing Docker...${NC}"
    curl -fsSL https://get.docker.com | sh
    echo -e "${GREEN}✅ Docker installed successfully${NC}"
else
    echo -e "${GREEN}✅ Docker is already installed${NC}"
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}📦 Installing Docker Compose...${NC}"
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}✅ Docker Compose installed successfully${NC}"
else
    echo -e "${GREEN}✅ Docker Compose is already available${NC}"
fi

# Generate secure passwords
echo -e "${YELLOW}🔐 Generating secure passwords...${NC}"
MONGO_PASSWORD=$(openssl rand -base64 16 | tr -d /=+ | cut -c -12)
JWT_SECRET=$(openssl rand -base64 32 | tr -d /=+)

echo -e "${GREEN}✅ Passwords generated${NC}"

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

  backend:
    image: vigneshr2011/temple-tracker-backend:latest
    container_name: temple-backend
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 3001
      MONGO_URI: mongodb://admin:${MONGO_PASSWORD}@mongodb:27017/templetracker?authSource=admin
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRE: 30d
      JWT_COOKIE_EXPIRE: 30
      FRONTEND_URL: http://localhost
    ports:
      - "3001:3001"
    depends_on:
      - mongodb
    networks:
      - temple-network

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
EOF

echo -e "${GREEN}✅ Configuration created${NC}"

# Pull images
echo -e "${YELLOW}📥 Pulling Docker images...${NC}"
docker-compose pull

# Start services
echo -e "${YELLOW}🚀 Starting Temple Tracker services...${NC}"
docker-compose up -d

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
fi

# Create admin user
echo -e "${YELLOW}👤 Creating admin user...${NC}"
docker exec temple-backend npm run seed:admin

# Get server IP
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || echo "localhost")

echo -e "${GREEN}🎉 Temple Tracker deployed successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Deployment Information:${NC}"
echo -e "Frontend URL: ${GREEN}http://${SERVER_IP}${NC}"
echo -e "Backend URL:  ${GREEN}http://${SERVER_IP}:3001${NC}"
echo ""
echo -e "${BLUE}🔑 Admin Login Credentials:${NC}"
echo -e "Username: ${GREEN}admin${NC}"
echo -e "Email:    ${GREEN}admin@gmail.com${NC}"
echo -e "Password: ${GREEN}admin123${NC}"
echo ""
echo -e "${YELLOW}⚠️ Important: Change the admin password after first login!${NC}"
echo ""
echo -e "${BLUE}🔧 Management Commands:${NC}"
echo "View logs:    docker-compose logs -f"
echo "Stop app:     docker-compose down"
echo "Restart app:  docker-compose restart"
echo "Update app:   docker-compose pull && docker-compose up -d"
echo ""
echo -e "${GREEN}✨ Enjoy managing your temple with Temple Tracker!${NC}"