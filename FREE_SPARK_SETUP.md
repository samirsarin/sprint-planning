# 🆓 FREE Setup Guide - Firebase Spark Plan + Netlify

This guide shows you how to deploy your Sprint Planning app **completely free** using:
- **Netlify** for hosting the frontend AND backend functions
- **Firebase Firestore** for the database (Spark plan - FREE)

No Firebase Functions needed! Everything stays on the free tier.

## 🔥 Firebase Setup (FREE Spark Plan)

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `sprint-planning-app-5c655` (or your chosen name)
4. Disable Google Analytics (optional)
5. Click "Create project"

### 2. Enable Firestore Database

1. In Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode"
4. Select a location close to your users
5. Click "Done"

### 3. Create Service Account (for Netlify Functions)

1. Go to Project Settings (gear icon) → Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. **Keep this file secure!** You'll need values from it

### 4. Get Firebase Configuration

1. In Firebase Console, go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click "Web" icon to add a web app
4. Register app with nickname: "sprint-planning-web"
5. Copy the config object values

## 🚀 Netlify Setup (FREE)

### 1. Prepare Repository

1. Push your code to GitHub/GitLab/Bitbucket
2. Make sure `netlify.toml` is in the root directory

### 2. Deploy to Netlify

1. Go to [Netlify](https://netlify.com)
2. Sign up/Login with your Git provider
3. Click "New site from Git"
4. Choose your repository
5. Build settings should auto-populate:
   - Base directory: `client`
   - Build command: `npm run build`
   - Publish directory: `client/build`
   - Functions directory: `netlify/functions`

### 3. Configure Environment Variables

In Netlify Dashboard → Site Settings → Environment Variables, add:

#### Frontend Environment Variables:
```
REACT_APP_FIREBASE_API_KEY=AIzaSyAna8fTgo9iMZBYBWDuVuW1iJIBWlDpPZI
REACT_APP_FIREBASE_AUTH_DOMAIN=sprint-planning-app-5c655.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=sprint-planning-app-5c655
REACT_APP_FIREBASE_STORAGE_BUCKET=sprint-planning-app-5c655.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=1017106301522
REACT_APP_FIREBASE_APP_ID=1:1017106301522:web:6ead796d5bb4c76322958b
```

#### Backend Environment Variables (from your service account JSON):
```
FIREBASE_PROJECT_ID=sprint-planning-app-5c655
FIREBASE_PRIVATE_KEY_ID=your-private-key-id-from-json
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nYour actual private key here\n-----END PRIVATE KEY-----
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@sprint-planning-app-5c655.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id-from-json
```

**Important**: For `FIREBASE_PRIVATE_KEY`, copy the entire private key including the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` parts, and replace actual newlines with `\n`.

## 🏗️ Local Development

### 1. Setup Environment Variables

1. Copy `client/src/env.example` to `client/.env.local`
2. Use the values from your Firebase config

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install client dependencies
cd client
npm install

# Install Netlify Functions dependencies
cd ../netlify/functions
npm install
```

### 3. Start Local Development

```bash
# Install Netlify CLI globally
npm install -g netlify-cli

# Start local development server
netlify dev
```

This will:
- Start the React app on http://localhost:3000
- Start Netlify Functions on http://localhost:8888/.netlify/functions/api
- Proxy everything correctly

## 🔒 Deploy Firestore Rules

Since we're not using Firebase Functions, we need to deploy Firestore rules manually:

```bash
# Only deploy Firestore rules (no functions needed)
firebase deploy --only firestore:rules
```

## 💰 Free Tier Limits (NO COST!)

### Firebase Spark Plan (FREE)
- ✅ **Firestore**: 1 GB storage, 50K reads/day, 20K writes/day
- ✅ **Authentication**: Unlimited users
- ✅ **Hosting**: 1 GB storage, 10 GB transfer/month

### Netlify Free Plan
- ✅ **Bandwidth**: 100 GB/month
- ✅ **Build minutes**: 300 minutes/month
- ✅ **Functions**: 125K requests/month
- ✅ **Sites**: Unlimited from public repos

## 🚨 Troubleshooting

### Common Issues:

1. **Environment Variables Not Loading**
   - Ensure all variables are set in Netlify dashboard
   - Redeploy after adding environment variables

2. **Private Key Issues**
   - Make sure to escape newlines as `\n` in the private key
   - Include the full key with BEGIN/END markers

3. **Functions Not Working**
   - Check Netlify Functions tab for error logs
   - Ensure `netlify/functions/package.json` dependencies are installed

4. **CORS Errors**
   - Functions include proper CORS headers
   - Check browser console for specific errors

## 📦 Deployment Commands

```bash
# Deploy to Netlify (automatic on git push)
git push origin main

# Deploy only Firestore rules
firebase deploy --only firestore:rules

# Test locally
netlify dev
```

## 🎉 You're Done!

Your app will be live at:
- **Frontend & Backend**: https://your-site-name.netlify.app
- **Database**: Firebase Firestore (FREE Spark plan)

### What You Get:
- ✅ Real-time updates via Firestore
- ✅ Serverless backend functions via Netlify
- ✅ Automated deployments from Git
- ✅ SSL certificates included
- ✅ **100% FREE!** No billing required

### Next Steps:
1. Test your deployment
2. Share your app URL with your team
3. Monitor usage in Netlify and Firebase dashboards
4. Consider upgrading only if you exceed free limits

🎯 **Your sprint planning app is now live and completely free!** 🎯 