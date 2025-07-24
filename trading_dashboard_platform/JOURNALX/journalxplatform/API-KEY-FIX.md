# 🔧 API Key Troubleshooting Steps

## Current Error: "Invalid API key" (401)

### ✅ Progress Made:
- Environment variables are now working
- App connects to correct Supabase URL
- No more localhost errors

### 🚨 Issue: API Key Invalid

## Quick Fix Steps:

### 1. Get Fresh API Keys
1. Go to: https://supabase.com/dashboard/project/gixiaqmqcvrrnvnxqewv/settings/api
2. Copy the **Project URL** (should be: `https://gixiaqmqcvrrnvnxqewv.supabase.co`)
3. Copy the **anon public** key (NOT the service_role key)

### 2. Update Vercel Environment Variables
1. Go to your Vercel project Settings → Environment Variables
2. **Edit** `VITE_SUPABASE_ANON_KEY`
3. **Paste the NEW key** from Supabase dashboard
4. Make sure there are no extra spaces or quotes
5. **Save** and **Redeploy**

### 3. Verify Supabase Project Settings
1. **Check project is active:** Dashboard should show green status
2. **Check authentication is enabled:** Authentication → Settings
3. **Verify API access:** Settings → API should show keys

### 4. Common Issues:
- **Wrong key type:** Make sure you're using `anon` key, not `service_role`
- **Expired key:** Regenerate keys if project is old
- **Copy error:** Key might have been truncated or have extra characters
- **Project paused:** Free Supabase projects pause after inactivity

## Test Commands:
```bash
# Test API key locally first
npm run dev
# Try signup/login locally - should work if keys are correct
```

## Expected Result:
After fixing the API key:
- ✅ Signup should work
- ✅ Login should work  
- ✅ No more 401 errors
