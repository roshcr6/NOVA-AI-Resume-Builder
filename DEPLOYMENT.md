# NOVA - Deployment Guide

This guide will help you deploy NOVA to the internet for free using industry-standard platforms.

## 🌐 Deployment Architecture

```
Frontend (Vercel) ──────► Backend (Render) ──────► MongoDB (Atlas)
   React/Vite              Node.js/Express           Cloud Database
```

---

## 📋 Prerequisites

- GitHub account
- MongoDB Atlas account (free): https://www.mongodb.com/cloud/atlas/register
- Vercel account (free): https://vercel.com/signup
- Render account (free): https://render.com/register
- Google Gemini API key: https://aistudio.google.com/app/apikey

---

## Step 1: Setup MongoDB Atlas (Database)

### 1.1 Create Cluster
1. Go to https://www.mongodb.com/cloud/atlas/register
2. Sign up and create a **Free M0 cluster**
3. Choose a cloud provider and region (closest to your users)
4. Cluster name: `nova-production`

### 1.2 Configure Security
1. Click **Database Access** → **Add New Database User**
   - Username: `nova-admin`
   - Password: Generate a strong password (save it!)
   - Database User Privileges: **Read and write to any database**

2. Click **Network Access** → **Add IP Address**
   - Click **Allow Access from Anywhere** (0.0.0.0/0)
   - Confirm

### 1.3 Get Connection String
1. Click **Database** → **Connect** → **Connect your application**
2. Copy the connection string (looks like):
   ```
   mongodb+srv://nova-admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
3. Replace `<password>` with your database password
4. Add database name before the `?`:
   ```
   mongodb+srv://nova-admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/nova-resume?retryWrites=true&w=majority
   ```

---

## Step 2: Deploy Backend to Render

### 2.1 Prepare Repository
1. Commit all changes:
   ```powershell
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

### 2.2 Create Web Service on Render
1. Go to https://render.com/
2. Click **New +** → **Web Service**
3. Connect your GitHub repository
4. Select your repository: `hackathon-team-hak-11`

### 2.3 Configure Build Settings
- **Name**: `nova-backend`
- **Region**: Choose closest to you
- **Branch**: `main`
- **Root Directory**: `backend`
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Instance Type**: `Free`

### 2.4 Add Environment Variables
Click **Environment** → **Add Environment Variable**:

```bash
# Required
MONGODB_URI=mongodb+srv://nova-admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/nova-resume?retryWrites=true&w=majority
GEMINI_API_KEY=your_gemini_api_key_here
NODE_ENV=production

# Frontend URL (you'll update this after deploying frontend)
FRONTEND_URL=https://your-frontend.vercel.app

# Optional
PORT=5000
```

### 2.5 Deploy
1. Click **Create Web Service**
2. Wait for deployment (3-5 minutes)
3. Copy your backend URL: `https://nova-backend-xxxx.onrender.com`

⚠️ **Note**: Render free tier spins down after 15 minutes of inactivity. First request may take 30-60 seconds.

---

## Step 3: Deploy Frontend to Vercel

### 3.1 Update Frontend Environment
1. Edit `frontend/.env`:
   ```env
   VITE_API_URL=https://nova-backend-xxxx.onrender.com/api
   ```

2. Commit changes:
   ```powershell
   git add frontend/.env
   git commit -m "Update API URL for production"
   git push origin main
   ```

### 3.2 Deploy to Vercel
1. Go to https://vercel.com/
2. Click **Add New** → **Project**
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. Add Environment Variable:
   ```
   VITE_API_URL=https://nova-backend-xxxx.onrender.com/api
   ```

6. Click **Deploy**
7. Wait for deployment (2-3 minutes)

### 3.3 Update Backend CORS
1. Go back to Render dashboard
2. Update `FRONTEND_URL` environment variable with your Vercel URL:
   ```
   FRONTEND_URL=https://your-project.vercel.app
   ```
3. Click **Save Changes** (this will redeploy)

---

## Step 4: Test Your Deployment

### 4.1 Access Your Application
1. Visit your Vercel URL: `https://your-project.vercel.app`
2. Test the following flows:
   - **Generate Resume**: From GitHub URL or manual entry
   - **Analyze Resume**: Upload PDF and get ATS score
   - **Job Apply**: Search jobs and generate emails

### 4.2 Verify Backend
1. Visit: `https://nova-backend-xxxx.onrender.com/api/session/create`
2. Should return: `{"success":true,"data":{...}}`

---

## 🔧 Alternative: Deploy to Railway (Backend Alternative)

Railway is faster than Render and doesn't spin down.

### Railway Setup
1. Go to https://railway.app/
2. Click **New Project** → **Deploy from GitHub repo**
3. Select repository and **Add variables**:
   ```
   MONGODB_URI=your_mongodb_atlas_uri
   GEMINI_API_KEY=your_key
   FRONTEND_URL=https://your-vercel-app.vercel.app
   NODE_ENV=production
   ```
