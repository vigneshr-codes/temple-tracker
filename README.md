# Temple Tracker

A comprehensive temple management system built with the MERN stack, featuring donation tracking, expense management, inventory control, event planning, and multi-channel donor notifications.

![Temple Tracker](https://img.shields.io/badge/Temple-Tracker-orange?style=for-the-badge)
![MERN Stack](https://img.shields.io/badge/MERN-Stack-blue?style=for-the-badge)
![Docker](https://img.shields.io/badge/Docker-Ready-green?style=for-the-badge)

## Features

### Financial Management
- **Donation Tracking** — Cash, UPI, and in-kind donations with receipt generation
  - PAN/Aadhaar collection for 80G tax receipts (ITR compliance)
  - Unique donation IDs, fund allocation, QR code scanning
- **Expense Management** — Expense entry with admin approval workflow and voucher printing
- **Fund Management** — Fund categories, balance tracking, and allocation
- **Financial Reports** — Export and print reports

### Operations
- **Inventory Management** — Track donated items, stock levels, usage logging, and donor attribution
- **Event Management** — Schedule temple events, ceremonies, and manage participants
- **Tamil Calendar** — Dashboard shows Gregorian + Tamil date (month, season)

### User Management & Permissions
- **Role-based access control** with four roles:
  - **Admin** — Full system access including users and settings
  - **Manager** — Operational management across all modules
  - **Volunteer** — Data entry for donations, expenses, inventory
  - **Viewer** — Read-only access
- **Granular per-module permissions** — admins can customize exactly what each user can access

### Notifications
- **WhatsApp** (Meta Business API) — template-based messages to donors
- **SMS** (MSG91 Flow API) — DLT-compliant SMS with template IDs
- **Email** (SMTP/Nodemailer) — HTML email notifications
- Triggers: donation created, inventory item used
- Per-trigger channel preferences (enable/disable WhatsApp/SMS/Email per trigger)
- Configurable message templates with variable placeholders (`{donorName}`, `{amount}`, etc.)
- **Notification Log** — full audit trail of every notification attempt (sent/failed)
- Test notification button from Settings

### Settings
- Temple profile — name (supports `|` for multi-line display), address, registration, PAN, logo upload (PNG/JPG/WebP)
- Notification channel configuration (API keys stored encrypted in DB)
- Notification preferences and message templates per trigger
- Backup and restore

### Security
- JWT authentication via httpOnly cookies
- AES-256-GCM encryption for stored API keys/secrets
- Role-based access control with granular module permissions
- Rate limiting on auth endpoints
- Helmet.js security headers
- CORS protection

## Tech Stack

### Frontend
- **React** with Vite
- **Redux Toolkit** — state management
- **Tailwind CSS** — styling
- **React Router** — navigation
- **i18next** — English/Tamil language support

### Backend
- **Node.js** + Express
- **MongoDB** + Mongoose
- **JWT** — authentication
- **Bcrypt** — password hashing
- **Nodemailer** — email
- **Axios** — WhatsApp/SMS API calls
- **Multer** — file uploads

### Deployment
- **Docker** & **Docker Compose**
- **Nginx** — reverse proxy
- **Let's Encrypt** — SSL

## Quick Start

### macOS (Docker Desktop)
```bash
chmod +x deploy-mac.sh
./deploy-mac.sh
```

### Linux/Ubuntu
```bash
chmod +x deploy-anywhere.sh
./deploy-anywhere.sh
```

### Manual (Docker Compose)
```bash
# Create .env file in project root
cp .env.prod .env
# Edit .env with your values
nano .env

# Start services
docker compose up -d

# Seed admin user
docker exec temple-backend npm run seed:admin
```

Access:
- Frontend: http://localhost
- Backend API: http://localhost:3001

## Default Admin Credentials

- **Username**: `admin`
- **Email**: `admin@gmail.com`
- **Password**: `admin123`

**Change the password after first login.**

## Environment Variables

### Root `.env` (for Docker Compose)
```env
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=your_strong_mongodb_password
JWT_SECRET=your_jwt_secret_at_least_32_characters
SETTINGS_ENCRYPTION_KEY=64_hex_chars  # openssl rand -hex 32
FRONTEND_URL=http://localhost
```

### Backend `.env` (for local dev)
```env
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27017/templetracker
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30
SETTINGS_ENCRYPTION_KEY=your_hex_key  # openssl rand -hex 32
FRONTEND_URL=http://localhost:5173
```

> `SETTINGS_ENCRYPTION_KEY` must be a 64-character hex string (32 bytes). Used to AES-256-GCM encrypt WhatsApp/SMS API keys stored in the database.

> Notification API credentials (WhatsApp access token, MSG91 key, SMTP password) are configured in Settings UI and stored encrypted — not in `.env`.

## Project Structure

```
temple-tracker/
├── backend/
│   ├── controllers/         # Route controllers
│   ├── models/              # MongoDB models (incl. NotificationLog)
│   ├── routes/              # API routes
│   ├── middleware/          # Auth, permissions, rate limiting
│   ├── utils/               # notification.js, encrypt.js
│   ├── seeders/             # Admin user seeder
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/      # Layout, DonationReceipt, QRScanner, etc.
│   │   ├── pages/           # Dashboard, Donations, Expenses, Settings, etc.
│   │   ├── features/        # Redux slices
│   │   └── utils/           # permissions.js
│   └── public/
├── docker-compose.yml       # Development
├── docker-compose.prod.yml  # Production
├── deploy-mac.sh            # One-click Mac deployment
├── deploy-anywhere.sh       # One-click Linux deployment
└── .env.prod                # Environment variable template
```

## Production Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) and [DOCKER_HUB_DEPLOYMENT.md](DOCKER_HUB_DEPLOYMENT.md) for full production setup including SSL, domain configuration, and server hardening.

## License

MIT License

---

Made with care for temple management and community service.
