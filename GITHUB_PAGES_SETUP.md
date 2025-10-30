# GitHub Pages Setup - Troubleshooting Guide

## If you're using GitHub Actions (Recommended):

1. Go to: https://github.com/aifunmobi/cursor/settings/pages
2. Under **"Source"**, select **"GitHub Actions"** (NOT "Deploy from a branch")
3. Click **Save**
4. The workflow will automatically deploy your site

## If GitHub Actions doesn't work, use the simpler method:

1. Go to: https://github.com/aifunmobi/cursor/settings/pages
2. Under **"Source"**, select **"Deploy from a branch"**
3. Select **main** branch and **/ (root)** folder
4. Click **Save**
5. Wait 1-2 minutes for deployment

## Important Checks:

- ✅ Make sure your repository is **public** (GitHub Pages requires public repos for free accounts)
- ✅ Make sure you've pushed all files (index.html, style.css, script.js)
- ✅ Wait a few minutes after enabling Pages - it takes time to build

## Your site URL will be:
https://aifunmobi.github.io/cursor/
