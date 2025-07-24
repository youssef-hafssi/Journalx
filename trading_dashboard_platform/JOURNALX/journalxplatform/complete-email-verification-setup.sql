-- Complete Email Verification Setup Guide
-- This file contains all the steps to implement email verification properly

-- =====================================================
-- STEP 1: CONFIGURE SMTP IN SUPABASE DASHBOARD
-- =====================================================

/*
1. Go to Supabase Dashboard → Authentication → Settings → SMTP Settings

2. Configure Gmail SMTP (recommended for development):
   - Host: smtp.gmail.com
   - Port: 587
   - Username: your-email@gmail.com
   - Password: your-gmail-app-password (NOT your regular password)
   - Sender email: your-email@gmail.com
   - Sender name: JournalX

3. To get Gmail App Password:
   - Go to Google Account Settings
   - Security → 2-Step Verification → App passwords
   - Generate new app password for "Mail"
   - Use this password in Supabase SMTP settings

4. Test the SMTP configuration:
   - Send a test email from Supabase Dashboard
   - Verify you receive the email
*/

-- =====================================================
-- STEP 2: DATABASE SETUP FOR EMAIL VERIFICATION
-- =====================================================

-- Update profiles table to support email verification
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_token TEXT,
ADD COLUMN IF NOT EXISTS verification_sent_at TIMESTAMP WITH TIME ZONE;

-- Create function to generate verification token
CREATE OR REPLACE FUNCTION public.generate_verification_token(user_id UUID)
RETURNS TEXT AS $$
DECLARE
    verification_token TEXT;
BEGIN
    -- Generate a unique verification token
    verification_token := encode(gen_random_bytes(32), 'hex');
    
    -- Update profile with verification token and timestamp
    UPDATE public.profiles 
    SET 
        verification_token = verification_token,
        verification_sent_at = NOW()
    WHERE id = user_id;
    
    -- Return the token
    RETURN verification_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to verify email using token
CREATE OR REPLACE FUNCTION public.verify_email_token(token TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_found BOOLEAN DEFAULT FALSE;
BEGIN
    -- Update user verification status if token matches and is not expired (24 hours)
    UPDATE public.profiles 
    SET 
        email_verified = TRUE,
        verification_token = NULL,
        verification_sent_at = NULL
    WHERE 
        verification_token = token 
        AND verification_sent_at > NOW() - INTERVAL '24 hours';
    
    -- Check if any row was updated
    GET DIAGNOSTICS user_found = ROW_COUNT;
    
    RETURN user_found > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update handle_new_user function for email verification
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name, email_verified)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name', 
            split_part(NEW.email, '@', 1)
        ),
        -- Email is verified if email_confirmed_at is set by Supabase
        COALESCE(NEW.email_confirmed_at IS NOT NULL, FALSE)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.generate_verification_token(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_email_token(TEXT) TO authenticated;

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE '✅ Email verification database setup complete!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Next steps:';
    RAISE NOTICE '   1. Configure SMTP in Supabase Dashboard';
    RAISE NOTICE '   2. Enable email confirmation in Auth settings';
    RAISE NOTICE '   3. Test the email verification flow';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Email verification is now properly configured!';
END $$;
