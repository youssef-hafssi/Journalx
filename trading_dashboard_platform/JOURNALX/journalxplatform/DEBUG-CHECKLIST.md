# 🔍 Environment Variables Debugging Checklist

## Issue: App connects to localhost:54321 instead of Supabase

### ✅ Step 1: Verify Local Environment File
- [x] .env.local exists
- [x] Contains VITE_SUPABASE_URL=https://gixiaqmqcvrrnvnxqewv.supabase.co
- [x] Contains VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

### 🔍 Step 2: Verify Vercel Environment Variables
Go to: https://vercel.com/dashboard → Your Project → Settings → Environment Variables

**Check these EXACT variable names:**
- [ ] `VITE_SUPABASE_URL` (NOT `SUPABASE_URL`)
- [ ] `VITE_SUPABASE_ANON_KEY` (NOT `SUPABASE_ANON_KEY`)

**Check values:**
- [ ] URL: `https://gixiaqmqcvrrnvnxqewv.supabase.co`
- [ ] Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpeGlhcW1xY3Zycm52bnhxZXd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2MDY5NzcsImV4cCI6MjA2ODE4Mjk3N30.4ZiwSIywhewWCEYRkx6AMoi4IYr0iCI3uD38q_i-2DQ`

**Check environments:**
- [ ] Production ✅
- [ ] Preview ✅  
- [ ] Development ✅

### 🔍 Step 3: Check Deployment
After pushing debug code:
1. [ ] Wait for Vercel deployment to complete
2. [ ] Visit your Vercel URL
3. [ ] Open browser DevTools → Console
4. [ ] Look for debug messages starting with "🔍 Environment Debug:"

### 🔍 Step 4: Debug Output Analysis
**If you see:**
- `VITE_SUPABASE_URL: undefined` → Environment variables not loaded
- `VITE_SUPABASE_URL: https://gixiaqmqcvrrnvnxqewv.supabase.co` → Variables loaded correctly

### 🔍 Step 5: Common Issues
- [ ] Variable names have typos
- [ ] Values have extra spaces or quotes
- [ ] Environment not selected (Production/Preview/Development)
- [ ] Case sensitivity issues
- [ ] Need to redeploy after adding variables

### 🔍 Step 6: Supabase Configuration
Go to: https://supabase.com/dashboard/project/gixiaqmqcvrrnvnxqewv/auth/settings

- [ ] Site URL matches your Vercel URL
- [ ] Redirect URLs added for your Vercel domain
- [ ] Project is active (not paused)

### 🎯 Expected Result
After fixing environment variables:
- ✅ Console shows: "🔧 Using Supabase URL: https://gixiaqmqcvrrnvnxqewv.supabase.co"
- ✅ No more localhost:54321 errors
- ✅ Signup/login works

---

## Quick Actions:
1. **Check Vercel Environment Variables** (most likely issue)
2. **Redeploy if variables were added/changed**
3. **Check browser console for debug output**
4. **Update Supabase Site URL if needed**
