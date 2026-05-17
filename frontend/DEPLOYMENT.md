# Frontend Deployment Guide

This guide will help you successfully deploy the urReadme.md frontend to Vercel.

## Quick Start

### Prerequisites
- Node.js 18+ with pnpm package manager
- Vercel account and Vercel CLI installed
- GitHub account (for OAuth integration)

### Environment Variables

Before deploying, set these environment variables in your Vercel project settings:

```bash
# Required
BACKEND_URL=https://api.example.com          # URL of your FastAPI backend
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxx          # GitHub API token for repo access

# Optional
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=xxxxx       # Vercel Analytics ID
```

See [.env.example](./.env.example) for reference.

## Deployment Steps

### 1. Using Vercel CLI (Recommended)

```bash
# Install Vercel CLI globally
npm i -g vercel

# Navigate to project root
cd /path/to/urReadme.md

# Deploy to Vercel
vercel
```

### 2. Using Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Set the following build settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
5. Add environment variables (see above)
6. Deploy!

### 3. Using GitHub Integration

1. Push your code to GitHub
2. Connect Vercel to your GitHub repository
3. Set Vercel to watch your repository
4. Each push to `main` branch will trigger automatic deployment

## Build Configuration

The following files ensure smooth deployment:

- `next.config.mjs` - Next.js configuration optimized for Vercel
- `tailwind.config.ts` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration
- `.eslintrc.json` - ESLint configuration
- `vercel.json` - Vercel-specific settings
- `.npmrc` - Package manager configuration (pnpm)
- `postcss.config.mjs` - PostCSS configuration

## Common Issues & Solutions

### Issue: "Build failed with error: Missing environment variable"
**Solution**: Ensure all required environment variables are set in Vercel project settings under:
Settings → Environment Variables

### Issue: "Deployment failed - cannot find module"
**Solution**: Clear the `.next` cache:
```bash
rm -rf .next
vercel --prod
```

### Issue: "ESLint errors during build"
**Solution**: The `.eslintrc.json` file handles linting. Make sure it's present in the frontend directory.

### Issue: "Tailwind CSS not loading"
**Solution**: Multiple lock files can cause issues. The `.npmrc` ensures we use pnpm. Run:
```bash
rm -f package-lock.json
pnpm install
```

## Local Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linter
pnpm lint
```

## Performance Tips

1. **Enable caching**: Vercel's caching is enabled by default
2. **Optimize images**: The app uses unoptimized images for simplicity; consider enabling Next.js Image Optimization for production
3. **Monitor bundle size**: Use `npm analyze` to check bundle size
4. **Environment-specific builds**: Use separate Vercel projects for staging and production

## Production Checklist

- ✅ Environment variables set in Vercel dashboard
- ✅ Backend URL points to production API
- ✅ GitHub token is valid and has repo access
- ✅ CORS headers configured on backend
- ✅ Domain DNS configured (if using custom domain)
- ✅ Analytics enabled (optional but recommended)

## Monitoring & Logs

View deployment logs in Vercel dashboard:
1. Select your project
2. Go to "Deployments" tab
3. Click on any deployment to see full build logs

## Support

For issues with Vercel deployment:
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/learn-nextjs/basics/deploying-nextjs-app)
- [Troubleshooting Guide](https://vercel.com/docs/platform/limits)
