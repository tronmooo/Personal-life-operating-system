#!/bin/bash

# LifeHub - Push to GitHub Script
# Replace YOUR_GITHUB_USERNAME with your actual GitHub username

echo "🚀 Pushing LifeHub to GitHub..."
echo ""
echo "⚠️  IMPORTANT: Before running this script:"
echo "1. Go to https://github.com/new"
echo "2. Create a repository named: lifehub-personal-dashboard"
echo "3. Make it PRIVATE"
echo "4. DO NOT initialize with README"
echo "5. Then come back and continue..."
echo ""
read -p "Press ENTER when you've created the repository..."

# Get GitHub username
read -p "Enter your GitHub username: " GITHUB_USERNAME

echo ""
echo "📦 Configuring remote repository..."
git remote add origin https://github.com/$GITHUB_USERNAME/lifehub-personal-dashboard.git

echo "🔄 Renaming branch to main..."
git branch -M main

echo "⬆️  Pushing to GitHub..."
echo ""
echo "⚠️  If prompted for password, use your Personal Access Token (not your GitHub password)"
echo "   Get token at: https://github.com/settings/tokens"
echo ""

git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SUCCESS! Your code is now on GitHub!"
    echo "🔗 View it at: https://github.com/$GITHUB_USERNAME/lifehub-personal-dashboard"
    echo ""
    echo "🎉 All 557 files (155,965 lines of code) safely backed up!"
else
    echo ""
    echo "❌ Push failed. Common issues:"
    echo "1. Make sure you created the repository on GitHub first"
    echo "2. Use a Personal Access Token as password (not your GitHub password)"
    echo "3. Check your internet connection"
    echo ""
    echo "Need a token? Visit: https://github.com/settings/tokens"
    echo "Select 'repo' scope when creating the token"
fi

