# 🏛️ Temple Tracker - DigitalOcean Deployment Guide

Complete guide to deploy Temple Tracker on DigitalOcean with Docker, SSL, and domain setup.

## 🚀 Quick Start

### Prerequisites
- DigitalOcean account
- Domain name (optional but recommended)
- Basic knowledge of Linux commands

### 1. Create DigitalOcean Droplet

1. **Login to DigitalOcean**
2. **Create New Droplet**:
   - **Image**: Ubuntu 22.04 LTS
   - **Plan**: Basic ($12/month - 2GB RAM, 1 vCPU, 50GB SSD)
   - **Datacenter**: Choose closest to your users
   - **Authentication**: SSH Key (recommended) or Password
   - **Hostname**: temple-tracker-server

3. **Add Firewall Rules** (Create new firewall):
   - SSH: Port 22 (Source: Your IP)
   - HTTP: Port 80 (Source: All IPv4, All IPv6)
   - HTTPS: Port 443 (Source: All IPv4, All IPv6)

### 2. Server Setup

SSH into your droplet:
```bash
ssh root@your_server_ip
```

**Update System & Install Dependencies:**
```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install -y docker-compose

# Install additional tools
apt install -y git curl openssl

# Start Docker service
systemctl start docker
systemctl enable docker
```

### 3. Deploy Application

**Clone your repository:**
```bash
cd /opt
git clone https://github.com/yourusername/temple-tracker.git
cd temple-tracker
```

**Run deployment script:**
```bash
./deploy.sh your-domain.com
```

The script will:
- ✅ Generate secure passwords
- ✅ Build and start all containers
- ✅ Create admin user
- ✅ Run health checks

### 4. Domain Setup (Optional but Recommended)

**Point your domain to the server:**
1. Go to your domain registrar (GoDaddy, Namecheap, etc.)
2. Add A record: `@ -> your_server_ip`
3. Add CNAME record: `www -> your-domain.com`

**Wait for DNS propagation (5-60 minutes)**

### 5. SSL Certificate Setup

**Run SSL setup:**
```bash
./setup-ssl.sh your-domain.com
```

This will:
- ✅ Install Let's Encrypt SSL certificate
- ✅ Configure automatic renewal
- ✅ Update nginx for HTTPS

## 📋 Post-Deployment

### Access Your Application
- **Without Domain**: `http://your_server_ip`
- **With Domain**: `https://your-domain.com`

### Default Admin Login
- **Username**: `admin`
- **Email**: `admin@gmail.com`
- **Password**: `admin123`

**⚠️ Important**: Change the admin password immediately after first login!

### Verify Deployment
```bash
# Check container status
docker-compose -f docker-compose.prod.yml ps

# Check logs
docker-compose -f docker-compose.prod.yml logs

# Test endpoints
curl http://localhost:3001/api/health
curl https://your-domain.com/health
```

## 🔧 Management Commands

### Start/Stop Application
```bash
# Stop all services
docker-compose -f docker-compose.prod.yml down

# Start all services
docker-compose -f docker-compose.prod.yml up -d

# Restart specific service
docker-compose -f docker-compose.prod.yml restart backend
```

### View Logs
```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend
```

### Database Management
```bash
# Access MongoDB
docker exec -it temple-tracker-mongodb-prod mongosh

# Backup database
docker exec temple-tracker-mongodb-prod mongodump --out /backup
docker cp temple-tracker-mongodb-prod:/backup ./backup-$(date +%Y%m%d)

# Restore database
docker cp ./backup temple-tracker-mongodb-prod:/backup
docker exec temple-tracker-mongodb-prod mongorestore /backup
```

### SSL Certificate Management
```bash
# Manual renewal
./ssl-renew.sh

# Check certificate status
sudo certbot certificates

# View renewal logs
tail -f ssl-renewal.log
```

## 🔒 Security Best Practices

### 1. Change Default Passwords
- Admin user password
- MongoDB root password (in .env.production)
- JWT secret key

### 2. Firewall Configuration
```bash
# Enable UFW firewall
ufw enable
ufw allow ssh
ufw allow http
ufw allow https
```

### 3. Regular Updates
```bash
# Update system packages
apt update && apt upgrade -y

# Update Docker images
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

### 4. Monitoring
```bash
# Install htop for monitoring
apt install htop

# Monitor containers
docker stats

# Monitor disk space
df -h
```

## 🆘 Troubleshooting

### Common Issues

**1. Port Already in Use**
```bash
# Find process using port 80/443
sudo lsof -i :80
sudo lsof -i :443

# Kill process if needed
sudo kill -9 [PID]
```

**2. SSL Certificate Issues**
```bash
# Check certificate validity
openssl x509 -in ssl/cert.pem -text -noout

# Regenerate certificate
rm -rf ssl/*
./setup-ssl.sh your-domain.com
```

**3. Container Won't Start**
```bash
# Check container logs
docker logs temple-tracker-backend-prod

# Check system resources
free -h
df -h
```

**4. Database Connection Issues**
```bash
# Check MongoDB logs
docker logs temple-tracker-mongodb-prod

# Test connection
docker exec temple-tracker-backend-prod npm run seed:admin
```

### Log Locations
- **Application Logs**: `docker-compose logs`
- **Nginx Logs**: Inside frontend container `/var/log/nginx/`
- **SSL Renewal**: `./ssl-renewal.log`

## 📈 Scaling & Optimization

### Performance Tuning
1. **Increase Droplet Size**: For more users, upgrade to higher RAM/CPU
2. **Database Optimization**: Add indexes, enable compression
3. **CDN Setup**: Use DigitalOcean Spaces for static files
4. **Load Balancer**: For multiple servers

### Backup Strategy
```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p backups

# Database backup
docker exec temple-tracker-mongodb-prod mongodump --out /backup
docker cp temple-tracker-mongodb-prod:/backup ./backups/db_$DATE

# Application backup
tar -czf backups/app_$DATE.tar.gz --exclude=node_modules --exclude=.git .

echo "Backup completed: $DATE"
EOF

chmod +x backup.sh
```

### Monitoring Setup
- Set up DigitalOcean Monitoring
- Configure email alerts
- Use external monitoring (UptimeRobot, etc.)

## 💰 Cost Estimation

| Component | Monthly Cost |
|-----------|-------------|
| Droplet (2GB RAM) | $12 |
| Domain (optional) | $10-15/year |
| **Total** | ~$12-15/month |

## 🔄 Updates & Maintenance

### Application Updates
```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up --build -d
```

### System Maintenance
- **Weekly**: Check logs and disk space
- **Monthly**: Update system packages
- **Quarterly**: Review security settings and backups

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Docker container logs
3. Check DigitalOcean community forums
4. Contact your system administrator

**Remember**: Always test changes in a staging environment first!