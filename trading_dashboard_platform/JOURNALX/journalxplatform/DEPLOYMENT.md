# JournalX Trading Platform - Vercel Deployment Guide

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Supabase Project**: Active Supabase project with configured database
3. **Environment Variables**: Properly configured Supabase credentials

## Deployment Steps

### 1. Install Vercel CLI (Optional)
```bash
npm install -g vercel
```

### 2. Connect to Vercel

#### Option A: Using Vercel Dashboard (Recommended)
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your Git repository
4. Configure environment variables (see below)
5. Deploy

#### Option B: Using Vercel CLI
```bash
# Navigate to your project directory
cd c:\Users\yusse\Desktop\trading_dashboard_platform\trading_dashboard_platform\JOURNALX\journalxplatform

# Login to Vercel
vercel login

# Deploy
vercel
```

### 3. Environment Variables Setup

In your Vercel project settings, add these environment variables:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key-here
```

**Important**: 
- Get these values from your Supabase Dashboard → Settings → API
- Never commit these values to Git
- Use the same values from your `.env.local` file

### 4. Supabase Configuration for Production

Update your Supabase settings for production:

1. **Site URL**: Set to your Vercel domain (e.g., `https://your-app.vercel.app`)
2. **Redirect URLs**: Add your Vercel domain for OAuth callbacks
3. **CORS**: Ensure your domain is allowed

#### In Supabase Dashboard:
- Go to Authentication → Settings
- Set Site URL: `https://your-app.vercel.app`
- Add redirect URLs:
  - `https://your-app.vercel.app/dashboard`
  - `https://your-app.vercel.app/onboarding`
  - `https://your-app.vercel.app/auth`

### 5. Build and Deploy Commands

The following commands are pre-configured:

- **Development Build**: `npm run build:dev`
- **Production Build**: `npm run build:prod`
- **Preview**: `npm run preview`
- **Deploy**: `npm run deploy` (requires Vercel CLI)

### 6. Domain Configuration

After deployment:
1. Vercel will provide a `.vercel.app` domain
2. Optionally, configure a custom domain in Vercel settings
3. Update Supabase settings with your final domain

## Troubleshooting

### Common Issues:

1. **Environment Variables Not Working**
   - Ensure all VITE_ prefixed variables are set in Vercel
   - Redeploy after adding environment variables

2. **Supabase Connection Issues**
   - Verify Site URL in Supabase matches your Vercel domain
   - Check CORS settings in Supabase

3. **Build Errors**
   - Run `npm run build` locally first to catch issues
   - Check build logs in Vercel dashboard

4. **Routing Issues**
   - The `vercel.json` file handles SPA routing
   - All routes redirect to `/index.html` for client-side routing

### Testing Locally Before Deployment:

```bash
# Build the project
npm run build

# Preview the build
npm run preview
```

## Post-Deployment Checklist

- [ ] Test user registration and login
- [ ] Verify Supabase database connectivity
- [ ] Test Google OAuth (if enabled)
- [ ] Check all pages and routes work
- [ ] Verify email verification works (if configured)
- [ ] Test responsive design on different devices

## Monitoring and Analytics

Consider adding:
- Vercel Analytics
- Error tracking (Sentry)
- Performance monitoring

## Support

For deployment issues:
- Check Vercel deployment logs
- Review Supabase settings
- Ensure environment variables are correct
