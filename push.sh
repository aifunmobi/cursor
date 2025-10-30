#!/bin/bash

# Script to stage, commit, and push changes to GitHub

# Check if there are any changes to commit
if [ -z "$(git status --porcelain)" ]; then
    echo "No changes to commit."
    exit 0
fi

# Show what will be committed
echo "Changes to be committed:"
git status --short
echo ""

# Get commit message
if [ -z "$1" ]; then
    echo "Enter commit message (or press Enter for default):"
    read -r commit_message
    if [ -z "$commit_message" ]; then
        commit_message="Update code"
    fi
else
    commit_message="$1"
fi

# Stage all changes
echo "Staging changes..."
git add .

# Commit with message
echo "Committing changes..."
git commit -m "$commit_message"

# Push to GitHub
echo "Pushing to GitHub..."
git push

echo "Done! Changes have been pushed to GitHub."

