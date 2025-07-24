# Google Authentication Setup Guide

This guide explains how to set up Google OAuth authentication for JournalX using Supabase.

## Prerequisites

- A Supabase project
- A Google Cloud Console account
- Your JournalX application deployed or running locally

## Step 1: Google Cloud Console Setup

1. **Go to Google Cloud Console**
   - Visit https://console.cloud.google.com/
   - Create a new project or select an existing one

2. **Enable Google+ API**
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it

3. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application" as the application type
   - Add your authorized redirect URIs:
     - For local development: `http://localhost:8080/auth/callback`
     - For production: `https://yourdomain.com/auth/callback`
     - **Important**: Also add your Supabase auth callback URL: `https://your-project-ref.supabase.co/auth/v1/callback`

4. **Get your credentials**
   - Copy the "Client ID" and "Client Secret"

## Step 2: Supabase Configuration

1. **Go to your Supabase Dashboard**
   - Navigate to Authentication > Providers
   - Find "Google" in the list of providers

2. **Enable Google Provider**
   - Toggle the "Enable sign in with Google" option
   - Enter your Google OAuth Client ID
   - Enter your Google OAuth Client Secret
   - Set the redirect URL to: `https://your-project-ref.supabase.co/auth/v1/callback`

3. **Update Site URL (Important)**
   - Go to Authentication > Settings
   - Set your Site URL to your application's URL:
     - For local development: `http://localhost:8080`
     - For production: `https://yourdomain.com`

4. **Add Redirect URLs**
   - In the same settings page, add redirect URLs:
     - `http://localhost:8080/dashboard` (for local development)
     - `https://yourdomain.com/dashboard` (for production)

## Step 3: Environment Variables

Make sure your `.env.local` file has the correct Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Step 4: Database Schema

The Google sign-in will automatically create user profiles. Ensure your profiles table can handle Google user data:

```sql
-- The profiles table should be able to store Google user info
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'email';
```

## Step 5: Testing

1. **Start your development server**
   ```bash
   npm run dev
   # or
   bun dev
   ```

2. **Test Google Sign-in**
   - Go to your auth page (`/auth`)
   - Click "Sign in with Google"
   - Complete the Google OAuth flow
   - You should be redirected to `/dashboard`

## Troubleshooting

### Common Issues:

1. **"Redirect URI mismatch"**
   - Make sure all redirect URIs are properly configured in Google Cloud Console
   - Include both your app URL and Supabase callback URL

2. **"Invalid client"**
   - Double-check your Client ID and Client Secret in Supabase
   - Ensure the Google+ API is enabled

3. **User not redirected after sign-in**
   - Check that your Site URL is correctly set in Supabase
   - Verify redirect URLs include your dashboard path

4. **Profile not created**
   - Ensure your profiles table accepts nullable fields for name
   - Check if RLS policies allow inserting new profiles

### Debug Tips:

- Check browser console for authentication errors
- Monitor Supabase Auth logs in the dashboard
- Test with incognito/private browsing to avoid cached sessions

## Security Notes

- Never expose your Google Client Secret in frontend code
- Use environment variables for all sensitive credentials
- Regularly rotate your OAuth credentials
- Monitor authentication logs for suspicious activity

## Next Steps

After successful setup:
- Test the complete user flow
- Verify profile creation in the database
- Test with different Google accounts
- Deploy and test in production environment
