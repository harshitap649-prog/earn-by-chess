# Git Commands - Quick Reference

Your repository is now connected to GitHub! Here's how to push updates:

## ✅ Setup Complete!

Your repository is connected to:
- **GitHub**: `https://github.com/harshitap649-prog/earn-by-chess.git`
- **Branch**: `main`

---

## 📤 How to Push Updates to GitHub

### Step 1: Check what changed
```powershell
cd "C:\Users\Keshav\Desktop\earn by chess"
git status
```

### Step 2: Add your changes
```powershell
git add .
```
Or add specific files:
```powershell
git add filename.ts
```

### Step 3: Commit your changes
```powershell
git commit -m "Description of what you changed"
```

### Step 4: Push to GitHub
```powershell
git push
```

That's it! Your changes will be on GitHub.

---

## 🔄 Complete Workflow Example

```powershell
# Navigate to project
cd "C:\Users\Keshav\Desktop\earn by chess"

# See what changed
git status

# Add all changes
git add .

# Commit with message
git commit -m "Updated theme colors"

# Push to GitHub
git push
```

---

## 📥 Pull Latest Changes (if working on multiple computers)

```powershell
git pull
```

---

## 🔍 Useful Commands

**See commit history:**
```powershell
git log --oneline
```

**See what files changed:**
```powershell
git status
```

**See differences:**
```powershell
git diff
```

**Undo changes (before committing):**
```powershell
git checkout -- filename.ts
```

**Undo last commit (keep changes):**
```powershell
git reset --soft HEAD~1
```

---

## ⚠️ Important Notes

1. **Always commit before pushing** - `git commit` then `git push`
2. **Write clear commit messages** - describe what you changed
3. **Don't commit `.env` files** - they contain secrets!
4. **Don't commit `node_modules`** - it's huge and unnecessary

---

## 🚀 Next Step: Deploy to Railway

Now that your code is on GitHub, you can deploy to Railway!

See `DEPLOYMENT_GUIDE.md` for Railway deployment instructions.

