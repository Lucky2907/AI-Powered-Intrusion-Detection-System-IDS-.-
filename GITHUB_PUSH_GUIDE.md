# 🚀 Push to GitHub Guide

## Step 1: Open a NEW PowerShell Terminal

Press `Ctrl + Shift + P` → Type "New Terminal" → Select PowerShell

## Step 2: Navigate to Project & Initialize Git

```powershell
cd "C:\Users\dhaun\Desktop\New Year\AI-IDS-Project"
git init
```

## Step 3: Configure Git (First Time Only)

```powershell
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

## Step 4: Add All Files

```powershell
git add .
```

## Step 5: Commit Changes

```powershell
git commit -m "Initial commit: AI-Powered IDS with PostgreSQL"
```

## Step 6: Create GitHub Repository

1. Go to https://github.com
2. Click **"+"** → **"New repository"**
3. Name it: `AI-IDS-Project`
4. Choose **Public** or **Private**
5. **DON'T** initialize with README (we already have files)
6. Click **"Create repository"**

## Step 7: Link & Push to GitHub

GitHub will show you commands. Use these:

```powershell
git remote add origin https://github.com/YOUR-USERNAME/AI-IDS-Project.git
git branch -M main
git push -u origin main
```

**Replace `YOUR-USERNAME` with your actual GitHub username!**

## 🔐 If Asked for Credentials

- **Username**: Your GitHub username
- **Password**: Use a **Personal Access Token** (not your password)
  
  Create token at: https://github.com/settings/tokens
  - Click "Generate new token (classic)"
  - Select: `repo` (full control)
  - Copy the token and use it as password

## ✅ Verify

Go to `https://github.com/YOUR-USERNAME/AI-IDS-Project` to see your code!

---

## 📝 Quick Commands Summary

```powershell
# Navigate
cd "C:\Users\dhaun\Desktop\New Year\AI-IDS-Project"

# Initialize
git init

# Add files
git add .

# Commit
git commit -m "Initial commit: AI-Powered IDS with PostgreSQL"

# Link remote
git remote add origin https://github.com/YOUR-USERNAME/AI-IDS-Project.git

# Push
git branch -M main
git push -u origin main
```

## 🔄 Future Updates

After making changes:

```powershell
git add .
git commit -m "Description of changes"
git push
```

---

**Note**: The `.gitignore` file I created will exclude:
- `node_modules/`
- `.env` (sensitive data)
- `logs/`
- Database files
- Python cache files
