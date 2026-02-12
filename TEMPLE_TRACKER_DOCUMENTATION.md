# Temple Tracker — Flow Documentation & Feature Reference

## Application Overview

Temple Tracker is a web-based management system for temple administration, handling donations, inventory, expenses, events, user management, and multi-channel donor notifications. Built on the MERN stack and deployable via Docker.

---

## System Architecture

### Tech Stack
- **Frontend**: React.js (Vite), Redux Toolkit, Tailwind CSS, i18next (English/Tamil)
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT via httpOnly cookies
- **Notifications**: WhatsApp Business API (Meta), MSG91 SMS, Nodemailer SMTP
- **Security**: AES-256-GCM encryption for stored secrets, rate limiting, Helmet.js

### Project Structure
```
temple-tracker/
├── frontend/src/
│   ├── components/       # Layout (collapsible sidebar), DonationReceipt, QRScanner
│   ├── pages/            # Dashboard, Donations, Inventory, Expenses, Funds, Events, Settings, Users
│   ├── features/         # Redux slices (auth, donations, inventory, expenses, funds, events, settings, ui)
│   └── utils/            # permissions.js (canAccessModule)
└── backend/
    ├── controllers/      # donations, inventory, expenses, funds, events, users, settings, auth
    ├── models/           # User, Donation, Inventory, Expense, Fund, Event, Settings, NotificationLog
    ├── routes/           # per-module + settings (specific routes before /:section)
    ├── middleware/        # auth (protect), checkPermission, rateLimiter
    └── utils/            # notification.js, encrypt.js
```

---

## User Roles & Permissions

### Four Built-in Roles

| Role | Description |
|------|-------------|
| **Admin** | Full system access — all modules, user management, settings |
| **Manager** | Operational management — create/edit most modules, read-only funds/users |
| **Volunteer** | Data entry — create/read donations, expenses, inventory |
| **Viewer** | Read-only access to all modules (except users/settings) |

### Default Permission Matrix

| Module | Admin | Manager | Volunteer | Viewer |
|--------|-------|---------|-----------|--------|
| Donations | Full CRUD | Create/Read/Update | Create/Read | Read |
| Inventory | Full CRUD | Create/Read/Update | Create/Read/Update | Read |
| Expenses | Full CRUD | Create/Read/Update | Create/Read | Read |
| Funds | Full + Allocate | Read | Read | Read |
| Events | Full CRUD | Create/Read/Update | Read | Read |
| Users | Full CRUD | Read | No Access | No Access |
| Settings | Full Access | No Access | No Access | No Access |

### Granular Per-User Permissions
Admins can override the default matrix per user via the Users page. Each module can be individually enabled/disabled for a specific user, overriding their role defaults. The frontend hides navigation items the user cannot access. Backend middleware enforces permissions on every API request.

---

## Core Module Flows

### 1. Donation Management
```
Donor Info Entry → Donation Details (Cash/UPI/In-Kind) → Amount & Category →
Fund Allocation → Receipt Generation → Donor Notification (WhatsApp/SMS/Email)
```

**Key Features:**
- Donor registration: name, mobile (required), email (optional)
- PAN/Aadhaar collection for 80G tax receipts (ITR compliance)
- Donation types: Cash, UPI, In-Kind
- Unique donation IDs with receipt print (expense-voucher style layout)
- QR code scanning for quick item lookup
- Notification sent automatically on creation (if configured)
- `notificationSent` flag tracked on each donation

### 2. Inventory Management
```
Item Registration → Stock Entry → Usage Tracking →
Donor Notification (on item use) → Low Stock Alert (future cron)
```

**Key Features:**
- Item categorization, stock levels, unit tracking
- Usage logging with purpose and quantity
- Donor attribution (links item back to donation)
- Notification to donor when their donated item is used

### 3. Expense Management
```
Expense Entry → Bill Reference → Admin Review →
Approval/Rejection → Fund Deduction → Expense Voucher Print
```

**Key Features:**
- Expense categories, amount, date
- Admin approval workflow with comments
- Fund balance updated on approval
- Expense voucher print with temple header (name with `|` line breaks, circular logo)

### 4. Event Management
```
Event Creation → Scheduling → Resource Planning → Event Execution
```

**Key Features:**
- Event types and scheduling
- Resource and participant tracking
- Dashboard shows active events count

### 5. Fund Management
- Fund categories with balance tracking
- Allocation from donations and deduction on expense approval

---

## Notification System

### Channels

