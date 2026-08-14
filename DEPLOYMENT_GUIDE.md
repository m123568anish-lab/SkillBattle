# 🚀 SkillBattle Deployment Guide

Complete step-by-step guide to deploy SkillBattle on free tier services.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Architecture Overview](#architecture-overview)
3. [Step 1: Database Setup (Neon.tech)](#step-1-database-setup-neontech)
4. [Step 2: Backend Deployment (Render.com)](#step-2-backend-deployment-rendercom)
5. [Step 3: Frontend Deployment (Vercel)](#step-3-frontend-deployment-vercel)
6. [Step 4: Keep Backend Alive (UptimeRobot)](#step-4-keep-backend-alive-uptimerobot)
7. [Verification & Testing](#verification--testing)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

✅ GitHub account with the repository pushed  
✅ Node.js 18+ (for local testing)  
✅ Python 3.9+ (for local testing)  
✅ Project structure:
- `backend/` — FastAPI application
- `frontend/` — Next.js application

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Students (Browser)                   │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│        Vercel CDN (Frontend)                            │
│   https://skillbattle.vercel.app                        │
│   - Next.js 16                                          │
│   - React 18                                            │
│   - Serverless Functions                               │
│   - Automatic HTTPS                                     │
│   - Global Edge Network                                 │
└────────────┬────────────────────────────────────────────┘
             │ (HTTPS API Calls)
             ▼
┌─────────────────────────────────────────────────────────┐
│        Render.com (Backend)                             │
│   https://skillbattle-api.onrender.com                  │
│   - FastAPI (Python)                                    │
│   - Free tier: 750 hrs/month                            │
│   - Sleeps after 15 min idle (UptimeRobot prevents)    │
│   - Auto-deploy from GitHub                            │
└────────────┬────────────────────────────────────────────┘
             │ (SQL over TLS)
             ▼
┌─────────────────────────────────────────────────────────┐
│        Neon.tech (Database)                             │
│   PostgreSQL Serverless                                 │
│   - 0.5 GB free tier                                    │
│   - Supports ~10,000 users                              │
│   - Automatic backups                                   │
│   - Connection pooling included                         │
└─────────────────────────────────────────────────────────┘
```

---

## Step 1: Database Setup (Neon.tech)

### 1.1 Create Neon Account

1. Go to **https://neon.tech**
2. Click **"Sign up with GitHub"**
3. Authorize Neon to access your GitHub account
4. Create a free account (no credit card required)

### 1.2 Create Project

1. Click **"Create a new project"** or **"New project"**
2. **Project name**: `skillbattle`
3. **Database name**: `skillbattle_db` (default is fine)
4. **PostgreSQL version**: Select latest (e.g., 16)
5. Click **"Create project"**

### 1.3 Get Connection String

1. After project creation, you'll see the **Connection String**
2. Look for the string starting with: `postgresql://user:password@...`
3. **Copy the full connection string** (or copy from the "Connection string" section)

Example format:
```
postgresql://user:xxxxxxxxxxxxxxxxxxxx@ep-blue-example.neon.tech/skillbattle_db?sslmode=require
```

### 1.4 Save for Later

Save this connection string. You'll need it in Step 2 when deploying the backend.

✅ **Neon Setup Complete!**

---

## Step 2: Backend Deployment (Render.com)

### 2.1 Create Render Account

1. Go to **https://render.com**
2. Click **"Sign up with GitHub"**
3. Authorize Render to access your GitHub repo
4. Verify your email

### 2.2 Create Web Service

1. In your Render dashboard, click **"New +"** → **"Web Service"**
2. **Select repository**: Choose your `BattleAI` repo
3. **Branch**: `main` (or your deployment branch)
4. Click **"Next"**

### 2.3 Configure Deployment

Fill in the configuration:

| Field | Value |
|-------|-------|
| **Name** | `skillbattle-api` |
| **Environment** | `Python 3` |
| **Region** | Singapore (or closest to you) |
| **Branch** | `main` |
| **Runtime** | Python 3 |
| **Build Command** | `cd backend && pip install -r requirements.txt` |
| **Start Command** | `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT` |

> **Note**: If your project root has the backend folder at the root level, use the commands above. Render will detect the root directory automatically.

### 2.4 Add Environment Variables

Click **"Environment"** on the left sidebar, then **"Add Environment Variables"**:

```
ENVIRONMENT=production
SECRET_KEY=<generate-below>
DATABASE_URL=<from-neon-step-1>
ALLOWED_ORIGINS=<you'll-update-after-vercel>
DEBUG=false
```

#### Generate SECRET_KEY

Run this in your terminal (or use an online generator):

**PowerShell:**
```powershell
-join (1..64 | ForEach-Object { [char][byte]::MinValue + (Get-Random -Maximum 127) })
```

**Python:**
```python
import secrets
print(secrets.token_urlsafe(64))
```

**Linux/Mac:**
```bash
openssl rand -base64 64
```

Use the generated string as your `SECRET_KEY`.

### 2.5 Deploy

1. Make sure all environment variables are set
2. Click **"Create Web Service"** at the bottom
3. Render will start building (takes ~3-5 minutes)
4. Watch the logs in the **"Logs"** tab
5. Once complete, you'll see: **"Service is live"** ✅

### 2.6 Copy Backend URL

1. At the top of your Render dashboard, copy your service URL
2. Format: `https://skillbattle-api.onrender.com`
3. **Save this for Step 3 and Step 4**

### 2.7 Test Backend Health

Open in browser (may take 30 sec to wake up on first request):
```
https://skillbattle-api.onrender.com/docs
```

You should see the FastAPI Swagger UI.

✅ **Backend Deployment Complete!**

---

## Step 3: Frontend Deployment (Vercel)

### 3.1 Create Vercel Account

1. Go to **https://vercel.com**
2. Click **"Sign up with GitHub"**
3. Authorize Vercel
4. Create account

### 3.2 Import Project

1. Click **"Add New..."** → **"Project"**
2. **Search repositories**: Find `BattleAI`
3. Click **"Import"** on the BattleAI repo

### 3.3 Configure Project

1. **Project name**: `skillbattle` (or your choice)
2. **Root directory**: Click **"Edit"** and select **`frontend`**
3. **Framework**: Should auto-detect as **Next.js**
4. **Build command**: `next build` (usually auto-filled)
5. **Output directory**: `.next` (auto-filled)
6. **Node version**: `18.x` or `20.x`

### 3.4 Add Environment Variables

Before deploying, add environment variables:

1. Scroll down to **"Environment Variables"**
2. Add this variable:

```
NEXT_PUBLIC_API_URL=https://skillbattle-api.onrender.com
```

(Replace with your actual Render backend URL from Step 2.6)

### 3.5 Deploy

1. Click **"Deploy"** at the bottom
2. Vercel will build your frontend (takes ~2 minutes)
3. Once complete, you'll see **"Congratulations! Your project has been successfully deployed"** ✅
4. Click the URL preview to visit your live app

### 3.6 Copy Frontend URL

1. At the top of Vercel dashboard, copy your domain
2. Format: `https://skillbattle.vercel.app` (or custom domain)
3. **Save this URL**

✅ **Frontend Deployment Complete!**

---

## Step 4: Update Backend CORS & Keep Alive

### 4.1 Update Backend Environment Variables

1. Go back to **Render.com**
2. Open your `skillbattle-api` service
3. Click **"Environment"** on the left
4. Find `ALLOWED_ORIGINS` variable
5. Update it to include your Vercel URL:
   ```
   ALLOWED_ORIGINS=https://skillbattle.vercel.app
   ```
6. Click **"Save"** (should auto-redeploy)

### 4.2 Set Up UptimeRobot (Keep Backend Alive)

Free Render services sleep after 15 minutes of inactivity. UptimeRobot will ping your backend every 5 minutes to prevent sleep.

1. Go to **https://uptimerobot.com**
2. Click **"Sign up for free"**
3. Create account and verify email

#### Add Monitor

1. In UptimeRobot dashboard, click **"Add Monitor"**
2. Fill in details:

| Field | Value |
|-------|-------|
| **Monitor Type** | HTTP(s) |
| **Friendly Name** | `SkillBattle Backend` |
| **URL** | `https://skillbattle-api.onrender.com/docs` |
| **Monitoring Interval** | 5 minutes |
| **Alert Contacts** | Email (optional) |

3. Click **"Create Monitor"**
4. You should see: **"Monitor is active"** ✅

This will ping your backend every 5 minutes, preventing it from sleeping.

✅ **UptimeRobot Setup Complete!**

---

## Verification & Testing

### 4.1 Test Frontend

1. Open https://skillbattle.vercel.app in browser
2. Check console (F12) for any CORS or network errors
3. Try to interact with the app (login, create battle, etc.)

### 4.2 Test Backend API

Open in browser:
```
https://skillbattle-api.onrender.com/docs
```

You should see the Swagger UI with all API endpoints.

### 4.3 Test Database Connection

In Neon.tech dashboard:
1. Click on your project
2. Go to **"Monitoring"** tab
3. Check for active connections

### 4.4 Check Logs

**Backend logs (Render):**
- Open your service → **"Logs"** tab
- Look for startup messages and any errors

**Frontend logs (Vercel):**
- Open project → **"Deployments"** → Click the latest → **"Build Logs"**

---

## Troubleshooting

### Issue: CORS Error in Browser Console
**Error:** `Access to XMLHttpRequest blocked by CORS`

**Solution:**
1. Go to Render dashboard
2. Check `ALLOWED_ORIGINS` includes your Vercel URL
3. Redeploy the backend service
4. Clear browser cache (Ctrl+Shift+Del)
5. Try again

### Issue: Backend Returns 502 Bad Gateway

**Solutions:**
1. **First request slow?** First request after sleep can take 30+ sec. Wait and refresh.
2. **Check Render logs** for errors:
   - Go to service → **"Logs"** tab
   - Look for Python errors or stack traces
3. **Check environment variables**:
   - Make sure `DATABASE_URL` is correct
   - Verify `SECRET_KEY` is set
4. **Check Neon connection**:
   - Go to Neon dashboard
   - Verify database is active
   - Try connecting from your local machine

### Issue: Frontend Shows Blank or 404

**Solutions:**
1. Verify `Root Directory` is set to `frontend` in Vercel
2. Check `next.config.ts` is present in frontend/
3. Look at Vercel **Build Logs** for errors
4. Manually redeploy: Vercel dashboard → **Deployments** → Click **...** → **Redeploy**

### Issue: Database Connection Timeout

**Solutions:**
1. Check `DATABASE_URL` format is correct
2. Verify Neon project is **active** (not paused)
3. Check if you've exceeded free tier (0.5 GB)
4. Neon may require SSL: add `?sslmode=require` to URL

### Issue: Backend Won't Stay Awake

**Solution:**
1. Verify UptimeRobot monitor is **active**
2. Check Render free tier includes 750 hrs/month (you likely have plenty)
3. Manually test backend URL in browser to confirm it's up
4. Check UptimeRobot logs: dashboard → **Status Page** → click your monitor

### Issue: "Service quota exceeded" on Render

This means you're using free tier services. Each account gets:
- **750 hours/month per service** (plenty for one app)
- **0.5 GB RAM** (sufficient)
- Upgrade to paid if you need more resources

---

## Post-Deployment Checklist

- [ ] Frontend loads at Vercel URL
- [ ] Backend API responds at `/docs`
- [ ] CORS errors are gone
- [ ] User can create account/login
- [ ] Battle arena works
- [ ] File uploads work (if applicable)
- [ ] UptimeRobot is monitoring backend
- [ ] Custom domain configured (optional)

---

## Next Steps

### Scale Beyond Free Tier

When you're ready to support more users:

| Service | Free | Paid |
|---------|------|------|
| **Vercel** | Unlimited | $20/month (Pro) |
| **Render** | 750 hrs/mo | $7/month → |
| **Neon** | 0.5 GB | $0.16/GB/month |
| **UptimeRobot** | 50 monitors | $9.99/month |

### Enable Custom Domain

**Vercel:**
1. Project settings → **Domains**
2. Add your domain (e.g., skillbattle.io)
3. Follow DNS setup

**Render:**
1. Service → **Settings** → **Custom Domain**
2. Add domain → follow DNS setup

### Enable CI/CD Pipeline

Both Vercel and Render support automatic deployments on git push. Already enabled!

---

## Support & Documentation

- **Vercel Docs**: https://vercel.com/docs
- **Render Docs**: https://render.com/docs
- **Neon Docs**: https://neon.tech/docs
- **FastAPI Docs**: https://fastapi.tiangolo.com
- **Next.js Docs**: https://nextjs.org/docs

---

## Cost Summary

| Service | Free Limit | Monthly Cost |
|---------|------------|--------------|
| **Vercel** | Unlimited | ₹0 |
| **Render** | 750 hrs | ₹0 |
| **Neon** | 0.5 GB | ₹0 |
| **UptimeRobot** | 50 monitors | ₹0 |
| **Custom Domain** | Optional | ₹100-500/yr |
| **TOTAL** | | **₹0/month** ✨ |

---

**Deployed by:** GitHub Copilot  
**Last Updated:** 2025-01-14  
**Status:** Production Ready 🚀
