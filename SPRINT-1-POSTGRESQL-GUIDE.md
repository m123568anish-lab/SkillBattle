# Sprint 1: PostgreSQL Migration - Quick Start Guide

**Status:** Ready to begin after Sprint 0 completion  
**Prerequisite:** Sprint 0 Foundation must be complete ✅  
**Estimated Duration:** 1-2 days  

---

## Pre-Flight Checklist

Before starting Sprint 1, verify:

```bash
# Run verification script
python verify-sprint-0.py

# Expected output: ✅ ALL TESTS PASSED
```

All 8 tests must pass before proceeding.

---

## Sprint 1 Objectives

1. **Setup PostgreSQL Infrastructure**
   - Install PostgreSQL locally or use managed service
   - Create database and user
   - Verify connectivity

2. **Update Configuration**
   - Update `.env.local` with PostgreSQL credentials
   - Change `DATABASE_TYPE` to "postgresql"
   - Verify configuration loads

3. **Verify Migration**
   - Start backend with PostgreSQL
   - Verify all tables created
   - Test health endpoints
   - Verify schema completeness

4. **Documentation**
   - Document PostgreSQL setup process
   - Create migration troubleshooting guide
   - Update README

---

## Quick Start: Local PostgreSQL Setup

### Option 1: Docker (Recommended)

```bash
# Start PostgreSQL container
docker run --name skillbattle-postgres \
  -e POSTGRES_USER=skillbattle \
  -e POSTGRES_PASSWORD=skillbattle \
  -e POSTGRES_DB=skillbattle_db \
  -p 5432:5432 \
  -d postgres:16

# Verify connection
docker exec skillbattle-postgres psql -U skillbattle -d skillbattle_db -c "SELECT 1"
```

### Option 2: Local PostgreSQL Installation

```bash
# Create database
createdb -U postgres -E UTF8 skillbattle_db

# Create user
createuser -U postgres -P skillbattle
# Enter password: skillbattle

# Grant privileges
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE skillbattle_db TO skillbattle"
```

### Option 3: Managed PostgreSQL

- AWS RDS
- Azure Database for PostgreSQL
- Google Cloud SQL
- DigitalOcean Managed Databases

---

## Configuration Update

### Step 1: Update `.env.local`

```bash
# Change from SQLite to PostgreSQL
DATABASE_TYPE=postgresql

# Verify PostgreSQL credentials
POSTGRES_HOST=localhost           # or your host
POSTGRES_PORT=5432              # or your port
POSTGRES_USER=skillbattle        # created above
POSTGRES_PASSWORD=skillbattle    # created above
POSTGRES_DB=skillbattle_db       # created above
```

### Step 2: Verify Backend Recognizes Configuration

```bash
cd backend
python -c "from app.core.config import settings; print(f'Database: {settings.DATABASE_URL[:50]}...')"
```

Expected output: `Database: postgresql://skillbattle:***@localhost:5432/...`

---

## Database Migration

### Start Backend with PostgreSQL

```bash
cd backend

# Start backend (runs init_db() in lifespan)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Expected logs:
```
INFO:app.database.session:🐘 Async engine configured for PostgreSQL
INFO:app.database.database:🐘 Using PostgreSQL database
INFO:app.main:📦 Initializing database...
INFO:app.database.init_db:Creating database tables from registered models...
INFO:app.database.init_db:✅ Tables created: ['users', 'profiles', ...]
```

### Verify Migration

```bash
# Check health endpoints
curl http://localhost:8000/health
# Expected: {"success": true, "status": "healthy"}

curl http://localhost:8000/ready
# Expected: {"success": true, "status": "ready", "database": "connected", "schema": "valid"}

curl http://localhost:8000/health/detailed
# Expected: Shows all 26 tables from PostgreSQL
```

### Verify in PostgreSQL

```bash
# Connect to PostgreSQL
psql -U skillbattle -d skillbattle_db

# List tables
\dt

# Check specific table
SELECT COUNT(*) FROM users;
```

---

## Troubleshooting

### Connection Refused

**Problem:** `psycopg2.OperationalError: could not connect to server`

**Solution:**
```bash
# Verify PostgreSQL is running
psql -U skillbattle -d skillbattle_db -c "SELECT 1"

