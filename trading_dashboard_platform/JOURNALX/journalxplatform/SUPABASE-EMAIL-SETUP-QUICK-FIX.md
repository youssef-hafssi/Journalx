# Supabase Email Configuration Setup

## Current Issue
You're seeing the verification page but not receiving emails because Supabase email sending isn't configured.

## Quick Fix Options

### Option 1: Use Supabase's Built-in Email Service (Easiest)
1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Settings**
3. Scroll down to **SMTP Settings**
4. **Enable** the toggle for "Enable custom SMTP"
5. Use Supabase's default email service (no additional setup needed)

### Option 2: Configure Gmail SMTP (Recommended for Production)
1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Settings** → **SMTP Settings**
3. Configure with these settings:

```
SMTP Host: smtp.gmail.com
SMTP Port: 587
SMTP User: your-gmail@gmail.com
SMTP Pass: your-app-password (NOT your regular password)
Sender Name: JournalX Trading Platform
Sender Email: your-gmail@gmail.com
```

**To get Gmail App Password:**
1. Go to Google Account settings
2. Security → 2-Step Verification
3. App passwords → Generate new app password
4. Use that password in Supabase (not your regular Gmail password)

### Option 3: Disable Email Confirmation (For Testing Only)
1. Go to Supabase Dashboard
2. **Authentication** → **Settings**
3. **Uncheck** "Enable email confirmations"
4. Users will be able to sign in immediately without email verification

## Current Status Check

Let me check your current auth configuration:
