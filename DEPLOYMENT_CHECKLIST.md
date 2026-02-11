# 🚀 Quick Deployment Checklist

## Pre-Deployment

- [ ] All code committed to Git
- [ ] `.gitignore` includes `.env` files
- [ ] Gemini API key obtained
- [ ] MongoDB Atlas account created
- [ ] Vercel account created
- [ ] Render account created

## Database Setup (MongoDB Atlas)

- [ ] Free M0 cluster created
- [ ] Database user created with password saved
- [ ] IP whitelist set to 0.0.0.0/0 (allow all)
- [ ] Connection string copied and tested

## Backend Deployment (Render)

- [ ] Repository connected
- [ ] Root directory set to `backend`
- [ ] Build command: `npm install`
- [ ] Start command: `npm start`
- [ ] Environment variables added:
  - [ ] `MONGODB_URI`
  - [ ] `GEMINI_API_KEY`
  - [ ] `NODE_ENV=production`
  - [ ] `FRONTEND_URL` (update after frontend deploy)
- [ ] Service deployed successfully
- [ ] Backend URL saved: `_______________________________`

## Frontend Deployment (Vercel)

- [ ] Repository connected
- [ ] Root directory set to `frontend`
- [ ] Framework preset: Vite
- [ ] Environment variable added:
  - [ ] `VITE_API_URL` (your backend URL + /api)
- [ ] Deployed successfully
- [ ] Frontend URL saved: `_______________________________`

## Post-Deployment

- [ ] Update `FRONTEND_URL` in Render with Vercel URL
- [ ] Redeploy backend on Render
- [ ] Test frontend loads correctly
- [ ] Test resume generation from GitHub
- [ ] Test resume analysis
- [ ] Test job search
- [ ] Check browser console for errors
- [ ] Verify CORS is working (no CORS errors)

## Optional Enhancements

- [ ] Custom domain configured
- [ ] Error tracking setup (Sentry)
- [ ] Analytics setup
- [ ] MongoDB indexes created
- [ ] Backup strategy implemented

## Troubleshooting Resources

If something goes wrong:
1. Check Render logs: Dashboard → Logs
2. Check Vercel deployment logs: Dashboard → Deployments
3. Check browser console: F12 → Console
4. Verify environment variables are set correctly
5. Ensure MongoDB Atlas IP whitelist includes 0.0.0.0/0
6. Wait 60 seconds for Render free tier to wake up

---

## Quick Test Commands

Once deployed, test these endpoints:

```bash
# Test backend health
curl https://your-backend.onrender.com/api/session/create

# Expected: {"success":true,"data":{...}}

# Test frontend
# Visit: https://your-app.vercel.app
# Should load the homepage with animations
```

---

## Environment Variable Quick Reference

**Backend (Render):**
```
MONGODB_URI=mongodb+srv://...
GEMINI_API_KEY=AIza...
FRONTEND_URL=https://your-app.vercel.app
NODE_ENV=production
```

**Frontend (Vercel):**
```
VITE_API_URL=https://your-backend.onrender.com/api
```

---

✅ **Deployment Complete!** Share your app: `https://your-app.vercel.app`
