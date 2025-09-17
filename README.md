# 🏛️ Temple Tracker

A comprehensive temple management system built with the MERN stack, featuring donation tracking, expense management, inventory control, event planning, and financial reporting.

![Temple Tracker](https://img.shields.io/badge/Temple-Tracker-orange?style=for-the-badge)
![MERN Stack](https://img.shields.io/badge/MERN-Stack-blue?style=for-the-badge)
![Docker](https://img.shields.io/badge/Docker-Ready-green?style=for-the-badge)

## ✨ Features

### 💰 Financial Management
- **Donation Tracking**: Record and categorize donations with receipts
- **Expense Management**: Track expenses with admin approval workflow
- **Fund Management**: Manage temple funds and allocations
- **Financial Reports**: Generate detailed financial reports

### 📦 Operations
- **Inventory Management**: Track temple assets and supplies
- **Event Planning**: Organize temple events and ceremonies
- **User Management**: Role-based access control (Admin, Manager, Volunteer, Viewer)
- **Settings Management**: Configure temple preferences and notifications

### 🔐 Security & Features
- JWT Authentication
- Role-based permissions
- Secure password hashing
- Input validation
- CORS protection
- Rate limiting

## 🛠️ Tech Stack

### Frontend
- **React** (with Vite)
- **Redux Toolkit** (State management)
- **Tailwind CSS** (Styling)
- **React Router** (Navigation)
- **Axios** (HTTP client)

### Backend
- **Node.js** with Express
- **MongoDB** with Mongoose
- **JWT** (Authentication)
- **Bcrypt** (Password hashing)
- **Joi** (Validation)
- **Multer** (File uploads)

### Deployment
- **Docker** & **Docker Compose**
- **Nginx** (Reverse proxy)
- **Let's Encrypt** (SSL certificates)
- **DigitalOcean** ready deployment

## 🚀 Quick Start

### Development Setup

1. **Clone the repository**
   \`\`\`bash
   git clone https://github.com/yourusername/temple-tracker.git
   cd temple-tracker
   \`\`\`

2. **Start with Docker (Recommended)**
   \`\`\`bash
   docker-compose up --build
   \`\`\`

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001

## 🔑 Default Admin Credentials

- **Username**: \`admin\`
- **Email**: \`admin@gmail.com\`
- **Password**: \`admin123\`

**⚠️ Important**: Change the password after first login!

## 📦 Production Deployment

### DigitalOcean Deployment

1. **Create a DigitalOcean Droplet** (Ubuntu 22.04)
2. **Upload your code** to the server
3. **Run deployment script**:
   \`\`\`bash
   ./deploy.sh your-domain.com
   \`\`\`
4. **Setup SSL** (if you have a domain):
   \`\`\`bash
   ./setup-ssl.sh your-domain.com
   \`\`\`

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

## 📁 Project Structure

\`\`\`
temple-tracker/
├── backend/
│   ├── controllers/         # Route controllers
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── middleware/         # Custom middleware
│   ├── config/             # Configuration files
│   ├── seeders/            # Database seeders
│   └── server.js           # Entry point
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── store/          # Redux store
│   │   ├── services/       # API services
│   │   └── utils/          # Utility functions
│   └── public/             # Static assets
├── docker-compose.yml      # Development Docker setup
├── docker-compose.prod.yml # Production Docker setup
├── deploy.sh               # Deployment script
├── setup-ssl.sh            # SSL setup script
└── DEPLOYMENT.md           # Deployment guide
\`\`\`

## 🔧 Environment Variables

### Backend (.env)
\`\`\`env
NODE_ENV=development
PORT=3001
MONGO_URI=mongodb://localhost:27017/templetracker
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30
\`\`\`

### Frontend (.env)
\`\`\`env
VITE_API_URL=http://localhost:3001/api
VITE_APP_NAME=Temple Tracker
VITE_TEMPLE_NAME=Sri Krishna Temple
\`\`\`

## 🚀 Getting Started

1. Clone this repository
2. Run \`docker-compose up --build\`
3. Visit http://localhost:3000
4. Login with admin credentials above

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

Made with ❤️ for temple management and community service.