# Check .env.local credentials
grep POSTGRES_ backend/.env.local

# Verify backend sees correct URL
python -c "from app.core.config import settings; print(settings.DATABASE_URL)"
```

### Authentication Failed

**Problem:** `psycopg2.OperationalError: FATAL: password authentication failed`

**Solution:**
- Verify POSTGRES_USER and POSTGRES_PASSWORD in `.env.local`
- Reset PostgreSQL password:
  ```bash
  # Docker
  docker exec skillbattle-postgres psql -U postgres -c "ALTER USER skillbattle WITH PASSWORD 'skillbattle'"
  
  # Local
  psql -U postgres -c "ALTER USER skillbattle WITH PASSWORD 'skillbattle'"
  ```

### Tables Not Created

**Problem:** `SELECT * FROM users` returns no table

**Solution:**
```bash
# Check backend logs for errors
# Look for "Error" or "Exception" in startup logs

# Verify backend actually ran init_db()
# Should see: "✅ Database initialized successfully"

# Manually create tables if backend fails:
python backend/app/database/init_db.py
```

### Database Exists But Empty

**Problem:** Database exists but no tables

**Solution:**
```bash
# Restart backend to trigger init_db()
# Or manually:
cd backend
python -c "from app.database.init_db import init_db; init_db(); print('✅ Tables created')"
```

---

## Testing Strategy

### 1. Connection Test
```bash
# Verify backend can connect
curl http://localhost:8000/ready
```

### 2. Schema Test
```bash
# Verify all tables exist
curl http://localhost:8000/health/detailed | grep tables
```

### 3. Data Test (optional)
```bash
# Connect to PostgreSQL and query
psql -U skillbattle -d skillbattle_db -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public'"
```

### 4. Functional Test
After migration, test actual API endpoints:
```bash
# Test an existing endpoint
curl http://localhost:8000/api/v1/health
```

---

## Rollback to SQLite

If you need to revert to SQLite:

```bash
# Update .env.local
DATABASE_TYPE=sqlite

# Delete PostgreSQL container (if using Docker)
docker stop skillbattle-postgres
docker rm skillbattle-postgres

# Restart backend
```

The backend will automatically use SQLite when `DATABASE_TYPE=sqlite`.

---

## Alembic Migration Management

After completing Sprint 1, Alembic is ready for future use:

```bash
# Create a new migration
alembic revision --autogenerate -m "Description of changes"

# Apply migrations
alembic upgrade head

# Downgrade
alembic downgrade -1
```

---

## Success Criteria

✅ PostgreSQL running and accessible  
✅ `.env.local` updated with correct credentials  
✅ Backend starts without errors  
✅ All 26 tables created in PostgreSQL  
✅ Health endpoints return "ready" status  
✅ Schema verification passes  
✅ Existing endpoints still work  

---

## Next: Sprint 2-5

After Sprint 1 completion:

1. **Sprint 2:** Create User model and schema
2. **Sprint 3:** JWT token generation and validation
3. **Sprint 4:** Refresh token implementation
4. **Sprint 5:** Auth API endpoints (register, login, refresh, logout, me)

With PostgreSQL in production use, authentication can be implemented cleanly without database switching issues.

---

## Documentation Links

- **Sprint 0:** [SPRINT-0-FOUNDATION-COMPLETE.md](SPRINT-0-FOUNDATION-COMPLETE.md)
- **Configuration:** [backend/app/core/config.py](backend/app/core/config.py)
- **Health Checks:** [backend/app/main.py](backend/app/main.py) (search for `@app.get("/ready")`)
- **Verification:** [verify-sprint-0.py](verify-sprint-0.py)

---

## Getting Help

1. Run verification script: `python verify-sprint-0.py`
2. Check backend logs for detailed error messages
3. Verify `.env.local` has correct credentials
4. Test connection directly: `psql -U skillbattle -d skillbattle_db -c "SELECT 1"`

---

**Ready to migrate to PostgreSQL?** Let's go! 🚀
