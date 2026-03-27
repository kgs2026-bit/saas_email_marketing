# Scripts Folder - Helper Scripts

PowerShell scripts to help you set up and deploy.

> **Note for Windows users**: These are `.ps1` files (PowerShell). To run them:
> 1. Open PowerShell as Administrator
> 2. Navigate to this folder: `cd scripts`
> 3. Run: `.\scriptname.ps1`
>
> If you get an execution policy error, run first: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

---

## 📜 Available Scripts

### 1. `setup.ps1` - Initial Setup
**What it does:**
- Checks Node.js is installed
- Installs all dependencies (backend + frontend)
- Checks if `.env` exists
- Generates Prisma client
- Tells you next steps

**When to use:** First time setup on a new machine

**Run:**
```powershell
cd scripts
.\setup.ps1
```

---

### 2. `health-check.ps1` - Verify Everything
**What it does:**
- Checks Node.js, npm, Docker
- Verifies `.env` variables are set
- Checks if dependencies are installed
- Tests if backend is running
- Reports status

**When to use:** Anytime to check if you're ready to run

**Run:**
```powershell
cd scripts
.\health-check.ps1
```

---

### 3. `init-git.ps1` - Push to GitHub
**What it does:**
- Initializes git (if needed)
- Stages all files
- Commits with a message
- Adds GitHub remote
- Pushes to `main` branch

**When to use:** After you've created the repo on GitHub and want to push your code

**Run:**
```powershell
cd scripts
.\init-git.ps1 -CommitMessage "Your commit message here"
```

Or just run `.\init-git.ps1` and it will guide you.

---

### 4. `deploy.ps1` - Deploy to Production
**What it does:**
- Pushes code to GitHub
- Tells you to deploy to Railway/Vercel
- Gives next steps

**When to use:** When you want to push and deploy

**Run:**
```powershell
cd scripts
.\deploy.ps1
```

---

## 🐛 Alternative: Manual Commands

If scripts don't work, here are manual commands:

### Install dependencies
```bash
# From project root
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

### Generate Prisma
```bash
cd backend
npx prisma generate
cd ..
```

### Run migrations
```bash
cd backend
npx prisma migrate dev
cd ..
```

### Start with Docker
```bash
docker-compose up
```

### Start without Docker
```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

### Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/kgs2026-bit/saas_email_marketing.git
git branch -M main
git push -u origin main
```

---

## 📚 Documentation Files

All docs are in `/` (root folder):

| File | Purpose |
|------|---------|
| `START_HERE.md` | **Read this first!** Non-technical overview |
| `QUICKSTART.md` | Fastest way to get running (15 min) |
| `SETUP.md` | Complete setup with explanations |
| `DEPLOYMENT.md` | How to deploy to live servers |
| `CHECKLIST.md` | Track all tasks (checklist format) |
| `ARCHITECTURE.md` | How the system works (technical) |
| `README.md` | Full documentation (API, features, etc.) |

---

## 🆘 Troubleshooting Scripts

### Script won't run (execution policy)
```powershell
# Run PowerShell as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Script says file not found
Make sure you're in the `scripts` folder:
```powershell
cd "C:\Users\IBALL\Desktop\Email Marketing tool\scripts"
.\setup.ps1
```

### Docker commands not working
Make sure Docker Desktop is installed and running.

---

## 🎯 Recommended Workflow

1. **First time?** Read `START_HERE.md`
2. **Setup computer?** Run `.\setup.ps1`
3. **Check status?** Run `.\health-check.ps1`
4. **Push to GitHub?** Run `.\init-git.ps1`
5. **Deploy?** Follow `DEPLOYMENT.md`

---

## 💡 Tips

- These scripts are helpers, not requirements
- You can do everything manually if scripts fail
- Always read error messages - they tell you what's wrong
- Check `.env` file first if something doesn't work (most issues are missing variables)

---

**Need more help?** Check the main documentation files in the root folder.
