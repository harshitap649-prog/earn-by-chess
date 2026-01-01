# GitHub Upload Guide - Step by Step

## Method 1: Using Git Commands (Recommended)

This is the proper way to upload your code to GitHub and allows for easy updates later.

### Step 1: Initialize Git Repository (if not already done)

Open PowerShell or Command Prompt in your project folder:

```powershell
cd "C:\Users\Keshav\Desktop\earn by chess"
git init
```

### Step 2: Add All Files

```powershell
git add .
```

### Step 3: Create Initial Commit

```powershell
git commit -m "Initial commit: Chess earning site with 18+ age verification"
```

### Step 4: Add GitHub Remote

Go to your GitHub repository page (`github.com/harshitap649-prog/earn-by-chess`) and copy the repository URL.

Then run:

```powershell
git remote add origin https://github.com/harshitap649-prog/earn-by-chess.git
```

### Step 5: Push to GitHub

```powershell
git branch -M main
git push -u origin main
```

You'll be prompted for your GitHub username and password (use a Personal Access Token, not your password).

---

## Method 2: Using GitHub Web Interface (Current Method)

If you prefer using the web interface you're currently on:

### Step 1: Prepare Your Files

1. **Create a ZIP file** of your project folder (excluding `node_modules`)
2. **Extract it** to a temporary location
3. **Remove these folders/files** before uploading:
   - `node_modules/` (both root and client/)
   - `dist/` or `build/` folders
   - `.env` files
   - `prisma/dev.db` (database file)
   - Any `.log` files

### Step 2: Upload via GitHub Web Interface

1. **On the GitHub upload page** (where you are now)
2. **Drag and drop** your project folder OR click "choose your files"
3. **Select all files** from your project (excluding the files mentioned above)
4. **Scroll down** to "Commit changes"
5. **Add commit message**: "Initial commit: Chess earning site"
6. **Click "Commit changes"**

### Step 3: Verify Upload

After upload completes, refresh the page and verify all files are there.

---

## Important: Files to EXCLUDE

**DO NOT upload these files/folders:**

- ❌ `node_modules/` (both root and client/)
- ❌ `.env` files (contains secrets!)
- ❌ `prisma/dev.db` (database file - too large)
- ❌ `dist/` or `build/` folders
- ❌ `.vscode/` (IDE settings)
- ❌ `*.log` files
- ❌ `package-lock.json` (optional, but recommended to exclude)

**The `.gitignore` file should already exclude these, but double-check!**

---

## After Uploading: Next Steps

1. **Verify all files uploaded correctly**
2. **Check that `.env` is NOT in the repository** (very important!)
3. **Proceed to Railway deployment** (see DEPLOYMENT_GUIDE.md)

---

## Troubleshooting

### If upload fails:
- Check file sizes (GitHub has limits)
- Make sure you're not uploading `node_modules` (it's huge!)
- Try uploading in smaller batches

### If you need to update files later:
- Use Git commands (Method 1) - it's much easier
- Or use GitHub Desktop app

---

## Quick Command Summary (Method 1)

```powershell
cd "C:\Users\Keshav\Desktop\earn by chess"
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/harshitap649-prog/earn-by-chess.git
git branch -M main
git push -u origin main
```

**Note:** You'll need to authenticate with GitHub (username + Personal Access Token)

