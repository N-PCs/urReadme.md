#!/bin/bash

# Pre-Vercel Deployment Checklist
# Run this script to verify everything is ready for deployment

echo "🔍 Vercel Deployment Pre-Check"
echo "================================"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_file() {
  if [ -f "$1" ]; then
    echo -e "${GREEN}✓${NC} Found: $1"
    return 0
  else
    echo -e "${RED}✗${NC} Missing: $1"
    return 1
  fi
}

check_dir() {
  if [ -d "$1" ]; then
    echo -e "${GREEN}✓${NC} Found: $1/"
    return 0
  else
    echo -e "${RED}✗${NC} Missing: $1/"
    return 1
  fi
}

# Check critical files
echo "📋 Checking critical files..."
FAILED=0

check_file ".npmrc" || FAILED=$((FAILED+1))
check_file "frontend/.eslintrc.json" || FAILED=$((FAILED+1))
check_file "frontend/.env.example" || FAILED=$((FAILED+1))
check_file "frontend/tailwind.config.ts" || FAILED=$((FAILED+1))
check_file "frontend/next.config.mjs" || FAILED=$((FAILED+1))
check_file "frontend/package.json" || FAILED=$((FAILED+1))
check_file "frontend/tsconfig.json" || FAILED=$((FAILED+1))
check_file "vercel.json" || FAILED=$((FAILED+1))
check_file ".vercelignore" || FAILED=$((FAILED+1))
check_file "frontend/DEPLOYMENT.md" || FAILED=$((FAILED+1))

echo ""
echo "📁 Checking directories..."
check_dir "frontend/app" || FAILED=$((FAILED+1))
check_dir "frontend/components" || FAILED=$((FAILED+1))
check_dir "frontend/lib" || FAILED=$((FAILED+1))

echo ""
echo "🔧 Checking build configuration..."

# Check if app directory has required files
if [ -f "frontend/app/layout.tsx" ]; then
  echo -e "${GREEN}✓${NC} Found: frontend/app/layout.tsx"
else
  echo -e "${RED}✗${NC} Missing: frontend/app/layout.tsx"
  FAILED=$((FAILED+1))
fi

if [ -f "frontend/app/page.tsx" ]; then
  echo -e "${GREEN}✓${NC} Found: frontend/app/page.tsx"
else
  echo -e "${RED}✗${NC} Missing: frontend/app/page.tsx"
  FAILED=$((FAILED+1))
fi

# Check API routes
if [ -d "frontend/app/api" ]; then
  echo -e "${GREEN}✓${NC} Found: frontend/app/api/ (API routes)"
else
  echo -e "${RED}✗${NC} Missing: frontend/app/api/"
  FAILED=$((FAILED+1))
fi

echo ""
echo "📦 Checking dependencies..."
if grep -q "\"next\"" frontend/package.json; then
  echo -e "${GREEN}✓${NC} Next.js installed"
else
  echo -e "${RED}✗${NC} Next.js not found in package.json"
  FAILED=$((FAILED+1))
fi

if grep -q "\"tailwindcss\"" frontend/package.json; then
  echo -e "${GREEN}✓${NC} Tailwind CSS installed"
else
  echo -e "${RED}✗${NC} Tailwind CSS not found in package.json"
  FAILED=$((FAILED+1))
fi

echo ""
echo "⚙️  Checking package.json scripts..."
if grep -q "\"build\"" frontend/package.json; then
  echo -e "${GREEN}✓${NC} Build script configured"
else
  echo -e "${RED}✗${NC} Build script missing"
  FAILED=$((FAILED+1))
fi

if grep -q "\"dev\"" frontend/package.json; then
  echo -e "${GREEN}✓${NC} Dev script configured"
else
  echo -e "${RED}✗${NC} Dev script missing"
  FAILED=$((FAILED+1))
fi

echo ""
echo "🌍 Environment Variables Setup"
echo "==============================="
echo ""
echo -e "${YELLOW}⚠️  Before deploying to Vercel, set these environment variables:${NC}"
echo ""
echo "  1. BACKEND_URL"
echo "     → URL of your FastAPI backend (e.g., https://api.example.com)"
echo ""
echo "  2. GITHUB_TOKEN"
echo "     → GitHub API token for repo access"
echo ""
echo "Set these in Vercel Dashboard:"
echo "  Settings → Environment Variables → Add Variable"
echo ""

echo "================================"
if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✨ All checks passed! Ready for Vercel deployment.${NC}"
  echo ""
  echo "Next steps:"
  echo "  1. Set environment variables in Vercel dashboard"
  echo "  2. Push to GitHub or run: vercel --prod"
  echo "  3. Check deployment at: https://vercel.com/dashboard"
  exit 0
else
  echo -e "${RED}❌ $FAILED check(s) failed. Fix the issues above before deploying.${NC}"
  exit 1
fi
