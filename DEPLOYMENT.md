# 🚀 Deployment Guide - ViralMediaHub on Vercel

This guide explains how to deploy ViralMediaHub to Vercel.

## 📋 Prerequisites

- GitHub account
- Vercel account (free tier available)
- Node.js 18+ locally for testing

## 🔧 Vercel Configuration

The project includes the following Vercel-specific files:

### 1. `vercel.json`
- Configures build settings for both frontend and backend
- Sets up routing for API and static files
- Defines environment variables and function settings

### 2. `api/index.ts`
- Serverless function entry point for Vercel
- Handles all API routes
- Includes CORS configuration for production

### 3. Updated `package.json`
- Added `vercel-build` script
- Optimized build process for Vercel deployment

## 🚀 Deployment Steps

### Method 1: Deploy via Vercel Dashboard (Recommended)

1. **Connect GitHub Repository**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click "New Project"
   - Import `NTVuong23/ViralMediaHub` repository

2. **Configure Project Settings**
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `npm run vercel-build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

3. **Set Environment Variables**
   ```
   NODE_ENV=production
   VERCEL=1
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be available at `https://your-project-name.vercel.app`

### Method 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy from Project Root**
   ```bash
   vercel
   ```

4. **Follow CLI Prompts**
   - Link to existing project or create new
   - Confirm settings
   - Deploy

## 🔧 Environment Variables

Set these in Vercel Dashboard → Project → Settings → Environment Variables:

```env
NODE_ENV=production
VERCEL=1
```

Optional variables:
```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
TOTAL_EGGS=8
MIN_REWARD=50
MAX_REWARD=500
DEFAULT_WINNING_RATE=100
```

## 📁 Project Structure for Vercel

```
ViralMediaHub/
├── api/
│   └── index.ts          # Vercel serverless function
├── client/               # Frontend React app
├── server/               # Backend logic
├── shared/               # Shared types and schemas
├── vercel.json          # Vercel configuration
├── package.json         # Updated with vercel-build script
└── .env.example         # Environment variables template
```

## 🌐 URLs After Deployment

- **Production App**: `https://your-project-name.vercel.app`
- **Admin Panel**: `https://your-project-name.vercel.app/admin`
- **API Endpoints**: `https://your-project-name.vercel.app/api/*`

## 🔍 Testing Deployment

1. **Test Game Interface**
   - Visit your Vercel URL
   - Try breaking eggs
   - Check if rewards display correctly

2. **Test Admin Interface**
   - Visit `/admin`
   - Login with admin credentials
   - Test egg configuration
   - Test link creation

3. **Test API Endpoints**
   ```bash
   curl https://your-project-name.vercel.app/api/eggs
   ```

## 🐛 Troubleshooting

### Common Issues:

1. **Build Fails**
   - Check Node.js version (should be 18+)
   - Verify all dependencies are in package.json
   - Check build logs in Vercel dashboard

2. **API Routes Not Working**
   - Verify `vercel.json` routing configuration
   - Check serverless function logs
   - Ensure CORS is properly configured

3. **Environment Variables**
   - Double-check variable names and values
   - Redeploy after changing environment variables

4. **Database Issues**
   - Current setup uses in-memory storage
   - Data will reset on each deployment
   - Consider upgrading to persistent database for production

## 📊 Performance Optimization

### Vercel Optimizations Applied:

1. **Static File Caching**
   - Frontend assets cached at edge
   - Optimal cache headers set

2. **Serverless Functions**
   - API routes run as serverless functions
   - Automatic scaling based on traffic

3. **Build Optimization**
   - Tree shaking enabled
   - Code splitting for optimal loading

## 🔄 Continuous Deployment

Vercel automatically deploys when you push to GitHub:

1. **Push to main branch** → Production deployment
2. **Push to other branches** → Preview deployments
3. **Pull requests** → Preview deployments with unique URLs

## 📈 Monitoring

Monitor your deployment:

1. **Vercel Dashboard**
   - View deployment status
   - Check function logs
   - Monitor performance metrics

2. **Analytics**
   - Enable Vercel Analytics for usage insights
   - Monitor page views and performance

## 🔐 Security Considerations

1. **Environment Variables**
   - Never commit `.env` files
   - Use Vercel dashboard for sensitive data

2. **CORS Configuration**
   - Configured for production use
   - Adjust origins as needed

3. **Admin Access**
   - Change default admin credentials
   - Consider implementing proper authentication

## 🎯 Next Steps

After successful deployment:

1. **Custom Domain** (Optional)
   - Add custom domain in Vercel dashboard
   - Configure DNS settings

2. **Database Upgrade** (Recommended for production)
   - Integrate with Vercel Postgres or external database
   - Implement data persistence

3. **Monitoring & Analytics**
   - Set up error tracking
   - Enable performance monitoring

---

**🎉 Your ViralMediaHub is now live on Vercel!**

For support, check the [GitHub repository](https://github.com/NTVuong23/ViralMediaHub) or create an issue.
