#!/bin/bash

# Temple Tracker - SSL Setup with Let's Encrypt
# Usage: ./setup-ssl.sh domain.com

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔐 Temple Tracker - SSL Setup${NC}"
echo "================================"

# Check if domain is provided
if [ "$#" -ne 1 ]; then
    echo -e "${RED}❌ Usage: ./setup-ssl.sh domain.com${NC}"
    exit 1
fi

DOMAIN=$1
EMAIL="admin@$DOMAIN"

echo -e "${GREEN}📍 Domain: $DOMAIN${NC}"
echo -e "${GREEN}📧 Email: $EMAIL${NC}"

# Check if certbot is installed
if ! command -v certbot &> /dev/null; then
    echo -e "${YELLOW}📦 Installing certbot...${NC}"
    
    # Detect OS and install certbot
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if command -v apt &> /dev/null; then
            # Ubuntu/Debian
            sudo apt update
            sudo apt install -y certbot
        elif command -v yum &> /dev/null; then
            # CentOS/RHEL
            sudo yum install -y certbot
        fi
    else
        echo -e "${RED}❌ Please install certbot manually${NC}"
        exit 1
    fi
fi

# Create SSL directory
mkdir -p ssl

# Stop nginx temporarily to allow certbot standalone mode
echo -e "${YELLOW}🛑 Temporarily stopping frontend container...${NC}"
docker-compose -f docker-compose.prod.yml stop frontend

# Get SSL certificate
echo -e "${YELLOW}🔐 Obtaining SSL certificate...${NC}"
sudo certbot certonly \
    --standalone \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    --domains $DOMAIN

# Copy certificates to ssl directory
echo -e "${YELLOW}📋 Copying certificates...${NC}"
sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem ssl/key.pem

# Set proper permissions
sudo chown $USER:$USER ssl/cert.pem ssl/key.pem
sudo chmod 644 ssl/cert.pem
sudo chmod 600 ssl/key.pem

# Update nginx configuration with the actual domain
sed -i.bak "s/server_name _;/server_name $DOMAIN;/g" nginx/prod.conf
rm nginx/prod.conf.bak

# Restart frontend with SSL
echo -e "${YELLOW}🚀 Starting frontend with SSL...${NC}"
docker-compose -f docker-compose.prod.yml up -d frontend

# Wait for frontend to start
sleep 10

# Test SSL certificate
echo -e "${YELLOW}🧪 Testing SSL configuration...${NC}"
if curl -f https://$DOMAIN/health >/dev/null 2>&1; then
    echo -e "${GREEN}✅ SSL is working correctly!${NC}"
else
    echo -e "${RED}❌ SSL test failed${NC}"
    exit 1
fi

# Set up automatic renewal
echo -e "${YELLOW}🔄 Setting up automatic SSL renewal...${NC}"

# Create renewal script
cat > ssl-renew.sh << EOF
#!/bin/bash
# SSL Certificate Renewal Script

echo "Renewing SSL certificate for $DOMAIN..."

# Stop frontend
docker-compose -f docker-compose.prod.yml stop frontend

# Renew certificate
sudo certbot renew --standalone

# Copy new certificates
sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem ssl/key.pem
sudo chown $USER:$USER ssl/cert.pem ssl/key.pem
sudo chmod 644 ssl/cert.pem
sudo chmod 600 ssl/key.pem

# Restart frontend
docker-compose -f docker-compose.prod.yml up -d frontend

echo "SSL renewal completed!"
EOF

chmod +x ssl-renew.sh

# Add to crontab for automatic renewal (runs at 3 AM on the 1st of every month)
(crontab -l 2>/dev/null; echo "0 3 1 * * $(pwd)/ssl-renew.sh >> $(pwd)/ssl-renewal.log 2>&1") | crontab -

echo -e "${GREEN}🎉 SSL setup completed successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Summary:${NC}"
echo "✅ SSL certificate obtained for $DOMAIN"
echo "✅ Nginx configured with SSL"
echo "✅ Automatic renewal set up (monthly)"
echo ""
echo -e "${GREEN}🌐 Your Temple Tracker is now available at: https://$DOMAIN${NC}"
echo ""
echo -e "${BLUE}🔧 SSL Management:${NC}"
echo "• Renewal script: ./ssl-renew.sh"
echo "• Renewal logs: ./ssl-renewal.log"
echo "• Certificate expires: $(sudo certbot certificates | grep -A 5 $DOMAIN | grep 'Expiry Date')"