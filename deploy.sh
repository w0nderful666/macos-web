#!/usr/bin/env bash
# Create GitHub repo + push + enable GitHub Pages (run on a machine with git + gh + network)
set -euo pipefail
cd "$(dirname "$0")"

REPO_NAME="${1:-macos-web}"
VISIBILITY="${2:-public}" # public | private

if ! command -v git >/dev/null; then
  echo "git not found. Install Git first."
  exit 1
fi
if ! command -v gh >/dev/null; then
  echo "GitHub CLI (gh) not found. Install: https://cli.github.com/"
  echo "Then: gh auth login"
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "Not logged in. Run: gh auth login"
  exit 1
fi

if [ ! -d .git ]; then
  git init
  git branch -M main
fi

git add -A
if git diff --cached --quiet; then
  echo "Nothing to commit (working tree clean or empty staging)."
else
  git commit -m "Initial commit: macOS Web desktop demo (simulated OS, GitHub Pages ready)"
fi

if gh repo view "$REPO_NAME" >/dev/null 2>&1 || gh repo view "$(gh api user -q .login)/$REPO_NAME" >/dev/null 2>&1; then
  echo "Remote repo may already exist — setting origin and pushing..."
  USERNAME=$(gh api user -q .login)
  git remote remove origin 2>/dev/null || true
  git remote add origin "https://github.com/${USERNAME}/${REPO_NAME}.git"
  git push -u origin main
else
  gh repo create "$REPO_NAME" --"$VISIBILITY" --source=. --remote=origin --push --description "Pure front-end macOS-inspired desktop demo (virtual FS, simulated shell, GitHub Pages)"
fi

USERNAME=$(gh api user -q .login)
# Enable GitHub Pages from main / root
gh api -X POST "repos/${USERNAME}/${REPO_NAME}/pages" \
  -f "build_type=legacy" \
  -f "source[branch]=main" \
  -f "source[path]=/" 2>/dev/null \
  || gh api -X PUT "repos/${USERNAME}/${REPO_NAME}/pages" \
       -f "build_type=legacy" \
       -f "source[branch]=main" \
       -f "source[path]=/" 2>/dev/null \
  || echo "If Pages API failed, enable manually: Settings → Pages → Deploy from branch main / (root)"

echo ""
echo "Done."
echo "Repo:  https://github.com/${USERNAME}/${REPO_NAME}"
echo "Pages: https://${USERNAME}.github.io/${REPO_NAME}/"
echo "(Pages may take 1–2 minutes to go live.)"
