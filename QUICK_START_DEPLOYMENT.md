# 🚀 SkillBattle Free Deployment - Quick Start

**Status**: ✅ Ready for Deployment  
**Total Cost**: ₹0/month  
**Deployment Time**: ~10-15 minutes  

---

## 📋 What Has Been Done

✅ **Project pushed to GitHub**
- Repository: https://github.com/m123568anish-lab/SkillBattle
- Branch: main
- All deployment configs committed

✅ **Backend prepared for production**
- CORS configured to read from environment
- Database supports both SQLite and PostgreSQL
- FastAPI ready with all endpoints (/docs, /health, /api/v1/*)
- Environment file template: `backend/.env.production.example`

✅ **Frontend prepared for production**
- Next.js 16 configured for Vercel
- API URL configurable via environment variables
- Environment file template: `frontend/.env.production.example`

✅ **Deployment configurations created**
- `vercel.json` - Frontend deployment config
- `render.yaml` - Backend deployment config
- `DEPLOYMENT_GUIDE.md` - Complete step-by-step guide

✅ **Project structure ready**
- Backend: `backend/` folder
- Frontend: `frontend/` folder
- Both have production environment templates

---

## 🚀 Next Steps — Deploy in 4 Steps

### Step 1️⃣: Database (Neon.tech) — 2 minutes
1. Go to **https://neon.tech** → Sign up with GitHub
2. Create project `skillbattle`
3. Copy connection string: `postgresql://user:pass@...`
4. ✅ Save it

### Step 2️⃣: Backend (Render.com) — 5 minutes
1. Go to **https://render.com** → Sign up with GitHub
2. New Web Service → Select your repo
3. **Build Command**: `cd backend && pip install -r requirements.txt`
4. **Start Command**: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add **Environment Variables**:
   ```
   ENVIRONMENT=production
   DATABASE_URL=postgresql://... (from Neon)
   SECRET_KEY=<generate 64-char string>
   DEBUG=false
   ```
6. Click **Deploy** → Wait 3-5 minutes
7. ✅ Copy backend URL: `https://skillbattle-api.onrender.com`

### Step 3️⃣: Frontend (Vercel) — 3 minutes
1. Go to **https://vercel.com** → Sign up with GitHub
2. Import repo → Select root directory: `frontend`
3. Add **Environment Variable**:
   ```
   NEXT_PUBLIC_API_URL=https://skillbattle-api.onrender.com
   ```
4. Click **Deploy** → Wait 1-2 minutes
5. ✅ Get your URL: `https://skillbattle.vercel.app`

### Step 4️⃣: Keep Backend Alive (UptimeRobot) — 2 minutes
1. Go to **https://uptimerobot.com** → Free account
2. Add Monitor:
   - URL: `https://skillbattle-api.onrender.com/docs`
   - Interval: 5 minutes
3. ✅ Done!

---

## 📁 Files Created/Modified

### Root Level
```
DEPLOYMENT_GUIDE.md          ← Complete deployment instructions
vercel.json                  ← Vercel config (frontend)
render.yaml                  ← Render config (backend)
.gitignore                   ← Updated to allow .env.*.example
```

### Backend
```
backend/.env.production.example  ← Deployment environment template
```

### Frontend
```
frontend/.env.production.example ← Frontend environment template
frontend/.gitignore              ← Updated to allow examples
```

---

## 🔐 Security Notes

✅ **Secrets are NOT committed to GitHub**
- `.env.production` files are in .gitignore
- Only `.env.production.example` templates are committed
- Never commit actual secrets!

✅ **CORS is configured for production**
- Reads from `ALLOWED_ORIGINS` environment variable
- Supports multiple origins (comma-separated)
- Already set up for Vercel URL

✅ **Database credentials**
- Managed in deployment platform (Render/Neon dashboards)
- Never hardcoded
- Use `.env.production` locally for development

---

## 🧪 Testing Checklist

After deploying:

- [ ] Visit `https://your-app.vercel.app` → Should load
- [ ] Open `https://skillbattle-api.onrender.com/docs` → Should show Swagger UI
- [ ] Check frontend console (F12) → No CORS errors
- [ ] Try user action (login, create battle, etc.)
- [ ] Check UptimeRobot monitor → Should be "Up"
- [ ] Wait 30 minutes → Backend should stay alive

---

## 📊 Cost Breakdown

| Service | Free Limit | Cost | Status |
|---------|------------|------|--------|
| **Vercel** | Unlimited | ₹0 | ✅ Unlimited |
| **Render** | 750 hrs/mo | ₹0 | ✅ Enough for 24/7 |
| **Neon** | 0.5 GB | ₹0 | ✅ Enough for ~10k users |
| **UptimeRobot** | 50 monitors | ₹0 | ✅ Plenty |
| **Custom Domain** | Optional | ₹100-500/yr | Optional |
| **TOTAL** | | **₹0** | 🎉 |

---

## 📖 Full Documentation

See **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** for:
- Detailed step-by-step instructions
- Troubleshooting common issues
- Advanced configuration
- Custom domain setup
- Scaling beyond free tier

---

## 🎯 What Happens After Deployment

```
Students open browser
         ↓
   Vercel (Frontend)
   https://skillbattle.vercel.app
         ↓
  Makes API calls via HTTPS
         ↓
   Render (Backend)
   https://skillbattle-api.onrender.com
         ↓
Connects to Neon.tech (Database)
   PostgreSQL on cloud
         ↓
UptimeRobot pings every 5 minutes
    Keeps backend alive!
```

---

## 🆘 Quick Troubleshooting

**CORS Error?** 
→ Update `ALLOWED_ORIGINS` in Render, then redeploy

**Backend returning 502?**
→ Check Render logs (takes 30s on first request after sleep)

**Database connection failed?**
→ Verify DATABASE_URL in Neon dashboard

**Frontend blank?**
→ Check Vercel build logs, ensure `root directory` is `frontend`

**Backend won't stay awake?**
→ Verify UptimeRobot monitor is active

---

## 🔗 Important Links

- **GitHub Repo**: https://github.com/m123568anish-lab/SkillBattle
- **Deployment Guide**: See DEPLOYMENT_GUIDE.md in repo root
- **Neon Docs**: https://neon.tech/docs
- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **FastAPI Docs**: https://fastapi.tiangolo.com
- **Next.js Docs**: https://nextjs.org/docs

---

**Ready?** Start with Step 1: Neon.tech! 🚀

---

Generated: 2025-01-14  
Deployment Stack: Vercel + Render + Neon + UptimeRobot  
Total Cost: ₹0/month ✨
