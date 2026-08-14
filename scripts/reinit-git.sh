#!/bin/sh
# Helper script to reinitialize Git history for the new repository
if [ -z "$1" ]; then
  echo "Usage: $0 <new-remote-url>"
  exit 1
fi

git remote remove origin 2>/dev/null || true
rm -rf .git
git init
git add .
git commit -m "chore: initial commit for wifi-measures"
git remote add origin "$1"
echo "New remote added: $1"
echo "Run: git push -u origin main" 
