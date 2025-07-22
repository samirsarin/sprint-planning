#!/bin/bash

# Sprint Planning App - FREE Deployment Script (Netlify + Firebase Spark)

echo "🚀 Deploying Sprint Planning App (FREE TIER)..."

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "📦 Installing Netlify CLI..."
    npm install -g netlify-cli
fi

# Check if Firebase CLI is installed for Firestore rules
if ! command -v firebase &> /dev/null; then
    echo "📦 Installing Firebase CLI..."
    npm install -g firebase-tools
fi

# Install dependencies
echo "📦 Installing dependencies..."

# Install client dependencies
cd client
npm install
cd ..

# Install Netlify Functions dependencies
cd netlify/functions
npm install
cd ../..

# Build the React app
echo "🏗️  Building React app..."
cd client
npm run build
cd ..

# Deploy Firestore rules only (FREE - no functions needed)
echo "🔥 Deploying Firestore rules..."
firebase deploy --only firestore:rules

# Deploy to Netlify
echo "🚀 Deploying to Netlify..."
netlify deploy --prod

echo "✅ Deployment complete!"
echo ""
echo "🌐 Your app should be available at your Netlify URL"
echo ""
echo "📚 Don't forget to:"
echo "1. Set up environment variables in Netlify dashboard"
echo "2. Create Firebase service account for backend functions"
echo "3. Test your deployment"
echo ""
echo "🎯 Enjoy your FREE sprint planning app!" 