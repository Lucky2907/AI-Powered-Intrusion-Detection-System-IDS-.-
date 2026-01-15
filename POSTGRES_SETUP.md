# 🐘 PostgreSQL Setup Guide

## Step 1: Configure PostgreSQL in pgAdmin4

1. **Open pgAdmin4**
2. **Check PostgreSQL Server is running**
   - You should see "PostgreSQL 16" (or your version) in the left sidebar
   - If not, right-click and "Connect Server"

3. **Verify Connection Settings**
   - Host: `localhost`
   - Port: `5432` (default)
   - Username: `postgres` (or your username)
   - Password: (the one you set during PostgreSQL installation)

## Step 2: Update Backend Configuration

The `.env` file has been created in the `backend` folder. **Update the password**:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ai_ids_database
DB_USER=postgres
DB_PASSWORD=your_actual_postgres_password_here  # ⚠️ CHANGE THIS
```

## Step 3: Install PostgreSQL Node Package (if needed)

The `pg` package is already in package.json, but run this to ensure:

```powershell
cd backend
npm install
```

## Step 4: Create Database & Tables

Run the setup script:

```powershell
cd backend
node setup-postgres.js
```

This will:
- ✅ Create the `ai_ids_database` database
- ✅ Create all tables (users, traffic_logs, alerts, etc.)
- ✅ Create default users (admin, analyst, viewer)

## Step 5: Start the Backend

```powershell
node server.js
```

You should see:
```
✅ Connected to database
Server running on port 3000 | WebSocket enabled
```

## 🔍 Verify in pgAdmin4

1. In pgAdmin4, refresh the server
2. Expand: **Servers → PostgreSQL → Databases → ai_ids_database**
3. Expand: **Schemas → public → Tables**
4. You should see 6 tables:
   - users
   - traffic_logs
   - alerts
   - blocked_ips
   - system_metrics
   - audit_logs

## 🐛 Troubleshooting

### Error: "password authentication failed"
- Update `DB_PASSWORD` in `.env` file with your actual PostgreSQL password

### Error: "database does not exist"
- The script creates it automatically, but if it fails:
  ```sql
  -- Run this in pgAdmin4 Query Tool:
  CREATE DATABASE ai_ids_database;
  ```

### Error: "connect ECONNREFUSED"
- PostgreSQL service is not running
- In Windows: Open Services → Find "postgresql-x64-16" → Start

### Check if PostgreSQL is Running
```powershell
# In PowerShell:
Get-Service -Name postgresql*
```

Should show "Running" status.

## 📊 View Data in pgAdmin4

1. Right-click on a table (e.g., `users`)
2. Select **View/Edit Data → All Rows**
3. You'll see the 3 default users

## 🔄 Reset Database (if needed)

To completely reset and recreate tables:

```javascript
// In setup-postgres.js, change line 47:
await db.sequelize.sync({ force: true }); // true = drops tables first
```

Then run `node setup-postgres.js` again.

---

## ✅ Success Checklist

- [ ] PostgreSQL service is running
- [ ] Updated `.env` with correct password
- [ ] Ran `node setup-postgres.js` successfully
- [ ] See 6 tables in pgAdmin4
- [ ] Backend starts without errors
- [ ] Can login with admin/admin123

**Need help?** Check the troubleshooting section above!
