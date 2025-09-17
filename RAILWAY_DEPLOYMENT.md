# 🚂 Railway Deployment Guide for Temple Tracker

Railway deployment guide for the Temple Tracker MERN application.

## 🚀 Quick Railway Deployment

### Option 1: Deploy Backend Only (Recommended)

1. **Create Railway Account**: Go to https://railway.app
2. **New Project**: Click "New Project" → "Deploy from GitHub repo"
3. **Select Repository**: Choose `vigneshr-codes/temple-tracker`
4. **Configure Service**:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### Option 2: Deploy Both Services Separately

#### Backend Service:
1. Create new Railway project
2. Add service from GitHub repo
3. Set **Root Directory**: `backend`
4. Configure environment variables (see below)

#### Frontend Service:
1. Add another service to same project
2. Set **Root Directory**: `frontend` 
3. **Build Command**: `npm run build`
4. **Start Command**: `npm run preview`

## ⚙️ Environment Variables

### Backend Service Variables:
```env
NODE_ENV=production
PORT=3000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/templetracker
JWT_SECRET=your_jwt_secret_here_at_least_32_chars
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30
```

### Frontend Service Variables:
```env
VITE_API_URL=https://your-backend-service.railway.app/api
VITE_APP_NAME=Temple Tracker
VITE_TEMPLE_NAME=Sri Krishna Temple
```

## 🗄️ Database Setup

### Option 1: Railway PostgreSQL (Convert from MongoDB)
1. Add PostgreSQL database service in Railway
2. Update backend to use PostgreSQL instead of MongoDB

### Option 2: MongoDB Atlas (Recommended)
1. Create account at https://cloud.mongodb.com
2. Create free cluster
3. Get connection string
4. Add to `MONGO_URI` environment variable

### Option 3: Railway MongoDB Plugin
1. Add MongoDB plugin to your Railway project
2. Use provided connection string

## 🔧 Troubleshooting Common Issues

### Build Failures
```bash
# If Railway can't find package.json
# Make sure you set Root Directory correctly

# Backend: Root Directory = backend
# Frontend: Root Directory = frontend
```

### Port Issues
```javascript
// Make sure your backend server.js uses Railway's PORT
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
```

### CORS Issues
```javascript
// Update CORS in backend to include Railway domain
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://your-frontend-service.railway.app'
  ],
  credentials: true
};
```

## 📦 Alternative: Single Service Deployment

If you want to deploy everything as one service:

1. **Root Directory**: Leave empty (root)
2. **Build Command**: `npm run railway-build`
3. **Start Command**: `npm start`
4. **Environment Variables**: Include all variables above

## 🔄 Auto-Deploy Setup

1. Connect GitHub repository
2. Enable auto-deploy on main branch
3. Every push to main will trigger new deployment

## 💡 Pro Tips

1. **Separate Services**: Deploy backend and frontend as separate services for better scalability
2. **Environment Separation**: Use different Railway projects for staging/production
3. **Monitoring**: Use Railway's built-in metrics and logs
4. **Custom Domain**: Add your domain in Railway dashboard
5. **Database Backups**: Set up regular backups for your database

## 🆘 If Deployment Still Fails

1. **Check Logs**: Go to Railway dashboard → Your service → Logs
2. **Common Issues**:
   - Missing environment variables
   - Wrong Node.js version
   - Database connection failures
   - CORS configuration

3. **Alternative Deployment**:
   - Try deploying only the backend first
   - Use Railway templates for MERN apps
   - Deploy frontend to Vercel/Netlify instead

## 📞 Support

- Railway Discord: https://discord.gg/railway
- Railway Documentation: https://docs.railway.app
- GitHub Issues: Create issue in this repository

---

**Railway URL Structure:**
- Backend: `https://your-backend-service.railway.app`
- Frontend: `https://your-frontend-service.railway.app`