| Channel | Provider | How Configured |
|---------|----------|----------------|
| WhatsApp | Meta Business API (Cloud API) | Settings → Notifications → WhatsApp |
| SMS | MSG91 Flow API | Settings → Notifications → SMS |
| Email | SMTP (Nodemailer) | Settings → Notifications → Email |

### Triggers

| Trigger | Recipient | Channels Available |
|---------|-----------|-------------------|
| Donation Created | Donor (mobile/email from donation) | WhatsApp, SMS, Email |
| Inventory Item Used | Donor (from linked donation) | WhatsApp, SMS, Email |
| Expiry Alert | Admin (adminContact) | SMS, Email (cron — future) |
| Event Reminder | Admin (adminContact) | WhatsApp, SMS, Email (cron — future) |

### Message Templates
Per trigger, per channel, configurable in Settings UI:
- **WhatsApp**: `templateName` + language (`en_US`)
- **SMS**: DLT Template ID + template text
- **Email**: Subject + HTML body

Variable placeholders available in templates:

| Trigger | Variables |
|---------|-----------|
| Donation Cash/UPI | `{donorName}` `{amount}` `{templeName}` `{event}` `{receiptId}` `{date}` |
| Donation In-Kind | `{donorName}` `{itemList}` `{templeName}` `{event}` `{date}` |
| Inventory Used | `{donorName}` `{itemType}` `{quantity}` `{unit}` `{purpose}` `{templeName}` `{date}` |
| Expiry Alert | `{itemName}` `{quantity}` `{expiryDate}` `{daysLeft}` `{templeName}` |
| Event Reminder | `{eventName}` `{eventDate}` `{daysLeft}` `{templeName}` |

### Notification Log
Every notification attempt (sent or failed) is saved to the `NotificationLog` collection:
- Fields: `trigger`, `channel`, `recipient`, `recipientName`, `status` (sent/failed), `error`, `referenceId`, `referenceType`, `templateUsed`, `createdAt`
- Viewable in Settings → Notification Logs (paginated, filterable by status/channel)

### API Key Storage
WhatsApp access token, MSG91 API key, and SMTP password are stored in the Settings collection **encrypted** using AES-256-GCM (`SETTINGS_ENCRYPTION_KEY` env var). They are never stored in plaintext in the database or `.env`.

---

## Settings Module

### Sections
| Section | Contents |
|---------|----------|
| Temple | Name (`|`-separated for multi-line), address, registration no., PAN, logo (PNG/JPG/WebP) |
| Notifications | Channel config (WhatsApp, SMS, Email), per-trigger preferences, message templates, notification logs |
| Security | Password change |
| Backup | Export/import database backup |

### Temple Name Display
The temple name supports `|` as a manual line-break separator. Example:
```
OM MAHALINGESWARA|IDAYAMELUR SRILA SRI MAYANDI SIDDHAR|ARAKKATALAI SIDDHAR PEEDAM
```
This renders as 3 separate lines in: login screen, sidebar, donation receipt header, expense voucher header.

---

## Security Implementation

### Authentication
- JWT tokens issued as **httpOnly cookies** (not localStorage) — prevents XSS token theft
- Token expiry: 30 days (configurable via `JWT_COOKIE_EXPIRE`)
- `protect` middleware validates token on every protected route
- `checkPermission(module, action)` middleware enforces RBAC per route

### Secrets Encryption
- `SETTINGS_ENCRYPTION_KEY` = 32-byte key (64 hex chars), stored in server environment only
- WhatsApp tokens, MSG91 keys, SMTP passwords encrypted with AES-256-GCM before DB storage
- `enc:` prefix detects encrypted values; raw values are auto-encrypted on save

### Rate Limiting
- Auth endpoints (`/api/auth/login`) limited to 10 requests per 15 minutes per IP

### Other
- Helmet.js security headers
- CORS restricted to `FRONTEND_URL`
- Input validation with Joi

---

## Database Collections

| Collection | Purpose |
|------------|---------|
| `users` | Auth, roles, granular permissions per module |
| `donations` | Donor info, amount, type, fund allocation, notificationSent flag |
| `inventoryitems` | Items, stock, usage history, donor attribution |
| `expenses` | Expenses, approval workflow, fund references |
| `funds` | Fund categories and balances |
| `events` | Event scheduling and details |
| `settings` | Temple config, notification channel config, templates, preferences |
| `notificationlogs` | Audit log of every notification attempt |

---

## API Endpoints

### Auth (`/api/auth`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/login` | Login, sets httpOnly JWT cookie |
| POST | `/logout` | Clears cookie |
| GET | `/me` | Current user profile |
| PUT | `/updatepassword` | Change password |

