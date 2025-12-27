# 🏭 The Factory - Setup Guide

Complete setup guide for The Factory autonomous app.

## 🚀 Quick Start (Recommended)

Run this ONE command to do everything automatically:

```bash
cd ~/the-architect
./quick_setup.sh
```

This will:
1. Login to your Expo account
2. Generate Android signing credentials
3. Build your first APK
4. Show you the GitHub token to configure

**That's it!** After this, every GitHub push will auto-build your APK.

---

## 📋 Manual Setup (Step by Step)

If you prefer to do it manually:

### Step 1: Login to EAS
```bash
cd ~/the-architect
eas login
```

Enter your Expo email and password.

### Step 2: Run Automated Setup
```bash
./setup_eas_automated.sh
```

This will:
- Verify your login
- Check project configuration
- Generate Android keystore
- Start the first build

### Step 3: Configure GitHub Actions

Get your EXPO_TOKEN:
```bash
cat ~/.expo/state.json | grep accessToken
```

Then:
1. Go to: https://github.com/Marcone1983/The-Architect/settings/secrets/actions
2. Click "New repository secret"
3. Name: `EXPO_TOKEN`
4. Value: [paste the token]
5. Click "Add secret"

---

## ✅ Verify Everything Works

### Check local build status:
```bash
eas build:list
```

### Trigger GitHub build:
```bash
git commit --allow-empty -m "Test build"
git push origin main
```

### Check GitHub Actions:
https://github.com/Marcone1983/The-Architect/actions

---

## 📱 Download Your APK

### From Expo:
1. Go to https://expo.dev
2. Click on "The Factory" project
3. Go to "Builds"
4. Download the APK when ready

### From GitHub Actions:
The workflow will show you the Expo build URL in the logs.

---

## 🔧 Troubleshooting

### "Not logged in to EAS"
```bash
eas login
```

### "Keystore generation failed"
```bash
eas credentials
# Select: Android → Set up build credentials
```

### "Build failed on GitHub"
1. Check EXPO_TOKEN is set correctly
2. Verify you did the first local build
3. Check logs: https://github.com/Marcone1983/The-Architect/actions

---

## 🎯 What Happens After Setup

1. **Every push to GitHub** triggers automatic APK build
2. **No manual intervention needed**
3. **APKs available on Expo dashboard**
4. **7 AI agents work autonomously**

---

## 📂 Project Structure

```
the-architect/
├── App.js                     # Main app with 7 AI agents
├── app.json                   # Expo configuration
├── eas.json                   # EAS Build configuration
├── package.json               # Dependencies
├── babel.config.js            # Babel configuration
├── .env.example               # Environment variables template
├── .github/
│   └── workflows/
│       └── android-build.yml  # GitHub Actions workflow
├── quick_setup.sh             # 🚀 Run this first!
├── setup_eas_automated.sh     # Automated setup script
└── README_SETUP.md            # This file
```

---

## 🤖 The 7 AI Agents

1. **SCOUT** - Finds market trends and app ideas
2. **UI** - Designs interfaces
3. **LOGIC** - Writes business logic
4. **INTEGRATOR** - Handles API integrations
5. **GROWTH** - Creates viral mechanics
6. **QA** - Quality assurance
7. **CLOSER** - Packages and deploys

All powered by OpenAI GPT-4 and Cloudflare D1.

---

## 🔐 Environment Variables

Create `.env` file with:

```bash
OPENAI_API_KEY=sk-your-key-here
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN=your-api-token
CLOUDFLARE_D1_DATABASE_ID=your-database-id
VERCEL_TOKEN=your-vercel-token
```

These are entered in the app on first launch.

---

## 💡 Tips

- First build takes ~10-15 minutes
- Subsequent builds are faster (~5-7 minutes)
- APK size: ~50-80 MB
- Works on Android 5.0+

---

## 🆘 Support

- EAS Build docs: https://docs.expo.dev/build/introduction/
- GitHub Actions: https://github.com/Marcone1983/The-Architect/actions
- Expo dashboard: https://expo.dev

---

**Ready to build?** Run `./quick_setup.sh` now! 🚀
