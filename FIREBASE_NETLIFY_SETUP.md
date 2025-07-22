# Firebase + Netlify Setup Guide

This guide will help you deploy your Sprint Planning app using Netlify (frontend) and Firebase (backend) - both completely free!

## 🔥 Firebase Setup (Backend)

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name (e.g., "sprint-planning-app")
4. Disable Google Analytics (optional)
5. Click "Create project"

### 2. Enable Firestore Database

1. In Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (we'll use custom rules)
4. Select a location close to your users
5. Click "Done"

### 3. Setup Firebase Functions

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase in your project:
   ```bash
   firebase init
   ```
   
   Select:
   - ☑️ Functions: Configure a Cloud Functions directory
   - ☑️ Firestore: Configure security rules and indexes files
   - ☑️ Hosting: Configure files for Firebase Hosting
   
   Choose:
   - Use existing project → Select your project
   - Language: JavaScript
   - ESLint: No
   - Install dependencies: Yes
   - Public directory: client/build
   - Single-page app: Yes
   - Automatic builds: No

4. Deploy Functions and Firestore rules:
   ```bash
   cd functions
   npm install
   cd ..
   firebase deploy --only functions,firestore:rules
   ```

### 4. Get Firebase Configuration

1. In Firebase Console, go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click "Web" icon to add a web app
4. Register app with nickname (e.g., "sprint-planning-web")
5. Copy the config object values

## 🚀 Netlify Setup (Frontend)

### 1. Prepare Your Repository

1. Push your code to GitHub/GitLab/Bitbucket
2. Make sure your `netlify.toml` file is in the root directory

### 2. Deploy to Netlify

1. Go to [Netlify](https://netlify.com)
2. Sign up/Login with your Git provider
3. Click "New site from Git"
4. Choose your repository
5. Build settings should auto-populate from `netlify.toml`:
   - Base directory: `client`
   - Build command: `npm run build`
   - Publish directory: `client/build`

### 3. Configure Environment Variables

1. In Netlify Dashboard, go to Site Settings → Environment Variables
2. Add these variables with your Firebase config values:

```
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
```

### 4. Update API URL in sessionService.js

Update the API_URL in `client/src/services/sessionService.js`:

```javascript
const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-region-your-project-id.cloudfunctions.net/api'
  : 'http://localhost:5001/your-project-id/us-central1/api';
```

Replace `your-region-your-project-id` with your actual Firebase Functions URL.

## 🏗️ Local Development

### 1. Setup Environment Variables

1. Copy `client/src/env.example` to `client/.env.local`
2. Fill in your Firebase configuration values

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install client dependencies
cd client
npm install

# Install functions dependencies
cd ../functions
npm install
```

### 3. Start Local Development

```bash
# Start Firebase emulators (in one terminal)
firebase emulators:start

# Start React development server (in another terminal)
cd client
npm start
```

## 💰 Free Tier Limits

### Firebase (Free Spark Plan)
- **Firestore**: 1 GB storage, 50K reads/day, 20K writes/day
- **Functions**: 125K invocations/month, 40K GB-seconds/month
- **Hosting**: 1 GB storage, 10 GB transfer/month

### Netlify (Free Plan)
- **Bandwidth**: 100 GB/month
- **Build minutes**: 300 minutes/month
- **Sites**: Unlimited public repositories
- **Functions**: 125K requests/month (if needed)

## 🔒 Security Considerations

1. **Firestore Rules**: The current rules allow all read/write access. For production, consider implementing more restrictive rules.

2. **Environment Variables**: Never commit `.env.local` files. Use Netlify's environment variables for production.

3. **API Rate Limiting**: Consider implementing rate limiting for production use.

## 📦 Deployment Commands

```bash
# Deploy everything to Firebase
firebase deploy

# Deploy only functions
firebase deploy --only functions

# Deploy only Firestore rules
firebase deploy --only firestore:rules

# Deploy to Netlify (automatic on git push)
git push origin main
```

## 🚨 Troubleshooting

### Common Issues:

1. **Firebase Functions timeout**: Increase timeout in functions if needed
2. **CORS errors**: Functions include CORS headers, but check browser console
3. **Environment variables not loading**: Ensure they're prefixed with `REACT_APP_`
4. **Build fails on Netlify**: Check build logs and ensure all dependencies are in package.json

### Support Resources:
- [Firebase Documentation](https://firebase.google.com/docs)
- [Netlify Documentation](https://docs.netlify.com)
- [Firebase Support](https://firebase.google.com/support)

## 🎉 You're Done!

Your app should now be running on:
- **Frontend**: https://your-site-name.netlify.app
- **Backend**: Firebase Functions + Firestore

Both services are free and will scale automatically! 🚀 