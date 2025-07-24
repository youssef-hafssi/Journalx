-- Disable email confirmation for development
-- Run this in your Supabase SQL Editor

-- This will allow users to sign up without email confirmation
-- Note: This is for development purposes only

DO $$ 
BEGIN
    RAISE NOTICE '⚠️  EMAIL CONFIRMATION DISABLED FOR DEVELOPMENT';
    RAISE NOTICE '';
    RAISE NOTICE '📋 To disable email confirmation:';
    RAISE NOTICE '   1. Go to your Supabase Dashboard';
    RAISE NOTICE '   2. Navigate to Authentication > Settings';
    RAISE NOTICE '   3. Scroll down to "Email Confirmation"';
    RAISE NOTICE '   4. UNCHECK "Enable email confirmations"';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 After disabling, users can sign up without email verification';
    RAISE NOTICE '   This is perfect for development and testing';
    RAISE NOTICE '';
    RAISE NOTICE '⚡ Alternative: Configure SMTP settings in Supabase for email sending';
END $$;