4. Set **Root Directory**: `backend`
5. Railway will auto-detect Node.js and deploy

---

## 🔧 Alternative: Deploy to Netlify (Frontend Alternative)

### Netlify Setup
1. Go to https://www.netlify.com/
2. **Add new site** → **Import from Git**
3. Configure:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`
4. Environment variables:
   ```
   VITE_API_URL=https://your-backend.onrender.com/api
   ```

---

## 📊 Cost Breakdown (Free Tier)

| Service | Plan | Limits |
|---------|------|--------|
| MongoDB Atlas | M0 Free | 512MB storage |
| Render | Free | 750 hours/month, spins down after 15min |
| Vercel | Hobby Free | 100GB bandwidth, unlimited projects |
| **Total** | **$0/month** | Perfect for portfolio/demos |

### Paid Options (Optional)
- **MongoDB Atlas**: $9/month (M10 cluster, 10GB)
- **Render**: $7/month (no spin down, always active)
- **Vercel Pro**: $20/month (better analytics)

---

## 🚀 One-Click Deploy (Future Enhancement)

### Add Deploy Buttons to README

**Deploy to Vercel:**
```markdown
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/nova-resume&root-directory=frontend&env=VITE_API_URL)
```

**Deploy to Render:**
```markdown
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)
```

Create `render.yaml` in project root:
```yaml
services:
  - type: web
    name: nova-backend
    env: node
    region: oregon
    plan: free
    buildCommand: cd backend && npm install
    startCommand: cd backend && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: MONGODB_URI
        sync: false
      - key: GEMINI_API_KEY
        sync: false
      - key: FRONTEND_URL
        sync: false
```

---

## 🐛 Troubleshooting

### Backend Issues

**Problem**: "Cannot connect to MongoDB"
- ✅ Check MongoDB Atlas IP whitelist (0.0.0.0/0)
- ✅ Verify connection string has correct password
- ✅ Check database user permissions

**Problem**: CORS errors
- ✅ Update `FRONTEND_URL` in Render to match Vercel URL
- ✅ Redeploy backend after changing env vars

**Problem**: 404 on API calls
- ✅ Verify `VITE_API_URL` includes `/api` at the end
- ✅ Check backend logs on Render dashboard

### Frontend Issues

**Problem**: Blank page
- ✅ Check browser console for errors
- ✅ Verify build succeeded on Vercel
- ✅ Check `VITE_API_URL` is set correctly

**Problem**: API calls timeout
- ✅ Render free tier spins down - wait 60 seconds for cold start
- ✅ Consider upgrading to paid tier ($7/month)

---

## 🔒 Security Checklist

Before going live:

- [ ] Never commit `.env` files to Git (already in `.gitignore`)
- [ ] Use strong database passwords (16+ characters)
- [ ] Rotate API keys if accidentally exposed
- [ ] Enable MongoDB Atlas backup (Paid feature)
- [ ] Monitor Render logs for suspicious activity
- [ ] Set up custom domain with HTTPS (Vercel/Render support this)

---

## 📈 Performance Optimization

### Backend
1. Enable Render's **Background Workers** for long-running tasks
2. Add Redis caching for job search results (optional)
3. Upgrade to paid tier to avoid cold starts

### Frontend
1. Vercel automatically optimizes:
   - Image compression
   - Code splitting
   - CDN distribution
2. Enable Vercel Analytics (free)

### Database
1. Create indexes in MongoDB:
   ```javascript
   db.resumes.createIndex({ sessionId: 1, isActive: 1 })
   db.analyses.createIndex({ sessionId: 1, createdAt: -1 })
   ```

---

## 🌐 Custom Domain (Optional)

### Add Custom Domain to Vercel
1. Buy domain (Namecheap, Google Domains, etc.)
2. Vercel Dashboard → **Domains** → **Add Domain**
3. Follow DNS configuration steps
4. Update `FRONTEND_URL` in Render backend

### Add Custom Domain to Render
1. Render Dashboard → **Settings** → **Custom Domain**
2. Add your domain: `api.yourdomain.com`
3. Update DNS CNAME record
4. Update `VITE_API_URL` in Vercel

---

## 📞 Support

If you encounter issues:
- Check Render logs: Dashboard → **Logs**
- Check Vercel deployment logs: Dashboard → **Deployments** → **View Logs**
- MongoDB Atlas logs: **Database** → **Metrics**

---

## ✅ Deployment Complete!

Your NOVA application is now live and accessible worldwide! 🎉

**Next Steps:**
1. Share your frontend URL with users
2. Monitor application performance
3. Set up error tracking (Sentry, LogRocket)
4. Consider adding authentication for user accounts
5. Implement usage analytics

---

**Production URLs:**
- **Frontend**: `https://your-project.vercel.app`
- **Backend API**: `https://nova-backend-xxxx.onrender.com/api`
- **Database**: MongoDB Atlas (managed)
