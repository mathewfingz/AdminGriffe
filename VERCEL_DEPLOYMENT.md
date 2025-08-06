# 🚀 Vercel Deployment Guide - AdminGriffe

This guide will help you deploy all AdminGriffe applications to Vercel.

## 📋 Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI**: Already installed via `pnpm add -g vercel`
3. **Git Repository**: Code is already pushed to GitHub

## 🏗️ Applications Ready for Deployment

### 1. **Web Admin** (Next.js)
- **Path**: `apps/web-admin/`
- **Framework**: Next.js 15
- **Features**: Admin dashboard, authentication, database management

### 2. **Nova Haven** (Vite + React)
- **Path**: `nova-haven/`
- **Framework**: Vite + React
- **Features**: Modern React SPA with 3D components

### 3. **Nova Works** (Vite + React)
- **Path**: `nova-works/`
- **Framework**: Vite + React
- **Features**: Portfolio/work showcase application

### 4. **Curry Landing** (Vite + React)
- **Path**: `curry-landing/`
- **Framework**: Vite + React
- **Features**: Landing page application

### 5. **Pixel Verse** (Vite + React)
- **Path**: `pixel-verse/`
- **Framework**: Vite + React
- **Features**: Creative/gaming application

## 🚀 Quick Deployment

### Option 1: Automated Script (Recommended)

```bash
# Run the automated deployment script
./scripts/deploy-vercel.sh
```

### Option 2: Manual Deployment

1. **Login to Vercel**:
```bash
vercel login
```

2. **Deploy each application**:

```bash
# Deploy Web Admin (Next.js)
cd apps/web-admin
vercel --prod

# Deploy Nova Haven
cd ../../nova-haven
vercel --prod

# Deploy Nova Works
cd ../nova-works
vercel --prod

# Deploy Curry Landing
cd ../curry-landing
vercel --prod

# Deploy Pixel Verse
cd ../pixel-verse
vercel --prod
```

## 🔧 Configuration Details

Each application has a `vercel.json` configuration file:

### Next.js Configuration (web-admin)
```json
{
  "name": "admin-griffe-web-admin",
  "framework": "nextjs",
  "buildCommand": "pnpm build",
  "outputDirectory": ".next"
}
```

### Vite Configuration (other apps)
```json
{
  "name": "admin-griffe-[app-name]",
  "framework": "vite",
  "buildCommand": "npm run build:client",
  "outputDirectory": "dist/spa"
}
```

## 🌐 Expected Deployment URLs

After deployment, you'll get URLs like:
- **Web Admin**: `https://admin-griffe-web-admin.vercel.app`
- **Nova Haven**: `https://admin-griffe-nova-haven.vercel.app`
- **Nova Works**: `https://admin-griffe-nova-works.vercel.app`
- **Curry Landing**: `https://admin-griffe-curry-landing.vercel.app`
- **Pixel Verse**: `https://admin-griffe-pixel-verse.vercel.app`

## 🔍 Monitoring Deployments

1. **Vercel Dashboard**: Visit [vercel.com/dashboard](https://vercel.com/dashboard)
2. **CLI Commands**:
```bash
# List all deployments
vercel ls

# Check deployment status
vercel inspect [deployment-url]

# View logs
vercel logs [deployment-url]
```

## 🛠️ Environment Variables

For production deployments, you may need to set environment variables:

1. **Via Vercel Dashboard**:
   - Go to Project Settings → Environment Variables
   - Add required variables for each application

2. **Via CLI**:
```bash
vercel env add [VARIABLE_NAME] [value] production
```

### Common Environment Variables:
- `DATABASE_URL` (for web-admin)
- `NEXTAUTH_SECRET` (for web-admin)
- `NEXTAUTH_URL` (for web-admin)
- `NODE_ENV=production`

## 🔒 Security Considerations

1. **Environment Variables**: Never commit sensitive data to Git
2. **Domain Configuration**: Set up custom domains in Vercel dashboard
3. **HTTPS**: Vercel provides automatic HTTPS
4. **CORS**: Configure CORS settings if needed for API calls

## 🐛 Troubleshooting

### Common Issues:

1. **Build Failures**:
   - Check build logs in Vercel dashboard
   - Ensure all dependencies are in `package.json`
   - Verify build commands in `vercel.json`

2. **Environment Variables**:
   - Ensure all required env vars are set in Vercel
   - Check variable names match exactly

3. **Routing Issues (Vite apps)**:
   - Verify `rewrites` configuration in `vercel.json`
   - Ensure SPA routing is properly configured

### Debug Commands:
```bash
# Check Vercel CLI version
vercel --version

# Check authentication
vercel whoami

# Verbose deployment
vercel --prod --debug
```

## 📊 Performance Optimization

1. **Build Optimization**:
   - Vite apps use optimized production builds
   - Next.js has automatic optimizations

2. **Caching**:
   - Vercel provides automatic edge caching
   - Static assets are cached globally

3. **Analytics**:
   - Enable Vercel Analytics in dashboard
   - Monitor Core Web Vitals

## 🔄 Continuous Deployment

To set up automatic deployments:

1. **Connect GitHub**: Link your repository in Vercel dashboard
2. **Auto-Deploy**: Enable automatic deployments on push
3. **Branch Protection**: Set up production branch protection
4. **Preview Deployments**: Get preview URLs for pull requests

## 📞 Support

- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **GitHub Issues**: Create issues in the repository
- **Vercel Support**: [vercel.com/support](https://vercel.com/support)

---

## 🎉 Success!

Once deployed, your applications will be available globally with:
- ⚡ Lightning-fast performance
- 🌍 Global CDN distribution
- 🔒 Automatic HTTPS
- 📊 Built-in analytics
- 🔄 Automatic deployments

Happy deploying! 🚀