### Donations (`/api/donations`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List donations (paginated, filterable) |
| POST | `/` | Create donation + trigger notification |
| GET | `/:id` | Get donation details |
| PUT | `/:id` | Update donation |
| DELETE | `/:id` | Delete donation (admin) |

### Inventory (`/api/inventory`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List inventory items |
| POST | `/` | Add item |
| GET | `/:id` | Get item |
| PUT | `/:id` | Update item |
| POST | `/:id/use` | Record usage + trigger donor notification |
| GET | `/:id/qr` | Generate QR code |

### Expenses (`/api/expenses`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List expenses |
| POST | `/` | Create expense |
| PUT | `/:id` | Update expense |
| PUT | `/:id/approve` | Approve/reject expense |
| DELETE | `/:id` | Delete expense |

### Funds (`/api/funds`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List funds with balances |
| POST | `/` | Create fund |
| PUT | `/:id` | Update fund |
| DELETE | `/:id` | Delete fund |

### Events (`/api/events`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List events |
| POST | `/` | Create event |
| PUT | `/:id` | Update event |
| DELETE | `/:id` | Delete event |

### Users (`/api/users`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List users (admin) |
| POST | `/` | Create user (admin) |
| PUT | `/:id` | Update user + permissions (admin) |
| DELETE | `/:id` | Delete user (admin) |

### Settings (`/api/settings`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Get all settings |
| PUT | `/:section` | Update section (temple/notifications/security/backup) |
| POST | `/test-notification` | Send test notification |
| GET | `/notification-logs` | Paginated notification log (admin) |
| POST | `/backup` | Create backup |
| GET | `/backup-info` | Backup metadata |
| POST | `/reset` | Reset to defaults |

---

## Environment Variables

### Root `.env` (Docker Compose)
```env
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=your_strong_password
JWT_SECRET=your_jwt_secret_at_least_32_chars
SETTINGS_ENCRYPTION_KEY=64_hex_chars        # openssl rand -hex 32
FRONTEND_URL=http://localhost
```

### Backend `.env` (local development)
```env
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27017/templetracker
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30
SETTINGS_ENCRYPTION_KEY=your_64_hex_key     # openssl rand -hex 32
FRONTEND_URL=http://localhost:5173
```

> Notification service credentials (WhatsApp token, MSG91 key, SMTP password) are **not** stored in `.env`. They are entered in the Settings UI and stored AES-encrypted in MongoDB.

---

## Deployment

### One-Click
```bash
# macOS
./deploy-mac.sh

# Linux
./deploy-anywhere.sh
```

Both scripts:
- Check/install Docker
- Generate secure `MONGO_PASSWORD`, `JWT_SECRET`, `SETTINGS_ENCRYPTION_KEY`
- Write a `docker-compose.yml` with those values
- Pull images from Docker Hub (`vigneshr2011/temple-tracker-*:latest`)
- Start services, wait for health, seed admin user

### Manual Docker Compose
```bash
cp .env.prod .env
# Fill in real values in .env
docker compose up -d
docker exec temple-backend npm run seed:admin
```

### Production (with domain + SSL)
```bash
./deploy.sh your-domain.com
./setup-ssl.sh your-domain.com
```

See `DEPLOYMENT.md` for full server setup and `DOCKER_HUB_DEPLOYMENT.md` for cloud provider guides.

---

## Feature Status

### Fully Implemented
1. User management with role-based + granular per-module permissions
2. Donation tracking — Cash/UPI/In-Kind, PAN/Aadhaar, receipts, fund allocation
3. Inventory management — stock, usage tracking, donor attribution, QR codes
4. Expense management — approval workflow, voucher printing
5. Event management — scheduling, participant tracking
6. Fund management — categories and balance tracking
7. Multi-channel notifications — WhatsApp (Meta), SMS (MSG91), Email (SMTP)
8. Notification logs — full audit trail
9. Settings — temple config, notification setup, templates, preferences, backup
10. Tamil calendar on dashboard
11. Donation receipt print (single card, portrait/landscape)
12. Expense voucher print (landscape optimised)
13. JWT httpOnly cookies + AES-256-GCM secrets encryption
14. Collapsible sidebar, language switcher (English/Tamil)

### Planned / Future
1. Cron-based expiry alerts and event reminders (preferences + templates already wired in UI)
2. Advanced financial analytics and charts
3. Real-time WebSocket updates
4. Mobile app (API is ready)
5. Automated scheduled backups
