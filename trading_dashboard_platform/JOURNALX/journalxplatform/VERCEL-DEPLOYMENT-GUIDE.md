# JournalX - Vercel Deployment Steps

## 🚀 Quick Deployment Guide

### Option 1: Deploy via Vercel Dashboard (Recommended for first deployment)

1. **Push your code to GitHub/GitLab/Bitbucket** (if not already done)
   ```powershell
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Click "New Project"
   - Import your repository

3. **Configure Project Settings**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **Add Environment Variables**
   In Vercel project settings, add these environment variables:
   ```
   VITE_SUPABASE_URL=https://gixiaqmqcvrrnvnxqewv.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpeGlhcW1xY3Zycm52bnhxZXd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2MDY5NzcsImV4cCI6MjA2ODE4Mjk3N30.4ZiwSIywhewWCEYRkx6AMoi4IYr0iCI3uD38q_i-2DQ
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete
   - Get your deployment URL

### Option 2: Deploy via CLI (Alternative)

1. **Login to Vercel CLI**
   ```powershell
   vercel login
   ```
   Choose your preferred login method (GitHub, Email, etc.)

2. **Deploy**
   ```powershell
   vercel
   ```
   Follow the prompts to configure your project

3. **Add Environment Variables via CLI**
   ```powershell
   vercel env add VITE_SUPABASE_URL
   vercel env add VITE_SUPABASE_ANON_KEY
   ```

4. **Deploy to Production**
   ```powershell
   vercel --prod
   ```

## 🔧 Post-Deployment Configuration

### 1. Update Supabase Settings
Once you have your Vercel URL (e.g., `https://your-app.vercel.app`):

1. Go to Supabase Dashboard → Authentication → Settings
2. Update **Site URL** to: `https://your-app.vercel.app`
3. Add **Redirect URLs**:
   - `https://your-app.vercel.app/dashboard`
   - `https://your-app.vercel.app/onboarding`
   - `https://your-app.vercel.app/auth`

### 2. Test Your Deployment
- [ ] Visit your Vercel URL
- [ ] Test user registration
- [ ] Test user login
- [ ] Verify all pages load correctly
- [ ] Test responsive design

### 3. Custom Domain (Optional)
1. In Vercel dashboard → Settings → Domains
2. Add your custom domain
3. Update Supabase settings with your custom domain

## 📋 Deployment Checklist

- [ ] Code pushed to Git repository
- [ ] Vercel project created
- [ ] Environment variables configured
- [ ] Build successful
- [ ] Deployment successful
- [ ] Supabase settings updated
- [ ] Application tested in production
- [ ] Custom domain configured (optional)

## 🐛 Troubleshooting

### Build Fails
- Check environment variables are set correctly
- Ensure all dependencies are in package.json
- Run `npm run build` locally to test

### App Loads but Authentication Doesn't Work
- Verify environment variables in Vercel
- Check Supabase Site URL and redirect URLs
- Check browser console for errors

### Routing Issues (404 on page refresh)
- Ensure `vercel.json` is properly configured
- Check that all routes redirect to `/index.html`

## 📞 Need Help?
- Check Vercel deployment logs
- Review Supabase authentication logs
- Verify environment variables match exactly
