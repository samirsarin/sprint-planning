#!/bin/bash

# Sprint Planning App - Firebase Deployment Script

echo "🚀 Deploying Sprint Planning App to Firebase..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Installing..."
    npm install -g firebase-tools
fi

# Check if user is logged in to Firebase
if ! firebase projects:list &> /dev/null; then
    echo "🔐 Please login to Firebase..."
    firebase login
fi

# Install dependencies
echo "📦 Installing dependencies..."
cd functions
npm install
cd ..

# Build the React app
echo "🏗️  Building React app..."
cd client
npm install
npm run build
cd ..

# Deploy to Firebase
echo "🔥 Deploying to Firebase..."
firebase deploy

echo "✅ Deployment complete!"
echo ""
echo "🌐 Your app should be available at:"
echo "https://your-project-id.web.app"
echo ""
echo "📚 Don't forget to:"
echo "1. Update your Netlify environment variables"
echo "2. Update the API_URL in sessionService.js"
echo "3. Test your deployment" 