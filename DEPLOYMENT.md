# Deployment Guide - GitHub Setup

## Step 1: Install Git (if not already installed)

1. Download Git for Windows from: https://git-scm.com/download/win
2. Run the installer with default settings
3. Restart your terminal/command prompt after installation

## Step 2: Initialize Git Repository

Once Git is installed, run these commands in your project directory:

```powershell
# Navigate to your project
cd "C:\Users\Titus\Documents\Magnolia App"

# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Magnolia Flight Portal with FSP integration"
```

## Step 3: Create GitHub Repository

1. Go to https://github.com and sign in (or create an account)
2. Click the "+" icon in the top right corner
3. Select "New repository"
4. Name it: `magnolia-flight-portal` (or your preferred name)
5. Choose **Private** or **Public**
6. **DO NOT** check "Initialize with README" (you already have one)
7. Click "Create repository"

## Step 4: Connect and Push

After creating the repository, GitHub will show you commands. Use these:

```powershell
# Replace YOUR_USERNAME and YOUR_REPO_NAME with your actual values
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

**Note:** GitHub may ask for authentication. Use a Personal Access Token instead of your password:
- Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
- Generate new token with `repo` permissions
- Use the token as your password when pushing

## Step 5: Deploy to Vercel (Recommended)

1. Go to https://vercel.com
2. Sign up with your GitHub account
3. Click "New Project"
4. Import your `magnolia-flight-portal` repository
5. Vercel will auto-detect Next.js settings
6. Click "Deploy"
7. Your site will be live in ~2 minutes!

Your portal will be available at: `https://magnolia-flight-portal.vercel.app`

## Quick Reference Commands

```powershell
# Check git status
git status

# See what files will be committed
git status

# Add specific file
git add filename

# Commit changes
git commit -m "Your commit message"

# Push to GitHub
git push

# Pull latest changes
git pull
```

