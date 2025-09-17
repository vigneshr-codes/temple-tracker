#!/bin/bash

# Temple Tracker - Production Deployment Script for DigitalOcean
# Usage: ./deploy.sh [domain]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🏛️  Temple Tracker - Production Deployment${NC}"
echo "=========================================="

# Check if domain is provided
if [ "$#" -eq 1 ]; then
    DOMAIN=$1
    echo -e "${GREEN}📍 Domain: $DOMAIN${NC}"
else
    read -p "Enter your domain (e.g., templetracker.yourdomain.com): " DOMAIN
fi

# Validate domain
if [ -z "$DOMAIN" ]; then
    echo -e "${RED}❌ Domain is required${NC}"
    exit 1
fi

# Create production environment file
echo -e "${YELLOW}🔧 Setting up production environment...${NC}"
if [ ! -f .env.production ]; then
    cp .env.prod .env.production
    
    # Generate strong passwords
    MONGO_PASSWORD=$(openssl rand -base64 32 | tr -d /=+ | cut -c -25)
    JWT_SECRET=$(openssl rand -base64 64 | tr -d /=+ | cut -c -50)
    
    # Update environment file
    sed -i.bak "s/your_strong_mongodb_password_here/$MONGO_PASSWORD/g" .env.production
    sed -i.bak "s/your_jwt_secret_key_at_least_32_characters_long/$JWT_SECRET/g" .env.production
    sed -i.bak "s/your-domain.com/$DOMAIN/g" .env.production
    rm .env.production.bak
    
    echo -e "${GREEN}✅ Environment file created with secure passwords${NC}"
else
    echo -e "${YELLOW}⚠️  Using existing .env.production file${NC}"
fi

# Create SSL directory
echo -e "${YELLOW}🔐 Setting up SSL directory...${NC}"
mkdir -p ssl

# Stop any running containers
echo -e "${YELLOW}🛑 Stopping existing containers...${NC}"
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true

# Build and start containers
echo -e "${YELLOW}🏗️  Building and starting containers...${NC}"
docker-compose -f docker-compose.prod.yml --env-file .env.production up --build -d

# Wait for services to be ready
echo -e "${YELLOW}⏳ Waiting for services to start...${NC}"
sleep 30

# Check if services are running
echo -e "${YELLOW}🔍 Checking service health...${NC}"

# Check MongoDB
if docker exec temple-tracker-mongodb-prod mongosh --eval "db.adminCommand('ping')" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ MongoDB is running${NC}"
else
    echo -e "${RED}❌ MongoDB failed to start${NC}"
    exit 1
fi

# Check Backend
if curl -f http://localhost:3001/api/health >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is running${NC}"
else
    echo -e "${RED}❌ Backend failed to start${NC}"
    exit 1
fi

# Check Frontend
if curl -f http://localhost >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend is running${NC}"
else
    echo -e "${RED}❌ Frontend failed to start${NC}"
    exit 1
fi

# Setup admin user
echo -e "${YELLOW}👤 Setting up admin user...${NC}"
docker exec temple-tracker-backend-prod npm run seed:admin

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "1. Point your domain ($DOMAIN) to this server's IP address"
echo "2. Run SSL setup: ./setup-ssl.sh $DOMAIN"
echo "3. Your app will be available at: https://$DOMAIN"
echo ""
echo -e "${BLUE}🔑 Admin Login Credentials:${NC}"
echo "Username: admin"
echo "Email: admin@gmail.com"
echo "Password: admin123"
echo ""
echo -e "${YELLOW}⚠️  Don't forget to change the admin password after first login!${NC}"

# Show running containers
echo -e "${BLUE}🐳 Running Containers:${NC}"
docker-compose -f docker-compose.prod.yml ps