# Quick GitHub Upload Guide

## 🚀 Easiest Method: GitHub Desktop

1. **Download GitHub Desktop**: https://desktop.github.com/
2. **Install and sign in** with your GitHub account
3. **Click "File" → "Add Local Repository"**
4. **Browse to**: `C:\Users\Titus\Documents\Magnolia App`
5. **Click "Publish repository"** button
6. **Name it**: `magnolia-flight-portal`
7. **Choose Private or Public**
8. **Click "Publish Repository"**

Done! Your code is now on GitHub! 🎉

---

## 📝 Alternative: Command Line (if Git is installed)

### Step 1: Install Git
- Download: https://git-scm.com/download/win
- Install with default settings
- **Restart PowerShell** after installation

### Step 2: Run the Setup Script
After installing Git, run this in PowerShell:

```powershell
cd "C:\Users\Titus\Documents\Magnolia App"
.\setup-github.ps1
```

### Step 3: Create Repository on GitHub
1. Go to https://github.com
2. Click "+" → "New repository"
3. Name: `magnolia-flight-portal`
4. **Don't** check "Initialize with README"
5. Click "Create repository"

### Step 4: Connect and Push
Copy the commands GitHub shows you, or use:

```powershell
git remote add origin https://github.com/YOUR_USERNAME/magnolia-flight-portal.git
git branch -M main
git push -u origin main
```

**Note**: GitHub will ask for authentication. Use a **Personal Access Token**:
- GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
- Generate token with `repo` permissions
- Use token as password when pushing

---

## ✅ What's Already Prepared

- ✅ `.gitignore` - Protects sensitive files
- ✅ All project files ready
- ✅ Setup script created (`setup-github.ps1`)

---

## 🎯 Recommended: Use GitHub Desktop

It's the easiest way - no command line needed!


